import { supabase } from '@/lib/supabase'
import { formatLocatie } from '@/lib/format'
import { getEvenimenteClient, type EvenimentRow } from '@/features/activitate/api'

export { getEvenimenteClient }
export type { EvenimentRow }

// Calendarul membrului = ședințele (RPC get_sedinte_membru: recurența, vacanțele, lunile
// suspendate, ora pe zi și OPEN-urile confirmate sunt calculate în DB) + evenimentele
// studioului și ale grupelor membrului.

export type SedintaRow = {
  clientId: string
  prenume: string | null
  cursId: string
  cursNume: string | null
  data: string
  ora: string | null
  sala: string | null
  locatie: string | null
  instructori: string[]
  sursa: 'abonament' | 'sedinta'
  rezervareId: string | null
}

export async function getSedinteMembru(de: string, pana: string): Promise<SedintaRow[]> {
  const { data, error } = await supabase.rpc('get_sedinte_membru', { p_de: de, p_pana: pana })
  if (error) throw error
  return (data ?? []).map((r) => ({
    clientId: r.client_id,
    prenume: r.prenume,
    cursId: r.curs_id,
    cursNume: r.curs_nume,
    data: r.data,
    ora: r.ora ? r.ora.slice(0, 5) : null,
    sala: r.sala,
    locatie: formatLocatie(r.locatie),
    instructori: r.instructori ?? [],
    sursa: r.sursa === 'sedinta' ? 'sedinta' : 'abonament',
    rezervareId: r.rezervare_id,
  }))
}

// Sezonul activ (interval an școlar) + vacanțele lui — surse studio-wide expuse
// prin RPC-uri SECURITY DEFINER din qapp v2 (portal nu poate citi tabelele direct).
export type SezonInfo = {
  sezonId: string
  nume: string | null
  dataIncepere: string | null
  dataFinal: string | null
}

export async function getSezonCurentClient(): Promise<SezonInfo | null> {
  const { data, error } = await supabase.rpc('get_sezon_curent_client')
  if (error) throw error
  const r = (data ?? [])[0]
  if (!r) return null
  return { sezonId: r.sezon_id, nume: r.nume, dataIncepere: r.data_incepere, dataFinal: r.data_final }
}

export type VacantaInfo = {
  id: string
  nume: string | null
  dataIncepere: string
  dataFinal: string
}

export async function getVacanteClient(): Promise<VacantaInfo[]> {
  const { data, error } = await supabase.rpc('get_vacante_client')
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.vacanta_id,
    nume: r.nume,
    dataIncepere: r.data_incepere,
    dataFinal: r.data_final,
  }))
}

export type CalKind = 'curs' | 'eveniment' | 'eveniment-grupa' | 'rezervare'

export type CalItem = {
  id: string
  kind: CalKind
  dateKey: string // YYYY-MM-DD (local)
  time: string | null // HH:MM
  title: string
  subtitle: string | null
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

export function buildItems(
  sedinte: SedintaRow[],
  evenimente: EvenimentRow[],
  startKey: string,
  endKey: string,
): CalItem[] {
  const items: CalItem[] = sedinte.map((s) => ({
    id: `sedinta:${s.clientId}:${s.cursId}:${s.data}`,
    kind: s.sursa === 'sedinta' ? 'rezervare' : 'curs',
    dateKey: s.data,
    time: s.ora,
    title: s.cursNume ?? 'Curs',
    subtitle: [s.sala, s.locatie].filter(Boolean).join(' · ') || null,
  }))

  for (const e of evenimente) {
    const k = isoToKey(e.data)
    if (!k || k < startKey || k > endKey) continue
    const isGrupa = Boolean(e.cursId)
    items.push({
      id: `eveniment:${e.id}`,
      kind: isGrupa ? 'eveniment-grupa' : 'eveniment',
      dateKey: k,
      time: toTime(e.ora),
      title: e.nume ?? 'Eveniment',
      subtitle:
        [isGrupa ? e.cursNume : null, e.locatie, e.tip]
          .filter(Boolean)
          .join(' · ') || null,
    })
  }

  items.sort((a, b) =>
    a.dateKey === b.dateKey
      ? (a.time ?? '').localeCompare(b.time ?? '')
      : a.dateKey.localeCompare(b.dateKey),
  )
  return items
}
