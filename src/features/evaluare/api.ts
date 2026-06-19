import { supabase } from '@/lib/supabase'

export type ContextAchizitie = 'curs_recurent' | 'open' | 'eveniment'

export const CONTEXTE: { key: ContextAchizitie; label: string }[] = [
  { key: 'curs_recurent', label: 'Cursurile recurente' },
  { key: 'open', label: 'OPEN class' },
  { key: 'eveniment', label: 'Evenimente' },
]

export async function submitRating(params: {
  clientId: string
  context: ContextAchizitie
  rating: number
  detalii?: string
}): Promise<void> {
  const { error } = await supabase.rpc('submit_rating_client', {
    p_client: params.clientId,
    p_context: params.context,
    p_rating: params.rating,
    p_detalii: params.detalii?.trim() || undefined,
  })
  if (error) throw error
}
