import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/subscriptions/cancel
 * Cancels the active subscription at period end.
 * Body: { shopSlug: string }
 */
export async function POST(req: NextRequest) {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const stripeKey  = process.env.STRIPE_SECRET_KEY

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  if (!stripeKey) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
  }

  const sessionClient = await createServerClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json() as { shopSlug?: string }
  const { shopSlug } = body

  if (!shopSlug) {
    return NextResponse.json({ error: 'shopSlug is required' }, { status: 400 })
  }

  // Verify shop ownership
  const { data: shop } = await sessionClient
    .from('shops')
    .select('id, stripe_subscription_id, subscription_status')
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found or not owned by you' }, { status: 403 })
  }

  // Find active subscription record
  const adminClient = createClient(url, serviceKey)
  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('id, stripe_subscription_id, cancel_at_period_end')
    .eq('shop_id', shop.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }

  if (subscription.cancel_at_period_end) {
    return NextResponse.json({ error: 'Subscription is already set to cancel' }, { status: 409 })
  }

  const stripeSubId = subscription.stripe_subscription_id ?? shop.stripe_subscription_id

  if (!stripeSubId) {
    return NextResponse.json({ error: 'No Stripe subscription ID on record' }, { status: 422 })
  }

  // Cancel at period end via Stripe
  const stripe = new Stripe(stripeKey)

  let stripeSub: Stripe.Subscription

  try {
    stripeSub = await stripe.subscriptions.update(stripeSubId, {
      cancel_at_period_end: true,
    })
  } catch (err) {
    console.error('[subscriptions/cancel]', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 502 })
  }

  // Update subscriptions table
  const { error: dbError } = await adminClient
    .from('subscriptions')
    .update({ cancel_at_period_end: true })
    .eq('id', subscription.id)

  if (dbError) {
    console.error('[subscriptions/cancel] db error', dbError)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }

  return NextResponse.json({
    cancelled:  true,
    period_end: (stripeSub as unknown as { current_period_end: number }).current_period_end,
  })
}
