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
