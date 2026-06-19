import { supabase } from '@/lib/supabase'

export type AnuntRow = {
  id: string
  titlu: string
  continut: string
  created: string
  readAt: string | null
}

export async function getAnunturiClient(): Promise<AnuntRow[]> {
  const { data, error } = await supabase.rpc('get_anunturi_client')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    titlu: r.titlu,
    continut: r.continut,
    created: r.created,
    readAt: r.read_at,
  }))
}

export async function markAnunturiCitite(): Promise<void> {
  const { error } = await supabase.rpc('mark_anunturi_citite')
  if (error) throw error
}
