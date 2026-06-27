import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui'
import { formatRON } from '@/lib/format'
import { getReduceriFamilie } from './api'

export function ReduceriSection() {
  const { data, isLoading } = useQuery({ queryKey: ['reduceri'], queryFn: getReduceriFamilie })

  if (isLoading) return <Spinner />
  if (!data || data.length === 0) return null

  return (
    <section className="space-y-2 rounded-2xl border border-ok/30 bg-surf p-5 shadow-card">
      <h2 className="text-base font-extrabold tracking-tight text-ink">Reducerile tale active</h2>
      <ul className="space-y-1.5">
        {data.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <div>
              <span className="font-medium text-ink">{r.cursNume ?? 'Curs'}</span>
              <span className="text-sub"> · {r.clientNume}</span>
              {r.codVoucher && <span className="text-sub"> · voucher {r.codVoucher}</span>}
            </div>
            <span className="shrink-0 font-semibold text-ok">−{formatRON(r.reducere)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-sub">
        Reducerile (al 2-lea abonament / frați / voucher) se aplică automat la facturare.
      </p>
    </section>
  )
}
