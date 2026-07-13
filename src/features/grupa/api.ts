import { supabase } from '@/lib/supabase'
import { formatLocatie } from '@/lib/format'
import type { Enums } from '@/types/db'

// „Grupa mea" — înrolările active ale unui membru cu curs + program + instructor
// + abonament. Sursă: RPC get_grupe_client (SECURITY DEFINER, scopat la familie).

export type GrupaRow = {
  enrollmentId: string
  cursId: string
  cursNume: string | null
  nivel: Enums<'nivel_curs'> | null
  varsta: Enums<'varsta_curs'> | null
  stil: string | null
  locatie: string | null
  sala: string | null
  zile: Enums<'zi_saptamana'>[]
  ora: string | null
  tipPlata: Enums<'tip_plata'> | null
  dataIncepere: string | null
  dataFinal: string | null
  instructori: string[]
}

export async function getGrupeClient(clientId: string): Promise<GrupaRow[]> {
  const { data, error } = await supabase.rpc('get_grupe_client', { p_client: clientId })
  if (error) throw error
  return (data ?? []).map((r) => ({
    enrollmentId: r.enrollment_id,
    cursId: r.curs_id,
    cursNume: r.curs_nume,
    nivel: r.nivel,
    varsta: r.varsta,
    stil: r.stil,
    locatie: formatLocatie(r.locatie_nume),
    sala: r.sala,
    zile: r.zile ?? [],
    ora: r.ora,
    tipPlata: r.tip_plata,
    dataIncepere: r.data_incepere,
    dataFinal: r.data_final,
    instructori: r.instructori ?? [],
  }))
}
