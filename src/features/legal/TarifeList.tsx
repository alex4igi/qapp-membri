import { useQuery } from '@tanstack/react-query'
import { listTarifePublice } from './api'
import { P, UL } from './ui'

// Lista de tarife publice, citită LIVE din qapp (Setări → Tarife publice).
// Folosită pe /servicii și /termeni. Dacă DB nu e disponibilă, nu afișăm prețuri
// vechi hard-codate (evităm desincronizarea) — punem un fallback neutru.
export function TarifeList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tarife_publice'],
    queryFn: listTarifePublice,
  })

  if (isLoading) return <P>Se încarcă tarifele…</P>

  if (isError || !data || data.length === 0) {
    return (
      <P>
        Tarifele actualizate sunt disponibile la recepția Quasar Dance și pe{' '}
        <a className="underline" href="https://www.quasardance.ro" target="_blank" rel="noreferrer">
          quasardance.ro
        </a>
        .
      </P>
    )
  }

  return (
    <UL>
      {data.map((t) => (
        <li key={t.id}>
          {t.program}
          {t.descriere ? <span className="text-quasar-gray"> ({t.descriere})</span> : null}:{' '}
          <strong>{t.pret}</strong>
          {t.taxa_rezervare ? (
            <span className="text-quasar-gray"> · taxă rezervare loc {t.taxa_rezervare}</span>
          ) : null}
        </li>
      ))}
    </UL>
  )
}
