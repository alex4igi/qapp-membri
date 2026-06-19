import { useQuery } from '@tanstack/react-query'
import { listBiletePublice } from './api'
import { H2, UL } from './ui'

// Format dată RO scurt (ex. „15 iul. 2026"); fallback la string brut dacă nu parsează.
function formatData(d: string | null): string | null {
  if (!d) return null
  const parsed = new Date(d)
  if (Number.isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Listă informativă de bilete la evenimente viitoare, derivată LIVE din modulul
// Evenimente (qapp). Afișată pe /servicii. Dacă nu există bilete publice, secțiunea
// NU se afișează deloc (e opțională).
export function BileteList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['bilete_publice'],
    queryFn: listBiletePublice,
  })

  if (isLoading || isError || !data || data.length === 0) return null

  return (
    <>
      <H2>Bilete la evenimente</H2>
      <UL>
        {data.map((b) => {
          const d = formatData(b.data)
          return (
            <li key={b.id}>
              {b.nume}
              {d ? <span className="text-quasar-gray"> — {d}</span> : null}
              {b.locatie ? <span className="text-quasar-gray"> ({b.locatie})</span> : null}
              {b.pret_bilet != null ? (
                <>
                  :{' '}
                  <strong>{b.pret_bilet} lei</strong>
                </>
              ) : null}
            </li>
          )
        })}
      </UL>
    </>
  )
}
