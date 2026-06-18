import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Button, Spinner } from '@/components/ui'
import { PaymentBadges } from '@/components/PaymentBadges'
import { formatRON, formatData } from '@/lib/format'
import { listOpenSesiuniClient, reserveOpenAndPay } from './api'

export function RezervariPage() {
  const { activeMember } = useActiveMember()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [returnNotice, setReturnNotice] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [voucherCod, setVoucherCod] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['open-sesiuni'],
    queryFn: () => listOpenSesiuniClient(),
  })

  // Revenire din Netopia (?order=...): rezervarea se confirmă din webhook (sursa de adevăr).
  useEffect(() => {
    if (!searchParams.get('order')) return
    setReturnNotice(true)
    queryClient.invalidateQueries({ queryKey: ['open-sesiuni'] })
    searchParams.delete('order')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, queryClient, setSearchParams])

  const reserve = useMutation({
    mutationFn: (sesiuneId: string) =>
      reserveOpenAndPay({ clientId: activeMember!.clientId, sesiuneId, voucherCod }),
    onMutate: (sesiuneId) => setPendingId(sesiuneId),
    onSuccess: (res) => {
      window.location.href = res.redirectUrl
    },
    onError: () => setPendingId(null),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Rezervări</h1>
        <p className="text-sm text-quasar-gray">
          Cursuri facultative (OPEN class, K-pop Covers) — sesiuni viitoare. Rezervi un loc și
          plătești cu cardul; locul se confirmă după plată.
        </p>
      </div>

      {returnNotice && (
        <div className="rounded-lg border border-quasar-yellow bg-quasar-yellow/10 px-4 py-3 text-sm">
          Plata a fost inițiată. Rezervarea se confirmă automat după validarea plății de către bancă.
        </div>
      )}

      <label className="block max-w-xs">
        <span className="mb-1 block text-xs font-medium text-quasar-gray">
          Cod voucher (opțional)
        </span>
        <input
          value={voucherCod}
          onChange={(e) => setVoucherCod(e.target.value)}
          placeholder="ex. TRUPA50"
          className="w-full rounded-md border border-quasar-gray-light px-3 py-2 text-sm uppercase"
        />
        <span className="mt-1 block text-xs text-quasar-gray">
          Se aplică la ședința pe care o rezervi; reducerea apare la plată.
        </span>
      </label>

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">Eroare la încărcare.</p>}
      {data && data.length === 0 && (
        <p className="text-sm text-quasar-gray">Nicio sesiune disponibilă momentan.</p>
      )}
      {data && data.length > 0 && (
        <ul className="divide-y divide-quasar-gray-light rounded-lg border border-quasar-gray-light">
          {data.map((s) => {
            const plin = s.locuriRamase <= 0
            const busy = reserve.isPending && pendingId === s.sesiuneId
            return (
              <li key={s.sesiuneId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{s.cursNume ?? 'Curs'}</p>
                  <p className="text-xs text-quasar-gray">
                    {formatData(s.data)}
                    {s.instructorNume ? ` · ${s.instructorNume}` : ''} · {s.locuriRamase} locuri
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold">{formatRON(s.pret ?? 0)}</span>
                  <Button
                    onClick={() => reserve.mutate(s.sesiuneId)}
                    disabled={plin || !activeMember || (reserve.isPending && !busy)}
                  >
                    {busy ? 'Se inițiază…' : plin ? 'Complet' : 'Rezervă'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {reserve.isError && (
        <p className="text-sm text-red-600">{(reserve.error as Error).message}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-quasar-gray">
        <span>Plată securizată cu cardul (RON) prin:</span>
        <PaymentBadges />
      </div>
    </div>
  )
}
