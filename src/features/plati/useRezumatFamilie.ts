import { useQuery } from '@tanstack/react-query'
import { acumBucuresti } from '@/lib/format'
import { getRezumatPlati, sumarPlati } from './api/payments'
import { sfarsitLuna } from './familie'

// Restanța și termenul următor ale familiei. Aceeași sursă ca badge-ul din meniu și Acasă
// (get_rezumat_plati_familie), ca cifrele să fie identice peste tot.
export function useRezumatFamilie() {
  const q = useQuery({ queryKey: ['rezumat-plati'], queryFn: getRezumatPlati })
  const azi = acumBucuresti().zi
  const sumar = sumarPlati(q.data ?? [])
  const t = sumar.urmatorTermen
  // Termenul intră în „Următoarea plată” doar dacă e până la sfârșitul lunii (regula coșului).
  const inLuna = !!t && t.scadenta <= sfarsitLuna(azi)
  return { q, azi, sumar, termen: inLuna ? t : null, urmatoareaRata: !inLuna ? t?.scadenta ?? null : null }
}
