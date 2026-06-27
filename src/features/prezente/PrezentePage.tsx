import { useQuery } from '@tanstack/react-query'
import { useActiveMember } from '@/hooks/useActiveMember'
import { Spinner } from '@/components/ui'
import { formatData } from '@/lib/format'
import { cn } from '@/lib/cn'
import { getPrezenteClient } from './api'

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

export function PrezentePage() {
  const { activeMember, loading } = useActiveMember()
  const { data, isLoading, error } = useQuery({
    queryKey: ['prezente', activeMember?.clientId],
    queryFn: () => getPrezenteClient(activeMember!.clientId),
    enabled: !!activeMember,
  })

  if (loading) return <Spinner />
  if (!activeMember) return <p className="text-sm text-sub">Niciun membru de afișat.</p>

  const prezentCount = data?.filter((p) => p.status === 'Prezent').length ?? 0
  const absentCount = data?.filter((p) => p.status === 'Absent').length ?? 0
  const totalRated = prezentCount + absentCount
  const rate = totalRated > 0 ? Math.round((prezentCount / totalRated) * 100) + '%' : '—'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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

      {isLoading && <Spinner />}
      {error && <p className="text-sm text-danger">Eroare la încărcare.</p>}
      {data && data.length === 0 && <p className="text-sm text-sub">Nicio prezență înregistrată.</p>}
      {data && data.length > 0 && (
        <div className="rounded-2xl border border-line bg-surf p-2 shadow-card">
          <ul className="space-y-1">
            {data.map((p, i) => (
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
