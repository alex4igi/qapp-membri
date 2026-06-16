import { FIRMA, TARIFE, ULTIMA_ACTUALIZARE } from './firma'
import { H1, H2, P, UL, Updated } from './ui'

export function TermeniPage() {
  return (
    <article>
      <H1>Termeni și condiții</H1>
      <Updated date={ULTIMA_ACTUALIZARE} />

      <P>
        Acest portal („Contul meu") este operat de {FIRMA.denumire}, CUI {FIRMA.cui}, {FIRMA.regCom},
        cu sediul în {FIRMA.adresa} („Quasar Dance"). Prin utilizarea portalului și efectuarea de
        plăți online, accepți termenii de mai jos.
      </P>

      <H2>1. Servicii oferite</H2>
      <P>
        Quasar Dance oferă cursuri și ședințe de dans și activități conexe, sub formă de ședințe
        individuale sau abonamente lunare/sezoniere. Înscrierea se face la recepție sau prin
        instructori; portalul permite vizualizarea situației plăților și achitarea online a
        abonamentelor/ședințelor datorate.
      </P>

      <H2>2. Tarife</H2>
      <UL>
        {TARIFE.map((t) => (
          <li key={t.serviciu}>
            {t.serviciu}: <strong>{t.pret}</strong>
          </li>
        ))}
      </UL>
      <P>
        Se aplică o reducere de 10% la al doilea abonament (două cursuri diferite sau frați);
        reducerile nu se cumulează. Abonamentul lunar se achită până pe data de 15 a lunii.
        Tarifele pot fi actualizate; prețul aplicabil este cel afișat la momentul tranzacției.
      </P>

      <H2>3. Plăți online</H2>
      <P>
        Plățile cu cardul sunt procesate securizat de NETOPIA Payments. Quasar Dance nu stochează
        datele cardului tău. Suma datorată este calculată automat din înrolările active și se achită
        integral în ordinea scadenței. Confirmarea plății se reflectă în portal după validarea
        tranzacției de către procesator. Moneda tranzacțiilor este RON.
      </P>

      <H2>4. Obligațiile utilizatorului</H2>
      <UL>
        <li>Să furnizeze date corecte și actuale.</li>
        <li>Să păstreze confidențialitatea datelor de autentificare.</li>
        <li>Să respecte regulamentul de ordine interioară și programul cursurilor.</li>
      </UL>

      <H2>5. Retur și rambursare</H2>
      <P>
        Condițiile de anulare și rambursare sunt detaliate în pagina „Retur și rambursare".
      </P>

      <H2>6. Răspundere</H2>
      <P>
        Quasar Dance depune eforturi pentru funcționarea corectă a portalului, dar nu garantează
        disponibilitatea neîntreruptă. Participarea la activități fizice se face pe propria
        răspundere, cu respectarea indicațiilor instructorilor.
      </P>

      <H2>7. Contact și soluționarea litigiilor</H2>
      <P>
        Pentru orice sesizare ne poți scrie la {FIRMA.email}. Poți apela și la{' '}
        <a className="underline" href="https://anpc.ro/" target="_blank" rel="noreferrer">ANPC</a> sau
        la platforma europeană de{' '}
        <a className="underline" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
          Soluționare Online a Litigiilor (SOL)
        </a>
        .
      </P>
    </article>
  )
}
