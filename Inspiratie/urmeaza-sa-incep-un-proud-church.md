# Zonă de membru pentru clienți / familii — blueprint & scop

## Context

Quasar Dance vrea o **aplicație nouă, complet separată** de site-ul public și de qapp v2 (toolul intern), prin care **clienții și familiile** își gestionează singuri relația cu școala: plăți, prezențe, evaluări, profil, anunțuri. Accesul se face printr-un link de pe site, dar duce într-o aplicație de sine stătătoare.

qapp v2 are deja modelată în Supabase aproape toată informația necesară. Notabil, există deja tabelul `anunturi_clienti` creat explicit „ca fundație pentru viitorul portal client" — deci direcția a fost anticipată. Singura zonă fără niciun suport e galeria foto/video.

Scopul acestui document e să fixeze **ce face contul de membru** și **arhitectura** înainte de a începe codul. Nu conține încă implementare.

## Decizii luate (cu user-ul)

1. **Plăți online reale cu cardul** — clientul achită din portal, nu doar vizualizează.
2. **Procesor: de decis ulterior** → proiectăm agnostic (Edge Function care creează un payment intent + webhook care confirmă → scrie în `incasari`). Candidați: Netopia mobilPay / PayU / EuPlatesc / Stripe.
3. **Conturi atât pentru familii (responsabil) cât și pentru adulți individuali.**
4. **Același backend Supabase ca qapp v2** — frontend nou separat, dar zero sincronizare de date; sold/prezențe mereu live. Adăugăm auth client + politici RLS noi.
5. **Proiect complet nou** — folder, repo, documentație și deploy separate de qapp v2, dar pe același backend Supabase. Logica de business (FIFO plăți, voucher, prorata) trăiește **o singură dată în DB** (RPC + Edge Functions); noua app e *thin* și doar apelează. Motivare detaliată în secțiunea „De ce proiect separat".

## Scop MVP (faza 1)

| Zonă | Funcții | Date existente |
|---|---|---|
| **Bani** | Vede soldul familiei + per membru; achită înrolările restante online (FIFO, cronologic); aplică voucher | `plati_inrolari`, `registerPlataFifo()`, `vouchere` + `validateVoucher()` |
| **Prezențe** | Lista prezențe/absențe per copil (Prezent/Absent/Motivat) | `prezente` |
| **Evaluări** | Rapoarte instructori: 10 skill-uri (1–5) + feedback general | `evaluari`, `skills.ts` |
| **Profil** | Editează contact/școală/mărime tricou; preferințe marketing (opt-in/out); consimțământ poze; gestionare membri familie | `clienti`, `familii`, modulul `opt-out`, `doreste_sa_apara_in_poze` |
| **Comunicare** | Primește anunțurile școlii + marcaj citit; notificări (reminder plată) | `anunturi_clienti` (deja pregătit), pattern `notifications` |

## Faza 2 (amânat explicit)

