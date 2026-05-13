import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/stripe/connect/callback
 * Handles the Stripe OAuth return. Exchanges code for account ID and
 * stores it against the shop.
 */
export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://farmmap.co.uk'

  const code  = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    const desc = req.nextUrl.searchParams.get('error_description') ?? error
    return NextResponse.redirect(
      `${siteUrl}/dashboard?connect_error=${encodeURIComponent(desc)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(`${siteUrl}/dashboard?connect_error=invalid_callback`)
  }

  // State is "nonce:userId:shopSlug" — verify nonce matches cookie
  const stateParts = state.split(':')
  if (stateParts.length < 3) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  }
  const [nonce, userId, ...slugParts] = stateParts
  const shopSlug = slugParts.join(':')

  const storedNonce = req.cookies.get('stripe_connect_state')?.value
  if (!storedNonce || storedNonce !== nonce) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  }

  // Clear the state cookie — single use
  const clearStateCookie = (res: NextResponse) => {
    res.cookies.set('stripe_connect_state', '', { maxAge: 0, path: '/' })
    return res
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return NextResponse.redirect(`${siteUrl}/auth/sign-in`)
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(`${siteUrl}/dashboard?connect_error=not_configured`)
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  let accountId: string
  try {
    const response = await stripe.oauth.token({ grant_type: 'authorization_code', code })
    if (!response.stripe_user_id) throw new Error('No account ID returned')
    accountId = response.stripe_user_id
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'stripe_error'
    return clearStateCookie(NextResponse.redirect(
      `${siteUrl}/dashboard/${shopSlug}/upgrade?connect_error=${encodeURIComponent(msg)}`
    ))
  }

  // Fetch account to check charges/payouts status
  const account = await stripe.accounts.retrieve(accountId)

  const { error: updateErr } = await supabase
    .from('shops')
    .update({
      stripe_connect_account_id:   accountId,
      stripe_connect_charges_ok:  account.charges_enabled   ?? false,
      stripe_connect_payouts_ok:  account.payouts_enabled   ?? false,
    })
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)

  if (updateErr) {
    return clearStateCookie(NextResponse.redirect(
      `${siteUrl}/dashboard/${shopSlug}/upgrade?connect_error=db_error`
    ))
  }

  return clearStateCookie(NextResponse.redirect(
    `${siteUrl}/dashboard/${shopSlug}/upgrade?connect_success=1`
  ))
}
