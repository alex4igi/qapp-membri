import { supabase } from '@/lib/supabase'
import type { TarifPublic, ProdusPublic, BiletPublic } from '@/types/db'

// Oferta publică editată de staff în qapp (Setări → Tarife publice). Citită cu
// rolul `anon` (vizitator nelogat) — RLS permite SELECT public pe tarife_publice.
export async function listTarifePublice(): Promise<TarifPublic[]> {
  const { data, error } = await supabase
    .from('tarife_publice')
    .select('*')
    .eq('activ', true)
    .order('ordine', { ascending: true })
    .limit(200)
  if (error) throw error
  return data ?? []
}

// Lista de produse (merchandise) editată în qapp (Setări → Produse publice).
// Listare informativă pe /servicii — citită cu rolul `anon` (SELECT public RLS).
export async function listProdusePublice(): Promise<ProdusPublic[]> {
  const { data, error } = await supabase
    .from('produse_publice')
    .select('*')
    .eq('activ', true)
    .order('ordine', { ascending: true })
    .limit(200)
  if (error) throw error
  return data ?? []
}

// Bilete la evenimentele viitoare, derivate din modulul Evenimente (qapp). View-ul
// `bilete_publice` filtrează deja la public + viitoare + neanulat — citit cu rolul `anon`.
export async function listBiletePublice(): Promise<BiletPublic[]> {
  const { data, error } = await supabase
    .from('bilete_publice')
    .select('*')
    .order('data', { ascending: true })
    .limit(200)
  if (error) throw error
  return data ?? []
}
