import { FIRMA, ULTIMA_ACTUALIZARE } from './firma'
import { H1, H2, P, UL, Updated } from './ui'

export function ConfidentialitatePage() {
  return (
    <article>
      <H1>Politică de confidențialitate</H1>
      <Updated date={ULTIMA_ACTUALIZARE} />

      <P>
        {FIRMA.denumire} (CUI {FIRMA.cui}, {FIRMA.adresa}) prelucrează datele cu caracter personal în
        conformitate cu Regulamentul (UE) 2016/679 (GDPR). Operator de date este {FIRMA.denumire},
        reprezentat de administrator {FIRMA.administrator}, contact {FIRMA.email}.
      </P>

      <H2>Ce date prelucrăm</H2>
      <UL>
        <li>Date de identificare și contact: nume, prenume, email, telefon, adresă.</li>
        <li>Date despre membri (inclusiv copii, furnizate de părinte/reprezentant): nume, data nașterii.</li>
        <li>Date despre înrolări, prezențe și plăți.</li>
        <li>Date tehnice minime necesare funcționării portalului (autentificare, sesiune).</li>
      </UL>

      <H2>Scopuri și temei</H2>
      <UL>
        <li>Executarea contractului de prestări servicii (gestionarea cursurilor și a plăților).</li>
        <li>Îndeplinirea obligațiilor legale (fiscale, contabile).</li>
        <li>Comunicări administrative legate de cont și plăți.</li>
        <li>Comunicări de marketing — doar cu consimțământul tău, revocabil oricând.</li>
      </UL>

      <H2>Plăți cu cardul</H2>
      <P>
        Plățile sunt procesate de NETOPIA Payments. Datele cardului sunt introduse direct pe pagina
        securizată a procesatorului; {FIRMA.denumire} nu colectează și nu stochează numărul cardului
        sau codul de securitate.
      </P>

      <H2>Cui dezvăluim datele</H2>
      <P>
        Furnizorilor care ne ajută să operăm serviciul (găzduire, bază de date, procesator de plăți,
        servicii de comunicare), strict în limita necesară, și autorităților, când legea o impune.
      </P>

      <H2>Cât păstrăm datele</H2>
      <P>
        Pe durata relației contractuale și ulterior pe perioadele impuse de lege (ex. documente
        financiar-contabile). Datele de marketing se păstrează până la retragerea consimțământului.
      </P>

      <H2>Drepturile tale</H2>
      <P>
        Ai drept de acces, rectificare, ștergere, restricționare, opoziție și portabilitate, precum
        și dreptul de a-ți retrage consimțământul. Le poți exercita scriind la {FIRMA.email}. Ai de
        asemenea dreptul de a depune plângere la Autoritatea Națională de Supraveghere a Prelucrării
        Datelor cu Caracter Personal (ANSPDCP).
      </P>
    </article>
  )
}
