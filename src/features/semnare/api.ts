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
  profilExistent?: boolean
  copii?: Array<{ id: string; nume: string; dataNasterii: string | null }>
  pdfUrl?: string | null
  alreadySigned?: boolean
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
