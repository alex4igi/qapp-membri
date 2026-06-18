// Aliasuri convenabile peste tipurile generate de Supabase (database.ts).
// database.ts se regenerează cu `npm run gen:types` — nu se editează manual.
//
// Cât timp database.ts e placeholder, aceste aliasuri sunt `Record<string, unknown>`.
// După `gen:types` devin tipizate complet. Adaugă aici doar tabelele de care are
// nevoie portalul de membru (subset din qapp v2).

import type { Database } from './database'

type Public = Database['public']

export type Tables<T extends keyof Public['Tables']> = Public['Tables'][T]['Row']
export type InsertDto<T extends keyof Public['Tables']> = Public['Tables'][T]['Insert']
export type UpdateDto<T extends keyof Public['Tables']> = Public['Tables'][T]['Update']
export type Views<T extends keyof Public['Views']> = Public['Views'][T]['Row']
export type Enums<T extends keyof Public['Enums']> = Public['Enums'][T]

// Row-uri tabele (subset MVP membru)
export type Client = Tables<'clienti'>
export type Familie = Tables<'familii'>
export type Curs = Tables<'cursuri'>
export type Enrollment = Tables<'enrollments'>
export type Prezenta = Tables<'prezente'>
export type Incasare = Tables<'incasari'>
export type OpenSesiune = Tables<'open_sesiuni'>
export type OpenRezervare = Tables<'open_rezervari'>
export type TarifPublic = Tables<'tarife_publice'>
export type ProdusPublic = Tables<'produse_publice'>

// Enums folosite în UI
export type StatusPrezenta = Enums<'status_prezenta'>
export type StatusRezervare = Enums<'status_rezervare'>
export type MetodaPlata = Enums<'metoda_plata'>
