import { type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { ActiveMemberProvider, useActiveMember } from '@/hooks/useActiveMember'
import { PaymentBadges } from '@/components/PaymentBadges'
import { NotificationBell } from '@/features/notificari/NotificationBell'
import { FeedbackFab } from '@/features/feedback/FeedbackFab'
import { Logo } from '@/components/Logo'
import { FIRMA } from '@/features/legal/firma'
import { getSoldFamilie } from '@/features/plati/api/payments'
import { cn } from '@/lib/cn'

// ===== Iconițe (line icons, 24x24) =====
type IconName = 'acasa' | 'grupa' | 'plati' | 'rezervari' | 'bilete' | 'profil'

const ICON_PATHS: Record<IconName, ReactNode> = {
  acasa: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  grupa: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6" /><path d="M18 14a6 6 0 0 1 3 5" /></>,
  plati: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" /></>,
  rezervari: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  bilete: <><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" /><path d="M15 6v12" /></>,
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

type NavItem = { to: string; label: string; labelScurt: string; icon: IconName; end?: boolean }

// 5 intrări — identice pe desktop (sidebar) și mobil (bottom-nav). Calendar și
// Notificări NU sunt taburi: se ajung din cardul „Ce urmează" (Acasă) și din clopoțel.
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Acasă', labelScurt: 'Acasă', icon: 'acasa', end: true },
  { to: '/grupa', label: 'Grupa mea', labelScurt: 'Grupa', icon: 'grupa' },
  { to: '/plati', label: 'Plăți', labelScurt: 'Plăți', icon: 'plati' },
  { to: '/rezervari', label: 'Rezervări', labelScurt: 'Rezervări', icon: 'rezervari' },
  { to: '/bilete', label: 'Bilete', labelScurt: 'Bilete', icon: 'bilete' },
  { to: '/profil', label: 'Profil', labelScurt: 'Profil', icon: 'profil' },
]
const TAB_PATHS = new Set(NAV_ITEMS.map((t) => t.to))

// Titlu + subtitlu pe rută.
const PAGE_META: Record<string, [string, string]> = {
  '/': ['Acasă', 'Privire de ansamblu asupra contului'],
  '/grupa': ['Grupa mea', 'Cursuri, prezențe și activitate'],
  '/plati': ['Plăți', 'Sold, istoric și plată online'],
  '/rezervari': ['Rezervări', 'Ședințe libere disponibile'],
  '/bilete': ['Bilete', 'Bilete la spectacole și evenimente'],
  '/calendar': ['Calendar', 'Program și evenimente'],
  '/notificari': ['Notificări', 'Mesaje și alerte'],
  '/profil': ['Profil', 'Date personale, documente și setări'],
}

function useSoldTotal(): number {
  const sold = useQuery({ queryKey: ['sold-familie'], queryFn: getSoldFamilie })
  return (sold.data ?? []).reduce((a, r) => a + r.restanta, 0)
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
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
  )
}

