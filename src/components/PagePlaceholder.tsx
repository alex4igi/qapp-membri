// Placeholder pentru pagini de schelet. Se înlocuiește cu UI-ul real per feature.
export function PagePlaceholder({
  title,
  descriere,
  todo,
}: {
  title: string
  descriere: string
  todo: string[]
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-quasar-gray">{descriere}</p>
      </div>
      <div className="rounded-lg border border-dashed border-quasar-gray-light bg-quasar-gray-light/40 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-quasar-gray">
          De implementat (MVP)
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-quasar-black">
          {todo.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
