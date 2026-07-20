import { supabase } from '@/lib/supabase'
import type { StatusPrezenta } from '@/types/db'

// Citire prin RPC client-facing scopat la familia contului. Sezonul e ales
// explicit de membru (vezi PrezenteSection) — filtrarea se face pe sezonul
// CURSULUI, nu pe un interval de date: când ceri „2025-2026" vrei orele de la
// cursurile acelui sezon, chiar dacă o oră a picat calendaristic în afara lui.
// Un sezon are < 1000 rânduri, deci un singur apel nu atinge plafonul PostgREST.
export type PrezentaRow = {
  data: string | null
  cursNume: string | null
  status: StatusPrezenta | null
}

export type SezonPrezenteRow = {
  sezonId: string | null
  sezonNume: string | null
  total: number
  prezente: number
  absente: number
}

// Sezoanele în care membrul are prezențe, recent→vechi, cu totalurile calculate
// server-side. `sezonId` null = prezențe pe cursuri fără sezon asociat.
export async function getPrezenteSezoane(clientId: string): Promise<SezonPrezenteRow[]> {
  const { data, error } = await supabase.rpc('get_prezente_sezoane_client', {
    p_client: clientId,
  })
  if (error) throw error
  return (data ?? []).map((r) => ({
    sezonId: r.sezon_id ?? null,
    sezonNume: r.sezon_nume ?? null,
    total: Number(r.total ?? 0),
    prezente: Number(r.prezente ?? 0),
    absente: Number(r.absente ?? 0),
  }))
}

// Prezențele unui sezon anume (p_sezon null = cursurile fără sezon).
export async function getPrezenteSezon(
  clientId: string,
  sezonId: string | null,
): Promise<PrezentaRow[]> {
  const { data, error } = await supabase.rpc('get_prezente_client', {
    p_client: clientId,
    // Omis (undefined) => `p_sezon` cade pe default-ul null al RPC-ului, iar
    // `c.sezon is not distinct from null` întoarce cursurile fără sezon.
    p_sezon: sezonId ?? undefined,
  })
  if (error) throw error
  return (data ?? []).map((r) => ({
    data: r.data,
    cursNume: r.curs_nume,
    status: r.status,
  }))
}
