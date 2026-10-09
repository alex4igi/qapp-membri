import { Button, Spinner } from '@/components/ui'
import { useActiveMember } from '@/hooks/useActiveMember'
import { cn } from '@/lib/cn'
import { formatRON, formatZi } from '@/lib/format'
import { sumarPlati } from './api/payments'
import { useRezumatFamilie } from './useRezumatFamilie'

// Textul permanent de lângă sume: clientul care a crezut că trebuie să plătească tot sezonul
// a pornit toată reproiectarea (handoff Codex 2026-10-09).
export function TextRate({ className }: { className?: string }) {
  return (
    <p className={cn('flex gap-2 rounded-xl bg-surf2 px-3 py-2.5 text-[12.5px] text-ink', className)}>
      <span aria-hidden>ℹ</span>
      <span>
        <b>Abonamentul se achită în rate, la termenele afișate.</b> Nu trebuie să achiți acum tot sezonul. O
        ședință plătită separat are termenul în ziua ședinței.
      </span>
    </p>
  )
}

export function SituatiaFamiliei() {
  const { members } = useActiveMember()
  const { q, azi, sumar, termen, urmatoareaRata } = useRezumatFamilie()
  const perMembru = members
    .map((m) => ({ m, s: sumarPlati(q.data ?? [], m.clientId) }))
    .filter((x) => x.s.restant > 0)

  return (
    <section className="grid gap-3 rounded-2xl border border-line bg-surf p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-extrabold tracking-tight text-ink">Situația familiei</h2>
        <span className="text-xs text-sub">{members.map((m) => m.displayName).join(' · ')}</span>
      </div>
      {q.isLoading ? (
        <Spinner />
      ) : q.isError ? (
        <div className="grid gap-2 text-sm">
          <p className="text-ink">Nu am putut încărca situația plăților.</p>
          <div><Button variant="secondary" onClick={() => void q.refetch()}>Reîncearcă</Button></div>
        </div>
      ) : (
        <div className="divide-y divide-line rounded-xl border border-line px-3.5">
          {sumar.restant > 0 ? (
            <Linie
              rosu
              titlu="Restanțe · termen depășit"
              sub={perMembru.map((x) => `${x.m.displayName} ${formatRON(x.s.restant)}`).join(' · ')}
              suma={sumar.restant}
            />
          ) : (
            <Linie ok titlu="Nu ai restanțe" />
          )}
          {termen && (
            <Linie
              titlu={termen.scadenta === azi ? 'De achitat azi' : 'Următoarea plată'}
              sub={termen.scadenta === azi ? undefined : `până pe ${formatZi(termen.scadenta, azi)}`}
              suma={termen.suma}
            />
          )}
          {urmatoareaRata && (
            <Linie titlu="Următoarea rată" sub={`${formatZi(urmatoareaRata, azi)} · nu e de plătit acum`} />
          )}
        </div>
      )}
      <TextRate />
    </section>
  )
}

function Linie({ titlu, sub, suma, rosu, ok }: { titlu: string; sub?: string; suma?: number; rosu?: boolean; ok?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <div className="grid min-w-0 gap-px">
        <b className={cn('text-sm', rosu ? 'text-danger' : ok ? 'text-ok' : 'text-ink')}>{titlu}</b>
        {sub && <span className="text-xs text-sub">{sub}</span>}
      </div>
      {suma != null && (
        <span className={cn('whitespace-nowrap text-xl font-extrabold', rosu ? 'text-danger' : 'text-ink')}>{formatRON(suma)}</span>
      )}
    </div>
  )
}
