import { cn } from '@/lib/cn'

// Logo-urile metodelor de plată acceptate — cerință obligatorie Netopia/bancă
// (Visa + Mastercard + NETOPIA Payments afișate ca IMAGINI, nu doar text).
// Asset-urile locale trăiesc în public/payments/ (fără hotlink extern).
const BADGES = [
  { src: '/payments/visa.svg', alt: 'Visa' },
  { src: '/payments/mastercard.svg', alt: 'Mastercard' },
  { src: '/payments/netopia.svg', alt: 'NETOPIA Payments' },
] as const

export function PaymentBadges({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-2', className)}>
      {BADGES.map((b) => (
        <img key={b.alt} src={b.src} alt={b.alt} className="h-6 w-auto" loading="lazy" />
      ))}
    </span>
  )
}
