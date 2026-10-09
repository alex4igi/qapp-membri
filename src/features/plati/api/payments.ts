import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase, edgeFunctionError } from '@/lib/supabase'

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

// Ce e de plată, pe termene: rate + datorii one-off, cu scadența canonică din DB
// (scadenta_inrolare). `restant` = termenul a trecut strict; ziua scadenței nu e întârziere.
export type TermenPlata = {
  clientId: string
  prenume: string | null
  scadenta: string
  suma: number
  restant: boolean
}

export async function getRezumatPlati(): Promise<TermenPlata[]> {
  const { data, error } = await supabase.rpc('get_rezumat_plati_familie')
  if (error) throw error
  return (data ?? []).map((r) => ({
    clientId: r.client_id,
    prenume: r.prenume,
    scadenta: r.scadenta,
    suma: Number(r.suma ?? 0),
    restant: Boolean(r.restant),
  }))
}

export type SumarPlati = {
  restant: number
  // Primul termen nescadent (azi sau mai târziu), cu suma doar a acelui termen.
  urmatorTermen: { scadenta: string; suma: number } | null
  // Tot ce e nescadent, inclusiv următorul termen.
  ramas: number
}

export function sumarPlati(termene: TermenPlata[], clientId?: string): SumarPlati {
  const t = clientId ? termene.filter((x) => x.clientId === clientId) : termene
  const restant = t.filter((x) => x.restant).reduce((a, x) => a + x.suma, 0)
  const viitoare = t.filter((x) => !x.restant)
  const prima = viitoare.reduce<string | null>((m, x) => (m == null || x.scadenta < m ? x.scadenta : m), null)
  return {
    restant,
    urmatorTermen: prima
      ? { scadenta: prima, suma: viitoare.filter((x) => x.scadenta === prima).reduce((a, x) => a + x.suma, 0) }
      : null,
    ramas: viitoare.reduce((a, x) => a + x.suma, 0),
  }
}

// Cheile care trebuie reîmprospătate după o plată (abonament, datorie sau rezervare).
export const CHEI_DUPA_PLATA = [
  ['sold-familie'],
  ['rezumat-plati'],
  ['plati'],
  ['datorii'],
  ['plata-integrala'],
  ['open-sesiuni'],
  ['sedinte-membru'],
  ['plati-in-curs'],
  ['preview-plata'],
] as const

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
  tipCurs: TipCurs
  scadenta: string | null
}

export type TipCurs = 'grupa' | 'trupa' | 'facultativ'

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
    tipCurs: (r.tip_curs ?? 'grupa') as TipCurs,
    scadenta: r.scadenta ?? null,
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
  // Până când se plătește (din 09.10.2026 o pune recepția; implicit ziua creării).
  termen: string
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
    termen: r.termen,
  }))
}

// Oferta de plată integrală a sezonului (−5%, Anexa 1 din contract). Eligibilitatea și
// prețurile vin din DB (plan_plata_integrala_sezon) — frontendul nu calculează nimic.
export type PlataIntegrala =
  | { eligibil: false; motiv: string }
  | {
      eligibil: true
      sezonNume: string | null
      scadenta: string | null
      luni: number
      totalCurent: number
      totalPlata: number
      discount: number
    }

export async function getPlataIntegrala(clientId: string): Promise<PlataIntegrala> {
  const { data, error } = await supabase.rpc('plan_plata_integrala_sezon', { p_client: clientId })
  if (error) throw error
  const r = data as Record<string, unknown> | null
  if (!r?.eligibil) return { eligibil: false, motiv: String(r?.motiv ?? '') }
  return {
    eligibil: true,
    sezonNume: (r.sezon_nume as string) ?? null,
    scadenta: (r.scadenta as string) ?? null,
    luni: Number(r.luni ?? 0),
    totalCurent: Number(r.total_curent ?? 0),
    totalPlata: Number(r.total_plata ?? 0),
    discount: Number(r.discount ?? 0),
  }
}

// Ce plătește un membru în coșul familiei: rândurile până la `panaLa` (FIFO pe luna
// înrolării) + datoriile one-off bifate. Serverul nu acceptă `panaLa` lipsă cu înrolări incluse.
export type SelectieMembru = {
  clientId: string
  includeInrolari: boolean
  panaLa?: string
  datorii?: string[]
}

