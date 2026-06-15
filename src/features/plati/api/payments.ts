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
  }))
}

export type CreatePaymentResult = { redirectUrl: string; orderId: string }

export async function createNetopiaPayment(params: {
  clientId: string
  suma: number
  voucherCod?: string | null
}): Promise<CreatePaymentResult> {
  // TODO: apel Edge Function 'netopia-create-payment'
  // const { data, error } = await supabase.functions.invoke('netopia-create-payment', { body: params })
  void supabase
  void params
  throw new Error('TODO: implementează Edge Function netopia-create-payment')
}
