import { formatRON, formatData } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { PlataRow } from './api/payments'

const LUNI = ['Ian.', 'Feb.', 'Mar.', 'Apr.', 'Mai', 'Iun.', 'Iul.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.']

function eticheta(r: PlataRow): string {
  if (!r.dataIncepere) return '—'
  if (r.tipPlata === 'Per an') return 'Tot sezonul'
  const [, m] = r.dataIncepere.split('-').map(Number)
  return LUNI[m - 1]
}

// Situația sezonului curent pe grupele și trupele recurente ale membrului: fiecare lună cu ce
// s-a plătit și ce urmează. Doar afișare — plata se face din lista de dedesubt.
export function SezonulMeu({
  rows,
  sezonId,
  sezonNume,
  membru,
  azi,
}: {
  rows: PlataRow[]
  sezonId: string
  sezonNume: string | null
  membru: string
  azi: string
}) {
  const recurente = rows.filter(
    (r) =>
      r.sezonId === sezonId &&
      (r.tipCurs === 'grupa' || r.tipCurs === 'trupa') &&
      (r.tipPlata === 'Per luna' || r.tipPlata === 'Per an'),
  )
  if (recurente.length === 0) return null

  const grupe: { nume: string; rows: PlataRow[] }[] = []
  for (const r of recurente) {
    const nume = r.cursNume ?? 'Grupă'
    let g = grupe.find((x) => x.nume === nume)
    if (!g) { g = { nume, rows: [] }; grupe.push(g) }
    g.rows.push(r)
  }
  const total = (xs: PlataRow[]) => {
    const cost = xs.reduce((a, r) => a + r.total, 0)
    const platit = xs.reduce((a, r) => a + Math.min(r.platit, r.total), 0)
    return { cost, platit, ramas: xs.reduce((a, r) => a + Math.max(r.rest, 0), 0) }
  }
  const tot = total(recurente)

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-surf p-5 shadow-card">
      <div>
        <h2 className="text-base font-extrabold tracking-tight text-ink">
          {sezonNume ?? 'Sezonul curent'} — {membru}
        </h2>
        <p className="text-xs text-sub">Grupele și trupele, lună cu lună: ce ai plătit și ce urmează.</p>
      </div>
      <Totaluri {...tot} mare />

      {grupe.map((g) => (
        <div key={g.nume} className="space-y-2 border-t border-line pt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-extrabold text-ink">{g.nume}</p>
            {grupe.length > 1 && <Totaluri {...total(g.rows)} />}
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {g.rows.map((r) => {
              const achitat = r.rest <= 0
              const restant = !achitat && !!r.scadenta && r.scadenta < azi
              const partial = !achitat && r.platit > 0
              return (
                <li
                  key={r.enrollmentId}
                  className={cn(
                    'rounded-xl border px-3 py-2',
                    achitat && 'border-ok/40 bg-ok/10',
                    restant && 'border-danger bg-surf',
                    !achitat && !restant && 'border-line bg-surf2',
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-ink">{eticheta(r)}</span>
                    {achitat ? (
                      <span className="text-xs font-extrabold text-ok">✓ achitat</span>
                    ) : restant ? (
                      <span className="text-xs font-extrabold text-danger">restant</span>
                    ) : null}
                  </div>
                  <p className="text-sm font-extrabold text-ink">{formatRON(achitat ? r.total : r.rest)}</p>
                  <p className={cn('text-[11px]', restant ? 'text-danger' : 'text-sub')}>
                    {achitat
                      ? 'plătit'
                      : partial
                        ? `rest din ${formatRON(r.total)}`
                        : r.scadenta
                          ? `${restant ? 'scadent din' : 'până pe'} ${formatData(r.scadenta)}`
                          : 'de plată'}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}

function Totaluri({ cost, platit, ramas, mare }: { cost: number; platit: number; ramas: number; mare?: boolean }) {
  return (
    <div className={cn('flex flex-wrap gap-x-4 gap-y-1', mare ? 'text-sm' : 'text-xs')}>
      <span className="text-sub">Cost sezon <b className="text-ink">{formatRON(cost)}</b></span>
      <span className="text-sub">Plătit <b className="text-ok">{formatRON(platit)}</b></span>
      <span className="text-sub">Rămas <b className="text-ink">{formatRON(ramas)}</b></span>
    </div>
  )
}
