export function formatRON(value: number | null | undefined): string {
  const n = value ?? 0
  return `${n.toLocaleString('ro-RO')} RON`
}

export function formatData(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
