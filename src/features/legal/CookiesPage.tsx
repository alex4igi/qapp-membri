import { FIRMA, ULTIMA_ACTUALIZARE } from './firma'
import { H1, H2, P, UL, Updated } from './ui'

// Politică de cookies — cerută explicit de Netopia. Portalul folosește DOAR
// cookie-uri strict necesare (sesiune de autentificare) + localStorage funcțional;
// fără cookie-uri de publicitate/urmărire.
export function CookiesPage() {
  return (
    <article>
      <H1>Politică de cookies</H1>
      <Updated date={ULTIMA_ACTUALIZARE} />

      <P>
        Acest portal („Contul meu"), operat de {FIRMA.denumire}, folosește un set minim de
        tehnologii de stocare locală, necesare funcționării. Nu folosim cookie-uri de publicitate
        sau de urmărire în scop de marketing.
      </P>

      <H2>Ce folosim</H2>
      <UL>
        <li>
          <strong>Strict necesare (autentificare):</strong> cookie-uri/stocare de sesiune pentru a te
          menține autentificat în siguranță. Fără ele, portalul nu funcționează.
        </li>
        <li>
          <strong>Funcționale:</strong> stocare locală (localStorage) pentru a reține membrul de
          familie selectat în comutator. Nu identifică persoane în afara contului tău.
        </li>
        <li>
          <strong>Procesatorul de plăți:</strong> la plata cu cardul ești pe pagina securizată
          NETOPIA Payments, care poate folosi propriile cookie-uri pentru securizarea tranzacției.
        </li>
      </UL>

      <H2>Cum le controlezi</H2>
      <P>
        Poți șterge sau bloca stocarea locală din setările browserului. Blocarea cookie-urilor strict
        necesare împiedică autentificarea în portal. Deconectarea („Ieșire") elimină datele de sesiune.
      </P>

      <H2>Contact</H2>
      <P>Pentru întrebări legate de cookie-uri, scrie-ne la {FIRMA.email}.</P>
    </article>
  )
}
