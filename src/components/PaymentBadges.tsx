// Pachetul e CommonJS; importul named evită problema de interop a default-import-ului în Vite.
import { NTPIdentity as NTPLogo } from 'ntp-logo-react'
import { cn } from '@/lib/cn'

// Cerință obligatorie Netopia: sigla oficială NETOPIA Payments în footer, prin pachetul
// oficial `ntp-logo-react` (din media kit → platformă React). Sigla conține deja Visa +
// Mastercard, deci nu mai afișăm badge-uri separate.
//   color  = culoarea secțiunii unde stă logo-ul (footer alb) -> pachetul alege varianta neagră
//   secret = punctul de vânzare Quasar
// Boxul fixat (h-5 w-28) păstrează raportul siglei orizontale (~5.6:1), fără distorsiune.
// Sigla se folosește NEMODIFICATĂ — pe fundal închis se pune sub ea o plăcuță albă
// (vezi `onDark`), nu se schimbă culorile siglei.
export function PaymentBadges({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center',
        onDark && 'rounded-md bg-white px-2.5 py-1.5',
        className,
      )}
    >
      <span className="block h-5 w-28">
        <NTPLogo color="#ffffff" version="orizontal" secret="166013" />
      </span>
    </span>
  )
}
