import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { getAnunturiClient, markAnunturiCitite } from './api'

export function NotificariPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['anunturi'], queryFn: getAnunturiClient })

  // La vizitarea paginii, marchează tot ca citit (apoi reîmprospătează badge-ul).
  useEffect(() => {
    markAnunturiCitite()
      .then(() => qc.invalidateQueries({ queryKey: ['anunturi'] }))
      .catch(() => {})
  }, [qc])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notificări</h1>
      {isLoading && <Spinner />}
      {data && data.length === 0 && (
        <p className="text-sm text-quasar-gray">Nicio notificare.</p>
      )}
      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((a) => (
            <li key={a.id} className="rounded-lg border border-quasar-gray-light p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{a.titlu}</p>
                <span className="shrink-0 text-xs text-quasar-gray">{formatData(a.created)}</span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-quasar-gray">{a.continut}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
