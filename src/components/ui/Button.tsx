import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  primary: 'bg-acc text-acc-ink hover:brightness-95 disabled:opacity-60',
  secondary: 'border border-line bg-surf text-ink hover:bg-surf2 disabled:opacity-60',
  danger: 'bg-danger text-white hover:brightness-95 disabled:opacity-60',
  ghost: 'text-sub hover:bg-surf2 hover:text-ink',
}

export function Button({ variant = 'primary', className, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-extrabold transition-colors disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
      {...rest}
    />
  )
}
