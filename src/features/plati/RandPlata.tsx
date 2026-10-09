import { cn } from '@/lib/cn'
import { formatRON, formatZi } from '@/lib/format'
import type { ArticolCos, Context, Rand, Stare } from './familie'
import { laTermen, perioada, stare } from './familie'

const TIP: Record<string, string> = {
  grupa: 'Grupă',
  trupa: 'Trupă',
  facultativ: 'Facultativ',
}

function tip(r: Rand): string {
  if (r.kind === 'datorie') return 'se plătește integral'
  const t = r.tipCurs ? TIP[r.tipCurs] : 'Curs'
  if (r.tipCurs === 'facultativ') return r.tipPlata === 'Per sedinta' ? `${t} · plată pe ședință` : `${t} · abonament lunar`
  return t
}

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11.5px] font-bold', className)}>
      {children}
    </span>
  )
}

export function ChipStare({ r, s, c }: { r: Rand; s: Stare; c: Context }) {
  if (s === 'restant') return <Chip className="border-danger bg-danger/10 text-danger">Termen depășit · scadență {formatZi(r.scadenta, c.azi)}</Chip>
  if (s === 'azi') return <Chip className="border-acc bg-acc text-acc-ink">De achitat azi</Chip>
  if (s === 'viitor')
    return laTermen(r, c)
      ? <Chip className="border-ink text-ink">Până pe {formatZi(r.scadenta, c.azi)}</Chip>
      : <Chip className="border-line text-sub">{r.kind === 'datorie' ? 'Urmează' : 'Rată viitoare'} · termen {formatZi(r.scadenta, c.azi)}</Chip>
  if (s === 'achitat') return <Chip className="border-transparent bg-ok/15 text-ok">✓ Achitat</Chip>
  if (s === 'acoperit') return <Chip className="border-transparent bg-ok/15 text-ok">Acoperit integral</Chip>
  return <Chip className="border-transparent bg-evgrupa/15 text-evgrupa">Plată în curs de confirmare</Chip>
}

export function RandPlata({
  r,
  c,
  bifat,
  onToggle,
  inclus,
}: {
  r: Rand
  c: Context
  bifat: boolean
  onToggle?: () => void
  inclus?: ArticolCos
}) {
  const s = stare(r, c.azi, c.inCurs)
  const deAchitat = s === 'restant' || s === 'azi' || s === 'viitor'
  return (
    <li className={cn('grid grid-cols-[22px_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3', inclus && 'bg-surf2')}>
      {deAchitat && !inclus && onToggle ? (
        <input
          type="checkbox"
          checked={bifat}
          onChange={onToggle}
          className="mt-0.5 h-[18px] w-[18px] accent-ink"
          aria-label={`Plătește ${r.titlu}, ${perioada(r, c.azi)}, ${r.membru}`}
        />
      ) : inclus ? (
        <span className="mt-0.5 text-center text-sm" title="Inclus obligatoriu" aria-label="Inclus obligatoriu">🔒</span>
      ) : (
        <span />
      )}
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{r.titlu}</p>
        <p className="text-xs text-sub">
          {r.membru} · {perioada(r, c.azi)} · {tip(r)}
          {r.codVoucher ? ` · voucher ${r.codVoucher}` : ''}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <ChipStare r={r} s={s} c={c} />
          {deAchitat && r.platit > 0 && <Chip className="border-line text-sub">achitat parțial</Chip>}
          {inclus && <Chip className="border-ink text-ink">Inclus obligatoriu</Chip>}
        </div>
        {inclus?.cauza && (
          <p className="mt-1.5 rounded-r-lg border-l-[3px] border-acc bg-surf px-2 py-1 text-xs text-ink">
            Se include pentru că ai bifat {inclus.cauza.titlu} ({perioada(inclus.cauza, c.azi)}): ratele unui
            membru se achită în ordine, de la cea mai veche.
          </p>
        )}
      </div>
      <div className="grid justify-items-end gap-0.5 text-right">
        {s === 'achitat' ? (
          <>
            <b className="text-[15px] font-extrabold text-ink">{formatRON(r.platit)}</b>
            <span className="text-[11.5px] text-sub">achitat</span>
          </>
        ) : s === 'acoperit' ? (
          <>
            <b className="text-[15px] font-extrabold text-ink">{formatRON(0)}</b>
            <span className="text-[11.5px] text-sub">{r.codVoucher ? `voucher ${r.codVoucher}` : 'acoperit'}</span>
          </>
        ) : (
          <>
            <b className="text-[15px] font-extrabold text-ink">{formatRON(r.rest)}</b>
            <span className="text-[11.5px] text-sub">mai ai de achitat</span>
            {r.platit > 0 && (
              <span className="text-[11.5px] text-sub">Achitat: {formatRON(r.platit)} din {formatRON(r.total)}</span>
            )}
          </>
        )}
      </div>
    </li>
  )
}
