import { supabase, edgeFunctionError } from '@/lib/supabase'
import { mesajEroare } from '@/lib/errorMessage'

// ─────────────────────────────────────────────────────────────────────────────
// REZERVĂRI OPEN CLASS (cursuri facultative: OPEN + K-pop Covers).
//
// ⚠️ RPC-ul existent în qapp v2 `rezerva_loc_open` NU e refolosibil direct:
//   - e gated pe roluri STAFF (auth_role() in admin/owner/manager/front_desk)
//   - încasează SINCRON (scrie `incasari` pe loc cu un `metoda`) — adică presupune
//     plata deja făcută la recepție.
//   Referință: qapp v2/supabase/migrations/20260606200100_open_class_rpc.sql
//              qapp v2/src/features/plati/api/open-class.ts
//
// Pentru portal e nevoie de o variantă CLIENT-FACING în 2 pași:
//   1. hold_loc_open()       → blochează atomic un loc (FOR UPDATE pe sesiune),
//                              creează rezervare status='in_asteptare' (fără incasari)
//   2. netopia-webhook       → la confirmare: incasari + enrollment + status='platit'
//      (timeout pe holduri neplătite eliberează locul — cron/expirare)
//
// Logica de capacitate strictă (count < cap sub FOR UPDATE) se PĂSTREAZĂ din RPC-ul
// existent — doar se separă plata de rezervare.
// ─────────────────────────────────────────────────────────────────────────────

export type OpenSesiuneRow = {
  sesiuneId: string
  cursId: string
  cursNume: string | null
  data: string | null
  locuriRamase: number
  capacitate: number
  pret: number | null
  instructorNume: string | null
  // Rezervarea membrului activ pe ședința asta: 'rezervat' = plata încă se confirmă.
  rezervareStatus: 'rezervat' | 'platit' | null
}

export async function listOpenSesiuniClient(clientId?: string | null): Promise<OpenSesiuneRow[]> {
  const { data, error } = await supabase.rpc('list_open_sesiuni_client', {
    p_client: clientId ?? undefined,
  })
  if (error) throw error
  return (data ?? []).map((r) => {
    const locuriRamase = r.locuri_ramase ?? 0
    const capacitate = r.capacitate ?? locuriRamase
    const st = r.rezervare_status
    return {
      sesiuneId: r.sesiune_id,
      cursId: r.curs_id,
      cursNume: r.curs_nume,
      data: r.data,
      locuriRamase,
      capacitate,
      pret: r.pret,
      instructorNume: r.instructor_nume,
      rezervareStatus: st === 'rezervat' || st === 'platit' ? st : null,
    }
  })
}

export type StatusComanda = {
  status: 'pending' | 'confirmed' | 'failed' | 'canceled'
  orderType: string | null
  rezervareStatus: string | null
  cursNume: string | null
  data: string | null
}

// null = comanda nu există sau nu e a familiei contului.
export async function getStatusComanda(orderRef: string): Promise<StatusComanda | null> {
  const { data, error } = await supabase.rpc('portal_status_comanda', { p_order_ref: orderRef })
  if (error) throw error
  if (!data) return null
  const o = data as Record<string, string | null>
  return {
    status: o.status as StatusComanda['status'],
    orderType: o.order_type,
    rezervareStatus: o.rezervare_status,
    cursNume: o.curs_nume,
    data: o.data,
  }
}

export type VoucherPreview =
  | { valid: true; cod: string; pretFinal: number; reducere: number }
  | { valid: false; motiv: string }

// Același verdict ca în `netopia-create-payment` (validate_voucher_code pe 'Per sedinta'),
// ca sumarul să arate exact suma care se va încasa.
export async function previewVoucherRezervare(params: {
  cod: string
  clientId: string
  cursId: string
  pret: number
}): Promise<VoucherPreview> {
  const { data, error } = await supabase.rpc('validate_voucher_code', {
    p_cod: params.cod.trim(),
    p_client: params.clientId,
    p_curs: params.cursId,
    p_tip: 'Per sedinta',
  })
  if (error) throw error
  const v = data?.[0]
  if (!v?.valid) return { valid: false, motiv: mesajEroare(v?.reason ?? 'Cod inexistent.') }
  const pretFinal = applyVoucherAmount(params.pret, v.tip, v.valoare)
  return {
    valid: true,
    cod: v.cod ?? params.cod.trim().toUpperCase(),
    pretFinal,
    reducere: params.pret - pretFinal,
  }
}

// Oglindă a applyVoucherAmount() din edge function-ul `netopia-create-payment`.
function applyVoucherAmount(base: number, tip: string | null, valoare: number | null): number {
  if (tip == null || valoare == null) return base
  if (tip === 'Procent') return Math.max(0, Math.round(base * (100 - valoare)) / 100)
  if (tip === 'Valoare') return Math.max(0, base - valoare)
  return base
}

export type ReserveResult ={ redirectUrl: string; orderId: string }

// Rezervă un loc + plătește cu cardul, în 2 pași (server-side):
//   1. edge function `netopia-create-payment` cu kind='rezervare' → cheamă hold_loc_open()
//      (blocaj atomic al locului, fără bani) și creează comanda Netopia
//   2. la confirmarea webhook-ului → enrollment 'Per sedinta' + incasare + status 'platit'
// Holdul neplătit expiră automat (cron) și eliberează locul.
export async function reserveOpenAndPay(params: {
  clientId: string
  sesiuneId: string
  voucherCod?: string
}): Promise<ReserveResult> {
  const { data, error } = await supabase.functions.invoke('netopia-create-payment', {
    body: {
      clientId: params.clientId,
      kind: 'rezervare',
      sesiuneId: params.sesiuneId,
      voucherCod: params.voucherCod?.trim() || undefined,
    },
  })
  if (error) throw await edgeFunctionError(error)
  return data as ReserveResult
}
