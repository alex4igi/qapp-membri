import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { CONTEXTE, submitRating, type ContextAchizitie } from './api'

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

function ContextRow({ context, label }: { context: ContextAchizitie; label: string }) {
  const { activeMember } = useActiveMember()
  const [rating, setRating] = useState(0)
  const [detalii, setDetalii] = useState('')
  const [done, setDone] = useState(false)

  const mut = useMutation({
    mutationFn: () =>
      submitRating({ clientId: activeMember!.clientId, context, rating, detalii }),
    onSuccess: () => setDone(true),
  })

  if (done) {
    return (
      <div className="rounded-2xl border border-line bg-surf p-4 shadow-card">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-1 text-sm font-medium text-ok">✓ Mulțumim pentru evaluare!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-2xl border border-line bg-surf p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">{label}</p>
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
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? 'Se trimite…' : 'Trimite evaluarea'}
          </Button>
        </>
      )}
    </div>
  )
}

export function EvaluareSection() {
  const { activeMember } = useActiveMember()
  if (!activeMember) return null
  return (
    <section className="space-y-3">
      <h2 className="text-base font-extrabold tracking-tight text-ink">Cât de mulțumit ești?</h2>
      <p className="text-xs text-sub">Evaluează experiența cu fiecare tip de activitate.</p>
      <div className="space-y-2">
        {CONTEXTE.map((c) => (
          <ContextRow key={c.key} context={c.key} label={c.label} />
        ))}
      </div>
    </section>
  )
}
