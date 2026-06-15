# qapp-membri — portal membri Quasar Dance

Zonă de membru self-service pentru clienți/familii: plăți, prezențe, rezervări, profil.
Aplicație **separată** de toolul intern qapp v2, dar pe **același backend Supabase**.

Vezi [CLAUDE.md](./CLAUDE.md) și [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dezvoltare

```bash
npm install
cp .env.example .env.local   # completează cheile Supabase (același proiect ca qapp v2)
npm run dev
```

## Variabile de mediu

| Var | Valoare |
|-----|---------|
| `VITE_SUPABASE_URL` | URL-ul proiectului Supabase qapp v2 |
| `VITE_SUPABASE_ANON_KEY` | anon key public al aceluiași proiect |

## Deploy

Vercel (framework preset: **Vite**). `vercel.json` rutează SPA-ul (fallback la `index.html`).
Setează cele 2 variabile de mediu în Vercel. Stack: Vite + React 19 + TypeScript + Supabase.
