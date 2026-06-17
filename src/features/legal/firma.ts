// Date oficiale ale entității juridice pe care e legat punctul de lucru Netopia.
// Sursă unică pentru toate paginile legale publice (cerute la verificarea Netopia/bancă).
export const FIRMA = {
  denumire: 'QUASAR DANCE STUDIO S.R.L.',
  cui: 'RO 49361270',
  regCom: 'J22/15/2024',
  adresa: 'Strada Vasile Lupu, Nr. 96, Bl. G2, Et. 7, Ap. 20, cod 700360, Iași, România',
  iban: 'RO85 INGB 0000 9999 1498 9082',
  banca: 'ING Bank',
  administrator: 'Alexandru Ignat',
  email: 'alex@quasardance.ro',
  website: 'https://www.quasardance.ro',
  telefoane: [
    { loc: 'Ștefan cel Mare (Galeriile Comerciale)', tel: '0730 534 172' },
    { loc: 'Nicolina (Str. Izvor 14)', tel: '0770 227 580' },
    { loc: 'Quasar for Kids (Str. Clopotari 24)', tel: '0745 371 200' },
  ],
} as const

// Tarifele publice NU mai sunt hard-codate aici — se editează în qapp (Setări →
// Tarife publice) și se citesc live din tabelul `tarife_publice` (vezi TarifeList).

export const ULTIMA_ACTUALIZARE = '17 iunie 2026'
