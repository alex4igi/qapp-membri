import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { cn } from '@/lib/cn'
import { getPrezenteClient } from './api'

const STATUS_STYLE: Record<string, string> = {
  Prezent: 'bg-green-100 text-green-800',
  Absent: 'bg-red-100 text-red-700',
  Motivat: 'bg-amber-100 text-amber-800',
}

export function PrezentePage() {
  const { activeMember, loading } = useActiveMember()
  const { data, isLoading, error } = useQuery({
    queryKey: ['prezente', activeMember?.clientId],
    queryFn: () => getPrezenteClient(activeMember!.clientId),
    enabled: !!activeMember,
  })

  if (loading) return <Spinner />
  if (!activeMember) return <p className="text-sm text-quasar-gray">Niciun membru de afișat.</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Prezențe — {activeMember.nume}</h1>
      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">Eroare la încărcare.</p>}
      {data && data.length === 0 && <p className="text-sm text-quasar-gray">Nicio prezență înregistrată.</p>}
      {data && data.length > 0 && (
        <ul className="divide-y divide-quasar-gray-light rounded-lg border border-quasar-gray-light">
          {data.map((p, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{p.cursNume ?? 'Curs'}</p>
                <p className="text-xs text-quasar-gray">{formatData(p.data)}</p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  STATUS_STYLE[p.status ?? ''] ?? 'bg-quasar-gray-light text-quasar-gray',
                )}
              >
                {p.status ?? '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
