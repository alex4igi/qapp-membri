// Logo-ul are două variante, pentru că în cea simplă cuvântul „DANCE" e ALB:
//   • logo-q-a-l.png        — pe fundal închis
//   • logo-q-a-l-contur.png — pe fundal deschis (literele au contur, „DANCE" se citește)
// `on='auto'` (implicit) comută după temă, prin CSS pe [data-theme] — fără flash la boot
// și fără dependență de ThemeProvider. Pe suprafețele cu culoare fixă (cardul alb de login,
// bara neagră din paginile legale) dai explicit `on='light'` / `on='dark'`.
type Props = {
  className?: string
  on?: 'auto' | 'light' | 'dark'
}

const SRC = {
  light: '/logo-q-a-l-contur.png',
  dark: '/logo-q-a-l.png',
} as const

export function Logo({ className = 'h-6 w-auto', on = 'auto' }: Props) {
  if (on !== 'auto') {
    return (
      <img
        src={SRC[on]}
        alt="Quasar Dance"
        className={`${className} select-none`}
        draggable={false}
      />
    )
  }
  return (
    <span role="img" aria-label="Quasar Dance" className="inline-flex">
      <img src={SRC.light} alt="" className={`logo-on-light ${className} select-none`} draggable={false} />
      <img src={SRC.dark} alt="" className={`logo-on-dark ${className} select-none`} draggable={false} />
    </span>
  )
}
