import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Spinner } from '@/components/ui'
import { PaymentBadges } from '@/components/PaymentBadges'
import { cn } from '@/lib/cn'
import { formatRON, formatZi } from '@/lib/format'
import { mesajEroare } from '@/lib/errorMessage'
import { ReduceriSection } from '@/features/reduceri/ReduceriSection'
import { getSezonCurentClient } from '@/features/calendar/api'
import { RezultatComanda } from './RezultatComanda'
import { OfertaIntegrala } from './OfertaIntegrala'
import { RandPlata } from './RandPlata'
import { SituatiaSezonului } from './SituatiaSezonului'
import { SituatiaFamiliei } from './SituatiaFamiliei'
import { useSituatieFamilie, usePreviewPlata } from './useSituatieFamilie'
import { CHEI_DUPA_PLATA, SumaSchimbataError, createNetopiaPaymentFamilie } from './api/payments'
import {
  cos,
  deAchitat,
  incluseObligatoriu,
  laTermen,
  stare,
  type Categorie,
  type Context,
  type Cos,
  type Rand,
} from './familie'

const byData = (a: Rand, b: Rand) =>
  (a.dataIncepere ?? '') < (b.dataIncepere ?? '') ? -1 : (a.dataIncepere ?? '') > (b.dataIncepere ?? '') ? 1 : 0

