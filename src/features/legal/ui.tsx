import type { ReactNode } from 'react'

// Tipografie comună pentru paginile legale (fără plugin de typography).
export function H1({ children }: { children: ReactNode }) {
  return <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{children}</h1>
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-display mt-8 mb-2 text-lg font-bold tracking-tight">{children}</h2>
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-[15px] leading-relaxed text-ink/80">{children}</p>
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mb-3 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-ink/80">{children}</ul>
}

export function Updated({ date }: { date: string }) {
  return (
    <div className="mt-2 mb-6">
      <span className="inline-block rounded-full border border-line bg-surf px-3 py-1 text-xs text-sub">
        Ultima actualizare: {date}
      </span>
    </div>
  )
}
