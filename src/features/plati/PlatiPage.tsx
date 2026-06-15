import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatRON, formatData } from '@/lib/format'
import { cn } from '@/lib/cn'
import { getSoldFamilie, getPlatiClient } from './api/payments'

export function PlatiPage() {
  const { members, activeMember, loading } = useActiveMember()
  const sold = useQuery({ queryKey: ['sold-familie'], queryFn: getSoldFamilie })
  const plati = useQuery({
    queryKey: ['plati', activeMember?.clientId],
    queryFn: () => getPlatiClient(activeMember!.clientId),
    enabled: !!activeMember,
  })

  if (loading) return <Spinner />

  const totalFamilie = (sold.data ?? []).reduce((a, r) => a + r.restanta, 0)
  const numeById = new Map(members.map((m) => [m.clientId, m.nume]))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Plăți</h1>
        <p className="text-sm text-quasar-gray">Sold familie + situația plăților per înrolare.</p>
      </div>

      {/* Sold familie */}
      <section className="rounded-lg border border-quasar-gray-light p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Sold familie</span>
          <span className={cn('text-lg font-bold', totalFamilie > 0 ? 'text-red-600' : 'text-green-700')}>
            {formatRON(totalFamilie)}
          </span>
        </div>
        {sold.isLoading && <Spinner />}
        {(sold.data ?? []).filter((r) => r.restanta > 0).length > 0 && (
          <ul className="mt-2 space-y-1">
            {sold.data!
              .filter((r) => r.restanta > 0)
              .map((r) => (
                <li key={r.clientId} className="flex justify-between text-sm">
                  <span>{numeById.get(r.clientId) ?? r.nume}</span>
                  <span className="font-medium text-red-600">{formatRON(r.restanta)}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* Detalii plăți membru activ */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Detalii — {activeMember?.nume ?? '—'}</h2>
        {plati.isLoading && <Spinner />}
        {plati.data && plati.data.length === 0 && (
          <p className="text-sm text-quasar-gray">Nicio înrolare.</p>
        )}
        {plati.data && plati.data.length > 0 && (
          <ul className="divide-y divide-quasar-gray-light rounded-lg border border-quasar-gray-light">
            {plati.data.map((p) => {
              const achitat = p.rest <= 0
              return (
                <li key={p.enrollmentId} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.cursNume ?? 'Curs'}</p>
                    <p className="text-xs text-quasar-gray">
                      {formatData(p.dataIncepere)} · {p.tipPlata ?? ''}
                      {p.codVoucher ? ` · voucher ${p.codVoucher}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{formatRON(p.platit)} / {formatRON(p.total)}</p>
                    {achitat ? (
                      <span className="text-xs font-semibold text-green-700">ACHITAT</span>
                    ) : (
                      <span className="text-xs font-semibold text-red-600">
                        rest {formatRON(p.rest)}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {/* TODO Faza 2: buton „Plătește" pe prima înrolare cu rest > 0 → Netopia (createNetopiaPayment) */}
      </section>
    </div>
  )
}
