import { useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { ActiveMemberProvider, useActiveMember } from '@/hooks/useActiveMember'
import { PaymentBadges } from '@/components/PaymentBadges'
import { NotificationBell } from '@/features/notificari/NotificationBell'
import { Logo } from '@/components/Logo'
import { FIRMA } from '@/features/legal/firma'
import { getSoldFamilie } from '@/features/plati/api/payments'
import { cn } from '@/lib/cn'
// Q-bot ascuns temporar — încă neimplementat. Re-activează importul + <QbotWidget /> când e gata.
// import { QbotWidget } from '@/features/chatbot/QbotWidget'

// ===== Iconițe (line icons, 24x24) =====
type IconName =
  | 'acasa' | 'grupa' | 'plati' | 'rezervari' | 'prezente'
  | 'calendar' | 'documente' | 'activitate' | 'profil'

const ICON_PATHS: Record<IconName, ReactNode> = {
  acasa: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  grupa: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6" /><path d="M18 14a6 6 0 0 1 3 5" /></>,
  plati: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" /></>,
  rezervari: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  prezente: <><path d="M9 11l3 3 8-8" /><path d="M21 12a9 9 0 1 1-6.2-8.5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 9h18M8 3v4M16 3v4" /><circle cx="12" cy="14" r="2" fill="currentColor" stroke="none" /></>,
  documente: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
  activitate: <><path d="M3 12h4l2 6 4-14 2 8h6" /></>,
  profil: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
}

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"
    >
      {ICON_PATHS[name]}
    </svg>
  )
}

type NavItem = { to: string; label: string; icon: IconName; end?: boolean }

const NAV_MAIN: NavItem[] = [
  { to: '/', label: 'Acasă', icon: 'acasa', end: true },
  { to: '/grupa', label: 'Grupa mea', icon: 'grupa' },
  { to: '/plati', label: 'Plăți', icon: 'plati' },
  { to: '/rezervari', label: 'Rezervări', icon: 'rezervari' },
  { to: '/prezente', label: 'Prezențe', icon: 'prezente' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
]

const NAV_ACCOUNT: NavItem[] = [
  { to: '/documente', label: 'Documente', icon: 'documente' },
  { to: '/activitate', label: 'Activitate', icon: 'activitate' },
  { to: '/profil', label: 'Profil', icon: 'profil' },
]

// Titlu + subtitlu pe rută (pentru bara de sus).
const PAGE_META: Record<string, [string, string]> = {
  '/': ['Acasă', 'Privire de ansamblu asupra contului'],
  '/grupa': ['Grupa mea', 'Cursuri și evaluări'],
  '/plati': ['Plăți', 'Sold, istoric și plată online'],
  '/rezervari': ['Rezervări', 'Ședințe libere disponibile'],
  '/prezente': ['Prezențe', 'Istoric prezență'],
  '/calendar': ['Calendar', 'Program și evenimente'],
  '/documente': ['Documente', 'Contracte, regulamente și facturi'],
  '/activitate': ['Activitate', 'Istoricul contului'],
  '/notificari': ['Notificări', 'Mesaje și alerte'],
  '/profil': ['Profil', 'Date personale și setări'],
}

function useSoldTotal(): number {
  const sold = useQuery({ queryKey: ['sold-familie'], queryFn: getSoldFamilie })
  return (sold.data ?? []).reduce((a, r) => a + r.restanta, 0)
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-[13px] px-3 py-2.5 text-sm font-bold transition-colors',
      isActive
        ? 'bg-acc text-acc-ink'
        : 'text-side-sub hover:bg-surf2 hover:text-side-ink',
    )
  const total = useSoldTotal()
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_MAIN.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={linkClass}>
          <NavIcon name={item.icon} />
          <span>{item.label}</span>
          {item.to === '/plati' && total > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-extrabold text-white">
              {Math.round(total)}
            </span>
          )}
        </NavLink>
      ))}
      <div className="mt-4 border-t border-side-line pt-3.5 pl-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-side-sub">
        Contul tău
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        {NAV_ACCOUNT.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={onNavigate} className={linkClass}>
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-2 pt-1">
        <span className="inline-flex items-center rounded-[11px] bg-[#15120E] px-2.5 py-2">
          <Logo className="h-[18px] w-auto" />
        </span>
        <div>
          <div className="text-sm font-extrabold tracking-tight text-side-ink">Quasar Dance</div>
          <div className="text-[11px] font-semibold text-side-sub">Portal membri</div>
        </div>
      </div>
      <div className="mt-6">
        <NavList onNavigate={onNavigate} />
      </div>
    </>
  )
}

