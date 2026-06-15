# qapp-membri — instrucțiuni pentru Claude

## Ce este

**qapp-membri** este **zona de membru client-facing** a Quasar Dance: o aplicație
**complet separată** prin care **clienții și familiile** își gestionează singuri relația
cu școala. Accesată printr-un link de pe site, dar e o aplicație de sine stătătoare.

Audiență: **familii (responsabil 18+) și adulți individuali** — NU staff.

## MVP (faza 1)

| Zonă | Funcție |
|------|---------|
| **Plăți** | Vede soldul familiei + per membru; achită înrolările restante **online cu cardul** (cronologic/FIFO); voucher |
| **Prezențe** | Istoricul prezențelor copilului (Prezent/Absent/Motivat) |
| **Rezervări** | Rezervă loc la cursuri **facultative** (OPEN class, K-pop Covers) + plată online |
| **Profil** | Schimbă parola; editează date personale/copii; preferințe marketing (opt-out) |

Faza 2 (NU acum): galerie foto/video, bilete, merch, workshop, reînscriere self-service,
jurnal de ședință, factură pe firmă, roster familie self-service.

## Relația cu qapp v2 — CITEȘTE ÎNAINTE DE ORICE

- **Backend comun**: ACELAȘI proiect Supabase ca `qapp v2/`. Zero sincronizare de date —
  sold/prezențe mereu live. Adăugăm doar auth client + RLS noi + RPC/Edge Functions noi.
- **Frontend separat**: repo/deploy/branding proprii. Clientul NU trebuie să încarce cod intern de admin.
- **Regula de aur**: logica de bani (FIFO, voucher, prorata, capacitate) trăiește **o singură
  dată în DB** (RPC + Edge Functions). Această app e *thin* — doar apelează. Clientul NU
  calculează ce datorează și NU inserează în `incasari`.
- `qapp v2/` se citește **read-only ca referință**. NU importa cod din el. Vezi `ARCHITECTURE.md`
  pentru lista exactă de fișiere de studiat + planul de backend.

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

> ⚠️ `src/types/database.ts` e momentan **placeholder**. După `supabase link` la proiectul
> qapp v2, rulează `npm run gen:types` ca să ai schema reală.

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
