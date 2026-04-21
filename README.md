# Farmmap

Interactive map directory of farm shops across the UK and Ireland.

**Operator:** Derrywilligan Farm Ltd (NI667971)  
**Domain:** farmmap.co.uk  
**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase (PostgreSQL + PostGIS) · MapLibre GL JS v5

---

## Quick start

### 1. Install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at supabase.com
2. SQL Editor → run `supabase/migrations/001_initial_schema.sql`
3. Dashboard → Extensions → enable `postgis`
4. Authentication → Users → Add user (your admin account)
5. In `profiles` table, set that user's `role` to `admin`

### 3. Environment

```bash
cp .env.local.example .env.local
# Fill in SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY
```

### 4. Dev server

```bash
npm run dev   # → http://localhost:3000
# Admin: http://localhost:3000/admin
```

---

## Seed the map (953 shops)

**Fast (no geocoding):**
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/seed-shops.mjs ../farmmap_seed_data_v3.csv
```

**With geocoding via Nominatim** (~20 min, 1 req/sec rate limit):
```bash
node scripts/seed-shops.mjs ../farmmap_seed_data_v3.csv --geocode
```

Or use the CSV Import button in the admin panel at `/admin/shops`.

---

## Structure

```
app/
  page.tsx                      Homepage — map
  shop/[slug]/page.tsx          Shop detail
  admin/                        Admin panel (login-protected)
    page.tsx                    Dashboard + stats
    shops/page.tsx              Shop list + CSV import
    shops/new/page.tsx          Add shop
    shops/[id]/edit/page.tsx    Edit / delete shop
    queue/page.tsx              Moderation queue
  (policies)/                   Privacy, terms, cookies, content policy

components/map/
  FarmMap.tsx                   MapLibre GL JS (client-only, dynamic import)
  MapFilters.tsx                Search + filter bar
  ShopListPanel.tsx             Sidebar list view

supabase/migrations/
  001_initial_schema.sql        Full DB schema + RLS policies + seed statements

scripts/
  seed-shops.mjs                CSV bulk importer
```

---

## Deploy to Vercel

1. Push to GitHub
2. Import at vercel.com/new
3. Add env vars (same as `.env.local`)
4. Deploy — Next.js auto-detected

---

## Phase roadmap

| Phase | Status | Scope |
|---|---|---|
| 1 — MVP | ✅ **Built** | Public map, shop pages, admin CRUD, CSV import |
| 2 — User submissions | Planned | Registration, add-a-shop, moderation emails |
| 3 — Confirmations & photos | Planned | Tick-box UI, photo pipeline, abuse detection |
| 4 — Farm owner accounts | Planned | Claim flow, verified badge |
| 5 — Polish & SEO | Planned | Regional pages, sitemap, analytics |

---

## Map tiles

[OpenFreeMap](https://openfreemap.org/) — free, no API key.  
**Attribution required:** © OpenStreetMap contributors (shown in footer).

---

## Legal

Policy drafts in `app/(policies)/`. **Solicitor review required before public launch.**  
Data processing agreements needed with Supabase, Vercel, and email provider.

## Getting Started (original)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
