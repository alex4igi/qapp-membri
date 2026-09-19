import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { getDocumenteClient, getDocumentDownloadUrl, type DocumentRow } from './api'
import { AdeverintaDocument } from './AdeverintaDocument'

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
    </svg>
  )
}

const cardClass =
  'flex w-full min-w-0 items-center gap-3.5 rounded-2xl border border-line bg-surf p-4 text-left shadow-card transition-colors hover:border-acc'

function subtitle(d: DocumentRow): string {
  return [
    d.tip ?? '',
    d.dataExpirarii ? `expiră ${formatData(d.dataExpirarii)}` : '',
    d.observatii ?? '',
  ].filter(Boolean).join(' · ')
}

function DocumentCard({ doc }: { doc: DocumentRow }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // Documentele arhivate de aplicație se cer la click (signed URL de 5 minute);
  // cele atașate manual de recepție au doar linkul.
  async function descarca() {
    setErr('')
    setLoading(true)
    try {
      const url = await getDocumentDownloadUrl(doc.id)
      const a = document.createElement('a')
      a.href = url
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Nu am putut descărca documentul.')
    } finally {
      setLoading(false)
    }
  }

  const inner = (
    <>
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-surf2 text-xl">
        📄
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-extrabold text-ink">
          {doc.titlu || doc.tip || 'Document'}
        </div>
        <div className="truncate text-[11.5px] font-medium text-sub">{subtitle(doc)}</div>
        {err && <div className="mt-1 text-[11.5px] font-semibold text-danger">{err}</div>}
      </div>
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-acc text-acc-ink">
        {loading
          ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-acc-ink/30 border-t-acc-ink" />
          : <DownloadIcon />}
      </span>
    </>
  )

  if (doc.storagePath) {
    return (
      <button type="button" onClick={descarca} disabled={loading} className={cardClass}>
        {inner}
      </button>
    )
  }
  return (
    <a href={doc.link} target="_blank" rel="noopener noreferrer" className={cardClass}>
      {inner}
    </a>
  )
}

export function DocumenteSection() {
  const { activeMember } = useActiveMember()
  const [showAdeverinta, setShowAdeverinta] = useState(false)
  const { data, isLoading, error } = useQuery({
    queryKey: ['documente', activeMember?.clientId],
    queryFn: () => getDocumenteClient(activeMember!.clientId),
    enabled: !!activeMember,
  })

  if (!activeMember) return null

  return (
    <section className="space-y-3">
      <h2 className="text-base font-extrabold text-ink">Documente</h2>
      {isLoading && <Spinner />}
      {error && <p className="text-sm text-danger">Eroare la încărcare.</p>}

      <div className="grid gap-3.5 sm:grid-cols-2">
        {(data ?? []).map((d) => (
          <DocumentCard key={d.id} doc={d} />
        ))}

        {/* Adeverință de participare — generată la cerere */}
        <div className="flex min-w-0 items-center gap-3.5 rounded-2xl border border-line bg-surf p-4 shadow-card">
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
    </section>
  )
}
