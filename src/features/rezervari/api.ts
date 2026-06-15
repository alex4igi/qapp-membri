import { supabase } from '@/lib/supabase'

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
  pret: number | null
  instructorNume: string | null
}

export async function listOpenSesiuniClient(locatieId?: string | null): Promise<OpenSesiuneRow[]> {
  const { data, error } = await supabase.rpc('list_open_sesiuni_client', {
    p_locatie: locatieId ?? undefined,
  })
  if (error) throw error
  return (data ?? []).map((r) => ({
    sesiuneId: r.sesiune_id,
    cursId: r.curs_id,
    cursNume: r.curs_nume,
    data: r.data,
    locuriRamase: r.locuri_ramase ?? 0,
    pret: r.pret,
    instructorNume: r.instructor_nume,
  }))
}

export async function holdLocOpen(_params: {
  clientId: string
  sesiuneId: string
}): Promise<{ rezervareId: string }> {
  // TODO: RPC hold_loc_open() — pasul 1 (blocaj atomic, fără plată)
  void supabase
  throw new Error('TODO: implementează RPC hold_loc_open() + plată Netopia (pas 2)')
}
