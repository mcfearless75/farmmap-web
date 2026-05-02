import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Must read raw body for Stripe signature verification
export async function POST(req: NextRequest) {
  const stripeKey    = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey)
  const resend  = new Resend(process.env.RESEND_API_KEY)
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Service-role client bypasses RLS
    const supabase = createClient(supabaseUrl, serviceKey)

    await supabase.from('orders').insert({
      stripe_session_id: session.id,
      amount_total:      session.amount_total,           // pence
      customer_email:    session.customer_details?.email ?? null,
      customer_name:     session.customer_details?.name  ?? null,
      shop_slug:         session.metadata?.shop_slug     ?? null,
      shop_name:         session.metadata?.shop_name     ?? null,
      item_count:        Number(session.metadata?.item_count ?? 0),
      status:            'paid',
    })

    // Confirmation email to customer
    const customerEmail = session.customer_details?.email
    if (customerEmail && process.env.RESEND_API_KEY) {
      const total = ((session.amount_total ?? 0) / 100).toFixed(2)
      const shopName = session.metadata?.shop_name ?? 'the farm shop'

      await resend.emails.send({
        from:    'Farmmap Orders <orders@farmmap.co.uk>',
        to:      customerEmail,
        subject: `Order confirmed — ${shopName}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 16px">
            <h2 style="color:#14532d;margin-bottom:8px">Order confirmed!</h2>
            <p style="color:#374151;line-height:1.6">
              Your payment of <strong>£${total}</strong> to <strong>${shopName}</strong> was successful.
            </p>
            <p style="color:#374151;line-height:1.6">
              The farm shop will be in touch to arrange delivery or collection.
              Keep an eye on your inbox.
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
            <p style="color:#9ca3af;font-size:13px">
              The Farmmap team — <a href="https://farmmap.co.uk" style="color:#15803d">farmmap.co.uk</a>
            </p>
          </div>
        `,
      })
    }
  }

  return NextResponse.json({ received: true })
}