- **Galerie foto/video** de la spectacole (de construit de la zero: tabel `galerie` + Supabase Storage + filtru pe consimțământ poze)
- **Bilete** la spectacole/concursuri (`incasari` Bilet → `evenimente`)
- **Merch** din inventar (atenție stoc + mărime)
- **Workshop / open class** — rezervare + plată (`evenimente.tip='Workshop'`)
- **Reînscriere sezon** self-service („Activează!")
- Idei nice-to-have: orar cursuri, anunțare absență din timp, istoric concursuri, referral „bring a friend"

## De ce proiect separat (nu același cadru cu qapp v2)

Decizie: **folder/repo/docs/deploy noi**, backend Supabase comun.

| Motiv | Detaliu |
|---|---|
| Suprafață de securitate diferită | qapp v2 e tool intern cu drepturi mari (RBAC staff, admin/manager). App client-facing nu trebuie să poată nici măcar livra accidental cod de admin în bundle. Separarea fizică = cea mai bună garanție. |
| Audiență & auth diferite | Clienți/familii vs staff. Auth nou, RLS nou, branding client. |
| Deploy & domeniu independente | Release cadence propriu; nu atingi toolul intern la fiecare update de portal. |
| Bundle curat | Clienții nu încarcă codul de administrare internă. |
| Documentație proprie | CLAUDE.md/ARCHITECTURE.md dedicate, fără să poluezi instrucțiunile qapp v2. |

**Costul separării = drift de logică** (FIFO, voucher, prorata, enum-uri) — exact problema existentă cu `public/qleads-widget.js`. **Soluție:** logica de bani stă o singură dată în Supabase (RPC + Edge Functions), noua app doar apelează. Asta e oricum necesar pentru plata online securizată (clientul nu calculează singur ce datorează). De sincronizat rămân doar tipurile (`gen:types` pe același proiect) și constantele enum.

Respins **monorepo cu pachete partajate**: curat pe hârtie, dar complexitate de build nejustificată pentru o echipă de 4; singurul lucru de partajat real (logica) stă mai bine în DB decât în cod frontend comun.

## Arhitectură

### Aplicația nouă (frontend)
- **Proiect/repo nou**, frate cu `qapp v2/` (ex. `qapp-membri/` sau `quasar-membri/`), cu CLAUDE.md + ARCHITECTURE.md proprii.
- **Stack identic cu qapp v2**: Vite + React 19 + TypeScript + Supabase JS client.
- `npm run gen:types` pointează la **același proiect Supabase**; tipurile vin din aceeași schemă.
- App *thin*: nu reimplementează FIFO/voucher/prorata — apelează RPC/Edge Functions.
- Branding Quasar: galben `#FFD600` + negru.

### Backend (în Supabase-ul existent qapp v2)
Munca grea e pe backend, nu pe UI. Necesită:

1. **Legare clienți/familii la auth.users** — model analog cu `teacheri.auth_user_id`. Adăugăm `clienti.auth_user_id` și/sau `familii.auth_user_id`. Un cont de familie = responsabilul (membru 18+); un cont individual = adult legat direct la `clienti`.
   - Fișiere de referință pentru pattern: cum sunt legați teacherii (`teacheri.auth_user_id` → `auth.users`) și RLS-urile `evaluari_teacher_*`.
2. **Politici RLS noi, client-facing** — pe `clienti`, `familii`, `prezente`, `evaluari`, `plati_inrolari` (sau RPC dedicate), `anunturi_clienti`, `opt_out`. Fiecare cont vede **doar** propriile date / ale familiei.
3. **RPC dedicate pentru citire sigură** (recomandat în loc de RLS direct pe view-uri complexe):
   - `get_sold_familie(client/familie)` — restanțe agregate + per membru
   - `get_prezente_client(client_id, sezon_id)`
   - `get_evaluari_client(client_id)`
   - listarea/marcarea anunțurilor: există deja `mark_anunt_read()`; de adăugat livrarea pe canalul `client` (RPC `send_anunt_client()` există ca fundație).
4. **Plată online (agnostic de procesator)**:
   - Edge Function `create-payment` → calculează ce se plătește (FIFO peste restanțe, reutilizând logica `registerPlataFifo()`), creează intent la procesor, întoarce client secret / redirect URL.
   - Edge Function `payment-webhook` → la confirmare, scrie în `incasari` (idempotent, dedup pe id tranzacție procesator) și recalculează soldul.
   - Reutilizează validarea voucher (`validateVoucher()` / `calc.ts`) înainte de a crea intentul.
5. **Sincronizare enum-uri** — la fel ca widget-ul public (`public/qleads-widget.js`), orice enum copiat în noua app trebuie ținut sincron cu sursa.

### Fișiere-cheie de studiat din qapp v2 (read-only, ca referință)
- `src/features/plati/api/incasari.ts` — `registerPlataFifo()`, `resolveWorkshopGuest()`
- `src/features/plati/api/enrollments.ts` — tipuri înrolare, prorata
- `src/features/clienti/api.ts` + `src/features/familii/api.ts` — query sold/prezențe per sezon
- `src/features/opt-out/` — preferințe marketing (RPC `mark_opt_out` / `clear_opt_out`)
- `src/features/announcements/api.ts` — `send_anunt_client()`, `mark_anunt_read()`
- `src/features/evaluari/` — model evaluări + skills
- migrațiile `plati_inrolari` / `restante_*` / `politica_discount` în `supabase/migrations/`

## Riscuri & puncte de atenție

- **Securitate RLS**: clienții devin pentru prima dată utilizatori autentificați pe acest Supabase. Politicile trebuie testate adversarial — un cont nu trebuie să poată citi datele altei familii. Testare dedicată.
- **Politica discount familie** se recalculează prin trigger la modificarea înrolărilor — plata online nu trebuie să strice invariantul (plata nu schimbă `suma`, doar `incasari`).
- **Idempotență webhook plată** — dublarea încasărilor e inacceptabilă (afectează soldul). Dedup obligatoriu pe id tranzacție.
- **Minori**: contul de familie e deținut de responsabil (18+); copiii nu au cont propriu în MVP.

## Verificare (end-to-end, când se implementează)

1. `npx tsc -b` + `npm run build` verzi în noua app.
2. Auth: un cont de familie se loghează și vede **doar** membrii proprii (test cu 2 familii diferite — izolare RLS).
3. Sold: restanțele afișate în portal coincid la leu cu cele din qapp v2 pentru aceeași familie.
4. Plată: flux complet pe sandbox-ul procesorului → webhook → apare un rând în `incasari`, soldul scade corect, fără dublare la retrimiterea webhook-ului.
5. Prezențe/evaluări: corespund cu ce vede recepția/teacherul în qapp v2.
6. Profil: editarea opt-out marketing se reflectă în `clienti.opt_out_marketing` și blochează marketingul, dar nu mesajele tranzacționale.
7. Cleanup date de test în Supabase (DB rămâne curat).
