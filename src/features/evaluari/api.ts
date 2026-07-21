import { supabase } from '@/lib/supabase'

// Cele 10 abilități evaluate (oglindă a qapp v2 skills.ts). Scală 1–5:
// „cu foarte mult ajutor" → „reușește independent".
export const SKILLS: { key: string; label: string }[] = [
  { key: 'skill_ritm', label: 'Ține ritmul și se mișcă pe muzică' },
  { key: 'skill_pasi_baza', label: 'Execută pașii de bază' },
  { key: 'skill_coregrafie', label: 'Reține și reproduce o coregrafie scurtă' },
  { key: 'skill_izolari', label: 'Realizează izolări ale corpului' },
  { key: 'skill_coordonare', label: 'Coordonează brațele cu picioarele' },
  { key: 'skill_freeze', label: 'Execută freeze-uri și poziții stabile' },
  { key: 'skill_sincronizare', label: 'Dansează sincronizat cu grupul' },
  { key: 'skill_improvizatie', label: 'Improvizează pași simpli în freestyle' },
  { key: 'skill_expresivitate', label: 'Își exprimă personalitatea prin mișcare' },
  { key: 'skill_prezentare', label: 'Prezintă în fața publicului cu încredere' },
]

export const SCALE_LEFT = 'cu mult ajutor'
export const SCALE_RIGHT = 'reușește singur'

export type EvaluareRow = {
  id: string
  data: string | null
  cursNume: string | null
  teacherNume: string | null
  nivelGrupa: string | null
  feedbackGeneral: string | null
  skills: Record<string, number | null>
}

export async function getEvaluariClient(clientId: string): Promise<EvaluareRow[]> {
  const { data, error } = await supabase.rpc('get_evaluari_client', { p_client: clientId })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    data: r.data,
    cursNume: r.curs_nume,
    teacherNume: r.teacher_nume,
    nivelGrupa: r.nivel_grupa,
    feedbackGeneral: r.feedback_general,
    skills: Object.fromEntries(
      SKILLS.map((s) => [s.key, (r as unknown as Record<string, number | null>)[s.key]]),
    ),
  }))
}

export type ContextAchizitie = 'curs_recurent' | 'open' | 'eveniment'

export const CONTEXT_LABEL: Record<ContextAchizitie, string> = {
  curs_recurent: 'Curs recurent',
  open: 'OPEN class',
  eveniment: 'Eveniment',
}

// Oglinda pragurilor din `submit_rating_client` — DB-ul le impune, aici doar evităm
// un roundtrip care s-ar întoarce cu eroare.
export const MIN_LUNI_ACHITATE = 3
export const MIN_COMENTARIU = 10
export const PRAG_COMENTARIU_OBLIGATORIU = 3

// O activitate evaluabilă: curs recurent, o sesiune OPEN sau un eveniment — cu ratingul curent.
export type ActivityKind = 'curs' | 'open_sesiune' | 'eveniment'
export type RatableActivity = {
  kind: ActivityKind
  id: string
  nume: string
  context: ContextAchizitie
  rating: number | null
  detalii: string | null
  /** false = sub pragul de luni achitate, sau sezon încheiat */
  poateEvalua: boolean
  /** doar pentru cursuri recurente; null la OPEN/evenimente */
  luniAchitate: number | null
  /** sezonul grupei s-a încheiat — votul rămâne fixat */
  blocat: boolean
}

export async function getRatableActivities(clientId: string): Promise<RatableActivity[]> {
  const { data, error } = await supabase.rpc('get_ratable_activities_client', {
    p_client: clientId,
  })
  if (error) throw error
  return (data ?? []).map((r) => ({
    kind: r.kind as ActivityKind,
    id: r.id,
    nume: r.nume,
    context: r.context as ContextAchizitie,
    rating: r.rating,
    detalii: r.detalii,
    poateEvalua: r.poate_evalua ?? false,
    luniAchitate: r.luni_achitate,
    blocat: r.blocat ?? false,
  }))
}

export async function submitRating(params: {
  clientId: string
  activity: RatableActivity
  rating: number
  detalii?: string
}): Promise<void> {
  const { activity } = params
  const { error } = await supabase.rpc('submit_rating_client', {
    p_client: params.clientId,
    p_context: activity.context,
    p_rating: params.rating,
    p_detalii: params.detalii?.trim() || undefined,
    p_curs: activity.kind === 'curs' ? activity.id : undefined,
    p_sesiune: activity.kind === 'open_sesiune' ? activity.id : undefined,
    p_eveniment: activity.kind === 'eveniment' ? activity.id : undefined,
  })
  if (error) throw error
}
