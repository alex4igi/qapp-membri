# Arhitectura qapp-membri

Portal client-facing pentru Quasar Dance. Backend = ACELAȘI Supabase ca `qapp v2/`.
Frontend separat, *thin*. Logica de business stă în DB.

---

## Structura repo

```
qapp-membri/
├── src/
│   ├── lib/                  # supabase client, format, cn (liant minimal)
│   ├── hooks/
│   │   ├── useAuth.tsx       # auth client SIMPLIFICAT (fără rol/RBAC/pontaj)
│   │   └── useActiveMember.tsx  # switcher membru familie
│   ├── components/
│   │   ├── ui/               # Button, Modal, Spinner (subset din qapp v2)
│   │   ├── layout/AppLayout  # shell: header + nav + switcher membru
│   │   ├── ProtectedRoute    # redirect /login dacă nu e sesiune
│   │   └── PagePlaceholder   # se șterge pe măsură ce paginile se implementează
│   ├── features/
│   │   ├── auth/             # LoginPage (funcțional)
│   │   ├── dashboard/        # AcasaPage
│   │   ├── plati/            # PlatiPage + api/payments.ts (Netopia)
│   │   ├── prezente/         # PrezentePage + api.ts
│   │   ├── rezervari/        # RezervariPage + api.ts (open class)
│   │   └── profil/           # ProfilPage (schimbă parola funcțional)
│   └── types/                # database.ts (PLACEHOLDER → gen:types) + db.ts (aliasuri)
└── (backend = ../qapp v2/supabase/ — migrații, RPC, edge functions partajate)
```

> Backend-ul (RLS, RPC, Edge Functions Netopia) NU trăiește aici, ci în `../qapp v2/supabase/`
> fiindcă proiectul Supabase e comun. Vezi „Backend NOU" mai jos.

Stare: **schelet**. Paginile sunt placeholder, `api/*` sunt stub-uri cu TODO care trimit
la sursa din qapp v2 și la RPC-ul de construit.

---

## Ce se ia din qapp v2 (referință read-only — NU se importă)

### Funcția MVP → fișier de studiat

| Funcție | Fișier qapp v2 | Ce conține |
|---|---|---|
| **Plăți FIFO** | `src/features/plati/api/incasari.ts` | `registerPlataFifo()` — de mutat **server-side** |
| | `src/features/plati/api/enrollments.ts` | tipuri înrolare, prorata |
| | `src/features/plati/api/list.ts` | query restanțe per înrolare |
| | modulul `vouchere` (`validateVoucher`/`calc.ts`) | validare voucher înainte de plată |
| **Prezențe** | `src/features/prezente/api.ts` | `getPrezente`, `getCursRoster`, `getOpenRosterForDate` |
| **Rezervare open class** | `src/features/plati/api/open-class.ts` | `rezervaLocOpen`, `listOpenSesiuni` |
| | `supabase/migrations/20260606200100_open_class_rpc.sql` | RPC `rezerva_loc_open` (staff, sincron — vezi gotcha) |
| | `supabase/migrations/20260606200000_open_class_tables.sql` | tabele `open_sesiuni` / `open_rezervari` |
| **Sold familie** | `src/features/clienti/api.ts`, `src/features/familii/api.ts` | query sold/membri per familie |
| **Profil / opt-out** | `src/features/opt-out/api.ts` | RPC `mark_opt_out` / `clear_opt_out` |
| **Pattern auth↔user + RLS** | `supabase/migrations/20260514100200_rls.sql` | `auth_role()`, `teacheri.auth_user_id`, RLS `evaluari_teacher_*` |

### Infra COPIATĂ în acest repo (deja făcut)
`package.json` (curățat: fără dnd-kit/recharts), `vite.config.ts`, `tsconfig*`, `eslint.config.js`,
`src/lib/{supabase,format,cn}.ts`, `src/index.css` (branding), `src/components/ui/*` (subset),
`src/main.tsx` (QueryClient). **NU** s-au copiat: `rolesMatrix`, `navConfig`, `Header`/`TopNav`
intern, `ProtectedRoute` cu RBAC — toate sunt logică staff.

---

## Backend NOU (în Supabase qapp v2) — partea grea

Se face în `qapp v2/supabase/`, NU aici. Frontend-ul de aici doar apelează.

