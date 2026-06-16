import { FIRMA, ULTIMA_ACTUALIZARE } from './firma'
import { H1, H2, P, UL, Updated } from './ui'

export function ReturPage() {
  return (
    <article>
      <H1>Politică de retur și rambursare</H1>
      <Updated date={ULTIMA_ACTUALIZARE} />

      <P>
        {FIRMA.denumire} prestează servicii (cursuri și ședințe de dans). Mai jos sunt condițiile de
        anulare și rambursare aplicabile plăților efectuate prin acest portal.
      </P>

      <H2>Dreptul legal de retragere</H2>
      <P>
        Conform OUG nr. 34/2014, consumatorul are dreptul de a se retrage dintr-un contract încheiat
        la distanță în termen de 14 zile, fără justificare. Întrucât oferim servicii, dacă soliciți
        expres începerea prestării serviciului înainte de expirarea celor 14 zile, vei datora
        contravaloarea ședințelor deja efectuate până la momentul retragerii. Dacă serviciul nu a
        început, rambursarea este integrală.
      </P>

      <H2>Anularea unui abonament</H2>
      <UL>
        <li>Ședințele neefectuate dintr-un abonament pot fi rambursate proporțional sau reportate, conform regulamentului intern.</li>
        <li>Reducerile acordate (ex. −10%) se recalculează la rambursare.</li>
        <li>Taxele de înscriere/administrative, acolo unde există, nu sunt rambursabile după prestarea serviciului asociat.</li>
      </UL>

      <H2>Cum soliciți rambursarea</H2>
      <P>
        Trimite o cerere la {FIRMA.email}, menționând numele membrului și plata vizată. Îți răspundem
        în cel mult 14 zile.
      </P>

      <H2>Modalitatea de rambursare</H2>
      <P>
        Rambursarea se face folosind aceeași metodă de plată utilizată la tranzacție (restituire pe
        cardul cu care s-a plătit), în termenul prevăzut de lege de la aprobarea cererii. Nu se
        percep costuri suplimentare pentru rambursare.
      </P>

      <H2>Plăți eronate</H2>
      <P>
        Dacă observi o plată dublă sau eronată, contactează-ne la {FIRMA.email}; după verificare,
        suma se restituie integral pe card.
      </P>
    </article>
  )
}
