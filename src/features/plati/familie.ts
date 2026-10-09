import { formatLuna, formatZi } from '@/lib/format'
import type { DatorieRow, PlataRow, SelectieMembru, TipCurs } from './api/payments'

// Situația plăților pe toată familia, pe rânduri: rate (înrolări) și datorii one-off.
// Regulile (Alex, 09.10.2026 — docs/reguli-domeniu.md §4):
//  - restant = termen strict înainte de azi; ziua termenului e „de achitat azi”;
//  - coșul pornește cu restanțele + rândurile cu primul termen al familiei, doar dacă acel
//    termen e până la sfârșitul lunii curente;
//  - FIFO pe luna înrolării, pe fiecare membru: bifarea unei rate include ratele mai vechi
//    ale aceluiași membru („inclus obligatoriu”).
// Sumele de plată le dă serverul (build_fifo_plan_familie); aici doar le grupăm pentru afișare.

export type Stare = 'achitat' | 'acoperit' | 'restant' | 'azi' | 'viitor' | 'curs'

export type Rand = {
  key: string
  kind: 'rata' | 'datorie'
  enrollmentId: string | null
  datorieId: string | null
  clientId: string
  membru: string
  titlu: string
  tipCurs: TipCurs | null
  tipPlata: string | null
  categorie: string | null
  // Rate: începutul lunii / ziua ședinței. Datorii: termenul (ordinea în listă).
  dataIncepere: string | null
  scadenta: string | null
  total: number
  platit: number
  rest: number
  sezonId: string | null
  sezonNume: string | null
  codVoucher: string | null
}

export function randuriDinRate(rows: PlataRow[], clientId: string, membru: string): Rand[] {
  return rows.map((r) => ({
    key: r.enrollmentId,
    kind: 'rata',
    enrollmentId: r.enrollmentId,
    datorieId: null,
    clientId,
    membru,
    titlu: r.cursNume ?? 'Curs',
    tipCurs: r.tipCurs,
    tipPlata: r.tipPlata,
    categorie: null,
    dataIncepere: r.dataIncepere,
    scadenta: r.scadenta,
    total: r.total,
    platit: r.platit,
    rest: r.rest,
    sezonId: r.sezonId,
    sezonNume: r.sezonNume,
    codVoucher: r.codVoucher,
  }))
}

export function randuriDinDatorii(rows: DatorieRow[], clientId: string, membru: string): Rand[] {
  return rows.map((d) => ({
    key: `d:${d.datorieId}`,
    kind: 'datorie',
    enrollmentId: null,
    datorieId: d.datorieId,
    clientId,
    membru,
    titlu: d.descriere || d.categorie,
    tipCurs: null,
    tipPlata: null,
    categorie: d.categorie,
    dataIncepere: d.termen,
    scadenta: d.termen,
    total: d.sumaDatorata,
    platit: d.platit,
    rest: d.rest,
    sezonId: null,
    sezonNume: null,
    codVoucher: null,
  }))
}

// Cheia din plata în curs: înrolarea sau datoria (fără prefix, cum vine din DB).
const idDb = (r: Rand) => r.enrollmentId ?? r.datorieId ?? ''

export function stare(r: Rand, azi: string, inCurs: Set<string>): Stare {
  if (r.rest > 0 && inCurs.has(idDb(r))) return 'curs'
  if (r.rest <= 0) return r.total <= 0 ? 'acoperit' : 'achitat'
  if (!r.scadenta) return 'viitor'
  if (r.scadenta < azi) return 'restant'
  if (r.scadenta === azi) return 'azi'
  return 'viitor'
}

export const deAchitat = (s: Stare) => s === 'restant' || s === 'azi' || s === 'viitor'

