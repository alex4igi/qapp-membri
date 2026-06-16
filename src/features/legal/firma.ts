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

// Tarife afișate public (sincron cu recepția qapp v2 / CLAUDE.md).
export const TARIFE = [
  { serviciu: 'Ședință individuală 60 min', pret: '50 RON' },
  { serviciu: 'Ședință individuală 90 min', pret: '60 RON' },
  { serviciu: 'Abonament 1×/săpt. (60 min) — lunar', pret: '170 RON' },
  { serviciu: 'Abonament 1×/săpt. (90 min) — lunar', pret: '200 RON' },
  { serviciu: 'Abonament 2×/săpt. (60 min) — lunar', pret: '260 RON' },
  { serviciu: 'Full copii — 70 ședințe (sept.–iun., 2×/săpt.)', pret: 'plată integrală (−10%) sau în tranșe' },
  { serviciu: 'Part-time copii — 35 ședințe (sept.–iun., 1×/săpt.)', pret: 'plată integrală (−10%) sau în tranșe' },
] as const

export const ULTIMA_ACTUALIZARE = '16 iunie 2026'
