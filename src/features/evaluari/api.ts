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
