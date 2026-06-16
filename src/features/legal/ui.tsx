import type { ReactNode } from 'react'

// Tipografie comună pentru paginile legale (fără plugin de typography).
export function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-2xl font-bold">{children}</h1>
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-6 mb-2 text-base font-semibold">{children}</h2>
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm leading-relaxed text-quasar-black/80">{children}</p>
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mb-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-quasar-black/80">{children}</ul>
}

export function Updated({ date }: { date: string }) {
  return <p className="mt-1 mb-4 text-xs text-quasar-gray">Ultima actualizare: {date}</p>
}
