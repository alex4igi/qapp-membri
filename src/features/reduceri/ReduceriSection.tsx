import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui'
import { formatRON } from '@/lib/format'
import { getReduceriFamilie, type ReducereRow } from './api'

// Un rând pe curs, nu unul pe lună (erau 18 rânduri identice). Se grupează doar lunile cu
// același membru, curs, preț întreg, preț redus și voucher — altfel ar ascunde diferențe.
type Grup = ReducereRow & { luni: number }

function grupeaza(rows: ReducereRow[]): Grup[] {
  const m = new Map<string, Grup>()
  for (const r of rows) {
    const key = [r.clientId, r.cursNume, r.sumaBaza, r.suma, r.codVoucher].join('|')
    const g = m.get(key)
    if (g) g.luni += 1
    else m.set(key, { ...r, luni: 1 })
  }
  return [...m.values()]
}

export function ReduceriSection() {
  const { data, isLoading } = useQuery({ queryKey: ['reduceri'], queryFn: getReduceriFamilie })

  if (isLoading) return <Spinner />
  if (!data || data.length === 0) return null
  const grupe = grupeaza(data)

  return (
    <details className="group overflow-hidden rounded-2xl border border-line bg-surf shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="grid gap-0.5">
          <span className="text-sm font-bold text-ink">Reducerile tale</span>
          <span className="text-xs text-sub">
            {grupe.length} {grupe.length === 1 ? 'reducere' : 'reduceri'} · deja scăzute din sumele de mai sus
          </span>
        </span>
        <span aria-hidden className="text-xs text-sub group-open:rotate-90">▸</span>
      </summary>
      <ul className="divide-y divide-line border-t border-line">
        {grupe.map((g, i) => {
          const pct = g.sumaBaza > 0 ? Math.round((1 - g.suma / g.sumaBaza) * 100) : 0
          return (
            <li key={i} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{g.cursNume ?? 'Curs'}</p>
                <p className="text-xs text-sub">
                  {g.clientNume} · {g.luni} {g.luni === 1 ? 'rată' : 'rate'}
                  {g.codVoucher ? ` · voucher ${g.codVoucher}` : ''}
                </p>
              </div>
              <div className="grid justify-items-end text-right">
                <b className="text-[15px] font-extrabold text-ink">{formatRON(g.suma)}</b>
                <span className="text-[11.5px] text-sub">
                  în loc de {formatRON(g.sumaBaza)}
                  {pct > 0 ? ` · −${pct}%` : ''}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="border-t border-line px-4 py-2.5 text-xs text-sub">
        Reducerea de 10% se aplică la al doilea abonament din familie (frați sau al doilea curs). Reducerile nu se
        cumulează.
      </p>
    </details>
  )
}