function ProfileChip() {
  const { activeMember, members, activeClientId, setActiveClientId } = useActiveMember()
  const navigate = useNavigate()
  const initials = (activeMember?.nume?.[0] ?? 'M').toUpperCase()
  const others = members
    .filter((m) => m.clientId !== activeClientId)
    .map((m) => m.nume)
    .join(' · ')

  return (
    <div className="flex items-center gap-2">
      {members.length > 1 && (
        <select
          value={activeClientId ?? ''}
          onChange={(e) => setActiveClientId(e.target.value)}
          aria-label="Schimbă membrul"
          className="hidden rounded-xl border border-line bg-surf px-2 py-2 text-sm font-semibold text-ink sm:block"
        >
          {members.map((m) => (
            <option key={m.clientId} value={m.clientId}>
              {m.nume} {m.prenume ?? ''}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={() => navigate('/profil')}
        className="flex items-center gap-2.5 rounded-full border border-line bg-surf py-1.5 pl-1.5 pr-3.5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-acc text-[13px] font-extrabold text-acc-ink">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-extrabold leading-tight text-ink">
            {activeMember?.nume ?? 'Cont'}
          </span>
          {others && <span className="block text-[11px] font-semibold text-sub">{others}</span>}
        </span>
      </button>
    </div>
  )
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const [title, sub] = PAGE_META[location.pathname] ?? ['', '']

  return (
    <div className="flex h-[74px] flex-none items-center gap-4 border-b border-line bg-bar px-4 sm:px-6">
      <button
        onClick={onMenu}
        aria-label="Meniu"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surf text-ink lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <div className="min-w-0">
        <div className="truncate text-lg font-extrabold tracking-tight text-ink sm:text-xl">{title}</div>
        <div className="truncate text-xs font-semibold text-sub sm:text-[12.5px]">{sub}</div>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggle}
          aria-label="Schimbă tema"
          className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-line bg-surf text-ink"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" /></svg>
          )}
        </button>
        <NotificationBell />
        <ProfileChip />
      </div>
    </div>
  )
}

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { signOut } = useAuth()

  return (
    <ActiveMemberProvider>
      <div className="flex h-full bg-canvas">
        {/* Sidebar fix (desktop) */}
        <aside className="hidden w-64 flex-none flex-col border-r border-side-line bg-side px-4 py-5 lg:flex">
          <SidebarContent />
        </aside>

        {/* Drawer mobil */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-side-line bg-side px-4 py-5">
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        {/* Zona principală */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenu={() => setDrawerOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-7 sm:py-7">
            <Outlet />
          </main>
          <footer className="border-t border-line bg-bar px-4 py-4 text-xs text-sub sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {FIRMA.denumire} · CUI {FIRMA.cui} ·{' '}
                <Link className="underline" to="/servicii">Servicii</Link>{' · '}
                <Link className="underline" to="/termeni">Termeni</Link>{' · '}
                <Link className="underline" to="/retur">Retur</Link>{' · '}
                <button className="underline" onClick={signOut}>Ieșire</button>
              </span>
              <PaymentBadges />
            </div>
          </footer>
        </div>
      </div>
    </ActiveMemberProvider>
  )
}