export function PlatiPage() {
  const queryClient = useQueryClient()
  const sit = useSituatieFamilie()
  const { rows, ctx: c, implicita, ordine } = sit
  const sezonCurent = useQuery({ queryKey: ['sezon-curent'], queryFn: getSezonCurentClient })

  // Coșul pornește de la selecția implicită; după o plată (alte rânduri neachitate) se resetează.
  const semnatura = [...implicita].sort().join(',') + '|' + rows.filter((r) => r.rest > 0).length
  const [sel, setSel] = useState<Set<string>>(() => new Set(implicita))
  const [semnaturaSel, setSemnaturaSel] = useState(semnatura)
  if (semnaturaSel !== semnatura) {
    setSemnaturaSel(semnatura)
    setSel(new Set(implicita))
  }

  const k = useMemo(() => cos(rows, sel, c, ordine), [rows, sel, c, ordine])
  const incluse = useMemo(() => incluseObligatoriu(k), [k])
  const preview = usePreviewPlata(k.selectie, k.blocate.length === 0)
  const [mesajSuma, setMesajSuma] = useState<string | null>(null)

  const pay = useMutation({
    meta: { erroareAfisata: true },
    mutationFn: () => createNetopiaPaymentFamilie(k.selectie, preview.data!.amount),
    onSuccess: (res) => {
      window.location.href = res.redirectUrl
    },
    onError: (e) => {
      if (e instanceof SumaSchimbataError) {
        setMesajSuma(e.message)
        for (const key of CHEI_DUPA_PLATA) void queryClient.invalidateQueries({ queryKey: [...key] })
      }
    },
  })

  const toggle = (r: Rand) => {
    setMesajSuma(null)
    setSel((prev) => {
      const next = new Set(prev)
      if (next.has(r.key)) next.delete(r.key)
      else next.add(r.key)
      return next
    })
  }

  if (sit.isLoading) return <Spinner />

  if (sit.isError) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <RezultatComanda />
        <div className="grid gap-2 rounded-2xl border border-danger bg-danger/10 p-4">
          <p className="font-bold text-danger">Nu am putut încărca plățile.</p>
          <p className="text-sm text-ink">
            Nu îți putem arăta acum ce ai de plătit. Încearcă din nou peste câteva momente; dacă nu merge,
            scrie-ne la office@quasardance.ro.
          </p>
          <div>
            <Button variant="secondary" onClick={sit.refetch}>Reîncearcă</Button>
          </div>
        </div>
      </div>
    )
  }

  const st = (r: Rand) => stare(r, c.azi, c.inCurs)
  const restante = rows
    .filter((r) => st(r) === 'restant' || (st(r) === 'curs' && !!r.scadenta && r.scadenta < c.azi))
    .sort(byData)
  const urmatoare = rows
    .filter((r) => !restante.includes(r) && (st(r) === 'azi' || ((st(r) === 'viitor' || st(r) === 'curs') && laTermen(r, c))))
    .sort(byData)
  const fortate = rows
    .filter((r) => incluse.has(r.key) && !restante.includes(r) && !urmatoare.includes(r))
    .sort(byData)
  const viitoare = rows.filter((r) => st(r) === 'viitor' && !laTermen(r, c) && !incluse.has(r.key)).sort(byData)
  const achitate = rows.filter((r) => st(r) === 'achitat' || st(r) === 'acoperit').sort(byData).reverse()
  const avans = viitoare.filter((r) => sel.has(r.key)).length
  const urmatoareaRata = rows
    .filter((r) => deAchitat(st(r)) && r.scadenta && r.scadenta >= c.azi)
    .map((r) => r.scadenta!)
    .sort()[0]

  const randuri = (rs: Rand[]) =>
    rs.map((r) => (
      <RandPlata key={r.key} r={r} c={c} bifat={sel.has(r.key)} onToggle={() => toggle(r)} inclus={incluse.get(r.key)} />
    ))

  const sezonId = sezonCurent.data?.sezonId ?? null
  const cosProps: CosProps = { k, c, preview, onPay: () => pay.mutate(), paying: pay.isPending, eroarePlata: pay.error, mesajSuma }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <RezultatComanda />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-5">
        <div className="min-w-0 space-y-5">
          <SituatiaFamiliei />
          <OfertaIntegrala />

          {sit.platiInCurs.map((p) => (
            <div key={p.orderRef} className="grid gap-1 rounded-2xl border border-evgrupa bg-evgrupa/10 px-4 py-3 text-sm">
              <p className="font-bold text-evgrupa">Plata de {formatRON(p.amount)} e în curs de confirmare</p>
              <p className="text-ink">
                Pornită la {ora(p.created)}
                {p.membri.length ? `, pentru ${p.membri.join(' și ')}` : ''}. Rândurile marcate „Plată în curs” devin
                „Achitat” după confirmarea băncii; nu le plăti din nou. Dacă ai închis pagina de plată fără să plătești,
                le poți plăti din nou după {ora(p.expira)}.
              </p>
            </div>
          ))}

          <h2 className="text-[17px] font-extrabold tracking-tight text-ink">Ce plătești acum</h2>

          <Sectiune titlu="Restanțe · termen depășit" suma={restante.reduce((a, r) => a + r.rest, 0)} rosu>
            {randuri(restante)}
          </Sectiune>
          <Sectiune
            titlu={c.primulTermen === c.azi ? 'De achitat azi' : 'Următoarea plată'}
            detaliu={c.termenInCos && c.primulTermen && c.primulTermen !== c.azi ? `până pe ${formatZi(c.primulTermen, c.azi)}` : undefined}
            suma={urmatoare.reduce((a, r) => a + r.rest, 0)}
          >
            {randuri(urmatoare)}
          </Sectiune>
          <Sectiune
            titlu="Incluse obligatoriu"
            suma={fortate.reduce((a, r) => a + r.rest, 0)}
            nota="Nu au încă termenul, dar intră în plată din cauza unui rând bifat mai sus."
          >
            {randuri(fortate)}
          </Sectiune>

          {!restante.length && !urmatoare.length && !fortate.length && (
            <div className="rounded-2xl border border-line bg-surf p-4 text-sm shadow-card">
              <b className="text-ink">Nimic de plătit acum.</b>{' '}
              <span className="text-sub">
                {urmatoareaRata
                  ? `Următoarea rată are termen pe ${formatZi(urmatoareaRata, c.azi)}. Dacă vrei, o poți plăti în avans din „Plăți viitoare”.`
                  : 'Toate ratele tale sunt achitate.'}
              </span>
            </div>
          )}

          {viitoare.length > 0 && (
            <Pliabil
              titlu="Plăți viitoare · nu sunt de achitat acum"
              sub={`${viitoare.length} ${viitoare.length === 1 ? 'plată' : 'plăți'} · ${formatRON(viitoare.reduce((a, r) => a + r.rest, 0))}${avans ? ` · ${avans} bifate pentru avans` : ''} · deschide ca să plătești în avans`}
            >
              {ordine.map((id) => {
                const ale = viitoare.filter((r) => r.clientId === id)
                if (!ale.length) return null
                return (
                  <li key={id}>
                    <Eticheta>{ale[0].membru}</Eticheta>
                    <ul className="divide-y divide-line">{randuri(ale)}</ul>
                  </li>
                )
              })}
            </Pliabil>
          )}

          <CosMobil {...cosProps} />

          <h2 className="pt-2 text-[17px] font-extrabold tracking-tight text-ink">Situația sezonului</h2>
          {sit.members.map((m) => (
            <SituatiaSezonului
              key={m.clientId}
              membru={m.displayName}
              rows={rows.filter((r) => r.clientId === m.clientId && (sezonId == null || r.sezonId === sezonId))}
              c={c}
              sezonNume={sezonCurent.data?.nume ?? null}
            />
          ))}

          <ReduceriSection />

          {achitate.length > 0 && (
            <Pliabil titlu="Achitate" sub={`${achitate.length} plăți · istoric pe sezoane`}>
              {[...new Set(achitate.map((r) => r.sezonNume ?? 'Fără sezon'))].map((sz) => (
                <li key={sz}>
                  <Eticheta>{sz}</Eticheta>
                  <ul className="divide-y divide-line">
                    {achitate
                      .filter((r) => (r.sezonNume ?? 'Fără sezon') === sz)
                      .map((r) => (
                        <RandPlata key={r.key} r={r} c={c} bifat={false} />
                      ))}
                  </ul>
                </li>
              ))}
            </Pliabil>
          )}
        </div>

        <aside className="hidden lg:sticky lg:top-4 lg:block">
          <div className="rounded-2xl border border-line bg-surf p-4 shadow-card">
            <CosDetaliu {...cosProps} />
          </div>
        </aside>
      </div>
    </div>
  )
}

