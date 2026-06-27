import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { cn } from '@/lib/cn'
import { getEvaluariClient, SKILLS, SCALE_LEFT, SCALE_RIGHT, type EvaluareRow } from './api'

function SkillBar({ value }: { value: number | null }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn('h-2.5 w-2.5 rounded-full', value && n <= value ? 'bg-acc' : 'bg-surf2')}
        />
      ))}
    </div>
  )
}

function EvaluareCard({ e }: { e: EvaluareRow }) {
  return (
    <div className="space-y-3 bg-surf border border-line rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-ink">{e.cursNume ?? 'Evaluare'}</p>
        <span className="text-xs text-sub">{formatData(e.data)}</span>
      </div>
      {e.teacherNume && <p className="text-xs text-sub">Instructor: {e.teacherNume}</p>}

      <div className="flex justify-between text-[10px] uppercase tracking-wide text-sub">
        <span>{SCALE_LEFT}</span>
        <span>{SCALE_RIGHT}</span>
      </div>
      <ul className="space-y-1.5">
        {SKILLS.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink">{s.label}</span>
            <SkillBar value={e.skills[s.key]} />
          </li>
        ))}
      </ul>

      {e.feedbackGeneral && (
        <div className="bg-surf2 rounded-xl p-3">
          <p className="text-xs font-bold text-sub">Feedback instructor</p>
          <p className="mt-0.5 text-sm text-ink">{e.feedbackGeneral}</p>
        </div>
      )}
    </div>
  )
}

export function EvaluariSection() {
  const { activeMember } = useActiveMember()
  const { data, isLoading } = useQuery({
    queryKey: ['evaluari', activeMember?.clientId],
    queryFn: () => getEvaluariClient(activeMember!.clientId),
    enabled: !!activeMember,
  })

  if (!activeMember) return null
  return (
    <section className="space-y-3">
      <h2 className="text-base font-extrabold text-ink">Progres & feedback</h2>
      {isLoading && <Spinner />}
      {data && data.length === 0 && (
        <p className="text-sm text-sub">Nicio evaluare disponibilă încă.</p>
      )}
      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((e) => (
            <EvaluareCard key={e.id} e={e} />
          ))}
        </div>
      )}
    </section>
  )
}
