// Pagina publică de semnare vorbește DOAR cu edge function-ul contract-public
// (fetch direct, fără sesiune supabase-js; tokenul din URL e cheia).
import { postEdgeFunction } from '@/lib/supabase'

export type SemnareField = {
  key: string
  label: string
  type: 'text' | 'date' | 'checkbox' | 'signature' | 'copii_table'
  required: boolean
  editable: boolean
  source: string
}

export type LoadResult = {
  contract?: { nume: string; tip: string }
  fields?: SemnareField[]
  prefill?: Record<string, string>
  /** Cheie → mască de afișat (CNP, CI): valoarea reală rămâne la noi, în fișă. */
  mascate?: Record<string, string>
  profilExistent?: boolean
  copii?: Array<{ id: string; nume: string }>
  pdfUrl?: string | null
  alreadySigned?: boolean
  canDownload?: boolean
  /** Fereastra de descărcare de pe linkul public s-a închis — rămâne portalul. */
  descarcareExpirata?: boolean
  message?: string
  error?: string
}

async function call(body: Record<string, unknown>): Promise<Response> {
  return postEdgeFunction('contract-public', body)
}

export async function loadContract(token: string): Promise<LoadResult> {
  const res = await call({ action: 'load', token })
  const data = (await res.json()) as LoadResult
  if (!res.ok && !data.error) data.error = 'Eroare la încărcare.'
  return data
}

export async function submitContract(params: {
  token: string
  valori: Record<string, unknown>
  semnaturaPng: string
  consimtamant: boolean
  marketingOptin: boolean
}): Promise<{ ok?: boolean; message?: string; error?: string }> {
  const res = await call({ action: 'submit', ...params })
  const data = await res.json()
  if (!res.ok && !data.error) data.error = 'Eroare la trimitere.'
  return data
}

// Documentul semnat: finalizarea (PDF + arhivare) rulează după submit, deci
// pagina întâi întreabă dacă e gata, apoi cere linkul la click.
export async function contractReady(
  token: string,
): Promise<{ ready: boolean; descarcareExpirata: boolean }> {
  try {
    const res = await call({ action: 'status', token })
    const data = (await res.json()) as { ready?: boolean; descarcareExpirata?: boolean }
    return { ready: data.ready === true, descarcareExpirata: data.descarcareExpirata === true }
  } catch {
    return { ready: false, descarcareExpirata: false }
  }
}

export async function downloadContract(
  token: string,
): Promise<{ url?: string; pending?: boolean; descarcareExpirata?: boolean; error?: string }> {
  const res = await call({ action: 'download', token })
  const data = (await res.json()) as {
    url?: string
    pending?: boolean
    descarcareExpirata?: boolean
    error?: string
  }
  if (!res.ok && !data.error) data.error = 'Documentul nu poate fi descărcat acum.'
  return data
}
