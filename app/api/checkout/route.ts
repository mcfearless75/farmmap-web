import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { calculateApplicationFee } from '@/lib/tiers'
import type { CartItem } from '@/lib/cart'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  let items: CartItem[]
  try {
    const body = await req.json() as { items?: CartItem[] }
    items = body.items ?? []
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!items.length) {
    return NextResponse.json({ error: 'Basket is empty' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://farmmap.co.uk'

  // Look up the shop to get Connect account + tier for commission calculation
  let connectAccountId: string | null = null
  let shopTier = 'free'
  let shopId: string | null = null

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseAnon) {
    const supabase = createClient(supabaseUrl, supabaseAnon)
    const { data: shop } = await supabase
      .from('shops')
      .select('id, tier, stripe_connect_account_id, stripe_connect_charges_ok')
      .eq('slug', items[0].shopSlug)
      .single()

    if (shop) {
      shopTier         = shop.tier ?? 'free'
      shopId           = shop.id
      connectAccountId = (shop.stripe_connect_charges_ok && shop.stripe_connect_account_id)
        ? shop.stripe_connect_account_id
        : null
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
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      shipping_address_collection: { allowed_countries: ['GB'] },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/checkout/cancel`,
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
    const message = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
