import { supabase } from '@/lib/supabase'
import type { Enums } from '@/types/db'

// „Activitatea mea" — evenimente viitoare (studio-wide, informativ), istoricul
// participărilor copilului la evenimente, și rezultatele la concursuri ale școlii.

export type EvenimentRow = {
  id: string
  nume: string | null
  tip: Enums<'tip_eveniment'> | null
  data: string | null
  locatie: string | null
  descriere: string | null
  pretBilet: number | null
}

export async function getEvenimenteClient(): Promise<EvenimentRow[]> {
  const { data, error } = await supabase.rpc('get_evenimente_client')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.eveniment_id,
    nume: r.nume,
    tip: r.tip,
    data: r.data,
    locatie: r.locatie,
    descriere: r.descriere,
    pretBilet: r.pret_bilet,
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
    locatie: r.locatie,
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
