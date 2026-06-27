import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  buildItems,
  dateKey,
  getEvenimenteClient,
  getGrupeClient,
  getRezervariClient,
  getSezonCurentClient,
  getVacanteClient,
  type CalItem,
  type VacantaInfo,
} from './api'

const DOT: Record<CalItem['kind'], string> = {
  curs: 'bg-acc',
  eveniment: 'bg-ink',
  rezervare: 'bg-ok',
}

const ZILE_INIT = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const LUNI = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

function monFirstIndex(jsDay: number): number {
  return (jsDay + 6) % 7
}

// Cele 42 de zile (6 săptămâni) ale grilei lunii, începând de luni.
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const lead = monFirstIndex(first.getDay())
  const gridStart = new Date(year, month, 1 - lead)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

// Lunile (y,m) din intervalul [startIso, endIso] inclusiv.
function monthsBetween(startIso: string, endIso: string): { y: number; m: number }[] {
  const [ys, ms] = startIso.split('-').map(Number)
  const [ye, me] = endIso.split('-').map(Number)
  const out: { y: number; m: number }[] = []
  let y = ys
  let m = ms - 1
  while (y < ye || (y === ye && m <= me - 1)) {
    out.push({ y, m })
    m++
    if (m > 11) { m = 0; y++ }
  }
  return out
}

// dateKey → numele vacanței (pentru hașurare + detaliu zi).
function buildVacanteMap(vacante: VacantaInfo[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const v of vacante) {
    const [ys, ms, ds] = v.dataIncepere.split('-').map(Number)
    const [ye, me, de] = v.dataFinal.split('-').map(Number)
    const cur = new Date(ys, ms - 1, ds)
    const end = new Date(ye, me - 1, de)
    while (cur <= end) {
      map.set(dateKey(cur), v.nume ?? 'Vacanță')
      cur.setDate(cur.getDate() + 1)
    }
  }
  return map
}

export function CalendarPage() {
  const { activeMember } = useActiveMember()
  const today = new Date()
  const [selectedKey, setSelectedKey] = useState(() => dateKey(today))

  const sezon = useQuery({ queryKey: ['sezon-curent'], queryFn: getSezonCurentClient })
  const vacante = useQuery({ queryKey: ['vacante'], queryFn: getVacanteClient })
  const grupe = useQuery({
    queryKey: ['grupe', activeMember?.clientId],
    queryFn: () => getGrupeClient(activeMember!.clientId),
    enabled: !!activeMember,
  })
  const evenimente = useQuery({ queryKey: ['evenimente'], queryFn: getEvenimenteClient })
  const rezervari = useQuery({
    queryKey: ['rezervari-cal', activeMember?.clientId],
    queryFn: () => getRezervariClient(activeMember!.clientId),
    enabled: !!activeMember,
  })

  const months = useMemo(() => {
    const s = sezon.data
    if (!s?.dataIncepere || !s?.dataFinal) return []
    return monthsBetween(s.dataIncepere, s.dataFinal)
  }, [sezon.data])

  const items = useMemo(() => {
    if (!grupe.data || !evenimente.data || months.length === 0) return [] as CalItem[]
    const first = months[0]
    const last = months[months.length - 1]
    const start = new Date(first.y, first.m, 1)
    const end = new Date(last.y, last.m + 1, 0) // ultima zi a ultimei luni
    return buildItems(grupe.data, evenimente.data, rezervari.data ?? [], start, end)
  }, [grupe.data, evenimente.data, rezervari.data, months])

  const byDay = useMemo(() => {
    const map = new Map<string, CalItem[]>()
    for (const it of items) {
      const arr = map.get(it.dateKey) ?? []
      arr.push(it)
      map.set(it.dateKey, arr)
    }
    return map
  }, [items])

  const vacanteMap = useMemo(() => buildVacanteMap(vacante.data ?? []), [vacante.data])

  const loading = sezon.isLoading || grupe.isLoading || evenimente.isLoading
  const todayKey = dateKey(today)
  const selectedItems = byDay.get(selectedKey) ?? []
  const selectedVacanta = vacanteMap.get(selectedKey)

  if (loading) return <Spinner />

  if (!sezon.data) {
    return (
      <div className="max-w-2xl rounded-2xl border border-line bg-surf p-6 text-sm text-sub shadow-card">
        Niciun sezon activ momentan. Calendarul apare după ce școala deschide un sezon.
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-5">
      {/* Antet sezon + legendă */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">{sezon.data.nume ?? 'Sezon'}</h1>
          <p className="text-sm text-sub">
            {sezon.data.dataIncepere} → {sezon.data.dataFinal}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-sub">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-acc" /> Ședință</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink" /> Eveniment</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ok" /> Rezervare</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-surf2 ring-1 ring-line" /> Vacanță</span>
        </div>
      </div>

      {/* Grilă anuală — câte o mini-lună per lună din sezon */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {months.map(({ y, m }) => {
          const grid = buildGrid(y, m)
          return (
            <div key={`${y}-${m}`} className="rounded-2xl border border-line bg-surf p-4 shadow-card">
              <div className="mb-2.5 text-sm font-extrabold text-ink">{LUNI[m]} {y}</div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {ZILE_INIT.map((z, i) => (
                  <div key={i} className="py-1 text-[10px] font-bold text-sub">{z}</div>
                ))}
                {grid.map((d) => {
                  const k = dateKey(d)
                  const inMonth = d.getMonth() === m
                  const dayItems = byDay.get(k) ?? []
                  const isToday = k === todayKey
                  const isSelected = k === selectedKey
                  const isVacanta = vacanteMap.has(k)
                  const kinds = new Set(dayItems.map((i) => i.kind))
                  return (
                    <button
                      key={k}
                      onClick={() => setSelectedKey(k)}
                      className={cn(
                        'flex aspect-square flex-col items-center justify-center rounded-lg text-xs',
                        !inMonth && 'text-sub opacity-30',
                        inMonth && isVacanta && 'bg-surf2',
                        isSelected && 'ring-2 ring-acc',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full font-semibold',
                          isToday && 'bg-acc font-extrabold text-acc-ink',
                          inMonth && !isToday && 'text-ink',
                        )}
                      >
                        {d.getDate()}
                      </span>
                      <span className="flex h-1.5 gap-0.5">
                        {(['curs', 'eveniment', 'rezervare'] as const).map((kind) =>
                          kinds.has(kind) ? (
                            <span key={kind} className={cn('h-1 w-1 rounded-full', DOT[kind])} />
                          ) : null,
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detaliu zi selectată */}
      <section className="rounded-2xl border border-line bg-surf p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold tracking-tight text-ink">
            {new Date(selectedKey).toLocaleDateString('ro-RO', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </h2>
          {selectedVacanta && (
            <span className="rounded-full bg-surf2 px-3 py-1 text-xs font-bold text-ink">
              🌴 {selectedVacanta}
            </span>
          )}
        </div>
        {selectedItems.length === 0 ? (
          <p className="mt-3 text-sm text-sub">
            {selectedVacanta ? 'Vacanță — fără ședințe.' : 'Nimic programat în această zi.'}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {selectedItems.map((it) => (
              <li key={it.id} className="flex items-center gap-3 rounded-xl border border-line bg-surf2 px-4 py-3">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT[it.kind])} />
                <span className="w-12 shrink-0 text-xs font-bold text-sub">{it.time ?? '—'}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{it.title}</p>
                  {it.subtitle && <p className="truncate text-xs text-sub">{it.subtitle}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