const ora = (iso: string) => new Date(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

function Eticheta({ children }: { children: ReactNode }) {
  return (
    <p className="bg-bar px-4 pb-1 pt-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-sub">{children}</p>
  )
}

function Pliabil({ titlu, sub, children }: { titlu: string; sub: string; children: ReactNode }) {
  return (
    <details className="group overflow-hidden rounded-2xl border border-line bg-surf shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="grid gap-0.5">
          <span className="text-sm font-bold text-ink">{titlu}</span>
          <span className="text-xs text-sub">{sub}</span>
        </span>
        <span aria-hidden className="text-xs text-sub group-open:rotate-90">▸</span>
      </summary>
      <ul className="divide-y divide-line border-t border-line">{children}</ul>
    </details>
  )
}

function Sectiune({
  titlu,
  detaliu,
  suma,
  rosu,
  nota,
  children,
}: {
  titlu: string
  detaliu?: string
  suma: number
  rosu?: boolean
  nota?: string
  children: ReactNode[]
}) {
  if (!children.length) return null
  return (
    <section className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={cn('text-base font-extrabold tracking-tight', rosu ? 'text-danger' : 'text-ink')}>{titlu}</h3>
        <span className={cn('text-sm font-extrabold', rosu ? 'text-danger' : 'text-ink')}>
          {detaliu ? `${detaliu} · ` : ''}
          {formatRON(suma)}
        </span>
      </div>
      {nota && <p className="text-xs text-sub">{nota}</p>}
      <ul className={cn('divide-y divide-line overflow-hidden rounded-2xl border bg-surf shadow-card', rosu ? 'border-danger' : 'border-line')}>
        {children}
      </ul>
    </section>
  )
}

// ----- Coșul familiei -----

const ETICHETA: Record<Categorie, string> = {
  restant: 'Restanțe',
  azi: 'De achitat azi',
  termen: 'Termen',
  inclus: 'Incluse obligatoriu',
  avans: 'Avans ales de tine',
}

const ORDINE: Categorie[] = ['restant', 'azi', 'termen', 'inclus', 'avans']

type CosProps = {
  k: Cos
  c: Context
  preview: ReturnType<typeof usePreviewPlata>
  onPay: () => void
  paying: boolean
  eroarePlata: unknown
  mesajSuma: string | null
}

// Suma de pe buton e cea calculată de server; până răspunde, butonul stă dezactivat.
function sumaDePlata({ k, preview }: Pick<CosProps, 'k' | 'preview'>): { suma: number; gata: boolean } {
  if (k.total <= 0) return { suma: 0, gata: false }
  if (preview.isSuccess) return { suma: preview.data.amount, gata: preview.data.amount > 0 }
  return { suma: k.total, gata: false }
}

function CosDetaliu(props: CosProps) {
  const { k, c, onPay, paying, eroarePlata, mesajSuma } = props
  const { suma, gata } = sumaDePlata(props)
  if (k.total <= 0) {
    return (
      <div className="grid gap-1.5">
        <h2 className="text-base font-extrabold tracking-tight text-ink">Coșul familiei</h2>
        <p className="text-sm text-sub">Nimic de plătit acum. Poți bifa rate viitoare ca să plătești în avans.</p>
      </div>
    )
  }
  return (
    <div className="grid gap-3">
      <h2 className="text-base font-extrabold tracking-tight text-ink">Coșul familiei</h2>
      {k.membri.map((m) => {
        const grupe = new Map<string, { cat: Categorie; eticheta: string; suma: number; n: number }>()
        for (const a of m.articole) {
          const key = a.cat === 'termen' ? `termen:${a.r.scadenta}` : a.cat
          const eticheta = a.cat === 'termen' ? `Termen ${formatZi(a.r.scadenta, c.azi)}` : ETICHETA[a.cat]
          const g = grupe.get(key) ?? { cat: a.cat, eticheta, suma: 0, n: 0 }
          g.suma += a.r.rest
          g.n += 1
          grupe.set(key, g)
        }
        return (
          <div key={m.clientId} className="grid gap-1 border-b border-line pb-2.5 last:border-b-0">
            <div className="flex justify-between font-extrabold text-ink">
              <span>{m.membru}</span>
              <span>{formatRON(m.total)}</span>
            </div>
            {[...grupe.values()].sort((x, y) => ORDINE.indexOf(x.cat) - ORDINE.indexOf(y.cat)).map((g) => (
              <div
                key={g.eticheta}
                className={cn(
                  'flex justify-between gap-3 text-[12.5px]',
                  g.cat === 'restant' ? 'text-danger' : g.cat === 'inclus' ? 'text-ink' : 'text-sub',
                )}
              >
                <span>
                  {g.eticheta}
                  {g.n > 1 ? ` (${g.n})` : ''}
                </span>
                <span>{formatRON(g.suma)}</span>
              </div>
            ))}
          </div>
        )
      })}
      <div className="flex items-baseline justify-between font-extrabold text-ink">
        <span>Total</span>
        <b className="text-2xl">{formatRON(suma)}</b>
      </div>
      <StarePreview {...props} />
      <Button onClick={onPay} disabled={!gata || paying || k.blocate.length > 0} className="w-full">
        {paying ? 'Se inițiază…' : `Plătește ${formatRON(suma)}`}
      </Button>
      {!!eroarePlata && !mesajSuma && <p className="text-xs text-danger">{mesajEroare(eroarePlata)}</p>}
      <p className="text-xs text-sub">
        O singură plată cu cardul, prin NETOPIA Payments, în RON. Suma se împarte pe membri ca mai sus.
      </p>
      <PaymentBadges />
    </div>
  )
}

function StarePreview({ k, preview, mesajSuma }: CosProps) {
  if (mesajSuma) return <p className="text-xs font-bold text-danger">{mesajSuma}</p>
  if (k.blocate.length)
    return (
      <p className="text-xs text-danger">
        Una dintre ratele care ar intra în plată are deja o plată în curs. Așteaptă confirmarea băncii sau debifează
        lunile mai noi.
      </p>
    )
  if (preview.isFetching && !preview.isSuccess) return <p className="text-xs text-sub">Calculăm suma exactă…</p>
  if (preview.isError) return <p className="text-xs text-danger">{mesajEroare(preview.error)}</p>
  if (preview.isSuccess && Math.abs(preview.data.amount - k.total) > 0.005)
    return <p className="text-xs text-sub">Suma de plată a fost recalculată: {formatRON(preview.data.amount)}.</p>
  return null
}

function CosMobil(props: CosProps) {
  const [deschis, setDeschis] = useState(false)
  const { k } = props
  const { suma, gata } = sumaDePlata(props)
  return (
    <div className="sticky bottom-0 z-10 grid gap-2.5 rounded-2xl border border-line bg-surf p-3.5 shadow-card lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-[11.5px] text-sub">
            Coșul familiei{k.membri.length ? ` · ${k.membri.map((m) => m.membru).join(' și ')}` : ''}
          </span>
          <b className="block text-xl font-extrabold text-ink">{k.total > 0 ? formatRON(suma) : 'Nimic de plătit acum'}</b>
        </div>
        {k.total > 0 && (
          <Button onClick={props.onPay} disabled={!gata || props.paying || k.blocate.length > 0}>
            {props.paying ? 'Se inițiază…' : 'Plătește'}
          </Button>
        )}
      </div>
      {k.total > 0 && (
        <button
          type="button"
          onClick={() => setDeschis((x) => !x)}
          className="justify-self-start text-[12.5px] font-bold text-ink underline"
        >
          {deschis ? 'Ascunde detaliile' : 'Vezi ce plătești'}
        </button>
      )}
      {k.total > 0 && !deschis && <StarePreview {...props} />}
      {deschis && <CosDetaliu {...props} />}
    </div>
  )
}