export function sfarsitLuna(azi: string): string {
  const [y, m] = azi.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

export type Context = { azi: string; inCurs: Set<string>; primulTermen: string | null; termenInCos: boolean }

// Primul termen al familiei, de azi încolo (inclusiv rândurile cu plată în curs: plata lor e
// deja pornită, deci termenul următor nu sare peste ele).
export function context(rows: Rand[], azi: string, inCurs: Set<string>): Context {
  let primul: string | null = null
  for (const r of rows) {
    const s = stare(r, azi, inCurs)
    if (!r.scadenta || r.scadenta < azi) continue
    if (s === 'azi' || s === 'viitor' || s === 'curs') {
      if (primul == null || r.scadenta < primul) primul = r.scadenta
    }
  }
  return { azi, inCurs, primulTermen: primul, termenInCos: primul != null && primul <= sfarsitLuna(azi) }
}

// Rândul face parte din „Următoarea plată” (termenul care intră implicit în coș).
export const laTermen = (r: Rand, c: Context) => c.termenInCos && r.scadenta === c.primulTermen

const selectabil = (r: Rand, c: Context) => deAchitat(stare(r, c.azi, c.inCurs)) && !!r.dataIncepere

export function selectieImplicita(rows: Rand[], c: Context): Set<string> {
  const out = new Set<string>()
  for (const r of rows) {
    if (!selectabil(r, c)) continue
    const s = stare(r, c.azi, c.inCurs)
    if (s === 'restant' || s === 'azi' || laTermen(r, c)) out.add(r.key)
  }
  return out
}

export type Categorie = 'restant' | 'azi' | 'termen' | 'inclus' | 'avans'

export type ArticolCos = { r: Rand; cat: Categorie; cauza: Rand | null }

export type Cos = {
  membri: { clientId: string; membru: string; articole: ArticolCos[]; total: number }[]
  total: number
  selectie: SelectieMembru[]
  // Rânduri cu plată în curs care ar intra obligatoriu (serverul ar refuza plata).
  blocate: Rand[]
}

const byData = (a: Rand, b: Rand) =>
  (a.dataIncepere ?? '') < (b.dataIncepere ?? '') ? -1
    : (a.dataIncepere ?? '') > (b.dataIncepere ?? '') ? 1
      : a.key < b.key ? -1 : 1

export function cos(rows: Rand[], sel: Set<string>, c: Context, ordineMembri: string[]): Cos {
  const membri: Cos['membri'] = []
  const selectie: SelectieMembru[] = []
  const blocate: Rand[] = []
  let total = 0
  for (const clientId of ordineMembri) {
    const ale = rows.filter((r) => r.clientId === clientId)
    if (!ale.length) continue
    const rate = ale.filter((r) => r.kind === 'rata' && r.rest > 0 && r.dataIncepere).sort(byData)
    const explicite = rate.filter((r) => sel.has(r.key) && selectabil(r, c))
    const articole: ArticolCos[] = []
    let panaLa: Rand | null = null
    if (explicite.length) {
      panaLa = explicite[explicite.length - 1]
      for (const r of rate.filter((x) => x.dataIncepere! <= panaLa!.dataIncepere!)) {
        const s = stare(r, c.azi, c.inCurs)
        if (s === 'curs') { blocate.push(r); continue }
        if (!deAchitat(s)) continue
        const cat: Categorie = !sel.has(r.key)
          ? 'inclus'
          : s === 'restant' ? 'restant' : s === 'azi' ? 'azi' : laTermen(r, c) ? 'termen' : 'avans'
        articole.push({ r, cat, cauza: cat === 'inclus' ? panaLa : null })
      }
    }
    const datorii = ale.filter((r) => r.kind === 'datorie' && sel.has(r.key) && selectabil(r, c))
    for (const r of datorii) {
      const s = stare(r, c.azi, c.inCurs)
      articole.push({ r, cat: s === 'restant' ? 'restant' : s === 'azi' ? 'azi' : laTermen(r, c) ? 'termen' : 'avans', cauza: null })
    }
    if (!articole.length) continue
    const t = articole.reduce((a, x) => a + x.r.rest, 0)
    membri.push({ clientId, membru: ale[0].membru, articole, total: t })
    total += t
    selectie.push({
      clientId,
      includeInrolari: !!panaLa,
      panaLa: panaLa?.enrollmentId ?? undefined,
      datorii: datorii.map((r) => r.datorieId!),
    })
  }
  return { membri, total, selectie, blocate }
}

// Rândurile incluse obligatoriu (neexplicite), cu cauza — ca lista să le poată marca.
export function incluseObligatoriu(k: Cos): Map<string, ArticolCos> {
  const m = new Map<string, ArticolCos>()
  for (const x of k.membri) for (const a of x.articole) if (a.cat === 'inclus') m.set(a.r.key, a)
  return m
}

// Ce s-a cumpărat pe rând: luna abonamentului, ziua ședinței, tot sezonul sau datoria.
export function perioada(r: Rand, azi: string): string {
  if (r.kind === 'datorie') return r.categorie ?? 'Plată'
  if (!r.dataIncepere) return '—'
  if (r.tipPlata === 'Per sedinta') return `ședința din ${formatZi(r.dataIncepere, azi)}`
  if (r.tipPlata === 'Per an') return 'tot sezonul'
  const d = Number(r.dataIncepere.slice(8, 10))
  return `${formatLuna(r.dataIncepere)}${d !== 1 ? ` (de la ${d})` : ''}`
}
