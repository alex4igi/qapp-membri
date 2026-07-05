# Arhitectura qapp-membri

Portal client-facing pentru Quasar Dance, **livrat și în producție** (membri.quasardance.ro).
Backend = ACELAȘI Supabase ca `qapp v2/`. Frontend separat, *thin* — logica de business
(bani, FIFO, capacitate, voucher) stă în DB (RPC SECURITY DEFINER + edge functions).

> Istoric: prima versiune a acestui document descria planul inițial (schelet + Supabase Auth
> + `provision-client`). Aplicația a fost livrată, iar autentificarea a pivotat pe un
> **director de login separat** (`portal_accounts`). Documentul de față descrie realitatea.

---

## Structura repo (reală)

```
qapp-membri/
├── src/
│   ├── lib/                  # supabase client + portal token, format, cn
│   ├── hooks/
│   │   ├── useAuth.tsx       # auth pe portal_accounts (HS256), NU Supabase Auth
│   │   └── useActiveMember.tsx  # switcher membru familie
│   ├── components/
│   │   ├── ui/               # Button, Modal, Spinner, Card (fork tematizat din qapp v2)
│   │   ├── layout/AppLayout  # shell: topbar + nav 5 taburi + switcher membru
│   │   ├── ProtectedRoute    # redirect /login dacă nu e sesiune
│   │   └── NotificationBell  # clopoțel anunțuri
│   ├── features/             # 15 module (toate implementate)
│   │   ├── auth/             # LoginPage + ResetPage
│   │   ├── dashboard/        # AcasaPage
│   │   ├── plati/            # sold + achitare online Netopia (FIFO, parțial, datorii one-off)
│   │   ├── grupa/            # grupa copilului (roster, orar)
│   │   ├── calendar/         # calendar sezon + vacanțe + evenimente
│   │   ├── prezente/         # istoric prezențe (redirect în /grupa din nav)
│   │   ├── rezervari/        # rezervare OPEN class + plată online
│   │   ├── activitate/       # participări/rezultate concursuri (redirect în /grupa)
│   │   ├── semnare/          # semnare contracte (canvas semnătură; și public /s/:token)
│   │   ├── documente/        # documente client + adeverință (redirect în /profil)
│   │   ├── evaluari/         # rating lunar către instructor
│   │   ├── notificari/       # anunțuri broadcast din qapp v2
│   │   ├── reduceri/         # reducerile familiei
│   │   ├── profil/           # date personale, parolă, opt-out marketing
│   │   └── legal/            # pagini publice: /servicii /termeni /confidentialitate etc.
│   └── types/                # database.ts GENERAT (vezi regula de sync) + db.ts (aliasuri)
└── (backend = ../qapp v2/supabase/ — migrații, RPC, edge functions partajate)
```

Nav-ul autentificat are 5 taburi: Acasă / Grupa / Calendar / Plăți / Profil; rutele vechi
(`/prezente`, `/activitate`, `/documente`, `/adeverinta`) rămân ca redirect-uri interne.

---

## Autentificarea (REALĂ — diferă de planul inițial)

**Director de login separat, NU Supabase Auth.** Vezi `src/hooks/useAuth.tsx` + `src/lib/supabase.ts`:

1. Tabele: `portal_accounts` (email + bcrypt) + `portal_sessions` (refresh) + `portal_reset_tokens`.
2. Login/refresh/logout/reset/change_password trec prin edge function **`portal-auth`**
   (apel direct `fetch`, nu supabase-js), care validează prin RPC-uri service_role-only
   (`portal_login`, `portal_set_password`, …) și emite **access token HS256 semnat cu
   secretul JWT al proiectului** + refresh token opac.
3. Tokenul e injectat în supabase-js prin opțiunea `accessToken` (`setPortalToken`) —
   toate query-urile/RPC-urile pleacă cu `Bearer <token HS256>`; nelogat → cheia anon
   (paginile publice /servicii etc.).
