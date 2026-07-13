import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Button, Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  getEvaluariClient,
  getRatableActivities,
  submitRating,
  SKILLS,
  SCALE_LEFT,
  SCALE_RIGHT,
  CONTEXT_LABEL,
  type EvaluareRow,
  type RatableActivity,
} from './api'

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

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} stele`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className={cn(
            'text-2xl leading-none transition-colors',
            n <= (hover || value) ? 'text-acc' : 'text-line',
          )}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ActivityRow({ activity }: { activity: RatableActivity }) {
  const { activeMember } = useActiveMember()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(activity.rating ?? 0)
  const [detalii, setDetalii] = useState(activity.detalii ?? '')

  const mut = useMutation({
    mutationFn: () =>
      submitRating({ clientId: activeMember!.clientId, activity, rating, detalii }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['ratable', activeMember?.clientId] }),
  })

  const alreadyRated = activity.rating != null
  // „murdar" = valoarea din UI diferă de ce e salvat în DB
  const dirty = rating !== (activity.rating ?? 0) || detalii !== (activity.detalii ?? '')

  return (
    <div className="space-y-2 rounded-2xl border border-line bg-surf p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{activity.nume}</p>
          <p className="text-[10px] uppercase tracking-wide text-sub">
            {CONTEXT_LABEL[activity.context]}
          </p>
        </div>
        <Stars value={rating} onChange={setRating} />
      </div>
      {rating > 0 && (
        <>
          <textarea
            rows={2}
            value={detalii}
            onChange={(e) => setDetalii(e.target.value)}
            placeholder="Un comentariu (opțional)"
            className="w-full rounded-md border border-line bg-surf2 px-3 py-2 text-sm text-ink"
          />
          {mut.isError && <p className="text-xs text-danger">Eroare la trimitere.</p>}
          <div className="flex items-center gap-3">
            <Button onClick={() => mut.mutate()} disabled={mut.isPending || !dirty}>
              {mut.isPending
                ? 'Se trimite…'
                : alreadyRated
                  ? 'Actualizează'
                  : 'Trimite evaluarea'}
            </Button>
            {alreadyRated && !dirty && (
              <span className="text-xs font-medium text-ok">✓ Evaluat</span>
            )}
          </div>
        </>
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
  const ratable = useQuery({
    queryKey: ['ratable', activeMember?.clientId],
    queryFn: () => getRatableActivities(activeMember!.clientId),
    enabled: !!activeMember,
  })

  if (!activeMember) return null
  return (
    <>
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
      <section className="space-y-3">
        <h2 className="text-base font-extrabold tracking-tight text-ink">Cât de mulțumit ești?</h2>
        <p className="text-xs text-sub">Evaluează fiecare curs și eveniment la care ai participat.</p>
        {ratable.isLoading && <Spinner />}
        {ratable.data && ratable.data.length === 0 && (
          <p className="text-sm text-sub">Nicio activitate de evaluat momentan.</p>
        )}
        {ratable.data && ratable.data.length > 0 && (
          <div className="space-y-2">
            {ratable.data.map((a) => (
              <ActivityRow key={`${a.kind}-${a.id}`} activity={a} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
