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
    <div className="mx-auto max-w-5xl space-y-6">
      <p className="text-sm text-sub">
        Cursuri facultative (OPEN class, K-pop Covers) — sesiuni viitoare. Rezervi un loc și
        plătești cu cardul; locul se confirmă după plată.
      </p>

      {returnNotice && (
        <div className="rounded-2xl border border-acc bg-surf2 px-4 py-3 text-sm text-ink">
          Plata a fost inițiată. Rezervarea se confirmă automat după validarea plății de către bancă.
        </div>
      )}

      <label className="block max-w-xs">
        <span className="mb-1 block text-xs font-medium text-sub">
          Cod voucher (opțional)
        </span>
        <input
          value={voucherCod}
          onChange={(e) => setVoucherCod(e.target.value)}
          placeholder="ex. TRUPA50"
          className="w-full rounded-xl border border-line bg-surf px-3 py-2 text-sm uppercase text-ink"
        />
        <span className="mt-1 block text-xs text-sub">
          Se aplică la ședința pe care o rezervi; reducerea apare la plată.
        </span>
      </label>

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-danger">Eroare la încărcare.</p>}
      {data && data.length === 0 && (
        <p className="text-sm text-sub">Nicio sesiune disponibilă momentan.</p>
      )}
      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => {
            const plin = s.locuriRamase <= 0
            const busy = reserve.isPending && pendingId === s.sesiuneId
            return (
              <div
                key={s.sesiuneId}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surf p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-sub">{formatData(s.data)}</span>
                  <span className="rounded-full bg-surf2 px-2.5 py-1 text-xs font-medium text-sub">
                    {plin ? 'Complet' : `${s.locuriRamase} locuri`}
                  </span>
                </div>
                <div>
                  <p className="text-base font-extrabold text-ink">{s.cursNume ?? 'Curs'}</p>
                  {s.instructorNume && <p className="text-sm text-sub">{s.instructorNume}</p>}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                  <span className="text-lg font-extrabold text-ink">{formatRON(s.pret ?? 0)}</span>
                  <Button
                    onClick={() => reserve.mutate(s.sesiuneId)}
                    disabled={plin || !activeMember || (reserve.isPending && !busy)}
                  >
                    {busy ? 'Se inițiază…' : plin ? 'Complet' : 'Rezervă'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {reserve.isError && (
        <p className="text-sm text-danger">{(reserve.error as Error).message}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-sub">
        <span>Plată securizată cu cardul (RON) prin:</span>
        <PaymentBadges />
      </div>
    </div>
  )
}
