import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

// Suprafață standard din designul portalului: surf + border line + shadow + radius mare.
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-line bg-surf p-5 shadow-card', className)}
      {...rest}
    />
  )
}
