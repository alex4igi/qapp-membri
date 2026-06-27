import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { getDocumenteClient } from './api'
import { AdeverintaDocument } from './AdeverintaDocument'

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
    </svg>
  )
}

export function DocumentePage() {
  const { activeMember, loading } = useActiveMember()
  const [showAdeverinta, setShowAdeverinta] = useState(false)
  const { data, isLoading, error } = useQuery({
    queryKey: ['documente', activeMember?.clientId],
    queryFn: () => getDocumenteClient(activeMember!.clientId),
    enabled: !!activeMember,
  })

  if (loading) return <Spinner />
  if (!activeMember) return <p className="text-sm text-sub">Niciun membru de afișat.</p>

  return (
    <div className="max-w-5xl space-y-4">
      {isLoading && <Spinner />}
      {error && <p className="text-sm text-danger">Eroare la încărcare.</p>}

      <div className="grid gap-3.5 sm:grid-cols-2">
        {(data ?? []).map((d) => (
          <a
            key={d.id}
            href={d.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 rounded-2xl border border-line bg-surf p-4 shadow-card transition-colors hover:border-acc"
          >
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-surf2 text-xl">
              📄
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14.5px] font-extrabold text-ink">
                {d.titlu || d.tip || 'Document'}
              </div>
              <div className="truncate text-[11.5px] font-medium text-sub">
                {d.tip ?? ''}
                {d.dataExpirarii ? ` · expiră ${formatData(d.dataExpirarii)}` : ''}
                {d.observatii ? ` · ${d.observatii}` : ''}
              </div>
            </div>
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-acc text-acc-ink">
              <DownloadIcon />
            </span>
          </a>
        ))}

        {/* Adeverință de participare — generată la cerere */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surf p-4 shadow-card">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-surf2 text-xl">
            📜
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14.5px] font-extrabold text-ink">
              Adeverință de frecvență
            </div>
            <div className="truncate text-[11.5px] font-medium text-sub">Generează la cerere</div>
          </div>
          <button
            onClick={() => setShowAdeverinta((v) => !v)}
            className="flex-none rounded-xl bg-surf2 px-4 py-2 text-[12.5px] font-extrabold text-ink hover:bg-acc hover:text-acc-ink"
          >
            {showAdeverinta ? 'Ascunde' : 'Generează'}
          </button>
        </div>
      </div>

      {data && data.length === 0 && !showAdeverinta && (
        <p className="text-sm text-sub">
          Niciun alt document disponibil. Poți genera o adeverință de frecvență mai sus.
        </p>
      )}

      {showAdeverinta && <AdeverintaDocument />}
    </div>
  )
}
