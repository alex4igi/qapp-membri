import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'

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
    <div className="flex min-h-full items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-md"
      >
        <div className="text-center">
          <span className="rounded bg-quasar-yellow px-2 py-1 text-lg font-black text-quasar-black">
            QUASAR
          </span>
          <h1 className="mt-3 text-xl font-bold">Contul meu</h1>
          <p className="text-sm text-quasar-gray">Quasar Dance</p>
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
      </form>
    </div>
  )
}
