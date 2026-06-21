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
  type CalItem,
} from './api'

const DOT: Record<CalItem['kind'], string> = {
  curs: 'bg-quasar-yellow',
  eveniment: 'bg-quasar-black',
  rezervare: 'bg-green-600',
}

const ZILE_SCURT = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']
const LUNI = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

// Index în grila Luni-first (0=Luni..6=Duminica) pentru un getDay() JS (0=Duminica).
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

export function CalendarPage() {
  const { activeMember } = useActiveMember()
  const today = new Date()
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedKey, setSelectedKey] = useState(() => dateKey(today))

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

  const grid = useMemo(
    () => buildGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  )

  const items = useMemo(() => {
    if (!grupe.data || !evenimente.data) return [] as CalItem[]
    return buildItems(
      grupe.data,
      evenimente.data,
      rezervari.data ?? [],
      grid[0],
      grid[grid.length - 1],
    )
  }, [grupe.data, evenimente.data, rezervari.data, grid])

  const byDay = useMemo(() => {
    const map = new Map<string, CalItem[]>()
    for (const it of items) {
      const arr = map.get(it.dateKey) ?? []
      arr.push(it)
      map.set(it.dateKey, arr)
    }
    return map
  }, [items])

  const loading = grupe.isLoading || evenimente.isLoading || rezervari.isLoading
  const todayKey = dateKey(today)
  const selectedItems = byDay.get(selectedKey) ?? []

  const goMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }
  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedKey(todayKey)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <button
          onClick={goToday}
          className="rounded-md border border-quasar-gray-light px-3 py-1.5 text-sm font-medium hover:bg-quasar-gray-light/40"
        >
          Azi
        </button>
      </div>

      {/* Navigare lună */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goMonth(-1)}
          aria-label="Luna anterioară"
          className="rounded-md px-3 py-1.5 text-lg leading-none text-quasar-gray hover:text-quasar-black"
        >
          ‹
        </button>
        <span className="text-sm font-semibold">
          {LUNI[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          onClick={() => goMonth(1)}
          aria-label="Luna următoare"
          className="rounded-md px-3 py-1.5 text-lg leading-none text-quasar-gray hover:text-quasar-black"
        >
          ›
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-hidden rounded-lg border border-quasar-gray-light">
          <div className="grid grid-cols-7 border-b border-quasar-gray-light bg-quasar-gray-light/30 text-center text-xs font-medium text-quasar-gray">
            {ZILE_SCURT.map((z) => (
              <div key={z} className="py-2">{z}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((d) => {
              const k = dateKey(d)
              const inMonth = d.getMonth() === cursor.getMonth()
              const dayItems = byDay.get(k) ?? []
              const isToday = k === todayKey
              const isSelected = k === selectedKey
              const kinds = new Set(dayItems.map((i) => i.kind))
              return (
                <button
                  key={k}
                  onClick={() => setSelectedKey(k)}
                  className={cn(
                    'flex min-h-14 flex-col items-center gap-1 border-b border-r border-quasar-gray-light/60 p-1.5 text-sm',
                    !inMonth && 'text-quasar-gray-light',
                    isSelected && 'bg-quasar-yellow/20',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      isToday && 'bg-quasar-black font-bold text-white',
                      isSelected && !isToday && 'font-bold',
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <span className="flex h-1.5 gap-1">
                    {(['curs', 'eveniment', 'rezervare'] as const).map((kind) =>
                      kinds.has(kind) ? (
                        <span key={kind} className={cn('h-1.5 w-1.5 rounded-full', DOT[kind])} />
                      ) : null,
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Legendă */}
      <div className="flex flex-wrap gap-4 text-xs text-quasar-gray">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-quasar-yellow" /> Ședință curs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-quasar-black" /> Eveniment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-600" /> Rezervare
        </span>
      </div>

      {/* Detaliu zi selectată */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">
          {new Date(selectedKey).toLocaleDateString('ro-RO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h2>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-quasar-gray">Nimic programat în această zi.</p>
        ) : (
          <ul className="divide-y divide-quasar-gray-light rounded-lg border border-quasar-gray-light">
            {selectedItems.map((it) => (
              <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT[it.kind])} />
                <span className="w-12 shrink-0 text-xs font-medium text-quasar-gray">
                  {it.time ?? '—'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{it.title}</p>
                  {it.subtitle && (
                    <p className="truncate text-xs text-quasar-gray">{it.subtitle}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
