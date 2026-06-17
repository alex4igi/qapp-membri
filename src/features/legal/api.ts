import { supabase } from '@/lib/supabase'
import type { TarifPublic } from '@/types/db'

// Oferta publică editată de staff în qapp (Setări → Tarife publice). Citită cu
// rolul `anon` (vizitator nelogat) — RLS permite SELECT public pe tarife_publice.
export async function listTarifePublice(): Promise<TarifPublic[]> {
  const { data, error } = await supabase
    .from('tarife_publice')
    .select('*')
    .eq('activ', true)
    .order('ordine', { ascending: true })
  if (error) throw error
  return data ?? []
}
