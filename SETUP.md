# Farmmap — Launch 2 Setup Checklist

Fast reference for getting the full stack live. Do these in order.

---

## 1. Supabase — Run Migrations

In the Supabase SQL Editor, run each file in order:

| File | What it does |
|------|-------------|
| `supabase/migrations/004_launch2_schema.sql` | Tiers, subscriptions, products, delivery zones, orders (extended), commission ledger |

> Migration 004 is self-contained — it creates `orders` if missing, then extends it. Safe to run even if 003 was never applied.

---

## 2. Environment Variables

Set all of these in Vercel (Production + Preview) and `.env.local` for local dev.

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Sanity CMS
```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=
```

### Stripe — Platform account
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe — Connect (OAuth)
```
STRIPE_CONNECT_CLIENT_ID=ca_...
```

### Stripe — Subscription price IDs (create these in Stripe Dashboard)
```
STRIPE_BRONZE_MONTHLY_PRICE_ID=price_...   # £20/mo
STRIPE_BRONZE_ANNUAL_PRICE_ID=price_...    # £200/yr
STRIPE_SILVER_MONTHLY_PRICE_ID=price_...   # £60/mo
STRIPE_SILVER_ANNUAL_PRICE_ID=price_...    # £600/yr
STRIPE_GOLD_MONTHLY_PRICE_ID=price_...     # £100/mo
STRIPE_GOLD_ANNUAL_PRICE_ID=price_...      # £1,000/yr
```

### Email
```
RESEND_API_KEY=re_...
```

### Site
```
NEXT_PUBLIC_SITE_URL=https://farmmap.co.uk
```

---

## 3. Stripe — Create Products & Prices

In Stripe Dashboard → Products:

| Product | Monthly price | Annual price |
|---------|--------------|-------------|
| Farmmap Bronze | £20.00 GBP recurring monthly | £200.00 GBP recurring yearly |
| Farmmap Silver | £60.00 GBP recurring monthly | £600.00 GBP recurring yearly |
| Farmmap Gold | £100.00 GBP recurring monthly | £1,000.00 GBP recurring yearly |

Copy the 6 price IDs into Vercel env vars above.

---

## 4. Stripe — Connect Setup

1. Dashboard → Settings → Connect → Enable Connect
2. Set redirect URI: `https://farmmap.co.uk/api/stripe/connect/callback`
3. Copy Client ID (`ca_...`) → `STRIPE_CONNECT_CLIENT_ID`

Silver and Gold shops must connect their own Stripe account before they can take orders. The `/dashboard/[slug]/upgrade` page handles this flow.

---

## 5. Stripe — Webhook

Dashboard → Developers → Webhooks → Add endpoint:

**URL:** `https://farmmap.co.uk/api/webhook/stripe`

**Events to subscribe:**
```
checkout.session.completed
account.updated
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
charge.refunded
```

Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

---

## 6. Resend — Domain

1. Add `farmmap.co.uk` in Resend → Domains
2. Add the DNS records (SPF, DKIM, DMARC) at your registrar
3. Emails send from `orders@farmmap.co.uk`

---

## 7. Vercel Deploy

```bash
git push origin master
```

Vercel auto-deploys on push. Check the build log — all 39 routes should compile.

No additional Vercel config needed beyond env vars.

---

## Route Map

### Public
| Route | Purpose |
|-------|---------|
| `/` | Landing + map |
| `/shop/[slug]` | Shop public page with products |
| `/order/[token]` | Order tracking (no login) |
| `/checkout/success` | Post-payment confirmation |

### Shop Owner Dashboard
| Route | Purpose |
|-------|---------|
| `/dashboard/[slug]` | Overview stats |
| `/dashboard/[slug]/products` | Product list |
| `/dashboard/[slug]/products/new` | Add product |
| `/dashboard/[slug]/products/[id]/edit` | Edit/publish product |
| `/dashboard/[slug]/orders` | Order management (Silver+) |
| `/dashboard/[slug]/orders/[id]` | Order detail + status update |
| `/dashboard/[slug]/zones` | Delivery zones (Silver+) |
| `/dashboard/[slug]/settings` | Branding + Stripe + subscription |
| `/dashboard/[slug]/upgrade` | Tier upgrade flow |

### API
| Route | Purpose |
|-------|---------|
| `POST /api/checkout` | Create Stripe checkout session |
| `POST /api/products` | Create product |
| `GET/PATCH/DELETE /api/products/[id]` | Manage product |
| `PATCH /api/orders/[id]` | Update order status |
| `POST /api/zones` | Create delivery zone |
| `PATCH/DELETE /api/zones/[id]` | Manage zone |
| `PATCH /api/shops/[slug]/settings` | Update shop branding |
| `POST /api/subscriptions/create` | Start Stripe subscription checkout |
| `POST /api/subscriptions/cancel` | Cancel at period end |
| `GET /api/stripe/connect` | Start Connect OAuth |
| `GET /api/stripe/connect/callback` | Complete Connect OAuth |
| `POST /api/webhook/stripe` | Stripe webhook handler |

---

## Commission Rules

| Tier | Rate | Threshold |
|------|------|-----------|
| Free | 0% | — |
| Bronze | 0% | — |
| Silver | 3% | Orders over £20 |
| Gold | 5% | Orders over £30 |

Commission is taken as a Stripe `application_fee_amount` on the Connect payment and recorded in `commission_ledger`.

---

## Product Moderation Flow

1. Shop owner adds product → `status = pending`, `active = false`
2. Admin reviews at `/admin/queue` → approves or rejects with note
3. On approval: `status = approved` — owner can then toggle `active = true` to publish
4. Published products appear on the public shop page

---

## Known Limitations (next sprint)

- No image upload UI — shop owners paste image URLs manually
- No customer address collection at checkout (delivery address flow not yet built)
- Admin moderation queue UI exists but product moderation actions not yet wired
- No automated low-stock email alerts
- Stripe Connect OAuth requires HTTPS — use ngrok for local webhook testing
