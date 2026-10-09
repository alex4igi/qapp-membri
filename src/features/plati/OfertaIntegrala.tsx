import { useNavigate } from 'react-router-dom'
import { useMutation, useQueries } from '@tanstack/react-query'
import { Button } from '@/components/ui'
import { useActiveMember } from '@/hooks/useActiveMember'
import { acumBucuresti, formatRON, formatZi } from '@/lib/format'
import { mesajEroare } from '@/lib/errorMessage'
import { createNetopiaPayment, getPlataIntegrala } from './api/payments'

// Oferta „tot sezonul −5%” (contract, Anexa 1). Alex, 09.10.2026: e o ofertă specială de început
// de sezon și stă sus, dar rămâne marcată „Opțional”, cu varianta în rate spusă explicit — un
// client a înțeles deja o dată că trebuie să plătească tot sezonul. Eligibilitatea și suma vin din DB.
// E o comandă separată, pe un singur membru; nu intră în coșul familiei.
export function OfertaIntegrala({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { members } = useActiveMember()
  const azi = acumBucuresti().zi
  const q = useQueries({
    queries: members.map((m) => ({
      queryKey: ['plata-integrala', m.clientId],
      queryFn: () => getPlataIntegrala(m.clientId),
    })),
  })
  const pay = useMutation({
    meta: { erroareAfisata: true },
    mutationFn: (clientId: string) => createNetopiaPayment({ clientId, platesteIntegral: true }),
    onSuccess: (res) => {
      window.location.href = res.redirectUrl
    },
  })

  const eligibili = members
    .map((m, i) => ({ m, o: q[i]?.data }))
    .filter((x): x is { m: (typeof members)[number]; o: Extract<NonNullable<typeof x.o>, { eligibil: true }> } => !!x.o?.eligibil)
  if (!eligibili.length) return null

  const scadenta = eligibili.map((x) => x.o.scadenta).filter(Boolean).sort()[0] ?? null
  const zile = scadenta
    ? Math.round((Date.parse(`${scadenta}T12:00:00`) - Date.parse(`${azi}T12:00:00`)) / 864e5)
    : null

  return (
    <section aria-label="Ofertă de început de sezon" className="grid gap-3 rounded-[20px] border-2 border-acc bg-surf p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-sub">Opțional · ofertă de început de sezon</p>
          <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-ink [text-wrap:balance]">
            Plătește tot sezonul acum și primești 5% reducere
          </h2>
        </div>
        <span className="rounded-full bg-acc px-2.5 py-1 text-[15px] font-extrabold text-acc-ink">−5%</span>
      </div>

      <ul className="grid gap-2">
        {eligibili.map(({ m, o }) => (
          <li key={m.clientId} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-sm text-sub">
              {m.displayName} · {o.luni} rate
            </span>
            <span className="flex flex-wrap items-baseline gap-x-2">
              <s className="text-sm text-sub">{formatRON(o.totalCurent)}</s>
              <b className="text-xl font-extrabold text-ink">{formatRON(o.totalPlata)}</b>
              <span className="text-[13px] font-bold text-ok">economisești {formatRON(o.discount)}</span>
            </span>
            {!compact && (
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => pay.mutate(m.clientId)}
                disabled={pay.isPending}
              >
                {pay.isPending && pay.variables === m.clientId
                  ? 'Se inițiază…'
                  : `Plătește ${formatRON(o.totalPlata)} pentru ${m.displayName}`}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {scadenta && (
        <span className="justify-self-start rounded-full bg-surf2 px-2.5 py-0.5 text-xs font-bold text-ink">
          Valabilă până pe {formatZi(scadenta, azi)}
          {zile != null && ` · ${zile <= 0 ? 'ultima zi' : zile === 1 ? 'încă o zi' : `încă ${zile} zile`}`}
        </span>
      )}

      {compact ? (
        <div>
          <Button variant="secondary" onClick={() => navigate('/plati')}>Vezi oferta</Button>
        </div>
      ) : (
        <p className="text-xs text-sub">
          Nu e obligatoriu: dacă nu alegi oferta, plătești în rate lunare, ca de obicei. Plata integrală e o
          plată separată, pentru un singur membru, și nu intră în coșul familiei. Ratele care au deja reducerea
          de familie (−10%) nu primesc și 5%.
        </p>
      )}
      {pay.isError && <p className="text-xs text-danger">{mesajEroare(pay.error)}</p>}
    </section>
  )
}
