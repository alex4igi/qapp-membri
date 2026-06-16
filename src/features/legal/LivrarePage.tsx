import { FIRMA, ULTIMA_ACTUALIZARE } from './firma'
import { H1, H2, P, UL, Updated } from './ui'

// Politică de livrare a serviciilor — cerută explicit de Netopia. Nu vindem bunuri
// fizice: „livrarea" = acordarea accesului la serviciu după plata online.
export function LivrarePage() {
  return (
    <article>
      <H1>Politică de livrare</H1>
      <Updated date={ULTIMA_ACTUALIZARE} />

      <P>
        {FIRMA.denumire} (Quasar Dance) prestează servicii (cursuri și ședințe de dans). Nu
        comercializăm bunuri fizice, deci nu există livrare prin curier. „Livrarea" serviciului
        înseamnă acordarea accesului la cursurile și ședințele plătite.
      </P>

      <H2>Cum și când primești serviciul</H2>
      <UL>
        <li>
          <strong>Plata unui abonament/restanțe:</strong> după confirmarea plății cu cardul,
          înrolarea ta devine activă, iar accesul la ședințe se face conform programului cursului,
          la locația aferentă.
        </li>
        <li>
          <strong>Rezervarea unei ședințe facultative (OPEN class):</strong> după confirmarea plății,
          locul tău este confirmat pentru data aleasă și apari în lista participanților ședinței.
          Te prezinți la locația cursului, la data și ora sesiunii.
        </li>
        <li>
          Confirmarea plății se reflectă în portal în câteva secunde de la validarea tranzacției de
          către bancă.
        </li>
      </UL>

      <H2>Locațiile de desfășurare</H2>
      <UL>
        {FIRMA.telefoane.map((t) => (
          <li key={t.loc}>{t.loc} — {t.tel}</li>
        ))}
      </UL>

      <H2>Dacă apare o problemă</H2>
      <P>
        Dacă plata a fost confirmată dar accesul la serviciu nu se reflectă corect, scrie-ne la{' '}
        {FIRMA.email} și remediem situația. Condițiile de anulare și rambursare sunt în pagina „Retur
        și rambursare".
      </P>
    </article>
  )
}
