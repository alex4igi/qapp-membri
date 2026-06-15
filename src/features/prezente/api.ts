import { supabase } from '@/lib/supabase'
import type { StatusPrezenta } from '@/types/db'

// Citire prin RPC client-facing get_prezente_client (scopat la familia contului).
export type PrezentaRow = {
  data: string | null
  cursNume: string | null
  status: StatusPrezenta | null
}

export async function getPrezenteClient(clientId: string): Promise<PrezentaRow[]> {
  const { data, error } = await supabase.rpc('get_prezente_client', { p_client: clientId })
  if (error) throw error
  return (data ?? []).map((r) => ({
    data: r.data,
    cursNume: r.curs_nume,
    status: r.status,
  }))
}
