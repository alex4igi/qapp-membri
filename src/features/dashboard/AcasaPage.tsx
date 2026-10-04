import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatRON, formatData, acumBucuresti, adaugaZile } from '@/lib/format'
import { getRezumatPlati, sumarPlati } from '@/features/plati/api/payments'
import { getSedinteMembru } from '@/features/calendar/api'
import { listOpenSesiuniClient } from '@/features/rezervari/api'
import { getProfilFamilie } from '@/features/profil/api'

export function AcasaPage() {
  const navigate = useNavigate()
  const { activeMember, members } = useActiveMember()
  const acum = acumBucuresti()
  const pana = adaugaZile(acum.zi, 14)

  const rezumat = useQuery({ queryKey: ['rezumat-plati'], queryFn: getRezumatPlati })
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

  const sumar = sumarPlati(rezumat.data ?? [])
  const termen = sumar.urmatorTermen
  const deAchitatAcum = sumar.restant > 0 ? sumar.restant : termen?.suma ?? 0
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

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Hero */}
      <section className="rounded-[24px] bg-acc p-7">
        <p className="text-sm font-semibold text-acc-ink opacity-70">Bună 👋</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-acc-ink">
          Salut{salutNume ? `, ${salutNume}` : ''}!
        </h1>
        <div className="mt-2 text-acc-ink">
          {rezumat.isLoading ? (
            <p className="opacity-70">Verificăm situația plăților…</p>
          ) : rezumat.isError ? (
            <p>
              Nu am putut încărca situația plăților.{' '}
              <button type="button" onClick={() => void rezumat.refetch()} className="font-bold underline">
                Reîncearcă
              </button>
            </p>
          ) : (
            <>
              {sumar.restant > 0 && (
                <p className="font-bold">Ai {formatRON(sumar.restant)} restanți.</p>
              )}
              {termen && (
                <p className={sumar.restant > 0 ? 'text-sm opacity-80' : undefined}>
                  {sumar.restant > 0 ? 'Următorul termen: ' : 'Ai '}
                  {formatRON(termen.suma)} de achitat{' '}
                  {termen.scadenta === acum.zi ? 'azi' : `până pe ${formatData(termen.scadenta)}`}.
                </p>
              )}
              {sumar.restant <= 0 && !termen && <p>Ești la zi cu plățile. Mulțumim!</p>}
            </>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {deAchitatAcum > 0 && (
            <button
              onClick={() => navigate('/plati')}
              className="rounded-full bg-[#15120E] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Plătește {formatRON(deAchitatAcum)}
            </button>
          )}
          <button
            onClick={() => navigate('/rezervari')}
            className="rounded-full bg-black/10 px-5 py-2.5 text-sm font-semibold text-acc-ink"
          >
            Rezervă ședință
          </button>
        </div>
      </section>

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
