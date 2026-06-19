import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import {
  getEvenimenteClient,
  getParticipariClient,
  getRezultateConcursuri,
} from './api'
import { EvaluareSection } from '@/features/evaluare/EvaluareSection'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function ActivitatePage() {
  const { activeMember } = useActiveMember()

  const evenimente = useQuery({ queryKey: ['evenimente'], queryFn: getEvenimenteClient })
  const participari = useQuery({
    queryKey: ['participari', activeMember?.clientId],
    queryFn: () => getParticipariClient(activeMember!.clientId),
    enabled: !!activeMember,
  })
  const rezultate = useQuery({ queryKey: ['rezultate-concursuri'], queryFn: getRezultateConcursuri })

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Activitate</h1>

      <Section title="Evenimente care urmează">
        {evenimente.isLoading && <Spinner />}
        {evenimente.data && evenimente.data.length === 0 && (
          <p className="text-sm text-quasar-gray">Niciun eveniment programat momentan.</p>
        )}
        {evenimente.data && evenimente.data.length > 0 && (
          <ul className="divide-y divide-quasar-gray-light rounded-lg border border-quasar-gray-light">
            {evenimente.data.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{e.nume ?? 'Eveniment'}</p>
                  <p className="text-xs text-quasar-gray">
                    {formatData(e.data)}
                    {e.locatie ? ` · ${e.locatie}` : ''}
                    {e.tip ? ` · ${e.tip}` : ''}
                  </p>
                </div>
                {e.pretBilet ? (
                  <span className="shrink-0 text-sm font-semibold">{e.pretBilet} RON</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Participări — ${activeMember?.nume ?? '—'}`}>
        {participari.isLoading && <Spinner />}
        {participari.data && participari.data.length === 0 && (
          <p className="text-sm text-quasar-gray">Nicio participare înregistrată încă.</p>
        )}
        {participari.data && participari.data.length > 0 && (
          <ul className="divide-y divide-quasar-gray-light rounded-lg border border-quasar-gray-light">
            {participari.data.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm font-medium">{p.nume ?? 'Eveniment'}</p>
                <p className="text-xs text-quasar-gray">{formatData(p.data)}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Rezultate la concursuri (Quasar Dance)">
        {rezultate.isLoading && <Spinner />}
        {rezultate.data && rezultate.data.length === 0 && (
          <p className="text-sm text-quasar-gray">Niciun rezultat înregistrat.</p>
        )}
        {rezultate.data && rezultate.data.length > 0 && (
          <ul className="divide-y divide-quasar-gray-light rounded-lg border border-quasar-gray-light">
            {rezultate.data.map((c) => {
              const locuri = [
                c.loculI ? `${c.loculI}× 🥇` : null,
                c.loculII ? `${c.loculII}× 🥈` : null,
                c.loculIII ? `${c.loculIII}× 🥉` : null,
              ].filter(Boolean).join('  ')
              return (
                <li key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{c.nume ?? 'Concurs'}</p>
                    <p className="text-xs text-quasar-gray">{formatData(c.data)}</p>
                  </div>
                  {locuri && <p className="mt-0.5 text-sm">{locuri}</p>}
                  {c.rezultate && <p className="mt-0.5 text-xs text-quasar-gray">{c.rezultate}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <EvaluareSection />
    </div>
  )
}
