import { supabase } from '@/lib/supabase'
import type { Enums } from '@/types/db'
import { getGrupeClient, type GrupaRow } from '@/features/grupa/api'
import { getEvenimenteClient, type EvenimentRow } from '@/features/activitate/api'

export { getGrupeClient, getEvenimenteClient }
export type { GrupaRow, EvenimentRow }

// Calendarul membrului = proiecția pe zile a trei surse existente (fără tabele noi):
//   1. ședințele recurente săptămânale din înrolările active (zile[] + ora)
//   2. evenimentele studioului (informativ, studio-wide)
//   3. rezervările OPEN class plătite ale membrului (RPC get_rezervari_client)

export type RezervareRow = {
  id: string
  cursNume: string | null
  data: string | null
  locatie: string | null
  instructorNume: string | null
}

export async function getRezervariClient(clientId: string): Promise<RezervareRow[]> {
  const { data, error } = await supabase.rpc('get_rezervari_client', { p_client: clientId })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.rezervare_id,
    cursNume: r.curs_nume,
    data: r.data,
    locatie: r.locatie,
    instructorNume: r.instructor_nume,
  }))
}

export type CalKind = 'curs' | 'eveniment' | 'rezervare'

export type CalItem = {
  id: string
  kind: CalKind
  dateKey: string // YYYY-MM-DD (local)
  time: string | null // HH:MM
  title: string
  subtitle: string | null
}

// zi_saptamana (Luni..Duminica) → index JS getDay() (0=Duminica..6=Sambata)
const ZI_TO_JS: Record<Enums<'zi_saptamana'>, number> = {
  Luni: 1,
  Marti: 2,
  Miercuri: 3,
  Joi: 4,
  Vineri: 5,
  Sambata: 6,
  Duminica: 0,
}

export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toTime(ora: string | null): string | null {
  if (!ora) return null
  return ora.slice(0, 5)
}

// Parsează o dată de tip `date` (YYYY-MM-DD) sau ISO la cheia locală, evitând
// shift-ul de fus orar al lui `new Date('YYYY-MM-DD')` (care e UTC midnight).
function isoToKey(iso: string | null): string | null {
  if (!iso) return null
  const datePart = iso.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart
  return dateKey(new Date(iso))
}

// Generează item-ele de calendar dintre [start, end] inclusiv.
export function buildItems(
  grupe: GrupaRow[],
  evenimente: EvenimentRow[],
  rezervari: RezervareRow[],
  start: Date,
  end: Date,
): CalItem[] {
  const items: CalItem[] = []

  // Ședințe recurente: pentru fiecare zi din interval, dacă ziua săptămânii e în
  // grupa.zile și data e în [data_incepere, data_final], adaugă o ocurență.
  for (const g of grupe) {
    if (!g.zile.length) continue
    const jsDays = new Set(g.zile.map((z) => ZI_TO_JS[z]))
    const fromKey = isoToKey(g.dataIncepere)
    const toKey = isoToKey(g.dataFinal)
    const cursor = new Date(start)
    while (cursor <= end) {
      if (jsDays.has(cursor.getDay())) {
        const k = dateKey(cursor)
        const afterStart = !fromKey || k >= fromKey
        const beforeEnd = !toKey || k <= toKey
        if (afterStart && beforeEnd) {
          items.push({
            id: `curs:${g.enrollmentId}:${k}`,
            kind: 'curs',
            dateKey: k,
            time: toTime(g.ora),
            title: g.cursNume ?? 'Curs',
            subtitle: [g.sala, g.locatie].filter(Boolean).join(' · ') || null,
          })
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  const startKey = dateKey(start)
  const endKey = dateKey(end)
  for (const e of evenimente) {
    const k = isoToKey(e.data)
    if (!k || k < startKey || k > endKey) continue
    items.push({
      id: `eveniment:${e.id}`,
      kind: 'eveniment',
      dateKey: k,
      time: e.data && e.data.length > 10 ? toTime(e.data.slice(11)) : null,
      title: e.nume ?? 'Eveniment',
      subtitle: [e.locatie, e.tip].filter(Boolean).join(' · ') || null,
    })
  }

  for (const r of rezervari) {
    const k = isoToKey(r.data)
    if (!k || k < startKey || k > endKey) continue
    items.push({
      id: `rezervare:${r.id}`,
      kind: 'rezervare',
      dateKey: k,
      time: null, // open_sesiuni.data e `date` (fără oră)
      title: r.cursNume ?? 'Rezervare',
      subtitle: [r.instructorNume, r.locatie].filter(Boolean).join(' · ') || null,
    })
  }

  items.sort((a, b) =>
    a.dateKey === b.dateKey
      ? (a.time ?? '').localeCompare(b.time ?? '')
      : a.dateKey.localeCompare(b.dateKey),
  )
  return items
}
