import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { callPortalAuth, setPortalToken } from '@/lib/supabase'

// Auth client-facing pe DIRECTOR DE LOGIN SEPARAT (portal_accounts, NU Supabase Auth).
// Login/refresh/logout trec prin edge function portal-auth, care emite un token semnat
// HS256 cu secretul proiectului. Tokenul e injectat în supabase-js prin setPortalToken.
// Izolarea datelor rămâne server-side prin RLS pe auth.uid() (= portal_accounts.id).

type PortalUser = { id: string; email: string }

type AuthContextValue = {
  session: PortalUser | null // truthy = autentificat (compat cu ProtectedRoute/LoginPage)
  user: PortalUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
}

type Stored = {
  access_token: string
  refresh_token: string
  expires_at: number
  account_id: string
  email: string
}

const KEY = 'portal_auth'
const REFRESH_SKEW_MS = 60_000

function load(): Stored | null {
  try {
    const s = localStorage.getItem(KEY)
    return s ? (JSON.parse(s) as Stored) : null
  } catch {
    return null
  }
}
function persist(s: Stored | null) {
  if (s) localStorage.setItem(KEY, JSON.stringify(s))
  else localStorage.removeItem(KEY)
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const timer = useRef<number | undefined>(undefined)

  function apply(s: Stored) {
    persist(s)
    setPortalToken(s.access_token)
    setUser({ id: s.account_id, email: s.email })
    scheduleRefresh(s.expires_at)
  }
  function clearSession() {
    persist(null)
    setPortalToken(null)
    setUser(null)
    if (timer.current) window.clearTimeout(timer.current)
  }
  function scheduleRefresh(expiresAt: number) {
    if (timer.current) window.clearTimeout(timer.current)
    const delay = Math.max(0, expiresAt - Date.now() - REFRESH_SKEW_MS)
    timer.current = window.setTimeout(doRefresh, delay)
  }
  async function doRefresh() {
    const cur = load()
    if (!cur?.refresh_token) return clearSession()
    const { ok, data } = await callPortalAuth({ action: 'refresh', refresh_token: cur.refresh_token })
    if (!ok || !data.access_token) return clearSession()
    apply({
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string,
      expires_at: data.expires_at as number,
      account_id: data.account_id as string,
      email: cur.email,
    })
  }

  useEffect(() => {
    const cur = load()
    if (cur && cur.expires_at > Date.now()) {
      apply(cur)
      setLoading(false)
    } else if (cur?.refresh_token) {
      doRefresh().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { ok, data } = await callPortalAuth({ action: 'login', email, password })
    if (!ok || !data.access_token) {
      return { error: (data.error as string) ?? 'Email sau parolă greșite.' }
    }
    apply({
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string,
      expires_at: data.expires_at as number,
      account_id: data.account_id as string,
      email: (data.email as string) ?? email,
    })
    return { error: null }
  }

  const signOut = async () => {
    const cur = load()
    if (cur?.refresh_token) await callPortalAuth({ action: 'logout', refresh_token: cur.refresh_token })
    clearSession()
  }

  const updatePassword: AuthContextValue['updatePassword'] = async (newPassword) => {
    const cur = load()
    if (!cur) return { error: 'Sesiune expirată. Autentifică-te din nou.' }
    const { ok, data } = await callPortalAuth(
      { action: 'change_password', new_password: newPassword },
      cur.access_token,
    )
    return { error: ok ? null : ((data.error as string) ?? 'Schimbarea parolei a eșuat.') }
  }

  const value: AuthContextValue = {
    session: user,
    user,
    loading,
    signIn,
    signOut,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth trebuie folosit în interiorul <AuthProvider>')
  return ctx
}
