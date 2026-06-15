import { useQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui'
import { formatRON, formatData } from '@/lib/format'
import { listOpenSesiuniClient } from './api'

export function RezervariPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['open-sesiuni'],
    queryFn: () => listOpenSesiuniClient(),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Rezervări</h1>
        <p className="text-sm text-quasar-gray">
          Cursuri facultative (OPEN class, K-pop Covers) — sesiuni viitoare.
        </p>
      </div>

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">Eroare la încărcare.</p>}
      {data && data.length === 0 && (
        <p className="text-sm text-quasar-gray">Nicio sesiune disponibilă momentan.</p>
      )}
      {data && data.length > 0 && (
        <ul className="divide-y divide-quasar-gray-light rounded-lg border border-quasar-gray-light">
          {data.map((s) => (
            <li key={s.sesiuneId} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{s.cursNume ?? 'Curs'}</p>
                <p className="text-xs text-quasar-gray">
                  {formatData(s.data)}
                  {s.instructorNume ? ` · ${s.instructorNume}` : ''} · {s.locuriRamase} locuri
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatRON(s.pret ?? 0)}</p>
                {/* TODO Faza 2: buton „Rezervă” → hold_loc_open() + plată Netopia */}
                <span className="text-xs text-quasar-gray">rezervare în Faza 2</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
