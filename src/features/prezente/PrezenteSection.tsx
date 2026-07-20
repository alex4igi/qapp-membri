import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData, formatRON } from '@/lib/format'
import { cn } from '@/lib/cn'
import { getPrezenteSezoane, getPrezenteSezon, type PrezentaRow } from './api'
import { getSezonCurentClient } from '@/features/calendar/api'
import { getPlatiClient } from '@/features/plati/api/payments'

const STATUS_STYLE: Record<string, string> = {
  Prezent: 'text-ok',
  Absent: 'text-danger',
  Motivat: 'text-amber-700',
}

const DOT_STYLE: Record<string, string> = {
  Prezent: 'bg-ok',
  Absent: 'bg-danger',
  Motivat: 'bg-amber-500',
}

// `sezonId` poate fi null (cursuri fără sezon) — în <select> null are nevoie de
// o valoare distinctă de "" ca să nu se confunde cu „neselectat".
const FARA_SEZON = '__fara_sezon__'
const toKey = (id: string | null) => id ?? FARA_SEZON
const fromKey = (k: string) => (k === FARA_SEZON ? null : k)

const lunaKey = (iso: string | null | undefined) => (iso ? iso.slice(0, 7) : '')

function formatLuna(luna: string): string {
  const d = new Date(`${luna}-01T00:00:00`)
  const s = d.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type LunaRow = {
  luna: string
  total: number
  platit: number
  rest: number
  areInrolare: boolean
  prezente: PrezentaRow[]
}

type CursGroup = {
  cursNume: string
  luni: LunaRow[]
  prezent: number
  absent: number
}

export function PrezenteSection() {
  const { activeMember } = useActiveMember()
  const clientId = activeMember?.clientId ?? null
  const [sezonAles, setSezonAles] = useState<string | null>(null)
  const [openLuni, setOpenLuni] = useState<Set<string>>(new Set())

  const sezonCurent = useQuery({
    queryKey: ['sezon-curent'],
    queryFn: getSezonCurentClient,
  })
  const sezoanePrezente = useQuery({
    queryKey: ['prezente-sezoane', clientId],
    queryFn: () => getPrezenteSezoane(clientId!),
    enabled: !!clientId,
  })
  const plati = useQuery({
    queryKey: ['plati', clientId],
    queryFn: () => getPlatiClient(clientId!),
    enabled: !!clientId,
  })

  // Opțiunile selectorului = sezoanele cu prezențe (deja recent→vechi) + cele în
  // care există doar înrolări (copil înscris, dar fără nicio oră consemnată).
  const optiuni = useMemo(() => {
    const out: { key: string; nume: string }[] = []
    const seen = new Set<string>()
    for (const s of sezoanePrezente.data ?? []) {
      const k = toKey(s.sezonId)
      if (seen.has(k)) continue
      seen.add(k)
      out.push({ key: k, nume: s.sezonNume ?? 'Fără sezon' })
    }
    const doarPlati = new Map<string, { nume: string; ultima: string }>()
    for (const p of plati.data ?? []) {
      const k = toKey(p.sezonId)
      if (seen.has(k)) continue
      const prev = doarPlati.get(k)
      const d = p.dataIncepere ?? ''
      if (!prev || d > prev.ultima) {
        doarPlati.set(k, { nume: p.sezonNume ?? 'Fără sezon', ultima: d })
      }
    }
    const extra = [...doarPlati.entries()].sort((a, b) => b[1].ultima.localeCompare(a[1].ultima))
    for (const [k, v] of extra) out.push({ key: k, nume: v.nume })
    return out
  }, [sezoanePrezente.data, plati.data])

  // Default: sezonul activ dacă membrul are activitate în el, altfel cel mai recent.
  const sezonImplicit =
    optiuni.find((o) => o.key === toKey(sezonCurent.data?.sezonId ?? null))?.key ??
    optiuni[0]?.key ??
    null
  const sezonKey = sezonAles ?? sezonImplicit

  const prezente = useQuery({
    queryKey: ['prezente', clientId, sezonKey],
    queryFn: () => getPrezenteSezon(clientId!, fromKey(sezonKey!)),
    enabled: !!clientId && sezonKey !== null,
  })

  // Un curs × o lună poate avea MAI MULTE înrolări (tipul „per ședință" emite
  // câte una pe dată) — de aceea sumele se agregă, nu se suprascriu.
  const grupuri = useMemo<CursGroup[]>(() => {
    if (!sezonKey) return []
    const sezonId = fromKey(sezonKey)
    const map = new Map<string, Map<string, LunaRow>>()
    const getLuna = (curs: string, luna: string): LunaRow => {
      let luniMap = map.get(curs)
      if (!luniMap) { luniMap = new Map(); map.set(curs, luniMap) }
      let row = luniMap.get(luna)
      if (!row) {
        row = { luna, total: 0, platit: 0, rest: 0, areInrolare: false, prezente: [] }
        luniMap.set(luna, row)
      }
      return row
    }

    for (const p of plati.data ?? []) {
      if ((p.sezonId ?? null) !== sezonId) continue
      const luna = lunaKey(p.dataIncepere)
      if (!luna) continue
      const row = getLuna(p.cursNume ?? 'Curs', luna)
      row.areInrolare = true
      row.total += p.total
      row.platit += p.platit
      row.rest += p.rest
    }
    for (const p of prezente.data ?? []) {
      const luna = lunaKey(p.data)
      if (!luna) continue
      getLuna(p.cursNume ?? 'Curs', luna).prezente.push(p)
    }

    const out: CursGroup[] = []
    for (const [cursNume, luniMap] of map) {
      const luni = [...luniMap.values()].sort((a, b) => a.luna.localeCompare(b.luna))
      for (const l of luni) {
        l.prezente.sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''))
      }
      const toate = luni.flatMap((l) => l.prezente)
      out.push({
        cursNume,
        luni,
        prezent: toate.filter((p) => p.status === 'Prezent').length,
        absent: toate.filter((p) => p.status === 'Absent').length,
      })
    }
    return out.sort(
      (a, b) =>
        (a.luni[0]?.luna ?? '').localeCompare(b.luni[0]?.luna ?? '') ||
        a.cursNume.localeCompare(b.cursNume),
    )
  }, [plati.data, prezente.data, sezonKey])

  const prezentCount = grupuri.reduce((a, g) => a + g.prezent, 0)
  const absentCount = grupuri.reduce((a, g) => a + g.absent, 0)
  const totalRated = prezentCount + absentCount
  const rate = totalRated > 0 ? Math.round((prezentCount / totalRated) * 100) + '%' : '—'

  const loading = sezoanePrezente.isLoading || plati.isLoading || sezonCurent.isLoading
  const toggleLuna = (id: string) =>
    setOpenLuni((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (loading) return <Spinner />
  if (optiuni.length === 0) {
    return <p className="text-sm text-sub">Nicio activitate înregistrată încă.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="sezon-prezente" className="text-sm font-semibold text-sub">
          Sezon
        </label>
        <div className="relative">
          <select
            id="sezon-prezente"
            value={sezonKey ?? ''}
            onChange={(e) => {
              setSezonAles(e.target.value)
              setOpenLuni(new Set())
            }}
            className="appearance-none rounded-full border border-line bg-surf py-2 pl-3.5 pr-8 text-[13px] font-bold text-ink"
          >
            {optiuni.map((o) => (
              <option key={o.key} value={o.key}>
                {o.nume}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line bg-surf p-5 shadow-card">
          <p className="text-sm text-sub">Prezent</p>
          <p className="text-3xl font-extrabold tracking-tight text-ink">{prezentCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surf p-5 shadow-card">
          <p className="text-sm text-sub">Absent</p>
          <p className="text-3xl font-extrabold tracking-tight text-danger">{absentCount}</p>
        </div>
        <div className="rounded-2xl bg-acc p-5 text-acc-ink shadow-card">
          <p className="text-sm opacity-80">Rată prezență</p>
          <p className="text-3xl font-extrabold tracking-tight">{rate}</p>
        </div>
      </div>

      {prezente.isLoading && <Spinner />}
      {!prezente.isLoading && grupuri.length === 0 && (
        <p className="text-sm text-sub">Nicio activitate în sezonul ales.</p>
      )}

      {grupuri.map((g) => (
        <div
          key={g.cursNume}
          className="overflow-hidden rounded-2xl border border-line bg-surf shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surf2 px-4 py-3">
            <p className="text-sm font-extrabold tracking-tight text-ink">{g.cursNume}</p>
            <p className="text-xs text-sub">
              {g.prezent} {g.prezent === 1 ? 'prezență' : 'prezențe'}
              {g.absent > 0 && <span className="text-danger"> · {g.absent} abs.</span>}
            </p>
          </div>
          <ul className="divide-y divide-line">
            {g.luni.map((l) => {
              const id = `${g.cursNume}|${l.luna}`
              const open = openLuni.has(id)
              const nrPrez = l.prezente.filter((p) => p.status === 'Prezent').length
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => toggleLuna(id)}
                    aria-expanded={open}
                    disabled={l.prezente.length === 0}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-4 py-3 text-left',
                      l.prezente.length > 0 && 'hover:bg-surf2',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="w-3 shrink-0 text-xs text-sub">
                        {l.prezente.length > 0 ? (open ? '▾' : '▸') : ''}
                      </span>
                      <span className="truncate text-sm font-medium text-ink">
                        {formatLuna(l.luna)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-xs">
                      <span className="text-sub">
                        {nrPrez} {nrPrez === 1 ? 'prez.' : 'prez.'}
                      </span>
                      {l.areInrolare && (
                        <>
                          <span className="text-sub">{formatRON(l.total)}</span>
                          {l.rest > 0 ? (
                            <span className="font-semibold text-danger">
                              rest {formatRON(l.rest)}
                            </span>
                          ) : l.total > 0 ? (
                            <span className="font-semibold text-ok">✓ Plătit</span>
                          ) : null}
                        </>
                      )}
                    </span>
                  </button>
                  {open && l.prezente.length > 0 && (
                    <ul className="space-y-1 bg-surf2 px-4 py-2">
                      {l.prezente.map((p, i) => (
                        <li key={i} className="flex items-center justify-between py-1">
                          <span className="flex items-center gap-3">
                            <span
                              className={cn(
                                'h-2 w-2 shrink-0 rounded-full',
                                DOT_STYLE[p.status ?? ''] ?? 'bg-sub',
                              )}
                            />
                            <span className="text-xs text-sub">{formatData(p.data)}</span>
                          </span>
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              STATUS_STYLE[p.status ?? ''] ?? 'text-sub',
                            )}
                          >
                            {p.status ?? '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
