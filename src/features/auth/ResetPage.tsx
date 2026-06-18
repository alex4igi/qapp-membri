import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'

// Reset parolă în 2 moduri pe aceeași pagină:
//  - fără sesiune de recuperare → formular „trimite-mi link" (resetPasswordForEmail)
//  - cu sesiune de recuperare (după click pe linkul din email) → formular „parolă nouă"
// Supabase emite un eveniment PASSWORD_RECOVERY și creează o sesiune temporară la
// aterizarea din link; o detectăm prin prezența unei sesiuni pe această rută.

export function ResetPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const [recovery, setRecovery] = useState(false)
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setRecovery(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function sendLink(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    })
    setBusy(false)
    setMsg(
      error
        ? `Eroare: ${error.message}`
        : 'Dacă adresa există, ți-am trimis un link de resetare pe email.',
    )
  }

  async function setNewPassword(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { error } = await updatePassword(pwd)
    setBusy(false)
    if (error) {
      setMsg(`Eroare: ${error}`)
      return
    }
    setMsg('Parola a fost schimbată. Te redirecționăm…')
    setTimeout(() => navigate('/'), 1200)
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
              placeholder="Parolă nouă"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              minLength={6}
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
