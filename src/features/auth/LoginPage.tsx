import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'
import { PaymentBadges } from '@/components/PaymentBadges'
import { Logo } from '@/components/Logo'

export function LoginPage() {
  const { session, signIn, completeTemporaryPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [mustChange, setMustChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (session) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error, mustChangePassword } = await signIn(email, password)
    setBusy(false)
    if (mustChangePassword) setMustChange(true)
    else if (error) setError('Email sau parolă incorecte.')
  }

  async function onSetPassword(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) {
      setError('Cele două parole nu coincid.')
      return
    }
    if (newPassword === password) {
      setError('Alege o parolă diferită de cea primită.')
      return
    }
    setBusy(true)
    const { error } = await completeTemporaryPassword(email, password, newPassword)
    setBusy(false)
    if (error) setError(error)
  }

  if (mustChange) {
    return (
      <div data-theme="light" className="flex min-h-full items-center justify-center bg-canvas p-4 text-ink">
        <form
          onSubmit={onSetPassword}
          className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-md"
        >
          <div className="text-center">
            <Logo className="mx-auto h-12 w-auto" on="light" />
            <h1 className="mt-3 text-xl font-bold">Alege-ți parola</h1>
            <p className="mt-2 text-sm text-quasar-gray">
              Te-ai conectat cu parola primită de la Quasar Dance. Pentru siguranța contului,
              setează acum o parolă doar a ta.
            </p>
          </div>
          <input
            type="password"
            placeholder="Parolă nouă (min. 8 caractere)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
            className="w-full rounded-md border border-quasar-gray-light px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Repetă parola nouă"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
            className="w-full rounded-md border border-quasar-gray-light px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Se salvează…' : 'Salvează și intră în cont'}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMustChange(false)
                setPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setError(null)
              }}
              className="text-xs text-quasar-gray underline hover:text-quasar-black"
            >
              Înapoi la autentificare
            </button>
          </div>
        </form>
      </div>
    )
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
