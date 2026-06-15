export function Spinner({ label = 'Se încarcă…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-quasar-gray">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-quasar-gray-light border-t-quasar-black" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
