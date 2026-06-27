import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Button, Spinner } from '@/components/ui'
import { PaymentBadges } from '@/components/PaymentBadges'
import { formatRON, formatData } from '@/lib/format'
import { cn } from '@/lib/cn'
import { getSoldFamilie, getPlatiClient, createNetopiaPayment, type PlataRow } from './api/payments'
import { ReduceriSection } from '@/features/reduceri/ReduceriSection'

export function PlatiPage() {
  const { members, activeMember, loading } = useActiveMember()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [returnNotice, setReturnNotice] = useState(false)
  // Data-limită până la care plătim (inclusiv). null = nimic selectat.
  const [cutoff, setCutoff] = useState<string | null>(null)

  const sold = useQuery({ queryKey: ['sold-familie'], queryFn: getSoldFamilie })
  const plati = useQuery({
    queryKey: ['plati', activeMember?.clientId],
    queryFn: () => getPlatiClient(activeMember!.clientId),
    enabled: !!activeMember,
  })

  useEffect(() => {
    if (!searchParams.get('order')) return
    setReturnNotice(true)
    queryClient.invalidateQueries({ queryKey: ['sold-familie'] })
    queryClient.invalidateQueries({ queryKey: ['plati'] })
    searchParams.delete('order')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, queryClient, setSearchParams])

  const rows = useMemo(() => plati.data ?? [], [plati.data])
  // Înrolări neachitate, ordonate vechi→nou (RPC le dă deja așa). Acesta e ordinea FIFO.
  const unpaid = useMemo(
    () => rows.filter((r) => r.rest > 0 && r.dataIncepere),
    [rows],
  )

  // Implicit: selectează TOT ce e de plată (cea mai nouă lună). Resetare la schimbarea membrului.
  useEffect(() => {
    const maxDate = unpaid.length ? unpaid[unpaid.length - 1].dataIncepere : null
    setCutoff(maxDate)
  }, [activeMember?.clientId, unpaid.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const isSelected = (r: PlataRow) => cutoff != null && r.dataIncepere != null && r.dataIncepere <= cutoff
  const selectedRows = unpaid.filter(isSelected)
  const selectedSum = selectedRows.reduce((a, r) => a + r.rest, 0)
  // Înrolarea-limită trimisă la server (null dacă plătim tot → RPC plătește toată restanța).
  const cutoffEnrollmentId =
    selectedRows.length > 0 && selectedRows.length < unpaid.length
      ? selectedRows[selectedRows.length - 1].enrollmentId
      : undefined

  function toggle(r: PlataRow) {
    if (!r.dataIncepere) return
    if (isSelected(r)) {
      // deselectează de la luna asta în sus → cutoff = cea mai mare lună STRICT mai veche
      const earlier = unpaid.filter((u) => u.dataIncepere! < r.dataIncepere!)
      setCutoff(earlier.length ? earlier[earlier.length - 1].dataIncepere : null)
    } else {
      setCutoff(r.dataIncepere)
    }
  }

  const pay = useMutation({
    mutationFn: () => createNetopiaPayment({ clientId: activeMember!.clientId, panaLa: cutoffEnrollmentId }),
    onSuccess: (res) => {
      window.location.href = res.redirectUrl
    },
  })

  if (loading) return <Spinner />

  const totalFamilie = (sold.data ?? []).reduce((a, r) => a + r.restanta, 0)
  const numeById = new Map(members.map((m) => [m.clientId, m.nume]))

  // Grupare pe sezon, păstrând ordinea cronologică a rândurilor.
  const groups: { sezon: string; rows: PlataRow[] }[] = []
  for (const r of rows) {
    const key = r.sezonNume ?? 'Fără sezon'
    let g = groups.find((x) => x.sezon === key)
    if (!g) { g = { sezon: key, rows: [] }; groups.push(g) }
    g.rows.push(r)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="text-sm text-sub">
          Tot ce ai de plată și ce ai achitat. Poți plăti lună cu lună, dar nu poți sări peste o lună
          mai veche neachitată (plata în avans e permisă).
        </p>
      </div>

      {returnNotice && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-acc bg-surf2 px-4 py-3 text-sm text-ink">
          <span>
            Plata a fost inițiată. Confirmarea apare după procesarea de către bancă; soldul se
            actualizează automat.
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['sold-familie'] })
              queryClient.invalidateQueries({ queryKey: ['plati'] })
            }}
          >
            Reîmprospătează
          </Button>
        </div>
      )}

      {/* Sold familie */}
      <section className="rounded-2xl border border-line bg-surf p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-sub">Sold familie</span>
          <span className={cn('text-2xl font-extrabold tracking-tight', totalFamilie > 0 ? 'text-danger' : 'text-ok')}>
            {formatRON(totalFamilie)}
          </span>
        </div>
        {(sold.data ?? []).filter((r) => r.restanta > 0).length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-line pt-3">
            {sold.data!.filter((r) => r.restanta > 0).map((r) => (
              <li key={r.clientId} className="flex justify-between text-sm">
                <span className="text-ink">{numeById.get(r.clientId) ?? r.nume}</span>
                <span className="font-medium text-danger">{formatRON(r.restanta)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReduceriSection />

      {/* Detaliu pe înrolări — grupat pe sezon */}
      <section className="space-y-3">
        <h2 className="text-base font-extrabold tracking-tight text-ink">Situația — {activeMember?.nume ?? '—'}</h2>
        {plati.isLoading && <Spinner />}
        {plati.data && rows.length === 0 && (
          <p className="text-sm text-sub">Nicio înrolare.</p>
        )}

        {groups.map((g) => (
          <div key={g.sezon} className="overflow-hidden rounded-2xl border border-line bg-surf shadow-card">
            <div className="border-b border-line bg-surf2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-sub">
              {g.sezon}
            </div>
            <ul className="divide-y divide-line">
              {g.rows.map((r) => {
                const achitat = r.rest <= 0
                const selectable = !achitat && !!r.dataIncepere
                const checked = isSelected(r)
                return (
                  <li
                    key={r.enrollmentId}
                    className={cn('flex items-center justify-between gap-3 px-4 py-3', achitat && 'opacity-70')}
                  >
                    <div className="flex items-center gap-3">
                      {selectable ? (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(r)}
                          className="h-4 w-4 shrink-0 accent-acc"
                          aria-label={`Selectează ${r.cursNume ?? ''}`}
                        />
                      ) : (
                        <span className="h-4 w-4 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-ink">{r.cursNume ?? 'Curs'}</p>
                        <p className="text-xs text-sub">
                          {formatData(r.dataIncepere)} · {r.tipPlata ?? ''}
                          {r.codVoucher ? ` · voucher ${r.codVoucher}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-ink">{formatRON(r.platit)} / {formatRON(r.total)}</p>
                      {achitat ? (
                        <span className="text-xs font-semibold text-ok">ACHITAT</span>
                      ) : (
                        <span className="text-xs font-semibold text-danger">rest {formatRON(r.rest)}</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>

      {/* Rezumat comandă + plată */}
      {unpaid.length > 0 && (
        <section className="space-y-2 rounded-2xl bg-surf2 p-5">
          <p className="text-base font-extrabold tracking-tight text-ink">Rezumat comandă</p>
          <div className="flex justify-between text-sm">
            <span className="text-sub">
              {selectedRows.length === 0
                ? 'Nicio lună selectată'
                : `${selectedRows.length} ${selectedRows.length === 1 ? 'lună selectată' : 'luni selectate'}`}
            </span>
            <span className="font-extrabold text-ink">{formatRON(selectedSum)}</span>
          </div>
          <p className="text-xs text-sub">
            Moneda: RON. Vei fi redirecționat către NETOPIA Payments pentru plata securizată cu cardul.
          </p>
          <PaymentBadges />
          <Button
            onClick={() => pay.mutate()}
            disabled={pay.isPending || selectedSum <= 0}
            className="w-full"
          >
            {pay.isPending ? 'Se inițiază…' : `Plătește ${formatRON(selectedSum)}`}
          </Button>
          {pay.isError && <p className="mt-1 text-xs text-danger">{(pay.error as Error).message}</p>}
        </section>
      )}
    </div>
  )
}
