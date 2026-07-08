import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Button, Modal, Spinner } from '@/components/ui'
import { PaymentBadges } from '@/components/PaymentBadges'
import { formatRON, formatData } from '@/lib/format'
import {
  listBileteEvenimente,
  getBileteMele,
  buyBileteAndPay,
  type EvenimentBiletRow,
} from './api'

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-sub">{label}</span>
      <span className="text-sm font-bold text-ink">{value}</span>
    </div>
  )
}

const MAX_QTY = 10

export function BiletePage() {
  const { activeMember } = useActiveMember()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [returnNotice, setReturnNotice] = useState(false)
  const [selected, setSelected] = useState<EvenimentBiletRow | null>(null)
  const [qty, setQty] = useState(1)

  const evenimenteQ = useQuery({
    queryKey: ['bilete-evenimente'],
    queryFn: listBileteEvenimente,
  })

  const bileteMeleQ = useQuery({
    queryKey: ['bilete-mele', activeMember?.clientId],
    queryFn: () => getBileteMele(activeMember!.clientId),
    enabled: Boolean(activeMember),
  })

  // Revenire din Netopia (?order=...): biletele se confirmă din webhook (sursa de adevăr).
  useEffect(() => {
    if (!searchParams.get('order')) return
    setReturnNotice(true)
    queryClient.invalidateQueries({ queryKey: ['bilete-evenimente'] })
    queryClient.invalidateQueries({ queryKey: ['bilete-mele'] })
    searchParams.delete('order')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, queryClient, setSearchParams])

  const buy = useMutation({
    mutationFn: () =>
      buyBileteAndPay({
        clientId: activeMember!.clientId,
        evenimentId: selected!.id,
        qty,
      }),
    onSuccess: (res) => {
      window.location.href = res.redirectUrl
    },
  })

  const openModal = (ev: EvenimentBiletRow) => {
    setSelected(ev)
    setQty(1)
  }
  const closeModal = () => {
    if (buy.isPending) return
    setSelected(null)
    buy.reset()
  }

  const maxForSelected = selected
    ? Math.min(MAX_QTY, selected.locuriRamase ?? MAX_QTY)
    : MAX_QTY
  const total = selected ? (selected.pret ?? 0) * qty : 0

  const bileteMele = bileteMeleQ.data ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <p className="text-sm text-sub">
        Bilete la spectacolele și evenimentele Quasar Dance. Cumperi online cu cardul; biletul
        primește un cod pe care îl prezinți la intrare.
      </p>

      {returnNotice && (
        <div className="rounded-2xl border border-acc bg-surf2 px-4 py-3 text-sm text-ink">
          Plata a fost inițiată. Biletele se confirmă automat după validarea plății de către bancă
          și apar mai jos, la „Biletele mele”.
        </div>
      )}

      <section className="space-y-4">
        {evenimenteQ.isLoading && <Spinner />}
        {evenimenteQ.error && <p className="text-sm text-danger">Eroare la încărcare.</p>}
        {evenimenteQ.data && evenimenteQ.data.length === 0 && (
          <p className="text-sm text-sub">Niciun eveniment cu bilete disponibil momentan.</p>
        )}
        {evenimenteQ.data && evenimenteQ.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evenimenteQ.data.map((ev) => {
              const plin = ev.locuriRamase != null && ev.locuriRamase <= 0
              return (
                <div
                  key={ev.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-surf p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-sub">{formatData(ev.data)}</span>
                    {ev.locuriRamase != null && (
                      <span className="rounded-full bg-surf2 px-2.5 py-1 text-xs font-medium text-sub">
                        {plin ? 'Epuizat' : `${ev.locuriRamase} locuri`}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-ink">{ev.nume}</p>
                    {ev.locatie && <p className="text-sm text-sub">{ev.locatie}</p>}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <span className="text-lg font-extrabold text-ink">{formatRON(ev.pret ?? 0)}</span>
                    <Button onClick={() => openModal(ev)} disabled={plin || !activeMember}>
                      {plin ? 'Epuizat' : 'Cumpără'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-sub">
          <span>Plată securizată cu cardul (RON) prin:</span>
          <PaymentBadges />
        </div>
      </section>

      {bileteMele.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-ink">Biletele mele</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {bileteMele.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surf p-4"
              >
                <div>
                  <p className="font-bold text-ink">{b.evenimentNume}</p>
                  <p className="text-xs text-sub">
                    {[formatData(b.data), b.locatie].filter(Boolean).join(' · ')}
                  </p>
                  <p className="mt-1 font-mono text-sm text-ink">{b.cod ?? '—'}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    b.status === 'validat' ? 'bg-surf2 text-sub' : 'bg-acc/15 text-acc'
                  }`}
                >
                  {b.status === 'validat' ? 'Folosit' : 'Valid'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal
        open={!!selected}
        title="Cumpără bilete"
        onClose={closeModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={buy.isPending}>
              Renunță
            </Button>
            <Button onClick={() => buy.mutate()} disabled={buy.isPending || !activeMember || qty < 1}>
              {buy.isPending ? 'Se inițiază…' : 'Continuă la plată'}
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-3">
            <SummaryRow label="Eveniment" value={selected.nume} />
            <SummaryRow label="Dată" value={formatData(selected.data)} />
            {selected.locatie && <SummaryRow label="Locație" value={selected.locatie} />}
            <SummaryRow label="Preț bilet" value={formatRON(selected.pret ?? 0)} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-sub">Număr bilete</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink disabled:opacity-40"
                  aria-label="Scade"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-bold text-ink">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxForSelected, q + 1))}
                  disabled={qty >= maxForSelected}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink disabled:opacity-40"
                  aria-label="Crește"
                >
                  +
                </button>
              </div>
            </div>
            <div className="border-t border-line pt-3">
              <SummaryRow label="Total de plată" value={formatRON(total)} />
            </div>
            {buy.isError && <p className="text-sm text-danger">{(buy.error as Error).message}</p>}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-sub">
              <span>Plată securizată cu cardul (RON) prin:</span>
              <PaymentBadges />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
