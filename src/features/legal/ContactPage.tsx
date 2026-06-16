import { FIRMA, ULTIMA_ACTUALIZARE } from './firma'
import { H1, H2, P, Updated } from './ui'

export function ContactPage() {
  return (
    <article>
      <H1>Contact și date firmă</H1>
      <Updated date={ULTIMA_ACTUALIZARE} />

      <H2>Date de identificare</H2>
      <dl className="space-y-1 text-sm">
        <Row k="Denumire" v={FIRMA.denumire} />
        <Row k="CUI" v={FIRMA.cui} />
        <Row k="Reg. com." v={FIRMA.regCom} />
        <Row k="Sediu social" v={FIRMA.adresa} />
        <Row k="IBAN" v={`${FIRMA.iban} (${FIRMA.banca})`} />
        <Row k="Administrator" v={FIRMA.administrator} />
      </dl>

      <H2>Cum ne contactezi</H2>
      <P>
        Email:{' '}
        <a className="underline" href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a>
        <br />
        Website:{' '}
        <a className="underline" href={FIRMA.website} target="_blank" rel="noreferrer">
          quasardance.ro
        </a>
      </P>

      <H2>Locații și telefoane</H2>
      <ul className="space-y-1 text-sm text-quasar-black/80">
        {FIRMA.telefoane.map((t) => (
          <li key={t.tel}>
            {t.loc}: <a className="underline" href={`tel:${t.tel.replace(/\s/g, '')}`}>{t.tel}</a>
          </li>
        ))}
      </ul>

      <H2>Protecția consumatorului</H2>
      <P>
        <a className="underline" href="https://anpc.ro/" target="_blank" rel="noreferrer">ANPC</a>
        {' · '}
        <a className="underline" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
          Soluționarea Online a Litigiilor (SOL)
        </a>
      </P>
    </article>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="w-32 shrink-0 text-quasar-gray">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  )
}
