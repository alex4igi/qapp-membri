import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Button, Spinner } from '@/components/ui'
import { formatRON, formatData } from '@/lib/format'
import { getSoldFamilie } from '@/features/plati/api/payments'
import { listOpenSesiuniClient } from '@/features/rezervari/api'

export function AcasaPage() {
  const navigate = useNavigate()
  const { activeMember } = useActiveMember()

  const sold = useQuery({ queryKey: ['sold-familie'], queryFn: getSoldFamilie })
  const sesiuni = useQuery({ queryKey: ['open-sesiuni'], queryFn: () => listOpenSesiuniClient() })

  const totalFamilie = (sold.data ?? []).reduce((a, r) => a + r.restanta, 0)
  const urmatoarele = (sesiuni.data ?? []).slice(0, 3)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">
          Salut{activeMember?.nume ? `, ${activeMember.nume}` : ''}!
        </h1>
        <p className="text-sm text-quasar-gray">Privire de ansamblu asupra contului tău.</p>
      </div>

      {/* Sold familie + CTA plată */}
      <section className="rounded-lg border border-quasar-gray-light p-4">
        <span className="text-sm font-semibold">Sold familie</span>
        {sold.isLoading ? (
          <Spinner />
        ) : totalFamilie > 0 ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-lg font-bold text-red-600">{formatRON(totalFamilie)} de plată</span>
            <Button onClick={() => navigate('/plati')}>Plătește</Button>
          </div>
        ) : (
          <p className="mt-2 text-sm font-medium text-green-700">Totul e achitat. Mulțumim!</p>
        )}
      </section>

      {/* Următoarele sesiuni OPEN */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Următoarele ședințe disponibile</h2>
          <Link to="/rezervari" className="text-xs text-quasar-gray underline hover:text-quasar-black">
            Vezi toate
          </Link>
        </div>
        {sesiuni.isLoading && <Spinner />}
        {!sesiuni.isLoading && urmatoarele.length === 0 && (
          <p className="text-sm text-quasar-gray">Nicio sesiune disponibilă momentan.</p>
        )}
        {urmatoarele.length > 0 && (
          <ul className="divide-y divide-quasar-gray-light rounded-lg border border-quasar-gray-light">
            {urmatoarele.map((s) => (
              <li key={s.sesiuneId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{s.cursNume ?? 'Curs'}</p>
                  <p className="text-xs text-quasar-gray">
                    {formatData(s.data)}
                    {s.instructorNume ? ` · ${s.instructorNume}` : ''} · {s.locuriRamase} locuri
                  </p>
                </div>
                <span className="text-sm font-semibold">{formatRON(s.pret ?? 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
