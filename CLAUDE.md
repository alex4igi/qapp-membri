# qapp-membri — instrucțiuni pentru Claude

## Ce este

**qapp-membri** este **zona de membru client-facing** a Quasar Dance: o aplicație
**complet separată** prin care **clienții și familiile** își gestionează singuri relația
cu școala. Accesată printr-un link de pe site, dar e o aplicație de sine stătătoare.

Audiență: **familii (responsabil 18+) și adulți individuali** — NU staff.

## Funcționalități LIVRATE (app în producție, membri.quasardance.ro)

| Zonă | Funcție |
|------|---------|
| **Plăți** | Sold familie + per membru; plată online Netopia (FIFO, parțială, datorii one-off); voucher |
| **Grupa** | Roster/orar grupă + istoric prezențe + activitate concursuri |
| **Calendar** | Sezon, vacanțe, evenimente |
| **Rezervări** | Loc la cursuri facultative (OPEN class) + plată online |
| **Semnare** | Contracte semnate pe canvas — autentificat (`/semneaza/:token`) sau public (`/s/:token`) |
| **Profil** | Date personale, parolă, opt-out, documente + adeverință, reduceri, evaluare instructor |
| **Notificări** | Anunțuri broadcast din qapp v2 (clopoțel) |
| **Public** | /servicii (tarife/produse/bilete) + pagini legale — fără login |

Neimplementat încă: galerie foto/video, merch checkout, workshop, reînscriere self-service,
jurnal de ședință, factură pe firmă, roster familie self-service.

## Relația cu qapp v2 — CITEȘTE ÎNAINTE DE ORICE

- **Backend comun**: ACELAȘI proiect Supabase ca `qapp v2/`. Zero sincronizare de date —
  sold/prezențe mereu live. Adăugăm doar auth client + RLS noi + RPC/Edge Functions noi.
- **Frontend separat**: repo/deploy/branding proprii. Clientul NU trebuie să încarce cod intern de admin.
- **Regula de aur**: logica de bani (FIFO, voucher, prorata, capacitate) trăiește **o singură
  dată în DB** (RPC + Edge Functions). Această app e *thin* — doar apelează. Clientul NU
  calculează ce datorează și NU inserează în `incasari`.
- `qapp v2/` se citește **read-only ca referință**. NU importa cod din el. Vezi `ARCHITECTURE.md`
  pentru structura reală, modelul de auth (portal_accounts + HS256, NU Supabase Auth) și fluxul de date.

## Stack

Identic cu qapp v2: **Vite + React 19 + TypeScript + Supabase JS + TanStack Query +
React Router + Tailwind v4** (`@theme inline`, fără `tailwind.config`). Branding: galben
`#FFD600` + negru.

## Procesator de plăți

**Netopia** (netopia-payments.com) — confirmat. Plată online reală cu cardul, în 2 pași
(create-payment → redirect → webhook IDEMPOTENT care scrie în `incasari`). Vezi ARCHITECTURE.md.

## Comenzi

```bash
npm install
npm run dev          # Vite dev server
npm run build        # tsc -b + vite build
npx tsc -b           # type-check
npm run gen:types    # regenerare src/types/database.ts din ACELAȘI Supabase ca qapp v2
```

> ⚠️ Repo-ul NU e linkat la Supabase — `gen:types` generează prin link-ul din
> `../qapp v2` (același proiect). **Regulă:** după ORICE migrație aplicată din qapp v2,
> rulează `npm run gen:types` și AICI, ca tipurile să nu rămână în urmă.

## Convenții cod

- **Limba**: română pentru UI; engleză pentru cod (variabile, funcții, fișiere, componente).
- **TypeScript** obligatoriu.
- **Comentarii**: minim — doar WHY non-evident.
- **Structură per modul**: `src/features/<domain>/` (pages + api + components), la fel ca qapp v2.
- **Securitate**: izolarea datelor se face **server-side prin RLS** pe `auth.uid()`, NU în frontend.

## Workflow per modul (ca în qapp v2)

1. Construiește / refactor
2. `npx tsc -b` verde
3. `npm run build` verde
4. Smoke test în browser
5. Cleanup date de test în Supabase
6. Raport scurt + întrebare „continuăm?"

## Context business

Pentru Quasar Dance (companie, abonamente, cursuri, surse), vezi memoria persistentă
și `../qapp v2/CLAUDE.md`. Blueprint-ul zonei de membru:
`~/.claude/plans/urmeaza-sa-incep-un-proud-church.md`.
