import { supabase } from '@/lib/supabase'
import type { StatusPrezenta } from '@/types/db'

// Citire prin RPC-uri client-facing scopate la familia contului. Istoricul se
// încarcă PER SEZON (acordeon) — un singur apel nu poate depăși plafonul
// PostgREST de 1000 de rânduri, iar statisticile de titlu vin agregate server-side.
export type PrezentaRow = {
  data: string | null
  cursNume: string | null
  status: StatusPrezenta | null
}

export type PrezenteSezon = {
  sezonId: string | null
  sezonNume: string | null
  total: number
  prezente: number
  absente: number
}

export async function getPrezenteSezoaneClient(clientId: string): Promise<PrezenteSezon[]> {
  const { data, error } = await supabase.rpc('get_prezente_sezoane_client', {
    p_client: clientId,
  })
  if (error) throw error
  return (data ?? []).map((r) => ({
    sezonId: r.sezon_id,
    sezonNume: r.sezon_nume,
    total: r.total ?? 0,
    prezente: r.prezente ?? 0,
    absente: r.absente ?? 0,
  }))
}

// sezonId null = prezențele pe cursuri fără sezon (grupul „Fără sezon").
export async function getPrezenteClient(
  clientId: string,
  sezonId: string | null,
): Promise<PrezentaRow[]> {
  const { data, error } = await supabase.rpc('get_prezente_client', {
    p_client: clientId,
    p_sezon: sezonId ?? undefined,
  })
  if (error) throw error
  return (data ?? []).map((r) => ({
    data: r.data,
    cursNume: r.curs_nume,
    status: r.status,
  }))
}
