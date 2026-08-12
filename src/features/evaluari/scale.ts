// Oglinda lui `src/features/evaluari/scale.ts` din qapp v2: DB-ul ține TREPTE (1–10),
// UI-ul arată STELE (0,5–5). O jumătate de stea = o treaptă.
// Portalul doar citește, deci nu are nevoie de `toTrepte`.

export const TREPTE_PE_STEA = 2
export const STELE_MAX = 5

export function toStele(trepte: number | null | undefined): number | null {
  return trepte == null ? null : trepte / TREPTE_PE_STEA
}

export function formatStele(trepte: number | null | undefined): string {
  const s = toStele(trepte)
  return s == null ? '—' : s.toFixed(1).replace('.', ',')
}
