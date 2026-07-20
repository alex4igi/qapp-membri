import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner, SezonSelect } from '@/components/ui'
import { formatData } from '@/lib/format'
import { cn } from '@/lib/cn'
import { getPrezenteSezoane, getPrezenteSezon, type PrezentaRow } from './api'
import { getSezonCurentClient } from '@/features/calendar/api'

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

const lunaKey = (iso: string | null | undefined) => (iso ? iso.slice(0, 7) : '')

function formatLuna(luna: string): string {
  const d = new Date(`${luna}-01T00:00:00`)
  const s = d.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type LunaRow = { luna: string; prezente: PrezentaRow[] }
type CursGroup = { cursNume: string; luni: LunaRow[]; prezent: number; absent: number }

export function PrezenteSection() {
  const { activeMember } = useActiveMember()
  const clientId = activeMember?.clientId ?? null
  const [sezonAles, setSezonAles] = useState<string | null>(null)
  const [openLuni, setOpenLuni] = useState<Set<string>>(new Set())

  const sezonCurent = useQuery({
    queryKey: ['sezon-curent'],
    queryFn: getSezonCurentClient,
  })
  const sezoane = useQuery({
    queryKey: ['prezente-sezoane', clientId],
    queryFn: () => getPrezenteSezoane(clientId!),
    enabled: !!clientId,
  })

  const optiuni = useMemo(
    () =>
      (sezoane.data ?? []).map((s) => ({
        key: s.sezonId ?? FARA_SEZON,
        nume: s.sezonNume ?? 'Fără sezon',
      })),
    [sezoane.data],
  )

  // Default: sezonul activ dacă membrul are prezențe acolo, altfel cel mai recent.
  const sezonImplicit =
    optiuni.find((o) => o.key === (sezonCurent.data?.sezonId ?? FARA_SEZON))?.key ??
    optiuni[0]?.key ??
    null
  const sezonKey = sezonAles ?? sezonImplicit

  const prezente = useQuery({
    queryKey: ['prezente', clientId, sezonKey],
    queryFn: () => getPrezenteSezon(clientId!, sezonKey === FARA_SEZON ? null : sezonKey),
    enabled: !!clientId && sezonKey !== null,
  })

  // Gruparea pe curs → lună ține lista citibilă: un sezon poate avea 90+ de ore,
  // iar lista plată devenea imposibil de parcurs.
  const grupuri = useMemo<CursGroup[]>(() => {
    const map = new Map<string, Map<string, LunaRow>>()
    for (const p of prezente.data ?? []) {
      const luna = lunaKey(p.data)
      if (!luna) continue
      const curs = p.cursNume ?? 'Curs'
      let luniMap = map.get(curs)
      if (!luniMap) { luniMap = new Map(); map.set(curs, luniMap) }
      let row = luniMap.get(luna)
      if (!row) { row = { luna, prezente: [] }; luniMap.set(luna, row) }
      row.prezente.push(p)
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
  }, [prezente.data])

  const prezentCount = grupuri.reduce((a, g) => a + g.prezent, 0)
  const absentCount = grupuri.reduce((a, g) => a + g.absent, 0)
  const totalRated = prezentCount + absentCount
  const rate = totalRated > 0 ? Math.round((prezentCount / totalRated) * 100) + '%' : '—'

  const toggleLuna = (id: string) =>
    setOpenLuni((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (sezoane.isLoading || sezonCurent.isLoading) return <Spinner />
  if (optiuni.length === 0) {
    return <p className="text-sm text-sub">Nicio prezență înregistrată încă.</p>
  }

  return (
    <div className="space-y-6">
      <SezonSelect
        id="sezon-prezente"
        value={sezonKey}
        optiuni={optiuni}
        onChange={(k) => {
          setSezonAles(k)
          setOpenLuni(new Set())
        }}
      />

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
        <p className="text-sm text-sub">Nicio prezență în sezonul ales.</p>
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
              const nrAbs = l.prezente.filter((p) => p.status === 'Absent').length
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => toggleLuna(id)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surf2"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="w-3 shrink-0 text-xs text-sub">{open ? '▾' : '▸'}</span>
                      <span className="truncate text-sm font-medium text-ink">
                        {formatLuna(l.luna)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-xs">
                      <span className="text-sub">{nrPrez} prez.</span>
                      {nrAbs > 0 && <span className="text-danger">{nrAbs} abs.</span>}
                    </span>
                  </button>
                  {open && (
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
