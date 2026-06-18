import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { getDocumenteClient } from './api'

export function DocumentePage() {
  const { activeMember, loading } = useActiveMember()
  const { data, isLoading, error } = useQuery({
    queryKey: ['documente', activeMember?.clientId],
    queryFn: () => getDocumenteClient(activeMember!.clientId),
    enabled: !!activeMember,
  })

  if (loading) return <Spinner />
  if (!activeMember) return <p className="text-sm text-quasar-gray">Niciun membru de afișat.</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Documente — {activeMember.nume}</h1>
      <p className="text-sm text-quasar-gray">
        Contracte, anexe și alte documente. Apasă pentru a deschide.
      </p>
      {isLoading && <Spinner />}
      {error && <p className="text-sm text-red-600">Eroare la încărcare.</p>}
      {data && data.length === 0 && (
        <p className="text-sm text-quasar-gray">Niciun document disponibil.</p>
      )}
      {data && data.length > 0 && (
        <ul className="divide-y divide-quasar-gray-light rounded-lg border border-quasar-gray-light">
          {data.map((d) => (
            <li key={d.id}>
              <a
                href={d.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-quasar-gray-light/20"
              >
                <div>
                  <p className="text-sm font-medium">{d.titlu || d.tip || 'Document'}</p>
                  <p className="text-xs text-quasar-gray">
                    {d.tip ?? ''}
                    {d.dataExpirarii ? ` · expiră ${formatData(d.dataExpirarii)}` : ''}
                    {d.observatii ? ` · ${d.observatii}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-quasar-black">↗</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