export type PlanFamilie = {
  amount: number
  items: { clientId: string; enrollmentId: string | null; datorieId: string | null; pay: number }[]
  peMembru: { clientId: string; amount: number }[]
}

const toSelectie = (m: SelectieMembru[]) =>
  m.map((x) => ({
    client: x.clientId,
    include_inrolari: x.includeInrolari,
    pana_la: x.panaLa ?? null,
    datorii: x.datorii ?? [],
  }))

// Previzualizarea coșului: aceeași funcție cu care serverul construiește comanda, deci suma
// de aici e suma care se plătește (cu excepția unei plăți făcute între timp — atunci 409).
export async function previewPlataFamilie(membri: SelectieMembru[]): Promise<PlanFamilie> {
  const { data, error } = await supabase.rpc('build_fifo_plan_familie', { p_selectie: toSelectie(membri) })
  if (error) throw error
  const r = data as { amount: number; plan: Record<string, unknown>[]; pe_membru: Record<string, unknown>[] }
  return {
    amount: Number(r.amount ?? 0),
    items: (r.plan ?? []).map((x) => ({
      clientId: String(x.client_id),
      enrollmentId: (x.enrollment_id as string) ?? null,
      datorieId: (x.datorie_id as string) ?? null,
      pay: Number(x.pay ?? 0),
    })),
    peMembru: (r.pe_membru ?? []).map((x) => ({ clientId: String(x.client), amount: Number(x.amount ?? 0) })),
  }
}

// Comenzile pornite și neconfirmate încă (max. 30 min): rândurile lor nu se mai pot plăti.
export type PlataInCurs = {
  orderRef: string
  amount: number
  created: string
  expira: string
  randuri: string[]
  membri: string[]
}

export async function getPlatiInCurs(): Promise<PlataInCurs[]> {
  const { data, error } = await supabase.rpc('get_plati_in_curs')
  if (error) throw error
  return (data ?? []).map((r) => ({
    orderRef: r.order_ref,
    amount: Number(r.amount ?? 0),
    created: r.created,
    expira: r.expira,
    randuri: r.randuri ?? [],
    membri: r.membri ?? [],
  }))
}

export type CreatePaymentResult = { redirectUrl: string; orderId: string }

// 409 de la server: suma s-a schimbat între previzualizare și plată.
export class SumaSchimbataError extends Error {}

// Plata pe familie: o singură comandă Netopia pentru toți membrii din coș.
export async function createNetopiaPaymentFamilie(
  membri: SelectieMembru[],
  sumaAsteptata: number,
): Promise<CreatePaymentResult> {
  const { data, error } = await supabase.functions.invoke('netopia-create-payment', {
    body: {
      membri: membri.map((m) => ({
        clientId: m.clientId,
        includeInrolari: m.includeInrolari,
        panaLa: m.panaLa,
        datorii: m.datorii ?? [],
      })),
      sumaAsteptata,
    },
  })
  if (error) {
    const e = await edgeFunctionError(error)
    if (error instanceof FunctionsHttpError && error.context.status === 409) throw new SumaSchimbataError(e.message)
    throw e
  }
  return data as CreatePaymentResult
}

// Inițiază plata online. Suma e recalculată server-side (FIFO) — trimitem clientId și,
// opțional, înrolarea-limită `panaLa` (plătește lunile până la și inclusiv ea, în ordine
// cronologică). Fără panaLa => toată restanța. Garda „nu sări peste o lună" e în RPC.
export async function createNetopiaPayment(params: {
  clientId: string
  panaLa?: string
  // datorii one-off selectate (plată integrală); includeInrolari=false => doar datorii.
  datorii?: string[]
  includeInrolari?: boolean
  // plata integrală a sezonului cu −5%: ignoră selecția de luni, suma vine din DB.
  platesteIntegral?: boolean
}): Promise<CreatePaymentResult> {
  const { data, error } = await supabase.functions.invoke('netopia-create-payment', {
    body: {
      clientId: params.clientId,
      panaLa: params.panaLa,
      datorii: params.datorii,
      includeInrolari: params.includeInrolari,
      platesteIntegral: params.platesteIntegral,
    },
  })
  if (error) throw await edgeFunctionError(error)
  return data as CreatePaymentResult
}
