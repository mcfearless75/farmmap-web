import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { calculateApplicationFee } from '@/lib/tiers'
import type { CartItem } from '@/lib/cart'

function isValidCartItem(x: unknown): x is CartItem {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string'       && o.id.length > 0 &&
    typeof o.name === 'string'     && o.name.length > 0 &&
    typeof o.price === 'number'    && isFinite(o.price) && o.price > 0 &&
    typeof o.quantity === 'number' && Number.isInteger(o.quantity) && o.quantity >= 1 &&
    typeof o.unit === 'string'     && o.unit.length > 0 &&
    typeof o.shopSlug === 'string' && o.shopSlug.length > 0 &&
    typeof o.shopName === 'string' && o.shopName.length > 0 &&
    (o.image === undefined || typeof o.image === 'string')
  )
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  // FIX 1 — Runtime validation of CartItem array
  let items: CartItem[]
  try {
    const body: unknown = await req.json()
    if (
      !body ||
      typeof body !== 'object' ||
      !Array.isArray((body as Record<string, unknown>).items) ||
      (body as Record<string, unknown[]>).items.length === 0 ||
      !(body as Record<string, unknown[]>).items.every(isValidCartItem)
    ) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    items = (body as { items: CartItem[] }).items
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://farmmap.co.uk'

  // FIX 2 — Require Supabase config; no silent price bypass
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  const supabase = createClient(supabaseUrl, supabaseAnon)

  // FIX 3 — Look up shop first so we can constrain the products query
  let connectAccountId: string | null = null
  let shopTier = 'free'
  let shopId: string | null = null

  const { data: shop } = await supabase
    .from('shops')
    .select('id, tier, stripe_connect_account_id, stripe_connect_charges_ok')
    .eq('slug', items[0].shopSlug)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 400 })
  }

  shopTier         = shop.tier ?? 'free'
  shopId           = shop.id
  connectAccountId = (shop.stripe_connect_charges_ok && shop.stripe_connect_account_id)
    ? shop.stripe_connect_account_id
    : null

  // FIX 3 — Verify products are active, approved, and belong to this shop
  const ids = items.map(i => i.id)
  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, price')
    .in('id', ids)
    .eq('shop_id', shopId)
    .eq('active', true)
    .eq('status', 'approved')

  if (!dbProducts || dbProducts.length !== ids.length) {
    return NextResponse.json({ error: 'One or more products not found' }, { status: 400 })
  }

  const priceMap = new Map<string, number>(dbProducts.map(p => [p.id, p.price]))
  for (const item of items) {
    const dbPrice = priceMap.get(item.id)
    if (dbPrice === undefined) {
      return NextResponse.json({ error: 'Product not found' }, { status: 400 })
    }
    if (Math.abs(Math.round(dbPrice * 100) - Math.round(item.price * 100)) > 1) {
      return NextResponse.json({ error: 'Price mismatch — please refresh your basket' }, { status: 400 })
    }
  }

  const subtotalPence = items.reduce((s, i) => s + Math.round(i.price * 100) * i.quantity, 0)
  const appFeePence   = calculateApplicationFee(subtotalPence, shopTier as any)

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode:                 'payment',
      line_items: items.map(item => ({
        price_data: {
          currency: 'gbp',
          product_data: {
            name:        item.name,
            description: `${item.unit} — ${item.shopName}`,
            ...(item.image ? { images: [item.image] } : {}),
          },
          // FIX 4 — Use verified DB price, not client-supplied price
          unit_amount: Math.round((priceMap.get(item.id) ?? item.price) * 100),
        },
        quantity: item.quantity,
      })),
      shipping_address_collection: { allowed_countries: ['GB'] },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/checkout/cancel?shop=${encodeURIComponent(items[0].shopSlug)}`,
      metadata: {
        shop_id:            shopId ?? '',
        shop_slug:          items[0].shopSlug,
        shop_name:          items[0].shopName,
        shop_tier:          shopTier,
        item_count:         String(items.reduce((s, i) => s + i.quantity, 0)),
        connect_account_id: connectAccountId ?? '',
        items_json:         JSON.stringify(items.map(i => ({
          id: i.id, name: i.name, price: i.price, quantity: i.quantity, unit: i.unit,
        }))),
      },
      payment_intent_data: {
        description: `Farmmap order — ${items[0].shopName}`,
        // If the shop has a Connect account, route payment through it
        ...(connectAccountId ? {
          application_fee_amount: appFeePence,
          transfer_data:          { destination: connectAccountId },
        } : {}),
      },
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
