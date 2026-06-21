export function Logo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <img
      src="/logo-q-a-l.png"
      alt="Quasar Dance"
      className={`${className} select-none`}
      draggable={false}
    />
  )
}
