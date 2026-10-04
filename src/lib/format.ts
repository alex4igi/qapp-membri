export function formatRON(value: number | null | undefined): string {
  const n = value ?? 0
  return `${n.toLocaleString('ro-RO')} RON`
}

// Numele canonice de locație din DB sunt lungi (ex. „Galeriile Stefan cel Mare");
// în UI folosim formele scurte, aliniate cu CRM-ul (LOCATII din qapp v2).
const LOCATIE_SCURTA: Record<string, string> = {
  'galeriile stefan cel mare': 'Ștefan cel Mare',
}

export function formatLocatie(nume: string | null | undefined): string | null {
  if (!nume) return null
  return LOCATIE_SCURTA[nume.trim().toLowerCase()] ?? nume
}

export function formatData(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Data și ora curente la studio (Europe/Bucharest), independent de fusul telefonului.
export function acumBucuresti(): { zi: string; ora: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bucharest',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const v = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return { zi: `${v('year')}-${v('month')}-${v('day')}`, ora: `${v('hour')}:${v('minute')}` }
}

export function adaugaZile(zi: string, n: number): string {
  const [y, m, d] = zi.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return dt.toISOString().slice(0, 10)
}
