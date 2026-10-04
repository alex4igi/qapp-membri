// Traduce orice eroare (rețea, sesiune, Postgres, edge function) într-un mesaj pentru
// părinte: ce s-a întâmplat + ce poate face. Mesajele scrise de noi în funcțiile DB și
// edge functions trec neschimbate; doar textele tehnice primesc o formulare umană.

export const CONTACT_RECEPTIE =
  'scrie-ne la office@quasardance.ro sau sună la recepția locației tale (telefoanele sunt pe pagina Contact)'

const FARA_INTERNET =
  'Nu ne-am putut conecta la server. Verifică internetul (Wi-Fi sau date mobile) și încearcă din nou.'
const SESIUNE_EXPIRATA = 'Sesiunea ta a expirat. Ieși din cont și intră din nou, apoi reia pasul.'
const FARA_ACCES = `Contul tău nu are acces la aceste date. Dacă ar trebui să le vezi, ${CONTACT_RECEPTIE}.`
const NEASTEPTATA =
  'A apărut o problemă neașteptată la noi. Încearcă din nou peste câteva minute; dacă se repetă, apasă butonul „Trimite-ne o părere" din colțul ecranului și spune-ne ce încercai să faci.'

// Motive comune cu aplicația de staff (_voucher_motiv_invalid): textul din DB e scris
// pentru recepție, aici îl spunem părintelui.
const MESAJE_CUNOSCUTE: Record<string, string> = {
  'Cod inexistent.': 'Codul nu există. Verifică literele și cifrele exact cum le-ai primit (fără spații).',
  'Voucher inexistent.': 'Codul nu există. Verifică literele și cifrele exact cum le-ai primit (fără spații).',
  'Membru invalid.': 'Alege din partea de sus a ecranului membrul familiei pentru care rezervi, apoi introdu din nou codul.',
  'Voucherul nu este activ.': `Codul nu mai este activ. Dacă l-ai primit recent, ${CONTACT_RECEPTIE}.`,
  'Voucherul nu e încă valabil.': 'Codul nu e încă valabil — verifică de la ce dată poate fi folosit.',
  'Voucherul a expirat.': 'Codul a expirat.',
  'Voucherul nu mai are utilizări disponibile.': 'Codul a fost deja folosit de numărul maxim de ori.',
  'Voucherul e emis pentru alt client.':
    'Codul e emis pe numele altui cursant. Dacă e al altui membru din familie, alege-l din partea de sus a ecranului.',
  'Voucherul nu se aplică pe acest curs.': 'Codul nu este valabil pentru acest curs.',
  'Clientul a atins limita de utilizări pentru acest cod.':
    'Acest cursant a folosit deja codul de numărul maxim de ori.',
  'Eroare internă.': NEASTEPTATA,
  'Prea multe cereri. Încearcă din nou peste puțin timp.':
    'Ai încercat de prea multe ori într-un timp scurt. Așteaptă câteva minute și încearcă din nou.',
}

function textEroare(e: unknown): string {
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message ?? '')
  return ''
}

// supabase-js nu aruncă TypeError-ul din fetch: îl pune ca text în eroarea întoarsă.
function esteFaraInternet(text: string): boolean {
  return /failed to fetch|load failed|networkerror|network request failed|fetch failed/i.test(text)
}

// Un mesaj scris de noi: cu diacritice, sau propoziție (majusculă la început, punct la final).
function pareScrisDeNoi(text: string): boolean {
  return /[ăâîșțĂÂÎȘȚ„]/.test(text) || (/^[A-Z]/.test(text) && /[.!?)]$/.test(text))
}

export function mesajEroare(e: unknown, fallback = NEASTEPTATA): string {
  const text = textEroare(e).trim()
  const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : ''

  if (esteFaraInternet(text)) return FARA_INTERNET
  if (/^PGRST30[1-3]$/.test(code) || /jwt|invalid token|token invalid|missing auth|neautentificat|sesiune expirat/i.test(text)) {
    return SESIUNE_EXPIRATA
  }
  if (/permission denied|row-level security/i.test(text)) return FARA_ACCES
  if (MESAJE_CUNOSCUTE[text]) return MESAJE_CUNOSCUTE[text]
  if (text && pareScrisDeNoi(text) && !/^Edge Function returned/i.test(text)) return text
  return fallback
}
