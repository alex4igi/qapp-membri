import { supabase, edgeFunctionError } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// BILETE SPECTACOLE — cumpărare online + biletele mele.
//
// Flux (server-side, 2 pași — identic cu rezervări):
//   1. edge function `netopia-create-payment` cu kind='bilet' → cheamă hold_bilete()
//      (blochează atomic p_qty locuri pe eveniment, fără bani) + creează comanda Netopia
//   2. la confirmarea webhook-ului → bilete 'platit' cu cod + o încasare categorie Bilet
//   Holdurile neplătite expiră (TTL 30min în hold_bilete) și eliberează locurile.
//
// Referință qapp v2: migrația 20260708100000_bilete_ticketing.sql
// ─────────────────────────────────────────────────────────────────────────────

export type EvenimentBiletRow = {
  id: string
  nume: string
  data: string | null
  locatie: string | null
  pret: number | null
  capacitate: number | null
  locuriRamase: number | null
}

export async function listBileteEvenimente(): Promise<EvenimentBiletRow[]> {
  const { data, error } = await supabase.rpc('list_bilete_evenimente')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    nume: r.nume,
    data: r.data,
    locatie: r.locatie,
    pret: r.pret_bilet,
    capacitate: r.capacitate,
    locuriRamase: r.locuri_ramase,
  }))
}

export type BiletMeuRow = {
  id: string
  eveniment: string
  evenimentNume: string
  data: string | null
  locatie: string | null
  cod: string | null
  pret: number
  status: string
}

// Biletele plătite/validate ale unui membru (scop familie, server-side).
export async function getBileteMele(clientId: string): Promise<BiletMeuRow[]> {
  const { data, error } = await supabase.rpc('get_bilete_membru', { p_client: clientId })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    eveniment: r.eveniment,
    evenimentNume: r.eveniment_nume,
    data: r.data,
    locatie: r.locatie,
    cod: r.cod,
    pret: Number(r.pret ?? 0),
    status: r.status,
  }))
}

export type BuyResult = { redirectUrl: string; orderId: string }

// Cumpără `qty` bilete la un eveniment + plătește cu cardul (redirect Netopia).
export async function buyBileteAndPay(params: {
  clientId: string
  evenimentId: string
  qty: number
}): Promise<BuyResult> {
  const { data, error } = await supabase.functions.invoke('netopia-create-payment', {
    body: {
      clientId: params.clientId,
      kind: 'bilet',
      evenimentId: params.evenimentId,
      qty: params.qty,
    },
  })
  if (error) throw await edgeFunctionError(error)
  return data as BuyResult
}
