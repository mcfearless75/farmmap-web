import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { TIER_CONFIG } from '@/lib/tiers'
import type { Tier } from '@/lib/tiers'

/**
 * POST /api/subscriptions/create
 * Creates a Stripe Checkout session for a tier subscription.
 * Redirects the user to Stripe to enter card details.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const body = await req.json() as {
    shopSlug:     string
    tier:         Exclude<Tier, 'free'>
    billingCycle: 'monthly' | 'annual'
  }
  const { shopSlug, tier, billingCycle } = body

  const config = TIER_CONFIG[tier]
  if (!config) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const priceId = billingCycle === 'annual'
    ? config.stripeAnnualPriceId
    : config.stripeMonthlyPriceId

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price ID not configured for ${tier} ${billingCycle}` },
      { status: 503 }
    )
  }

  // Verify ownership
  const { data: shop } = await supabase
    .from('shops')
    .select('id, tier, stripe_connect_account_id')
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found or not owned by you' }, { status: 403 })
  }

  // Silver/Gold require Connect to be set up first
  if (config.requiresConnect && !shop.stripe_connect_account_id) {
    return NextResponse.json(
      { error: 'Stripe Connect required — set up your Stripe account first' },
      { status: 400 }
    )
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://farmmap.co.uk'

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items:           [{ price: priceId, quantity: 1 }],
      success_url:          `${siteUrl}/dashboard/${shopSlug}?upgrade_success=1`,
      cancel_url:           `${siteUrl}/dashboard/${shopSlug}/upgrade?cancelled=1`,
      customer_email:       user.email,
      metadata: {
        shop_id:       shop.id,
        shop_slug:     shopSlug,
        tier,
        billing_cycle: billingCycle,
        user_id:       user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
