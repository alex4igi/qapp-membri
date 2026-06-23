import { createClient } from '@supabase/supabase-js'
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

const PORTAL_AUTH_URL = `${supabaseUrl}/functions/v1/portal-auth`

// Apel direct la portal-auth (login/refresh/logout/reset). Nu trece prin supabase-js
// ca să nu interfereze cu `accessToken`. Pentru change_password se trimite tokenul logat.
export async function callPortalAuth(
  body: Record<string, unknown>,
  accessToken?: string,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(PORTAL_AUTH_URL, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken ?? supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}
