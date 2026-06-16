import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  if (loading) return <Spinner />
  // Vizitatorul nelogat aterizează pe pagina publică (servicii/prețuri) — Netopia
  // respinge site-urile doar-cu-login. De acolo are buton „Intră în cont".
  if (!session) return <Navigate to="/servicii" replace />
  return <Outlet />
}
