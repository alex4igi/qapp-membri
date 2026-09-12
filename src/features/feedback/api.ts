import { supabase } from '@/lib/supabase'

export type FeedbackTip = 'Bug' | 'Idee' | 'Intrebare'

export const TIP_OPTIONS: { value: FeedbackTip; label: string; hint: string }[] = [
  { value: 'Bug', label: '🐞 Ceva nu merge', hint: 'un buton care nu răspunde, o cifră greșită, o pagină care se blochează' },
  { value: 'Idee', label: '💡 Am o idee', hint: 'ceva ce ți-ar plăcea să găsești aici' },
  { value: 'Intrebare', label: '❓ Am o întrebare', hint: 'nu înțelegi ceva din portal' },
]

// Rolul `parinte` nu poate scrie direct în tabele (gardul deny_parinte_direct),
// deci totul trece prin RPC-ul SECURITY DEFINER.
export async function submitFeedback(input: {
  tip: FeedbackTip
  titlu: string
  detalii?: string | null
  clientId?: string | null
}): Promise<string> {
  const { data, error } = await supabase.rpc('submit_app_feedback_portal', {
    p_tip: input.tip,
    p_titlu: input.titlu,
    p_detalii: input.detalii?.trim() || undefined,
    p_pagina: window.location.pathname,
    p_user_agent: navigator.userAgent,
    p_client: input.clientId ?? undefined,
  })
  if (error) throw error
  return data as string
}
