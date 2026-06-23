import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { callPortalAuth } from '@/lib/supabase'
import { Button } from '@/components/ui'

// Reset parolă în 2 moduri pe aceeași pagină (director de login separat — portal-auth):
//  - fără ?token în URL → formular „trimite-mi link" (portal-auth request_reset → email)
//  - cu ?token=… (din linkul primit pe email) → formular „parolă nouă" (portal-auth reset)

export function ResetPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')
  const recovery = !!token

  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function sendLink(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { ok, data } = await callPortalAuth({ action: 'request_reset', email })
    setBusy(false)
    setMsg(
      ok
        ? 'Dacă adresa există, ți-am trimis un link de resetare pe email.'
        : `Eroare: ${(data.error as string) ?? 'încearcă din nou'}`,
    )
  }

  async function setNewPassword(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { ok, data } = await callPortalAuth({ action: 'reset', token, password: pwd })
    setBusy(false)
    if (!ok) {
      setMsg(`Eroare: ${(data.error as string) ?? 'link invalid sau expirat'}`)
      return
    }
    setMsg('Parola a fost schimbată. Te redirecționăm la autentificare…')
    setTimeout(() => navigate('/login'), 1400)
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-md">
        <div className="text-center">
          <span className="rounded bg-quasar-yellow px-2 py-1 text-lg font-black text-quasar-black">
            QUASAR
          </span>
          <h1 className="mt-3 text-xl font-bold">
            {recovery ? 'Setează o parolă nouă' : 'Resetare parolă'}
          </h1>
        </div>

        {recovery ? (
          <form onSubmit={setNewPassword} className="space-y-3">
            <input
              type="password"
              placeholder="Parolă nouă (min. 8)"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-md border border-quasar-gray-light px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Se salvează…' : 'Salvează parola'}
            </Button>
          </form>
        ) : (
          <form onSubmit={sendLink} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-quasar-gray-light px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Se trimite…' : 'Trimite link de resetare'}
            </Button>
          </form>
        )}

        {msg && <p className="text-sm text-quasar-gray">{msg}</p>}
        <div className="text-center">
          <Link to="/login" className="text-xs text-quasar-gray underline hover:text-quasar-black">
            Înapoi la autentificare
          </Link>
        </div>
      </div>
    </div>
  )
}
