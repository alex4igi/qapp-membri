// Pagina publică de semnare vorbește DOAR cu edge function-ul contract-public
// (fetch direct, fără supabase-js — nu există sesiune; tokenul din URL e cheia).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const ENDPOINT = `${SUPABASE_URL}/functions/v1/contract-public`

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
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })
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
