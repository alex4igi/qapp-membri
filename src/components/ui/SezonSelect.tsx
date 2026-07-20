type Optiune = { key: string; nume: string }

// Selector de sezon — folosit în tabul Cursuri și în Prezențe. Opțiunile vin din
// RPC-uri diferite (înrolări vs. prezențe), de aceea primește lista gata făcută.
export function SezonSelect({
  id,
  value,
  optiuni,
  onChange,
}: {
  id: string
  value: string | null
  optiuni: Optiune[]
  onChange: (key: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor={id} className="text-sm font-semibold text-sub">
        Sezon
      </label>
      <div className="relative">
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none rounded-full border border-line bg-surf py-2 pl-3.5 pr-8 text-[13px] font-bold text-ink"
        >
          {optiuni.map((o) => (
            <option key={o.key} value={o.key}>
              {o.nume}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  )
}
