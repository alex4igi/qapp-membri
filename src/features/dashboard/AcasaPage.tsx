import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatRON, formatData, formatZi, acumBucuresti, adaugaZile } from '@/lib/format'
import { sumarPlati } from '@/features/plati/api/payments'
import { useRezumatFamilie } from '@/features/plati/useRezumatFamilie'
import { useSituatieFamilie, usePreviewPlata } from '@/features/plati/useSituatieFamilie'
import { OfertaIntegrala } from '@/features/plati/OfertaIntegrala'
import { getSedinteMembru } from '@/features/calendar/api'
import { listOpenSesiuniClient } from '@/features/rezervari/api'
import { getProfilFamilie } from '@/features/profil/api'

export function AcasaPage() {
  const navigate = useNavigate()
  const { members, activeMember } = useActiveMember()
  const acum = acumBucuresti()
  const pana = adaugaZile(acum.zi, 14)

  // Banii: restanța și termenul din aceeași sursă ca badge-ul și Plăți; suma de pe buton e
  // coșul implicit al familiei, calculat de server (Alex + Codex, 09.10.2026).
  const { q: rezumat, sumar, termen, urmatoareaRata } = useRezumatFamilie()
  const sit = useSituatieFamilie()
  const preview = usePreviewPlata(sit.cosImplicit.selectie, sit.cosImplicit.blocate.length === 0)
  const sedinte = useQuery({
    queryKey: ['sedinte-membru', acum.zi, pana],
    queryFn: () => getSedinteMembru(acum.zi, pana),
  })
  const sesiuni = useQuery({
    queryKey: ['open-sesiuni', activeMember?.clientId ?? null],
    queryFn: () => listOpenSesiuniClient(activeMember?.clientId),
  })
  // Salutul e pentru titularul contului (părintele/reprezentantul). La conturile
  // individuale (fără familie) cădem pe numele membrului propriu.
  const familie = useQuery({ queryKey: ['profil-familie'], queryFn: getProfilFamilie })

  // Ședințele de azi care au început deja nu mai sunt „următoarele".
  const urmatoareleSedinte = (sedinte.data ?? [])
    .filter((x) => x.data > acum.zi || !x.ora || x.ora > acum.ora)
    .slice(0, 5)
  const maiMultiMembri = members.length > 1
  const urmatoarele = (sesiuni.data ?? []).slice(0, 3)
  const salutNume =
    familie.data?.prenumeReprezentant ||
    familie.data?.numeReprezentant ||
    activeMember?.displayName ||
    null
  const deAchitat = preview.isSuccess ? preview.data.amount : 0
  const pentru = sit.cosImplicit.membri.map((m) => m.membru)
  const perMembru = members.map((m) => ({ m, s: sumarPlati(rezumat.data ?? [], m.clientId) }))

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Hero: „Ce am de achitat și până când?” */}
      <section className="grid gap-4 rounded-[24px] bg-acc p-6 text-acc-ink">
        <div>
          <p className="text-sm font-semibold opacity-70">Bună 👋</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Salut{salutNume ? `, ${salutNume}` : ''}!</h1>
        </div>
        {rezumat.isLoading ? (
          <p className="opacity-70">Verificăm situația plăților…</p>
        ) : rezumat.isError ? (
          <div className="rounded-2xl bg-[#fffdf3] px-4 py-3 text-[#1a1714]">
            <p className="font-bold">Nu am putut încărca situația plăților.</p>
            <p className="text-sm text-[#6e6754]">Plățile tale nu s-au schimbat. Încearcă din nou peste câteva momente.</p>
            <button type="button" onClick={() => void rezumat.refetch()} className="mt-1 text-sm font-bold underline">
              Reîncearcă
            </button>
          </div>
        ) : (
          <>
            {sit.platiInCurs.length > 0 && (
              <p className="rounded-xl bg-white/50 px-3 py-2 text-sm">
                <b>Ai o plată de {formatRON(sit.platiInCurs.reduce((a, p) => a + p.amount, 0))} în curs de confirmare.</b>{' '}
                Nu plăti din nou; banca o confirmă de obicei în câteva minute.
              </p>
            )}
            <div className="divide-y divide-[#efe6c8] rounded-2xl bg-[#fffdf3] px-4 text-[#1a1714]">
              {sumar.restant > 0 ? (
                <LinieBani rosu titlu="Restanțe · termen depășit" sub="De achitat cât mai curând" suma={sumar.restant} />
              ) : (
                <LinieBani ok titlu="Nu ai restanțe" sub="Mulțumim că plătești la timp." />
              )}
              {termen && (
                <LinieBani
                  titlu={termen.scadenta === acum.zi ? 'De achitat azi' : 'Următoarea plată'}
                  sub={termen.scadenta === acum.zi ? undefined : `până pe ${formatZi(termen.scadenta, acum.zi)}`}
                  suma={termen.suma}
                />
              )}
              {urmatoareaRata && (
                <LinieBani titlu="Următoarea rată" sub={`${formatZi(urmatoareaRata, acum.zi)} · nu e de plătit acum`} />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {deAchitat > 0 ? (
                <>
                  <button
                    onClick={() => navigate('/plati')}
                    className="rounded-full bg-[#15120E] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Plătește {formatRON(deAchitat)}
                  </button>
                  <span className="text-xs opacity-75">
                    {pentru.length ? `pentru ${pentru.join(' și ')} · ` : ''}o singură plată
                  </span>
                </>
              ) : (
                <button
                  onClick={() => navigate('/plati')}
                  className="rounded-full bg-[#15120E] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Vezi plățile
                </button>
              )}
              <button
                onClick={() => navigate('/rezervari')}
                className="rounded-full bg-black/10 px-5 py-2.5 text-sm font-semibold"
              >
                Rezervă ședință
              </button>
            </div>
            {maiMultiMembri && (
              <ul className="grid gap-1 text-[12.5px]">
                {perMembru.map(({ m, s }) => (
                  <li key={m.clientId} className="flex justify-between gap-3">
                    <span>{m.displayName}</span>
                    <span className="text-right">
                      {s.restant > 0 && <b className="text-[#b3361f]">{formatRON(s.restant)} restanță</b>}
                      {s.restant > 0 && s.urmatorTermen && ' · '}
                      {s.urmatorTermen && `${formatRON(s.urmatorTermen.suma)} până pe ${formatZi(s.urmatorTermen.scadenta, acum.zi)}`}
                      {s.restant <= 0 && !s.urmatorTermen && 'achitat'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="flex gap-2 rounded-xl bg-white/45 px-3 py-2 text-[12.5px]">
              <span aria-hidden>ℹ</span>
              <span>
                <b>Abonamentul se achită în rate, la termenele afișate.</b> Nu trebuie să achiți acum tot sezonul.
              </span>
            </p>
          </>
        )}
      </section>

      <OfertaIntegrala compact />

      {/* Ce urmează: ședințele reale ale familiei (aceeași sursă ca Calendarul) */}
      <section className="rounded-2xl border border-line bg-surf p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold tracking-tight text-ink">Ce urmează</h2>
          <Link to="/calendar" className="text-sm font-semibold text-sub hover:text-ink">
            Calendar →
          </Link>
        </div>
        {sedinte.isLoading ? (
          <div className="mt-4"><Spinner /></div>
        ) : sedinte.isError ? (
          <p className="mt-4 text-sm text-sub">
            Nu am putut încărca programul.{' '}
            <button type="button" onClick={() => void sedinte.refetch()} className="font-semibold text-ink underline">
              Reîncearcă
            </button>
          </p>
        ) : urmatoareleSedinte.length === 0 ? (
          <p className="mt-4 text-sm text-sub">Nicio ședință în următoarele 14 zile.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {urmatoareleSedinte.map((x) => (
              <li
                key={`${x.clientId}:${x.cursId}:${x.data}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surf2 px-4 py-3"
              >
                <div className="w-20 shrink-0">
                  <p className="text-xs font-bold capitalize text-sub">
                    {x.data === acum.zi ? 'azi' : zi(x.data)}
                  </p>
                  <p className="text-sm font-extrabold text-ink">{x.ora ?? 'ora ?'}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {maiMultiMembri && x.prenume ? `${x.prenume.trim()} · ` : ''}
                    {x.cursNume ?? 'Curs'}
                  </p>
                  <p className="truncate text-xs text-sub">
                    {[x.sala, x.locatie].filter(Boolean).join(' · ') || '—'}
                    {!x.ora && ' · ora nu e stabilită, întreabă recepția'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ședințe disponibile */}
      <section className="rounded-2xl border border-line bg-surf p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold tracking-tight text-ink">Ședințe disponibile</h2>
          <Link to="/rezervari" className="text-sm font-semibold text-sub hover:text-ink">
            Vezi toate →
          </Link>
        </div>
        {sesiuni.isLoading && (
          <div className="mt-4">
            <Spinner />
          </div>
        )}
        {sesiuni.isError && (
          <p className="mt-4 text-sm text-sub">
            Nu am putut încărca sesiunile.{' '}
            <button type="button" onClick={() => void sesiuni.refetch()} className="font-semibold text-ink underline">
              Reîncearcă
            </button>
          </p>
        )}
        {!sesiuni.isLoading && !sesiuni.isError && urmatoarele.length === 0 && (
          <p className="mt-4 text-sm text-sub">Nicio sesiune disponibilă momentan.</p>
        )}
        {urmatoarele.length > 0 && (
          <ul className="mt-4 space-y-2">
            {urmatoarele.map((s) => (
              <li
                key={s.sesiuneId}
                className="flex items-center justify-between rounded-xl border border-line bg-surf2 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{s.cursNume ?? 'Curs'}</p>
                  <p className="text-xs text-sub">
                    {formatData(s.data)}
                    {s.instructorNume ? ` · ${s.instructorNume}` : ''} ·{' '}
                    {s.locuriRamase <= 0
                      ? 'Complet'
                      : `${s.locuriRamase} ${s.locuriRamase === 1 ? 'loc liber' : 'locuri libere'} din ${s.capacitate}`}
                  </p>
                </div>
                {s.rezervareStatus === 'platit' ? (
                  <span className="shrink-0 rounded-full bg-ok px-2.5 py-1 text-xs font-semibold text-white">
                    ✓ Rezervat
                  </span>
                ) : s.rezervareStatus === 'rezervat' ? (
                  <span className="shrink-0 rounded-full bg-surf px-2.5 py-1 text-xs font-semibold text-ink">
                    ⏳ Se confirmă
                  </span>
                ) : (
                  <span className="text-sm font-extrabold text-ink">{formatRON(s.pret ?? 0)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function zi(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })
}

function LinieBani({ titlu, sub, suma, rosu, ok }: { titlu: string; sub?: string; suma?: number; rosu?: boolean; ok?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <div className="grid min-w-0 gap-px">
        <b className={cn('text-sm', rosu && 'text-[#b3361f]', ok && 'text-[#1f7a50]')}>{titlu}</b>
        {sub && <span className="text-xs text-[#6e6754]">{sub}</span>}
      </div>
      {suma != null && (
        <span className={cn('whitespace-nowrap text-xl font-extrabold', rosu && 'text-[#b3361f]')}>{formatRON(suma)}</span>
      )}
    </div>
  )
}
