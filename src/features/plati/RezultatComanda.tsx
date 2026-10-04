import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { getStatusComanda, type StatusComanda } from '@/features/rezervari/api'
import { CHEI_DUPA_PLATA } from './api/payments'

const FEREASTRA_MS = 30_000
const FINALE: StatusComanda['status'][] = ['confirmed', 'failed', 'canceled']

// Revenirea din Netopia (?order=...). Confirmarea vine din IPN, deci întrebăm comanda până iese
// din 'pending'. Referința rămâne în URL până la o stare finală: un refresh reia verificarea.
export function RezultatComanda() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orderRef, setOrderRef] = useState<string | null>(() => searchParams.get('order'))
  // Revenirea din Netopia e o încărcare de pagină nouă, deci referința se citește o singură dată.
  const [astept, setAstept] = useState(true)

  useEffect(() => {
    if (!astept) return
    const t = setTimeout(() => setAstept(false), FEREASTRA_MS)
    return () => clearTimeout(t)
  }, [astept])

  const comanda = useQuery({
    meta: { erroareAfisata: true },
    queryKey: ['status-comanda', orderRef],
    queryFn: () => getStatusComanda(orderRef!),
    enabled: !!orderRef,
    refetchInterval: (q) => (astept && q.state.data?.status === 'pending' ? 2000 : false),
  })
  const status = comanda.data?.status

  useEffect(() => {
    if (!status) return
    if (status === 'confirmed') {
      for (const key of CHEI_DUPA_PLATA) queryClient.invalidateQueries({ queryKey: [...key] })
    } else {
      queryClient.invalidateQueries({ queryKey: ['open-sesiuni'] })
    }
    if (FINALE.includes(status) && searchParams.get('order')) {
      searchParams.delete('order')
      setSearchParams(searchParams, { replace: true })
    }
  }, [status, queryClient, searchParams, setSearchParams])

  if (!orderRef) return null

  const inchide = () => {
    setOrderRef(null)
    if (searchParams.get('order')) {
      searchParams.delete('order')
      setSearchParams(searchParams, { replace: true })
    }
  }
  const verificaDinNou = () => {
    setAstept(true)
    void comanda.refetch()
  }

  return (
    <Mesaj
      comanda={comanda.data}
      seIncarca={comanda.isLoading || (astept && status === 'pending')}
      eroare={comanda.isError}
      onVerifica={verificaDinNou}
      onInchide={inchide}
    />
  )
}

function Mesaj({
  comanda,
  seIncarca,
  eroare,
  onVerifica,
  onInchide,
}: {
  comanda: StatusComanda | null | undefined
  seIncarca: boolean
  eroare: boolean
  onVerifica: () => void
  onInchide: () => void
}) {
  const box = 'rounded-2xl border px-4 py-3 text-sm'
  const rezervare = comanda?.orderType === 'rezervare'
  const bilet = comanda?.orderType === 'bilet'
  const ce = comanda?.cursNume
    ? ` — ${comanda.cursNume}${comanda.data ? `, ${formatData(comanda.data)}` : ''}`
    : ''
  const actiuni = (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button variant="ghost" onClick={onVerifica}>Verifică din nou</Button>
      <Button variant="ghost" onClick={onInchide}>Închide</Button>
    </div>
  )

  if (seIncarca) {
    return (
      <div className={`${box} border-line bg-surf2 text-ink`}>
        <Spinner label="Verificăm plata la bancă…" />
      </div>
    )
  }
  if (eroare) {
    return (
      <div className={`${box} border-danger bg-surf text-ink`}>
        <p className="font-bold">Nu am putut verifica plata acum.</p>
        <p className="mt-1 text-sub">
          Asta nu înseamnă că plata a eșuat. Verifică din nou peste câteva momente; dacă suma ți-a
          fost retrasă și nu apare confirmată, scrie-ne la office@quasardance.ro.
        </p>
        {actiuni}
      </div>
    )
  }
  if (comanda === null) {
    return (
      <div className={`${box} border-line bg-surf text-ink`}>
        <p className="font-bold">Nu găsim această plată în contul tău.</p>
        <p className="mt-1 text-sub">
          Dacă ai plătit din alt cont sau suma ți-a fost retrasă, scrie-ne la office@quasardance.ro
          și o verificăm.
        </p>
        <div className="mt-2">
          <Button variant="ghost" onClick={onInchide}>Închide</Button>
        </div>
      </div>
    )
  }
  if (comanda?.status === 'confirmed') {
    return (
      <div className={`${box} border-ok bg-surf text-ink`}>
        <p className="font-bold text-ok">
          ✓ {rezervare ? `Rezervare confirmată${ce}` : bilet ? 'Biletele sunt plătite' : 'Plata a fost confirmată'}
        </p>
        <p className="mt-1 text-sub">
          {rezervare
            ? 'Plata a trecut. Ședința apare în calendar și în Plăți.'
            : 'Plata a trecut, iar situația de mai jos e actualizată.'}
        </p>
      </div>
    )
  }
  if (comanda?.status === 'failed' || comanda?.status === 'canceled') {
    return (
      <div className={`${box} border-danger bg-surf text-ink`}>
        <p className="font-bold text-danger">
          {rezervare ? `Plata nu a trecut, deci locul nu e rezervat${ce}` : 'Plata nu a trecut'}
        </p>
        <p className="mt-1 text-sub">
          Nu ți s-a încasat nimic prin această comandă. Poți încerca din nou. Dacă banca ți-a
          retras totuși suma, scrie-ne la office@quasardance.ro și o verificăm.
        </p>
        <div className="mt-2">
          <Button variant="ghost" onClick={onInchide}>Închide</Button>
        </div>
      </div>
    )
  }
  return (
    <div className={`${box} border-acc bg-surf2 text-ink`}>
      <p className="font-bold">⏳ Banca încă procesează plata{ce}</p>
      <p className="mt-1 text-sub">
        {rezervare
          ? 'Locul e ținut 30 de minute de la inițierea rezervării. Când plata trece, ședința apare ca rezervată.'
          : 'Când plata trece, suma apare achitată mai jos.'}{' '}
        Dacă suma ți-a fost retrasă și plata nu apare confirmată, scrie-ne la office@quasardance.ro.
      </p>
      {actiuni}
    </div>
  )
}
