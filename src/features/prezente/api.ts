import { supabase } from '@/lib/supabase'
import type { StatusPrezenta } from '@/types/db'

// Citire prin RPC client-facing scopat la familia contului. Prezențele se
// afișează DOAR pentru perioada sezonului activ (interval de date), nu tot
// istoricul — vezi PrezenteSection. Un interval de sezon are < 1000 rânduri,
// deci un singur apel nu atinge plafonul PostgREST.
export type PrezentaRow = {
  data: string | null
  cursNume: string | null
  status: StatusPrezenta | null
}

// Prezențele a căror dată cade în [from, to] (perioada sezonului activ),
// indiferent de sezonul cursului.
export async function getPrezenteInterval(
  clientId: string,
  from: string,
  to: string,
): Promise<PrezentaRow[]> {
  const { data, error } = await supabase.rpc('get_prezente_interval_client', {
    p_client: clientId,
    p_from: from,
    p_to: to,
  })
  if (error) throw error
  return (data ?? []).map((r) => ({
    data: r.data,
    cursNume: r.curs_nume,
    status: r.status,
  }))
}
