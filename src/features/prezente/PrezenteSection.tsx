import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { cn } from '@/lib/cn'
import { getPrezenteInterval } from './api'
import { getSezonCurentClient } from '@/features/calendar/api'

const STATUS_STYLE: Record<string, string> = {
  Prezent: 'text-ok',
  Absent: 'text-danger',
  Motivat: 'text-amber-700',
}

const DOT_STYLE: Record<string, string> = {
  Prezent: 'bg-ok',
  Absent: 'bg-danger',
  Motivat: 'bg-amber-500',
}

export function PrezenteSection() {
  const { activeMember } = useActiveMember()
  const clientId = activeMember?.clientId ?? null

  // Prezențele se calculează DOAR pentru perioada sezonului aflat în desfășurare
  // (interval de date), nu pe tot istoricul. Perioada se afișează explicit.
  const sezon = useQuery({
    queryKey: ['sezon-curent'],
    queryFn: getSezonCurentClient,
  })
  const from = sezon.data?.dataIncepere ?? null
  const to = sezon.data?.dataFinal ?? null

  const prezente = useQuery({
    queryKey: ['prezente', clientId, from, to],
    queryFn: () => getPrezenteInterval(clientId!, from!, to!),
    enabled: !!clientId && !!from && !!to,
  })

  const list = prezente.data ?? []
  const prezentCount = list.filter((p) => p.status === 'Prezent').length
  const absentCount = list.filter((p) => p.status === 'Absent').length
  const totalRated = prezentCount + absentCount
  const rate = totalRated > 0 ? Math.round((prezentCount / totalRated) * 100) + '%' : '—'

  const perioada = sezon.data
    ? `${sezon.data.nume ?? 'Sezon curent'} · ${formatData(sezon.data.dataIncepere)} – ${formatData(sezon.data.dataFinal)}`
    : null

  return (
    <div className="space-y-6">
      {perioada && (
        <p className="text-sm text-sub">
          Prezențe pentru sezonul curent:{' '}
          <span className="font-semibold text-ink">{perioada}</span>
        </p>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line bg-surf p-5 shadow-card">
          <p className="text-sm text-sub">Prezent</p>
          <p className="text-3xl font-extrabold tracking-tight text-ink">{prezentCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surf p-5 shadow-card">
          <p className="text-sm text-sub">Absent</p>
          <p className="text-3xl font-extrabold tracking-tight text-danger">{absentCount}</p>
        </div>
        <div className="rounded-2xl bg-acc p-5 text-acc-ink shadow-card">
          <p className="text-sm opacity-80">Rată prezență</p>
          <p className="text-3xl font-extrabold tracking-tight">{rate}</p>
        </div>
      </div>

      {(sezon.isLoading || prezente.isLoading) && <Spinner />}
      {sezon.data === null && !sezon.isLoading && (
        <p className="text-sm text-sub">Niciun sezon activ momentan.</p>
      )}
      {prezente.data && list.length === 0 && (
        <p className="text-sm text-sub">Nicio prezență înregistrată în sezonul curent.</p>
      )}
      {list.length > 0 && (
        <div className="rounded-2xl border border-line bg-surf p-2 shadow-card">
          <ul className="space-y-1">
            {list.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-surf2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 shrink-0 rounded-full',
                      DOT_STYLE[p.status ?? ''] ?? 'bg-sub',
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-ink">{p.cursNume ?? 'Curs'}</p>
                    <p className="text-xs text-sub">{formatData(p.data)}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    STATUS_STYLE[p.status ?? ''] ?? 'text-sub',
                  )}
                >
                  {p.status ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
