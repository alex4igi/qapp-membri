import { mesajEroare } from '@/lib/errorMessage'
import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Button, Modal, Spinner } from '@/components/ui'
import { PaymentBadges } from '@/components/PaymentBadges'
import { formatRON, formatData } from '@/lib/format'
import {
  getStatusComanda,
  listOpenSesiuniClient,
  previewVoucherRezervare,
  reserveOpenAndPay,
  type OpenSesiuneRow,
  type StatusComanda,
} from './api'

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-sub">{label}</span>
      <span className="text-sm font-bold text-ink">{value}</span>
    </div>
  )
}

export function RezervariPage() {
  const { activeMember } = useActiveMember()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orderRef, setOrderRef] = useState<string | null>(null)
  const [astept, setAstept] = useState(false)
  const [selected, setSelected] = useState<OpenSesiuneRow | null>(null)
  const [voucherCod, setVoucherCod] = useState('')

  const { data, isLoading, error } = useQuery({
    meta: { erroareAfisata: true },
    queryKey: ['open-sesiuni', activeMember?.clientId ?? null],
    queryFn: () => listOpenSesiuniClient(activeMember?.clientId),
  })

  // Revenire din Netopia (?order=...): confirmarea vine din IPN, deci întrebăm comanda
  // câteva secunde până iese din 'pending'.
  useEffect(() => {
    const ref = searchParams.get('order')
    if (!ref) return
    setOrderRef(ref)
    setAstept(true)
    searchParams.delete('order')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!astept) return
    const t = setTimeout(() => setAstept(false), 30_000)
    return () => clearTimeout(t)
  }, [astept])

  const comanda = useQuery({
    meta: { erroareAfisata: true },
    queryKey: ['status-comanda', orderRef],
    queryFn: () => getStatusComanda(orderRef!),
    enabled: !!orderRef,
    refetchInterval: (q) => (astept && q.state.data?.status === 'pending' ? 2000 : false),
  })
  const statusComanda = comanda.data?.status

  useEffect(() => {
    if (!statusComanda) return
    queryClient.invalidateQueries({ queryKey: ['open-sesiuni'] })
    if (statusComanda === 'confirmed') {
      queryClient.invalidateQueries({ queryKey: ['plati'] })
      queryClient.invalidateQueries({ queryKey: ['sold-familie'] })
    }
  }, [statusComanda, queryClient])

  const codVoucher = voucherCod.trim()
  const voucherQ = useQuery({
    meta: { erroareAfisata: true },
    queryKey: ['voucher-rezervare', codVoucher.toUpperCase(), activeMember?.clientId, selected?.sesiuneId],
    queryFn: () =>
      previewVoucherRezervare({
        cod: codVoucher,
        clientId: activeMember!.clientId,
        cursId: selected!.cursId,
        pret: selected!.pret ?? 0,
      }),
    enabled: !!selected && !!activeMember && codVoucher !== '',
  })
  const voucher = codVoucher ? voucherQ.data : undefined
  const pretBaza = selected?.pret ?? 0
  const totalDePlata = voucher?.valid ? voucher.pretFinal : pretBaza
  // Ședința gratuită nu trece prin Netopia — edge function-ul o refuză.
  const voucherIntegral = voucher?.valid === true && voucher.pretFinal <= 0
  const voucherBlocheaza =
    codVoucher !== '' &&
    (voucherQ.isFetching || voucherQ.isError || voucher?.valid === false || voucherIntegral)

  const reserve = useMutation({
    meta: { erroareAfisata: true },
    mutationFn: (sesiuneId: string) =>
      reserveOpenAndPay({ clientId: activeMember!.clientId, sesiuneId, voucherCod }),
    onSuccess: (res) => {
      window.location.href = res.redirectUrl
    },
  })

  const closeModal = () => {
    if (reserve.isPending) return
    setSelected(null)
    reserve.reset()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <p className="text-sm text-sub">
        Cursuri facultative (OPEN class, K-pop Covers) — sesiuni viitoare. Rezervi un loc și
        plătești cu cardul; locul se confirmă după plată.
      </p>

      {orderRef && <RezultatPlata comanda={comanda.data} seIncarca={comanda.isLoading} astept={astept} />}

      <label className="block max-w-xs">
        <span className="mb-1 block text-xs font-medium text-sub">
          Cod voucher (opțional)
        </span>
        <input
          value={voucherCod}
          onChange={(e) => setVoucherCod(e.target.value)}
          placeholder="Introdu codul tău"
          className="w-full rounded-xl border border-line bg-surf px-3 py-2 text-sm uppercase text-ink"
        />
        <span className="mt-1 block text-xs text-sub">
          Se aplică la ședința pe care o rezervi; reducerea apare în rezumat.
        </span>
      </label>

      {isLoading && <Spinner />}
      {error && (
        <p className="text-sm text-danger">
          Nu am putut încărca ședințele disponibile. {mesajEroare(error)}
        </p>
      )}
      {data && data.length === 0 && (
        <p className="text-sm text-sub">Nicio sesiune disponibilă momentan.</p>
      )}
      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => {
            const plin = s.locuriRamase <= 0
            const rezervat = s.rezervareStatus
            return (
              <div
                key={s.sesiuneId}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surf p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-sub">{formatData(s.data)}</span>
                  <span className="rounded-full bg-surf2 px-2.5 py-1 text-xs font-medium text-sub">
                    {plin ? 'Complet' : `${s.locuriRamase} ${s.locuriRamase === 1 ? 'loc liber' : 'locuri libere'} din ${s.capacitate}`}
                  </span>
                </div>
                <div>
                  <p className="text-base font-extrabold text-ink">{s.cursNume ?? 'Curs'}</p>
                  {s.instructorNume && <p className="text-sm text-sub">{s.instructorNume}</p>}
                </div>
                {rezervat === 'platit' ? (
                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <span className="text-sm text-sub">Plătit · locul e al tău</span>
                    <span className="rounded-full bg-ok px-3 py-1.5 text-sm font-semibold text-white">
                      ✓ Ai loc rezervat
                    </span>
                  </div>
                ) : rezervat === 'rezervat' ? (
                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <span className="text-sm text-sub">Locul e ținut cât se confirmă plata.</span>
                    <span className="shrink-0 rounded-full bg-surf2 px-3 py-1.5 text-sm font-semibold text-ink">
                      ⏳ Plata se confirmă
                    </span>
                  </div>
                ) : (
                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <span className="text-lg font-extrabold text-ink">{formatRON(s.pret ?? 0)}</span>
                    <Button onClick={() => setSelected(s)} disabled={plin || !activeMember}>
                      {plin ? 'Complet' : 'Rezervă'}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-sub">
        <span>Plată securizată cu cardul (RON) prin:</span>
        <PaymentBadges />
      </div>

      <Modal
        open={!!selected}
        title="Rezumat comandă"
        onClose={closeModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={reserve.isPending}>
              Renunță
            </Button>
            <Button
              onClick={() => selected && reserve.mutate(selected.sesiuneId)}
              disabled={reserve.isPending || !activeMember || voucherBlocheaza}
            >
              {reserve.isPending ? 'Se inițiază…' : 'Continuă la plată'}
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-3">
            <SummaryRow label="Curs" value={selected.cursNume ?? 'Curs'} />
            <SummaryRow label="Dată" value={formatData(selected.data)} />
            {selected.instructorNume && (
              <SummaryRow label="Instructor" value={selected.instructorNume} />
            )}
            <SummaryRow label="Preț ședință" value={formatRON(pretBaza)} />
            {codVoucher && (
              <SummaryRow
                label={`Voucher ${codVoucher.toUpperCase()}`}
                value={
                  voucherQ.isFetching
                    ? 'se verifică…'
                    : voucher?.valid
                      ? `−${formatRON(voucher.reducere)}`
                      : '—'
                }
              />
            )}
            <div className="border-t border-line pt-3">
              <SummaryRow label="Total de plată" value={formatRON(totalDePlata)} />
            </div>
            {voucher?.valid === false && (
              <p className="text-sm text-danger">
                {voucher.motiv} Șterge codul ca să plătești prețul întreg.
              </p>
            )}
            {voucherIntegral && (
              <p className="text-sm text-danger">
                Voucherul acoperă integral ședința — rezervarea gratuită se face la recepție.
              </p>
            )}
            {voucherQ.isError && (
              <p className="text-sm text-danger">
                Nu am putut verifica codul. {mesajEroare(voucherQ.error)} Dacă vrei să plătești acum
                fără reducere, șterge codul.
              </p>
            )}
            {reserve.isError && (
              <p className="text-sm text-danger">{mesajEroare(reserve.error)}</p>
            )}
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

function RezultatPlata({
  comanda,
  seIncarca,
  astept,
}: {
  comanda: StatusComanda | null | undefined
  seIncarca: boolean
  astept: boolean
}) {
  const box = 'rounded-2xl border px-4 py-3 text-sm'
  const ce = comanda?.cursNume
    ? ` — ${comanda.cursNume}${comanda.data ? `, ${formatData(comanda.data)}` : ''}`
    : ''

  if (comanda?.status === 'confirmed') {
    return (
      <div className={`${box} border-ok bg-surf text-ink`}>
        <p className="font-bold text-ok">✓ Rezervare confirmată{ce}</p>
        <p className="mt-1 text-sub">Plata a trecut. Ședința e marcată mai jos și apare în Plăți.</p>
      </div>
    )
  }
  if (comanda?.status === 'failed' || comanda?.status === 'canceled') {
    return (
      <div className={`${box} border-danger bg-surf text-ink`}>
        <p className="font-bold text-danger">Plata nu a trecut, deci locul nu e rezervat{ce}</p>
        <p className="mt-1 text-sub">
          Poți încerca din nou de pe cardul ședinței. Dacă banca ți-a retras totuși suma, scrie-ne
          la office@quasardance.ro și o verificăm.
        </p>
      </div>
    )
  }
  if (seIncarca || (comanda?.status === 'pending' && astept)) {
    return (
      <div className={`${box} border-line bg-surf2 text-ink`}>
        <Spinner label="Verificăm plata la bancă…" />
      </div>
    )
  }
  if (comanda?.status === 'pending') {
    return (
      <div className={`${box} border-acc bg-surf2 text-ink`}>
        <p className="font-bold">⏳ Banca încă procesează plata{ce}</p>
        <p className="mt-1 text-sub">
          Locul îți e ținut până la confirmare. Reîncarcă pagina peste câteva minute: când plata
          trece, ședința apare marcată cu „Ai loc rezervat”. Dacă suma ți-a fost retrasă și
          rezervarea nu apare confirmată, scrie-ne la office@quasardance.ro.
        </p>
      </div>
    )
  }
  return (
    <div className={`${box} border-acc bg-surf2 text-ink`}>
      Plata a fost inițiată. Rezervarea se confirmă automat după validarea plății de către bancă.
    </div>
  )
}
