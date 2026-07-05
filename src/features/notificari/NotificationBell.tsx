import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAnunturiClient } from './api'

export function NotificationBell() {
  // Poll la 2 min: anunțurile noi apar fără reîncărcarea paginii (portalul stă
  // deschis pe telefon; fără realtime, refetchInterval e suficient).
  const { data } = useQuery({
    queryKey: ['anunturi'],
    queryFn: getAnunturiClient,
    refetchInterval: 120_000,
  })
  const unread = (data ?? []).filter((a) => !a.readAt).length

  return (
    <Link
      to="/notificari"
      aria-label={`Notificări${unread ? ` (${unread} necitite)` : ''}`}
      className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-line bg-surf text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
