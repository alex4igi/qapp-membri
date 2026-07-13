import { supabase } from '@/lib/supabase'
import { formatLocatie } from '@/lib/format'
import type { Enums } from '@/types/db'

// „Activitatea mea" — evenimente viitoare (studio-wide, informativ), istoricul
// participărilor copilului la evenimente, și rezultatele la concursuri ale școlii.

export type EvenimentRow = {
  id: string
  nume: string | null
  tip: Enums<'tip_eveniment'> | null
  data: string | null
  ora: string | null
  locatie: string | null
  descriere: string | null
  pretBilet: number | null
  /** Setat = eveniment exclusiv grupei (vizibil doar membrilor înscriși). */
  cursId: string | null
  cursNume: string | null
}

// Cu clientId: include și evenimentele grupelor în care membrul are înrolare
// activă. Fără: doar evenimentele studio-wide.
export async function getEvenimenteClient(clientId?: string): Promise<EvenimentRow[]> {
  const { data, error } = await supabase.rpc(
    'get_evenimente_client',
    clientId ? { p_client: clientId } : {},
  )
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.eveniment_id,
    nume: r.nume,
    tip: r.tip,
    data: r.data,
    ora: r.ora,
    locatie: formatLocatie(r.locatie),
    descriere: r.descriere,
    pretBilet: r.pret_bilet,
    cursId: r.curs_id,
    cursNume: r.curs_nume,
  }))
}

export type ParticipareRow = {
  id: string
  nume: string | null
  tip: Enums<'tip_eveniment'> | null
  data: string | null
  locatie: string | null
}

export async function getParticipariClient(clientId: string): Promise<ParticipareRow[]> {
  const { data, error } = await supabase.rpc('get_participari_client', { p_client: clientId })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.eveniment_id,
    nume: r.nume,
    tip: r.tip,
    data: r.data,
    locatie: formatLocatie(r.locatie),
  }))
}

export type RezultatConcursRow = {
  id: string
  nume: string | null
  data: string | null
  loculI: number | null
  loculII: number | null
  loculIII: number | null
  rezultate: string | null
}

export async function getRezultateConcursuri(): Promise<RezultatConcursRow[]> {
  const { data, error } = await supabase.rpc('get_rezultate_concursuri')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    nume: r.nume,
    data: r.data,
    loculI: r.locul_i,
    loculII: r.locul_ii,
    loculIII: r.locul_iii,
    rezultate: r.rezultate,
  }))
}
