import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// PLĂȚI ONLINE — Netopia (procesatorul confirmat).
//
// REGULA DE AUR: clientul NU inserează în `incasari` și NU calculează singur cât
// datorează. Tot ce înseamnă bani trece prin DB (RPC) + Edge Functions server-side.
//
// Referință qapp v2 (logica de replicat server-side, NU de copiat în acest frontend):
//   - registerPlataFifo()  → distribuie suma FIFO peste înrolări vechi→nou
//       qapp v2/src/features/plati/api/incasari.ts
//   - validateVoucher() / calc.ts (modulul vouchere) → aplicat ÎNAINTE de intent
//
// Flux de implementat (2 Edge Functions noi în Supabase qapp v2):
//   1. netopia-create-payment:
//        - authz pe auth.uid() → rezolvă familia/clientul
//        - recalculează restanța FIFO server-side (sursa de adevăr a sumei)
//        - creează ordinul Netopia → întoarce { redirectUrl, orderId }
//   2. netopia-webhook (IPN):
//        - verifică semnătura Netopia
//        - IDEMPOTENT: dedup pe id tranzacție Netopia (o plată = un singur rând incasari)
//        - la „confirmed” → inserează incasari (FIFO) + recalcul sold
// ─────────────────────────────────────────────────────────────────────────────

export type SoldMembru = {
  clientId: string
  nume: string
  prenume: string | null
  restanta: number
}

export async function getSoldFamilie(): Promise<SoldMembru[]> {
  const { data, error } = await supabase.rpc('get_sold_familie')
  if (error) throw error
  return (data ?? []).map((r) => ({
    clientId: r.client_id,
    nume: r.nume ?? '—',
    prenume: r.prenume,
    restanta: Number(r.restanta ?? 0),
  }))
}

export type PlataRow = {
  enrollmentId: string
  cursNume: string | null
  dataIncepere: string | null
  tipPlata: string | null
  total: number
  platit: number
  rest: number
  codVoucher: string | null
  sezonId: string | null
  sezonNume: string | null
}

export async function getPlatiClient(clientId: string): Promise<PlataRow[]> {
  const { data, error } = await supabase.rpc('get_plati_client', { p_client: clientId })
  if (error) throw error
  return (data ?? []).map((r) => ({
    enrollmentId: r.enrollment_id,
    cursNume: r.curs_nume,
    dataIncepere: r.data_incepere,
    tipPlata: r.tip_plata,
    total: Number(r.total_de_plata ?? 0),
    platit: Number(r.platit ?? 0),
    rest: Number(r.rest ?? 0),
    codVoucher: r.cod_voucher,
    sezonId: r.sezon_id ?? null,
    sezonNume: r.sezon_nume ?? null,
  }))
}

export type DatorieRow = {
  datorieId: string
  categorie: string
  descriere: string | null
  sumaDatorata: number
  platit: number
  rest: number
  created: string | null
}

// Datoriile one-off (Bilet/Merch/Taxă) neachitate ale unui membru. Se plătesc INTEGRAL.
export async function getDatoriiClient(clientId: string): Promise<DatorieRow[]> {
  const { data, error } = await supabase.rpc('get_datorii_client', { p_client: clientId })
  if (error) throw error
  return (data ?? []).map((r) => ({
    datorieId: r.datorie_id,
    categorie: r.categorie,
    descriere: r.descriere,
    sumaDatorata: Number(r.suma_datorata ?? 0),
    platit: Number(r.platit ?? 0),
    rest: Number(r.rest ?? 0),
    created: r.created,
  }))
}

export type CreatePaymentResult = { redirectUrl: string; orderId: string }

// Inițiază plata online. Suma e recalculată server-side (FIFO) — trimitem clientId și,
// opțional, înrolarea-limită `panaLa` (plătește lunile până la și inclusiv ea, în ordine
// cronologică). Fără panaLa => toată restanța. Garda „nu sări peste o lună" e în RPC.
export async function createNetopiaPayment(params: {
  clientId: string
  panaLa?: string
  // datorii one-off selectate (plată integrală); includeInrolari=false => doar datorii.
  datorii?: string[]
  includeInrolari?: boolean
}): Promise<CreatePaymentResult> {
  const { data, error } = await supabase.functions.invoke('netopia-create-payment', {
    body: {
      clientId: params.clientId,
      panaLa: params.panaLa,
      datorii: params.datorii,
      includeInrolari: params.includeInrolari,
    },
  })
  if (error) {
    const msg = (data as { error?: string } | null)?.error ?? error.message
    throw new Error(msg)
  }
  return data as CreatePaymentResult
}
