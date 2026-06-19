import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { getGrupeClient, type GrupaRow } from './api'
import { EvaluariSection } from '@/features/evaluari/EvaluariSection'

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

function GrupaCard({ g }: { g: GrupaRow }) {
  const subtitlu = [g.nivel, g.varsta, g.stil].filter(Boolean).join(' · ')
  const program = g.zile.map((z) => ZI_SCURT[z] ?? z).join(', ')
  return (
    <div className="rounded-lg border border-quasar-gray-light p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{g.cursNume ?? 'Curs'}</p>
          {subtitlu && <p className="text-xs text-quasar-gray">{subtitlu}</p>}
        </div>
        {g.tipPlata && (
          <span className="shrink-0 rounded-full bg-quasar-yellow/20 px-2.5 py-0.5 text-xs font-semibold text-quasar-black">
            {TIP_PLATA_LABEL[g.tipPlata] ?? g.tipPlata}
          </span>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        {(program || g.ora) && (
          <div>
            <dt className="text-xs text-quasar-gray">Program</dt>
            <dd className="font-medium">
              {program}
              {g.ora ? ` · ${formatOra(g.ora)}` : ''}
            </dd>
          </div>
        )}
        {(g.locatie || g.sala) && (
          <div>
            <dt className="text-xs text-quasar-gray">Locație</dt>
            <dd className="font-medium">
              {[g.locatie, g.sala].filter(Boolean).join(' · ')}
            </dd>
          </div>
        )}
        {g.instructori.length > 0 && (
          <div>
            <dt className="text-xs text-quasar-gray">
              {g.instructori.length > 1 ? 'Instructori' : 'Instructor'}
            </dt>
            <dd className="font-medium">{g.instructori.join(', ')}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-quasar-gray">Valabilitate</dt>
          <dd className="font-medium">
            {g.dataIncepere ? formatData(g.dataIncepere) : '—'}
            {g.dataFinal ? ` → ${formatData(g.dataFinal)}` : ''}
          </dd>
        </div>
      </dl>
    </div>
  )
}

export function GrupaPage() {
  const { activeMember, loading } = useActiveMember()
  const { data, isLoading, error } = useQuery({
    queryKey: ['grupe', activeMember?.clientId],
    queryFn: () => getGrupeClient(activeMember!.clientId),
    enabled: !!activeMember,
  })

  if (loading) return <Spinner />
  if (!activeMember) return <p className="text-sm text-quasar-gray">Niciun membru de afișat.</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Grupa mea — {activeMember.nume}</h1>
      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">Eroare la încărcare.</p>}
      {data && data.length === 0 && (
        <p className="text-sm text-quasar-gray">Nicio înrolare activă momentan.</p>
      )}
      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((g) => (
            <GrupaCard key={g.enrollmentId} g={g} />
          ))}
        </div>
      )}

      <EvaluariSection />
    </div>
  )
}
