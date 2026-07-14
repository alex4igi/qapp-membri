import { createClient, FunctionsHttpError } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Lipsesc variabilele de mediu Supabase. Completează VITE_SUPABASE_URL și VITE_SUPABASE_ANON_KEY în .env.local',
  )
}

// Portalul folosește un DIRECTOR DE LOGIN SEPARAT (portal_accounts), nu Supabase Auth.
// Tokenul de portal (emis de edge function portal-auth, semnat HS256 cu secretul
// proiectului) e atașat ca Bearer pe fiecare cerere prin opțiunea `accessToken`.
// Când nu suntem logați, întoarcem cheia anon (pentru paginile publice /servicii).
let portalToken: string | null = null
export function setPortalToken(t: string | null) {
  portalToken = t
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => portalToken ?? supabaseAnonKey,
})

// La un răspuns non-2xx, `supabase.functions.invoke` întoarce un FunctionsHttpError
// cu `data === null` și `error.message` generic („…non-2xx status code"). Mesajul real
// stă în corpul răspunsului (`error.context`, un Response). Îl extragem ca să afișăm
// userului cauza reală (ex. „Sesiune completă", „Voucher invalid").
export async function edgeFunctionError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null)
    if (body?.error) return new Error(body.error as string)
  }
  return error instanceof Error ? error : new Error(String(error))
}

// POST direct la o edge function (fără supabase-js — ca să nu interfereze cu
// `accessToken` și pentru fluxurile fără sesiune, ex. semnarea publică).
export function postEdgeFunction(
  name: string,
  body: Record<string, unknown>,
  accessToken?: string,
): Promise<Response> {
  return fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken ?? supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

// Apel la portal-auth (login/refresh/logout/reset). Pentru change_password se
// trimite tokenul logat.
export async function callPortalAuth(
  body: Record<string, unknown>,
  accessToken?: string,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await postEdgeFunction('portal-auth', body, accessToken)
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}
