import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { PaymentBadges } from '@/components/PaymentBadges'
import { Logo } from '@/components/Logo'
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
  const { pathname } = useLocation()
  const navRef = useRef<HTMLDivElement>(null)

  // Pe telefon pilulele depășesc ecranul — aducem în vizor documentul curent.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    })
  }, [pathname])

  return (
    <div data-theme="light" className="flex min-h-full flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-40">
        {/* Bara de brand — aceeași identitate ca pe quasardance.ro */}
        <div className="bg-quasar-black text-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:h-20">
            <a href={FIRMA.website} aria-label="Quasar Dance">
              <Logo className="h-9 w-auto sm:h-11" />
            </a>

            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href={FIRMA.website}
                className="hidden px-3 py-2 text-sm text-white/70 transition hover:text-quasar-yellow sm:inline-block"
              >
                Înapoi la site
              </a>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-quasar-yellow px-4 py-2.5 text-sm font-bold text-quasar-black shadow-[0_0_0_3px_rgba(255,214,0,0.18)] transition hover:brightness-95 sm:px-5"
              >
                Intră în cont
                <span aria-hidden className="text-base leading-none">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigația între documente — pilule, ca să se vadă că sunt de apăsat */}
        <nav aria-label="Documente legale" className="border-b border-line bg-bar/95 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4">
            <div
              ref={navRef}
              className="mx-auto flex w-fit max-w-full gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    [
                      'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
                      isActive
                        ? 'border-quasar-black bg-quasar-black text-white'
                        : 'border-line bg-surf text-sub hover:border-quasar-black/25 hover:text-ink',
                    ].join(' ')
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">
        <Outlet />
      </main>

      {/* Celelalte documente, la finalul lecturii — fără derulare înapoi sus */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          <p className="mb-3 text-xs font-semibold tracking-wide text-sub uppercase">Vezi și</p>
          <div className="flex flex-wrap gap-2">
            {links
              .filter((l) => l.to !== pathname)
              .map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-full border border-line bg-surf px-3.5 py-1.5 text-sm font-semibold text-ink transition hover:border-quasar-black/25 hover:bg-surf2"
                >
                  {l.label}
                </Link>
              ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-quasar-black text-white/70">
        <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Logo className="h-10 w-auto" />
            <Link
              to="/login"
              className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:border-quasar-yellow hover:text-quasar-yellow"
            >
              Intră în cont
            </Link>
          </div>
          <p className="font-semibold text-white">{FIRMA.denumire}</p>
          <p>
            CUI {FIRMA.cui} · {FIRMA.regCom} · {FIRMA.adresa}
          </p>
          <p>
            <a className="underline hover:text-quasar-yellow" href={`mailto:${FIRMA.email}`}>
              {FIRMA.email}
            </a>
            {' · '}
            <a
              className="underline hover:text-quasar-yellow"
              href={FIRMA.website}
              target="_blank"
              rel="noreferrer"
            >
              quasardance.ro
            </a>
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
            <a
              className="underline hover:text-quasar-yellow"
              href="https://anpc.ro/"
              target="_blank"
              rel="noreferrer"
            >
              ANPC
            </a>
            <a
              className="underline hover:text-quasar-yellow"
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noreferrer"
            >
              Soluționarea online a litigiilor (SOL)
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span>Plăți procesate securizat prin:</span>
            <PaymentBadges onDark />
          </div>
        </div>
      </footer>
    </div>
  )
}
