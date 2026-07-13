import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatRON, formatData } from '@/lib/format'
import { getSoldFamilie } from '@/features/plati/api/payments'
import { listOpenSesiuniClient } from '@/features/rezervari/api'
import { getProfilFamilie } from '@/features/profil/api'

export function AcasaPage() {
  const navigate = useNavigate()
  const { activeMember } = useActiveMember()

  const sold = useQuery({ queryKey: ['sold-familie'], queryFn: getSoldFamilie })
  const sesiuni = useQuery({ queryKey: ['open-sesiuni'], queryFn: () => listOpenSesiuniClient() })
  // Salutul e pentru titularul contului (părintele/reprezentantul). La conturile
  // individuale (fără familie) cădem pe numele membrului propriu.
  const familie = useQuery({ queryKey: ['profil-familie'], queryFn: getProfilFamilie })

  const totalFamilie = (sold.data ?? []).reduce((a, r) => a + r.restanta, 0)
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
        <p className="mt-2 text-acc-ink">
          {totalFamilie > 0
            ? `Ai ${formatRON(totalFamilie)} de achitat.`
            : 'Totul e achitat. Mulțumim!'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {totalFamilie > 0 && (
            <button
              onClick={() => navigate('/plati')}
              className="rounded-full bg-[#15120E] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Plătește {formatRON(totalFamilie)}
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

      {/* Ce urmează — singura poartă către Calendar (scos din meniu) */}
      <Link
        to="/calendar"
        className="flex items-center gap-4 rounded-2xl border border-line bg-surf p-5 shadow-card transition-colors hover:border-acc"
      >
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-surf2 text-xl">📅</span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold text-ink">Ce urmează</p>
          <p className="text-[13px] text-sub">Program, ședințe și evenimente în calendar</p>
        </div>
        <span className="text-lg text-sub">→</span>
      </Link>

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
        {!sesiuni.isLoading && urmatoarele.length === 0 && (
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
                    {s.instructorNume ? ` · ${s.instructorNume}` : ''} · {s.locuriRamase} {s.locuriRamase === 1 ? 'loc liber' : 'locuri libere'} din {s.capacitate}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-ink">{formatRON(s.pret ?? 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
