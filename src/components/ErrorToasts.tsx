import { useSyncExternalStore } from 'react'
import { dismissErrorToast, getErrorToasts, subscribeErrorToasts } from '@/lib/errorToasts'

export function ErrorToasts() {
  const toasts = useSyncExternalStore(subscribeErrorToasts, getErrorToasts)
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-danger/40 bg-surf p-4 text-sm text-ink shadow-card"
        >
          <p className="font-semibold text-danger">{t.titlu}</p>
          <p className="mt-1 text-sub">{t.message}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-acc px-3 py-1.5 text-xs font-extrabold text-acc-ink"
            >
              Reîncarcă pagina
            </button>
            <button
              type="button"
              onClick={() => dismissErrorToast(t.id)}
              className="rounded-xl px-3 py-1.5 text-xs font-extrabold text-sub hover:bg-surf2"
            >
              Închide
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
