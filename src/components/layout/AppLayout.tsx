import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ActiveMemberProvider, useActiveMember } from '@/hooks/useActiveMember'
import { PaymentBadges } from '@/components/PaymentBadges'
import { FIRMA } from '@/features/legal/firma'
import { cn } from '@/lib/cn'

const NAV = [
  { to: '/', label: 'Acasă', end: true },
  { to: '/grupa', label: 'Grupa mea' },
  { to: '/activitate', label: 'Activitate' },
  { to: '/plati', label: 'Plăți' },
  { to: '/prezente', label: 'Prezențe' },
  { to: '/rezervari', label: 'Rezervări' },
  { to: '/documente', label: 'Documente' },
  { to: '/profil', label: 'Profil' },
]

function MemberSwitcher() {
  const { members, activeClientId, setActiveClientId } = useActiveMember()
  if (members.length <= 1) return null
  return (
    <select
      value={activeClientId ?? ''}
      onChange={(e) => setActiveClientId(e.target.value)}
      className="rounded-md border border-quasar-gray-light bg-white px-2 py-1 text-sm"
    >
      {members.map((m) => (
        <option key={m.clientId} value={m.clientId}>
          {m.nume} {m.prenume ?? ''}
        </option>
      ))}
    </select>
  )
}

function Header() {
  const { user, signOut } = useAuth()
  return (
    <header className="flex items-center justify-between border-b border-quasar-gray-light bg-quasar-black px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="rounded bg-quasar-yellow px-2 py-1 text-sm font-black text-quasar-black">
          QUASAR
        </span>
        <span className="text-sm font-semibold text-white">Contul meu</span>
      </div>
      <div className="flex items-center gap-3">
        <MemberSwitcher />
        <span className="hidden text-xs text-quasar-gray-light sm:inline">{user?.email}</span>
        <button
          onClick={signOut}
          className="rounded-md px-2 py-1 text-sm text-quasar-gray-light hover:text-white"
        >
          Ieșire
        </button>
      </div>
    </header>
  )
}

function TopNav() {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-quasar-gray-light bg-white px-2">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'whitespace-nowrap px-3 py-3 text-sm font-medium',
              isActive
                ? 'border-b-2 border-quasar-yellow text-quasar-black'
                : 'text-quasar-gray hover:text-quasar-black',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppLayout() {
  return (
    <ActiveMemberProvider>
      <div className="mx-auto flex min-h-full max-w-5xl flex-col bg-white shadow-sm">
        <Header />
        <TopNav />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <footer className="border-t border-quasar-gray-light bg-white px-4 py-4 text-xs text-quasar-gray">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {FIRMA.denumire} · CUI {FIRMA.cui} ·{' '}
              <Link className="underline" to="/servicii">Servicii</Link>{' · '}
              <Link className="underline" to="/termeni">Termeni</Link>{' · '}
              <Link className="underline" to="/retur">Retur</Link>
            </span>
            <PaymentBadges />
          </div>
        </footer>
      </div>
    </ActiveMemberProvider>
  )
}
