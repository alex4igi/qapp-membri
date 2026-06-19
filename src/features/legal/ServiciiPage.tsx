import { Link } from 'react-router-dom'
import { PaymentBadges } from '@/components/PaymentBadges'
import { FIRMA, ULTIMA_ACTUALIZARE } from './firma'
import { TarifeList } from './TarifeList'
import { ProduseList } from './ProduseList'
import { BileteList } from './BileteList'
import { H1, H2, P, UL, Updated } from './ui'

// Pagină PUBLICĂ (fără cont) — servicii, prețuri în RON, mod de plată online,
// date firmă + logo-uri de plată. Punctul de intrare pentru un vizitator/recenzent
// Netopia: site-ul NU trebuie să fie doar-cu-login.
export function ServiciiPage() {
  return (
    <article>
      <H1>Servicii și prețuri</H1>
      <Updated date={ULTIMA_ACTUALIZARE} />

      <P>
        {FIRMA.denumire} (Quasar Dance) este o școală de dans din Iași care oferă cursuri și ședințe
        de dans, acrobatică și activități conexe pentru copii, adolescenți și adulți. Portalul
        „Contul meu" permite membrilor să vadă situația plăților, să achite online abonamentele și
        ședințele datorate și să rezerve locuri la ședințele facultative (OPEN class).
      </P>

      <H2>Cursuri oferite</H2>
      <UL>
        <li>Street Dance — grupe Tiny (4–6), Junior (7–10), Varsity (11–14), Teens (15–18), Students (19–24), Adults (25+)</li>
        <li>Acrobatică — aceleași grupe de vârstă</li>
        <li>K-pop Covers — aceleași grupe de vârstă</li>
        <li>Quasar for Kids — ateliere creative prin joc (copii mici)</li>
      </UL>

      <H2>Tarife</H2>
      <TarifeList />
      <P>
        Toate prețurile sunt exprimate în <strong>RON</strong>. Se aplică o reducere de 10% la al
        doilea abonament (două cursuri diferite sau frați); reducerile nu se cumulează. Abonamentul
        lunar se achită până pe data de 15 a lunii.
      </P>

      <ProduseList />

      <BileteList />

      <H2>Cum funcționează plata online</H2>
      <P>
        Plățile cu cardul sunt procesate securizat de NETOPIA Payments (Visa și Mastercard), în RON.
        Quasar Dance nu stochează datele cardului. Plătești fie restanța la abonamente/ședințe
        (calculată automat din înrolările tale), fie prețul unei ședințe facultative pe care o
        rezervi. Confirmarea apare în portal după validarea tranzacției de către bancă. Condițiile de
        anulare și rambursare sunt în pagina{' '}
        <Link className="underline" to="/retur">Retur și rambursare</Link>.
      </P>
      <PaymentBadges className="my-3" />

      <H2>Date firmă</H2>
      <P>
        {FIRMA.denumire} · CUI {FIRMA.cui} · {FIRMA.regCom}
        <br />
        Sediu: {FIRMA.adresa}
        <br />
        Email: <a className="underline" href={`mailto:${FIRMA.email}`}>{FIRMA.email}</a> · Web:{' '}
        <a className="underline" href={FIRMA.website} target="_blank" rel="noreferrer">quasardance.ro</a>
      </P>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-quasar-gray-light bg-quasar-yellow/10 px-4 py-4">
        <span className="text-sm font-medium">Ai deja un cont de membru?</span>
        <Link
          to="/login"
          className="rounded-md bg-quasar-yellow px-4 py-2 text-sm font-bold text-quasar-black hover:brightness-95"
        >
          Intră în cont
        </Link>
      </div>
    </article>
  )
}
