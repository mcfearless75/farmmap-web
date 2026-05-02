import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/stripe/connect?shop=<slug>
 * Initiates Stripe Connect OAuth for a shop owner upgrading to Silver/Gold.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://farmmap.co.uk'

  if (!user) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  }

  const shopSlug = req.nextUrl.searchParams.get('shop')
  if (!shopSlug) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 })
  }

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Stripe Connect not configured' }, { status: 503 })
  }

  // Verify the user owns this shop before starting OAuth
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found or not owned by you' }, { status: 403 })
  }

  const params = new URLSearchParams({
    response_type:               'code',
    client_id:                   clientId,
    scope:                       'read_write',
    redirect_uri:                `${siteUrl}/api/stripe/connect/callback`,
    state:                       `${user.id}:${shopSlug}`,
    'stripe_user[business_type]': 'individual',
    'stripe_user[country]':      'GB',
  })

  return NextResponse.redirect(
    `https://connect.stripe.com/oauth/authorize?${params.toString()}`
  )
}
