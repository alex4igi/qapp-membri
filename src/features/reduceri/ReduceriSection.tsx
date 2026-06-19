import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui'
import { formatRON } from '@/lib/format'
import { getReduceriFamilie } from './api'

export function ReduceriSection() {
  const { data, isLoading } = useQuery({ queryKey: ['reduceri'], queryFn: getReduceriFamilie })

  if (isLoading) return <Spinner />
  if (!data || data.length === 0) return null

  return (
    <section className="space-y-2 rounded-lg border border-green-200 bg-green-50/50 p-4">
      <h2 className="text-sm font-semibold">Reducerile tale active</h2>
      <ul className="space-y-1.5">
        {data.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <div>
              <span className="font-medium">{r.cursNume ?? 'Curs'}</span>
              <span className="text-quasar-gray"> · {r.clientNume}</span>
              {r.codVoucher && <span className="text-quasar-gray"> · voucher {r.codVoucher}</span>}
            </div>
            <span className="shrink-0 font-semibold text-green-700">−{formatRON(r.reducere)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-quasar-gray">
        Reducerile (al 2-lea abonament / frați / voucher) se aplică automat la facturare.
      </p>
    </section>
  )
}