4. Claim-urile tokenului: `sub` = `portal_accounts.id`, rol aplicativ `parinte`
   (citit de `auth_role()` în RLS).
5. Sesiunea (access+refresh) e persistată în `localStorage` sub cheia `portal_auth`,
   cu refresh proactiv înainte de expirare.
6. Provisioning conturi: din qapp v2 (staff) prin edge `provision-client` / RPC
   `portal_create_account`; seed test: `../qapp v2/scripts/seed-portal-test.mjs`.

### Threat model (pe scurt)
- **Token în localStorage** → exfiltrabil prin XSS (trade-off SPA standard, fără cookie
  httpOnly). Atenuare: fără dependencies exotice, fără `dangerouslySetInnerHTML`.
- **Izolarea datelor e integral server-side**: gardul RESTRICTIVE `deny_parinte_direct`
  de pe TOATE tabelele + RPC-uri SECURITY DEFINER scopate la `client_member_ids()`.
  Frontend-ul nu e niciodată bariera.
- **Invariant de mentenanță**: orice tabel NOU din qapp v2 trebuie să aibă RLS activ +
  gardul `deny_parinte_direct`. Verificare re-rulabilă:
  `node "../qapp v2/scripts/check-rls-parinte.mjs"` (de rulat după orice migrație cu
  tabele noi; vezi migrația `20260705090000_reapply_deny_parinte_guard.sql`).

---

## Fluxul de date

- **Citire**: exclusiv prin RPC-uri `*_client` / `*_familie` (get_sold_familie,
  get_plati_client, get_datorii_client, get_prezente_client, get_grupe_client,
  get_anunturi_client, get_documente_client, get_reduceri_familie, …). Excepție:
  3 surse publice pe /servicii (`tarife_publice`, view-urile `produse_publice`,
  `bilete_publice`) citite direct cu anon.
- **Scriere**: doar RPC dedicat (update_profil_client, submit_rating_client,
  mark_anunturi_citite) sau edge functions.
- **Bani**: `netopia-create-payment` (recalcul server-side al sumei, FIFO
  `build_fifo_plan_membru`, holduri `hold_loc_open`) → redirect Netopia →
  `netopia-webhook` IPN idempotent scrie `incasari` / confirmă rezervarea.
  Clientul NU calculează ce datorează și NU inserează în `incasari`.
- **Contracte**: semnare autenticată (`/semneaza/:token`) sau publică (`/s/:token`)
  prin edge `contract-public`.

## Riscuri & puncte de atenție (rămân valabile)

- **Idempotență webhook Netopia**: dedup pe id tranzacție. Dublarea încasărilor e inacceptabilă.
- **Invariant discount familie**: plata nu schimbă `suma`/`suma_baza` pe `enrollments`.
- **Enum-uri partajate** (metoda_plata, status_prezenta, status_rezervare): ambele
  app-uri le iau din `database.ts` generat — vezi regula de sincronizare din CLAUDE.md
  (după orice migrație, regen în AMBELE repo-uri).
- **Config push**: `supabase config push` din qapp v2 rescrie `[auth].site_url` pe
  proiectul partajat (e setat pe membri.quasardance.ro) — schimbările de auth se fac
  țintit, nu prin push orb de config.

## Verificare end-to-end

1. `npx tsc -b` + `npm run build` verzi.
2. Izolare: 2 familii diferite — fiecare vede DOAR membrii proprii (RLS adversarial).
   Smoke de referință pe căile reale: login portal-auth cu contul de test
   (`portal.test@quasardance.ro`) → direct pe tabele = 0 rânduri, RPC-urile familiei = OK.
3. Sold: restanțele din portal = la leu cu qapp v2 pentru aceeași familie.
4. Plată: sandbox Netopia → webhook → 1 rând `incasari`, fără dublare la retrimitere.
5. Cleanup date de test în Supabase (fixture ZZTEST rămâne — e reutilizabil).
