import { cn } from '@/lib/cn'
import { formatLuna, formatRON, formatZi } from '@/lib/format'
import { laTermen, stare, type Context, type Rand } from './familie'

// Situația sezonului, pe un membru: fiecare lună / ședință ca un card colorat.
// Culorile (Alex, 09.10.2026): verde = achitat, roșu = restant, galben plin = de plătit acum
// (azi sau termenul care intră în coș), galben deschis = luni următoare.
export function SituatiaSezonului({
  membru,
  rows,
  c,
  sezonNume,
}: {
  membru: string
  rows: Rand[]
  c: Context
  sezonNume: string | null
}) {
  const rate = rows.filter((r) => r.kind === 'rata')
  if (!rate.length) return null
  const platit = rate.reduce((a, r) => a + Math.min(r.platit, Math.max(r.total, 0)), 0)
  const ramas = rate.reduce((a, r) => a + Math.max(r.rest, 0), 0)
  const abonamente = rate.filter((r) => r.tipCurs === 'grupa' || r.tipCurs === 'trupa')
  const facultative = rate.filter((r) => r.tipCurs === 'facultativ')

  return (
    <details open className="overflow-hidden rounded-2xl border border-line bg-surf shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="grid gap-0.5">
          <span className="text-sm font-extrabold text-ink">
            {membru} · {sezonNume ?? 'Sezonul curent'}
          </span>
          <span className="text-xs text-sub">
            Plătit {formatRON(platit)} · {ramas > 0 ? `rămas ${formatRON(ramas)}, include rate viitoare` : 'nimic rămas'}
          </span>
        </span>
        <span aria-hidden className="text-xs text-sub">▾</span>
      </summary>
      <div className="grid gap-3 border-t border-line p-4">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-sub">
          <span>Plătit până acum <b className="text-ok">{formatRON(platit)}</b></span>
          <span>
            Total rămas pentru înscrierile existente <b className="text-ink">{formatRON(ramas)}</b>{' '}
            <span className="text-xs">(include rate viitoare)</span>
          </span>
        </div>
        <Legenda />
        <Bloc titlu="Abonamente pe sezon" rows={abonamente} c={c} />
        <Bloc titlu="Facultative" rows={facultative} c={c} />
      </div>
    </details>
  )
}

function Legenda() {
  const item = (cls: string, t: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded-sm border', cls)} />
      {t}
    </span>
  )
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-sub">
      {item('border-transparent bg-ok/25', 'achitat')}
      {item('border-danger bg-danger/10', 'restant')}
      {item('border-acc bg-acc', 'de plătit acum')}
      {item('border-line bg-surf2', 'urmează')}
    </div>
  )
}

function Bloc({ titlu, rows, c }: { titlu: string; rows: Rand[]; c: Context }) {
  if (!rows.length) return null
  const cursuri = [...new Set(rows.map((r) => r.titlu))]
  return (
    <div className="grid gap-2">
      <h3 className="text-[13px] font-extrabold text-ink">{titlu}</h3>
      {cursuri.map((nume) => (
        <div key={nume} className="grid gap-1.5">
          <p className="text-xs text-sub">{nume}</p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-1.5">
            {rows
              .filter((r) => r.titlu === nume)
              .sort((a, b) => ((a.dataIncepere ?? '') < (b.dataIncepere ?? '') ? -1 : 1))
              .map((r) => <Card key={r.key} r={r} c={c} />)}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Card({ r, c }: { r: Rand; c: Context }) {
  const s = stare(r, c.azi, c.inCurs)
  const acum = s === 'azi' || (s === 'viitor' && laTermen(r, c))
  const eticheta =
    r.tipPlata === 'Per sedinta'
      ? formatZi(r.dataIncepere, c.azi)
      : r.tipPlata === 'Per an'
        ? 'Tot sezonul'
        : r.dataIncepere
          ? formatLuna(r.dataIncepere, true).replace(/^./, (x) => x.toUpperCase())
          : '—'
  const suma = s === 'achitat' ? r.platit : s === 'acoperit' ? 0 : r.rest
  const sub =
    s === 'achitat' ? '✓ achitat'
      : s === 'acoperit' ? 'acoperit'
        : s === 'restant' ? 'termen depășit'
          : s === 'azi' ? 'de achitat azi'
            : s === 'curs' ? 'plată în curs'
              : acum ? `până pe ${formatZi(r.scadenta, c.azi)}`
                : `termen ${formatZi(r.scadenta, c.azi)}`
  return (
    <li
      className={cn(
        'grid gap-0.5 rounded-xl border px-2.5 py-2',
        (s === 'achitat' || s === 'acoperit') && 'border-transparent bg-ok/15',
        s === 'restant' && 'border-danger bg-danger/10',
        acum && 'border-acc bg-acc text-acc-ink',
        s === 'viitor' && !acum && 'border-line bg-surf2',
        s === 'curs' && 'border-transparent bg-evgrupa/15',
      )}
    >
      <span className="text-xs font-bold">{eticheta}</span>
      <span className="text-[13px] font-extrabold">{formatRON(suma)}</span>
      <span
        className={cn(
          'text-[10.5px]',
          (s === 'achitat' || s === 'acoperit') && 'font-bold text-ok',
          s === 'restant' && 'font-bold text-danger',
          acum && 'font-bold',
          s === 'viitor' && !acum && 'text-sub',
          s === 'curs' && 'font-bold text-evgrupa',
        )}
      >
        {sub}
      </span>
    </li>
  )
}