### 1. Legare clienți la auth
- Migrație: `clienti.auth_user_id` + `familii.auth_user_id` (pattern `teacheri.auth_user_id`).
- Funcții helper: `current_client()` / `current_familie()` (analog `current_teacher()`).
- Un cont de familie = responsabilul (18+); un cont individual = adult legat direct la `clienti`.
- Minorii NU au cont propriu în MVP.

### 2. RLS client-facing
Pe `clienti`, `familii`, `prezente`, `enrollments`, `incasari`, `open_sesiuni`, `open_rezervari`,
`opt_out`. Fiecare cont vede **DOAR** familia lui. **Testat adversarial** (2 familii diferite).

### 3. RPC de citire sigură
- `get_sold_familie()` — restanțe agregate + per membru
- `get_prezente_client(p_client, p_sezon)` 
- `list_open_sesiuni_client()` — sesiuni viitoare + locuri rămase

### 4. Plată Netopia (2 Edge Functions noi)
- **`netopia-create-payment`**: authz pe `auth.uid()` → recalculează FIFO server-side (sursa de
  adevăr a sumei, reutilizând logica `registerPlataFifo`) → aplică voucher → creează ordin
  Netopia → întoarce `{ redirectUrl, orderId }`.
- **`netopia-webhook`** (IPN): verifică semnătura → **IDEMPOTENT** (dedup pe id tranzacție
  Netopia) → la confirmare scrie `incasari` (FIFO) + recalcul sold. Dublarea încasărilor e
  inacceptabilă.

### 5. Rezervare open class CLIENT (variantă în 2 pași)
RPC-ul existent `rezerva_loc_open` e **staff-gated + plată sincronă** → nu e apelabil de client.
Nou:
- **`hold_loc_open()`**: blocaj atomic la capacitate (`SELECT ... FOR UPDATE` pe sesiune, ca în
  RPC-ul existent), creează rezervare `status='in_asteptare'` **fără** `incasari`.
- **`netopia-webhook`** confirmă → `incasari` + `enrollment` + `status='platit'`.
- Expirare holduri neplătite (cron) → eliberează locul.

---

## Stare backend (2026-06-15)

**Faza 1 LIVRATĂ + aplicată pe remote** (migrații în `../qapp v2/supabase/migrations/`):
`20260615120000_portal_membri_foundation` + `20260615130000_portal_membri_rpc`.
- `clienti/familii.auth_user_id` + helperi `current_client/current_familie/client_member_ids`.
- **Gard de securitate**: politică RESTRICTIVE `deny_parinte_direct` pe toate tabelele cu RLS →
  rolul `parinte` nu atinge niciun tabel direct; totul prin RPC SECURITY DEFINER.
- RPC citire: `get_sold_familie`, `get_plati_client`, `get_prezente_client`,
  `list_open_sesiuni_client`, `get_membri_familie`.
- Edge function `provision-client` (creează/leagă cont `parinte`) — DEPLOYAT.
- Test adversarial RLS: `../qapp v2/scripts/test-portal-rls.mjs` (6/6 pass, auto-cleanup).

⚠️ **Mentenanță gard**: `deny_parinte_direct` se aplică tabelelor existente la momentul migrației.
Orice tabel NOU adăugat în qapp v2 trebuie să primească manual aceeași politică restrictivă,
altfel devine citibil de conturile `parinte`.

## Riscuri & puncte de atenție

- **RLS**: clienții devin pentru prima dată utilizatori autentificați pe acest Supabase.
  Testare adversarială obligatorie — un cont nu trebuie să vadă altă familie. ✓ acoperit (vezi mai sus).
- **Idempotență webhook**: dedup pe id tranzacție Netopia.
- **Invariant discount familie**: plata nu schimbă `suma`/`suma_baza` pe `enrollments`, doar `incasari`.
- **Enum-uri**: orice enum copiat din qapp v2 (metoda_plata, status_prezenta, status_rezervare)
  trebuie ținut sincron cu sursa (problema `qleads-widget.js`).

## Verificare end-to-end (când se implementează)

1. `npx tsc -b` + `npm run build` verzi.
2. Auth: 2 familii diferite — fiecare vede DOAR membrii proprii (izolare RLS).
3. Sold: restanțele din portal = la leu cu qapp v2 pentru aceeași familie.
4. Plată: sandbox Netopia → webhook → 1 rând `incasari`, sold scade corect, fără dublare la retrimitere.
5. Prezențe: corespund cu ce vede recepția în qapp v2.
6. Profil: opt-out se reflectă în `clienti` și blochează marketingul (nu și tranzacționalul).
7. Cleanup date de test în Supabase.
