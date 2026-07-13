import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import {
  getEvenimenteClient,
  getParticipariClient,
  getRezultateConcursuri,
} from './api'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-extrabold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  )
}

export function ActivitateSection() {
  const { activeMember } = useActiveMember()

  const evenimente = useQuery({ queryKey: ['evenimente'], queryFn: getEvenimenteClient })
  const participari = useQuery({
    queryKey: ['participari', activeMember?.clientId],
    queryFn: () => getParticipariClient(activeMember!.clientId),
    enabled: !!activeMember,
  })
  const rezultate = useQuery({ queryKey: ['rezultate-concursuri'], queryFn: getRezultateConcursuri })

  return (
    <div className="space-y-6">
      <Section title="Evenimente care urmează">
        {evenimente.isLoading && <Spinner />}
        {evenimente.data && evenimente.data.length === 0 && (
          <p className="text-sm text-sub">Niciun eveniment programat momentan.</p>
        )}
        {evenimente.data && evenimente.data.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surf shadow-card">
            {evenimente.data.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{e.nume ?? 'Eveniment'}</p>
                  <p className="text-xs text-sub">
                    {formatData(e.data)}
                    {e.locatie ? ` · ${e.locatie}` : ''}
                    {e.tip ? ` · ${e.tip}` : ''}
                  </p>
                </div>
                {e.pretBilet ? (
                  <span className="shrink-0 text-sm font-semibold text-ink">{e.pretBilet} RON</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Participări — ${activeMember?.displayName ?? '—'}`}>
        {participari.isLoading && <Spinner />}
        {participari.data && participari.data.length === 0 && (
          <p className="text-sm text-sub">Nicio participare înregistrată încă.</p>
        )}
        {participari.data && participari.data.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surf shadow-card">
            {participari.data.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm font-medium text-ink">{p.nume ?? 'Eveniment'}</p>
                <p className="text-xs text-sub">{formatData(p.data)}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Rezultate la concursuri (Quasar Dance)">
        {rezultate.isLoading && <Spinner />}
        {rezultate.data && rezultate.data.length === 0 && (
          <p className="text-sm text-sub">Niciun rezultat înregistrat.</p>
        )}
        {rezultate.data && rezultate.data.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surf shadow-card">
            {rezultate.data.map((c) => {
              const locuri = [
                c.loculI ? `${c.loculI}× 🥇` : null,
                c.loculII ? `${c.loculII}× 🥈` : null,
                c.loculIII ? `${c.loculIII}× 🥉` : null,
              ].filter(Boolean).join('  ')
              return (
                <li key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{c.nume ?? 'Concurs'}</p>
                    <p className="text-xs text-sub">{formatData(c.data)}</p>
                  </div>
                  {locuri && <p className="mt-0.5 text-sm text-ink">{locuri}</p>}
                  {c.rezultate && <p className="mt-0.5 text-xs text-sub">{c.rezultate}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </div>
  )
}
