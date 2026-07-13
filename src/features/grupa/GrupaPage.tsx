import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { getGrupeClient, type GrupaRow } from './api'
import { EvaluariSection } from '@/features/evaluari/EvaluariSection'
import { PrezenteSection } from '@/features/prezente/PrezenteSection'
import { ActivitateSection } from '@/features/activitate/ActivitateSection'

type GrupaTab = 'cursuri' | 'prezente' | 'activitate'

const TABS: { key: GrupaTab; label: string }[] = [
  { key: 'cursuri', label: 'Cursuri' },
  { key: 'prezente', label: 'Prezențe' },
  { key: 'activitate', label: 'Activitate' },
]

const ZI_SCURT: Record<string, string> = {
  Luni: 'Lun', Marti: 'Mar', Miercuri: 'Mie', Joi: 'Joi',
  Vineri: 'Vin', Sambata: 'Sâm', Duminica: 'Dum',
}

const TIP_PLATA_LABEL: Record<string, string> = {
  'Per sedinta': 'Per ședință',
  'Per luna': 'Abonament lunar',
  'Per an': 'Abonament anual',
}

function formatOra(ora: string | null): string {
  if (!ora) return ''
  return ora.slice(0, 5) // "18:00:00" → "18:00"
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-sub">{label}</p>
      <p className="text-sm font-bold text-ink">{value}</p>
    </div>
  )
}

function GrupaCard({ g }: { g: GrupaRow }) {
  const subtitlu = [g.nivel, g.varsta, g.stil].filter(Boolean).join(' · ')
  const program = g.zile.map((z) => ZI_SCURT[z] ?? z).join(', ')
  const programVal = `${program}${g.ora ? ` · ${formatOra(g.ora)}` : ''}`
  const locatieVal = [g.locatie, g.sala].filter(Boolean).join(' · ')
  const valabilitate = `${g.dataIncepere ? formatData(g.dataIncepere) : '—'}${
    g.dataFinal ? ` → ${formatData(g.dataFinal)}` : ''
  }`
  return (
    <div className="bg-surf border border-line rounded-2xl p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold text-ink">{g.cursNume ?? 'Curs'}</p>
          {subtitlu && <p className="text-sub">{subtitlu}</p>}
        </div>
        {g.tipPlata && (
          <span className="shrink-0 rounded-full bg-surf2 px-2.5 py-0.5 text-xs font-semibold text-ink">
            {TIP_PLATA_LABEL[g.tipPlata] ?? g.tipPlata}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3">
        {(program || g.ora) && <Field label="Program" value={programVal} />}
        {(g.locatie || g.sala) && <Field label="Locație" value={locatieVal} />}
        {g.instructori.length > 0 && (
          <Field
            label={g.instructori.length > 1 ? 'Instructori' : 'Instructor'}
            value={g.instructori.join(', ')}
          />
        )}
        <Field label="Valabilitate" value={valabilitate} />
      </div>
    </div>
  )
}

export function GrupaPage() {
  const { activeMember, members, activeClientId, setActiveClientId, loading } = useActiveMember()
  const [tab, setTab] = useState<GrupaTab>('cursuri')
  const { data, isLoading, error } = useQuery({
    queryKey: ['grupe', activeMember?.clientId],
    queryFn: () => getGrupeClient(activeMember!.clientId),
    enabled: !!activeMember && tab === 'cursuri',
  })

  if (loading) return <Spinner />
  if (!activeMember) return <p className="text-sm text-sub">Niciun membru de afișat.</p>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {members.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.clientId}
              type="button"
              onClick={() => setActiveClientId(m.clientId)}
              className={
                m.clientId === activeClientId
                  ? 'rounded-full bg-acc px-4 py-1.5 text-sm font-bold text-acc-ink'
                  : 'rounded-full bg-surf border border-line px-4 py-1.5 text-sm font-bold text-sub'
              }
            >
              {m.displayName}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              t.key === tab
                ? 'rounded-full bg-acc px-4 py-1.5 text-sm font-bold text-acc-ink'
                : 'rounded-full bg-surf border border-line px-4 py-1.5 text-sm font-bold text-sub'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cursuri' && (
        <>
          {isLoading && <Spinner />}
          {error && <p className="text-sm text-danger">Eroare la încărcare.</p>}
          {data && data.length === 0 && (
            <p className="text-sm text-sub">Nicio înrolare activă momentan.</p>
          )}
          {data && data.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.map((g) => (
                <GrupaCard key={g.enrollmentId} g={g} />
              ))}
            </div>
          )}
          <EvaluariSection />
        </>
      )}
      {tab === 'prezente' && <PrezenteSection />}
      {tab === 'activitate' && <ActivitateSection />}
    </div>
  )
}
