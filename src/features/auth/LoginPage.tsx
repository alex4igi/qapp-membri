import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'
import { PaymentBadges } from '@/components/PaymentBadges'
import { Logo } from '@/components/Logo'

export function LoginPage() {
  const { session, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setError('Email sau parolă incorecte.')
  }

  return (
    <div data-theme="light" className="flex min-h-full items-center justify-center bg-canvas p-4 text-ink">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-md"
      >
        <div className="text-center">
          <Logo className="mx-auto h-12 w-auto" on="light" />
          <h1 className="mt-3 text-xl font-bold">Contul meu</h1>
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md border border-quasar-gray-light px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Parolă"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-md border border-quasar-gray-light px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Se conectează…' : 'Intră în cont'}
        </Button>
        <div className="text-center">
          <Link to="/reset" className="text-xs text-quasar-gray underline hover:text-quasar-black">
            Ai uitat parola?
          </Link>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-1 text-xs text-quasar-gray">
          <Link className="hover:text-quasar-black hover:underline" to="/servicii">Servicii</Link>
          <Link className="hover:text-quasar-black hover:underline" to="/termeni">Termeni</Link>
          <Link className="hover:text-quasar-black hover:underline" to="/confidentialitate">Confidențialitate</Link>
          <Link className="hover:text-quasar-black hover:underline" to="/retur">Retur</Link>
          <Link className="hover:text-quasar-black hover:underline" to="/contact">Contact</Link>
        </nav>
        <div className="flex justify-center pt-1">
          <PaymentBadges />
        </div>
      </form>
    </div>
  )
}