function NavList() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-[13px] px-3 py-2.5 text-sm font-bold transition-colors',
      isActive ? 'bg-acc text-acc-ink' : 'text-side-sub hover:bg-surf2 hover:text-side-ink',
    )
  const total = useSoldTotal()
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
          <NavIcon name={item.icon} />
          <span>{item.label}</span>
          {item.to === '/plati' && total > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-extrabold text-white">
              {Math.round(total)}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarContent() {
  return (
    <>
      <div className="flex flex-col items-start gap-1.5 px-1 pt-1">
        <Logo className="h-11 w-auto xl:h-12" />
        <div className="pl-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-side-sub">
          Portal membri
        </div>
      </div>
      <div className="mt-6">
        <NavList />
      </div>
    </>
  )
}

// Comutator de membru (familie cu mai mulți copii). Pe desktop apare lângă chip;
// pe mobil e singurul control de switch (header).
function MemberSwitcher({ className }: { className?: string }) {
  const { members, activeClientId, setActiveClientId } = useActiveMember()
  if (members.length <= 1) return null
  return (
    <div className={cn('relative', className)}>
      <select
        value={activeClientId ?? ''}
        onChange={(e) => setActiveClientId(e.target.value)}
        aria-label="Schimbă membrul"
        className="appearance-none rounded-full border border-line bg-surf py-2 pl-3.5 pr-8 text-[13px] font-bold text-ink"
      >
        {members.map((m) => (
          <option key={m.clientId} value={m.clientId}>
            {[m.prenume, m.nume].filter(Boolean).join(' ')}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
    </div>
  )
}

function ProfileChip() {
  const { activeMember, members, activeClientId } = useActiveMember()
  const navigate = useNavigate()
  const initials = (activeMember?.displayName?.[0] ?? 'M').toUpperCase()
  const others = members
    .filter((m) => m.clientId !== activeClientId)
    .map((m) => m.displayName)
    .join(' · ')

  return (
    <div className="flex items-center gap-2">
      <MemberSwitcher className="hidden sm:block" />
      <button
        onClick={() => navigate('/profil')}
        className="flex items-center gap-2.5 rounded-full border border-line bg-surf py-1.5 pl-1.5 pr-3.5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-acc text-[13px] font-extrabold text-acc-ink">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-extrabold leading-tight text-ink">
            {activeMember?.displayName ?? 'Cont'}
          </span>
          {others && <span className="block text-[11px] font-semibold text-sub">{others}</span>}
        </span>
      </button>
    </div>
  )
}

// ===== Bara de sus (DESKTOP) =====
function TopBar() {
  const location = useLocation()
  const [title, sub] = PAGE_META[location.pathname] ?? ['', '']
  return (
    <div className="hidden h-[74px] flex-none items-center gap-4 border-b border-line bg-bar px-6 lg:flex">
      <div className="min-w-0">
        <div className="truncate text-xl font-extrabold tracking-tight text-ink">{title}</div>
        <div className="truncate text-[12.5px] font-semibold text-sub">{sub}</div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell />
        <ProfileChip />
      </div>
    </div>
  )
}

// ===== Header (MOBIL) — pe taburi: logo + clopoțel + switcher; pe sub-ecrane: înapoi + titlu =====
function MobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeMember } = useActiveMember()
  const isTab = TAB_PATHS.has(location.pathname)
  const [title] = PAGE_META[location.pathname] ?? ['', '']
  const initials = (activeMember?.displayName?.[0] ?? 'M').toUpperCase()

  return (
    <header className="flex h-16 flex-none items-center justify-between gap-3 border-b border-line bg-bar px-4 lg:hidden">
      {isTab ? (
        <>
          <Logo className="h-7 w-auto" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <MemberSwitcher />
            <button
              onClick={() => navigate('/profil')}
              aria-label="Profil"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-acc text-[13px] font-extrabold text-acc-ink"
            >
              {initials}
            </button>
          </div>
        </>
      ) : (
        <button onClick={() => navigate(-1)} className="flex items-center gap-2.5 text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surf">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </span>
          <span className="text-[17px] font-extrabold tracking-tight">{title}</span>
        </button>
      )}
    </header>
  )
}

// ===== Bottom-nav (MOBIL) =====
function BottomNav() {
  const total = useSoldTotal()
  return (
    <nav className="flex flex-none items-stretch justify-around border-t border-line bg-bar pb-[env(safe-area-inset-bottom)] lg:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className="relative flex flex-1 flex-col items-center gap-1 py-2">
          {({ isActive }) => (
            <>
              <span className={cn('flex h-8 w-14 items-center justify-center rounded-full', isActive ? 'bg-acc text-acc-ink' : 'text-sub')}>
                <NavIcon name={item.icon} />
              </span>
              <span className={cn('text-[11px] font-bold', isActive ? 'text-ink' : 'text-sub')}>{item.labelScurt}</span>
              {item.to === '/plati' && total > 0 && (
                <span className="absolute right-4 top-1 h-2 w-2 rounded-full bg-danger" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppLayout() {
  const { signOut } = useAuth()

  return (
    <ActiveMemberProvider>
      <div className="flex h-full bg-canvas">
        {/* Sidebar fix (desktop ≥1024px) */}
        <aside className="hidden w-64 flex-none flex-col border-r border-side-line bg-side px-4 py-5 lg:flex">
          <SidebarContent />
        </aside>

        {/* Zona principală */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <MobileHeader />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-7 sm:py-7">
            <Outlet />
          </main>
          {/* Footer legal — doar pe desktop (pe mobil: logout în Profil) */}
          <footer className="hidden border-t border-line bg-bar px-7 py-4 text-xs text-sub lg:block">
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
          {/* Bottom-nav — doar pe mobil <1024px */}
          <BottomNav />
        </div>
        {/* Feedback despre portal — disponibil pe toate ecranele */}
        <FeedbackFab />
      </div>
    </ActiveMemberProvider>
  )
}
