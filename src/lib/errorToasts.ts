// Plasa globală: o încărcare sau o salvare eșuată care nu-și arată singură eroarea apare
// aici, ca părintele să nu creadă că „0 lei" sau o listă goală sunt datele lui reale.

export type ErrorToast = { id: number; titlu: string; message: string }

declare module '@tanstack/react-query' {
  interface Register {
    // true = componenta afișează singură eroarea; plasa o sare.
    queryMeta: { erroareAfisata?: boolean }
    mutationMeta: { erroareAfisata?: boolean }
  }
}

let toasts: ErrorToast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function subscribeErrorToasts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getErrorToasts(): ErrorToast[] {
  return toasts
}

export function dismissErrorToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function showErrorToast(titlu: string, message: string) {
  // Mai multe încărcări pică deodată când cade internetul: un singur mesaj.
  if (toasts.some((t) => t.titlu === titlu && t.message === message)) return
  toasts = [...toasts, { id: nextId++, titlu, message }].slice(-2)
  emit()
}
