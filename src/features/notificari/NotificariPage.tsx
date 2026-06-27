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
    <div className="mx-auto max-w-2xl">
      {isLoading && <Spinner />}
      {data && data.length === 0 && (
        <p className="text-sm text-sub">Nicio notificare.</p>
      )}
      {data && data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.map((a) => (
            <li key={a.id} className="flex gap-3.5 rounded-2xl border border-line bg-surf p-4">
              <span className="mt-1.5 h-[10px] w-[10px] shrink-0 rounded-full bg-acc" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-extrabold text-ink">{a.titlu}</p>
                  <span className="shrink-0 text-[11.5px] font-semibold text-sub">{formatData(a.created)}</span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-sub">{a.continut}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
