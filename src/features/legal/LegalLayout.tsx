import { Link, NavLink, Outlet } from 'react-router-dom'
import { PaymentBadges } from '@/components/PaymentBadges'
import { FIRMA } from './firma'

const links = [
  { to: '/servicii', label: 'Servicii și prețuri' },
  { to: '/termeni', label: 'Termeni și condiții' },
  { to: '/confidentialitate', label: 'Confidențialitate' },
  { to: '/retur', label: 'Retur și rambursare' },
  { to: '/livrare', label: 'Livrare' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/contact', label: 'Contact' },
]

// Shell PUBLIC (fără autentificare) pentru paginile legale — necesare la validarea
// punctului de lucru Netopia. Accesibile și de un vizitator/recenzent fără cont.
export function LegalLayout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-quasar-gray-light bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/login" className="flex items-center gap-2">
            <span className="rounded bg-quasar-yellow px-2 py-0.5 text-base font-black text-quasar-black">
              QUASAR
            </span>
            <span className="text-sm font-semibold">Contul meu</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-quasar-black' : 'text-quasar-gray hover:text-quasar-black'
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="rounded-md bg-quasar-yellow px-3 py-1 font-bold text-quasar-black hover:brightness-95"
            >
              Intră în cont
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-quasar-gray-light bg-white">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-6 text-xs text-quasar-gray">
          <p className="font-semibold text-quasar-black">{FIRMA.denumire}</p>
          <p>
            CUI {FIRMA.cui} · {FIRMA.regCom} · {FIRMA.adresa}
          </p>
          <p>
            <a className="underline" href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a>
            {' · '}
            <a className="underline" href={FIRMA.website} target="_blank" rel="noreferrer">
              quasardance.ro
            </a>
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
            <a className="underline" href="https://anpc.ro/" target="_blank" rel="noreferrer">ANPC</a>
            <a
              className="underline"
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noreferrer"
            >
              Soluționarea online a litigiilor (SOL)
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span>Plăți procesate securizat prin:</span>
            <PaymentBadges />
          </div>
        </div>
      </footer>
    </div>
  )
}
