import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAnunturiClient } from './api'

export function NotificationBell() {
  const { data } = useQuery({ queryKey: ['anunturi'], queryFn: getAnunturiClient })
  const unread = (data ?? []).filter((a) => !a.readAt).length

  return (
    <Link
      to="/notificari"
      aria-label={`Notificări${unread ? ` (${unread} necitite)` : ''}`}
      className="relative text-quasar-gray-light hover:text-white"
    >
      <span className="text-lg">🔔</span>
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-quasar-yellow px-1 text-[10px] font-bold text-quasar-black">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
