import { useQuery } from '@tanstack/react-query'
import { listProdusePublice } from './api'
import { H2, UL } from './ui'

// Listă informativă de produse (merchandise), citită LIVE din qapp (Setări → Produse
// publice). Afișată pe /servicii ca justificare a CAEN-ului secundar (comerț). Dacă nu
// există produse active, secțiunea NU se afișează deloc (e opțională).
export function ProduseList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['produse_publice'],
    queryFn: listProdusePublice,
  })

  if (isLoading || isError || !data || data.length === 0) return null

  return (
    <>
      <H2>Articole Quasar (merchandise)</H2>
      <UL>
        {data.map((p) => (
          <li key={p.id}>
            {p.nume}
            {p.descriere ? <span className="text-quasar-gray"> ({p.descriere})</span> : null}:{' '}
            <strong>{p.pret}</strong>
          </li>
        ))}
      </UL>
    </>
  )
}
