import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { calculateApplicationFee } from '@/lib/tiers'
import type { Tier } from '@/lib/tiers'

export async function POST(req: NextRequest) {
  const stripeKey     = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const stripe   = new Stripe(stripeKey)
  const supabase = createClient(supabaseUrl, serviceKey)
  const resend   = new Resend(process.env.RESEND_API_KEY)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  // ── Route by event type ──────────────────────────────────────────────────
  switch (event.type) {

    // ── Customer order completed ───────────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Only handle payment mode (not subscription mode)
      if (session.mode !== 'payment') break

      const subtotalPence = session.amount_subtotal ?? session.amount_total ?? 0
      const shopTier      = (session.metadata?.shop_tier as Tier) ?? 'silver'
      const appFeePence   = calculateApplicationFee(subtotalPence, shopTier)

      // Upsert order (idempotent via stripe_session_id unique constraint)
      const { data: order } = await supabase.from('orders').upsert({
        stripe_session_id:          session.id,
        amount_total:               session.amount_total,
        subtotal_pence:             subtotalPence,
        application_fee_pence:      appFeePence,
        customer_email:             session.customer_details?.email   ?? null,
        customer_name:              session.customer_details?.name    ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delivery_address:           (session as any).shipping_details?.address ?? null,
        shop_slug:                  session.metadata?.shop_slug     ?? null,
        shop_name:                  session.metadata?.shop_name     ?? null,
        item_count:                 Number(session.metadata?.item_count ?? 0),
        order_status:               'accepted',
        stripe_connect_account_id:  session.metadata?.connect_account_id ?? null,
        order_items:                (() => {
          try {
            return session.metadata?.items_json ? JSON.parse(session.metadata.items_json) : null
          } catch {
            return null
          }
        })(),
        placed_at:                  new Date().toISOString(),
        status:                     'paid',
      }, { onConflict: 'stripe_session_id', ignoreDuplicates: true })
        .select('id, shop_id, order_number, tracking_token')
        .single()

      // Write commission ledger entry if there's a Connect fee
      if (order && appFeePence > 0 && session.metadata?.shop_id) {
        await supabase.from('commission_ledger').insert({
          order_id:                order.id,
          shop_id:                 session.metadata.shop_id,
          stripe_session_id:       session.id,
          order_subtotal_pence:    subtotalPence,
          commission_pence:        appFeePence,
          tier_at_time:            shopTier,
        })
      }

      // Order confirmation email to customer
      const customerEmail = session.customer_details?.email
      if (customerEmail && process.env.RESEND_API_KEY) {
        const total    = ((session.amount_total ?? 0) / 100).toFixed(2)
        const shopName = session.metadata?.shop_name ?? 'the farm shop'
        await resend.emails.send({
          from:    'Farmmap Orders <orders@farmmap.co.uk>',
          to:      customerEmail,
          subject: `Order confirmed — ${shopName}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 16px">
              <h2 style="color:#14532d">Order confirmed!</h2>
              <p style="color:#374151;line-height:1.6">
                Your payment of <strong>£${total}</strong> to
                <strong>${shopName}</strong> was successful.
              </p>
              <p style="color:#374151;line-height:1.6">
                The farm shop will be in touch to arrange delivery or collection.
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
              <p style="color:#9ca3af;font-size:13px">Farmmap —
                <a href="https://farmmap.co.uk" style="color:#15803d">farmmap.co.uk</a>
              </p>
            </div>`,
        })
      }

      // Shop owner notification email
      if (session.metadata?.shop_id && process.env.RESEND_API_KEY) {
        try {
          const { data: ownerData } = await supabase
            .from('shops')
            .select('owner_user_id')
            .eq('id', session.metadata.shop_id)
            .single()

          if (ownerData?.owner_user_id) {
            const { data: { user: ownerUser } } = await supabase.auth.admin.getUserById(ownerData.owner_user_id)

            if (ownerUser?.email) {
              const orderNum  = (order as { order_number?: string } | null)?.order_number ?? session.id.slice(-8).toUpperCase()
              const shopName  = session.metadata?.shop_name ?? 'your shop'
              const total     = ((session.amount_total ?? 0) / 100).toFixed(2)
              const itemCount = Number(session.metadata?.item_count ?? 0)
              const trackUrl  = (order as { tracking_token?: string } | null)?.tracking_token
                ? `${process.env.NEXT_PUBLIC_SITE_URL}/order/${(order as { tracking_token?: string }).tracking_token}`
                : null

              await resend.emails.send({
                from:    'Farmmap Orders <orders@farmmap.co.uk>',
                to:      ownerUser.email,
                subject: `New order ${orderNum} — £${total}`,
                html: `
                  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 16px">
                    <h2 style="color:#14532d">New order received</h2>
                    <p style="color:#374151;line-height:1.6">
                      <strong>${shopName}</strong> has received a new order for
                      <strong>£${total}</strong> (${itemCount} item${itemCount !== 1 ? 's' : ''}).
                    </p>
                    <p style="color:#374151;line-height:1.6">
                      Order reference: <strong>${orderNum}</strong>
                    </p>
                    ${trackUrl ? `<p><a href="${trackUrl}" style="color:#15803d">View order tracking page →</a></p>` : ''}
                    <p style="color:#374151;line-height:1.6">
                      Log in to your dashboard to accept or manage this order.
                    </p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
                    <p style="color:#9ca3af;font-size:13px">Farmmap — <a href="https://farmmap.co.uk" style="color:#15803d">farmmap.co.uk</a></p>
                  </div>`,
              })
            }
          }
        } catch {
          // Owner notification failure must not break the webhook response
        }
      }
      break
    }

    // ── Stripe Connect account status updated ──────────────────────────────
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      await supabase
        .from('shops')
        .update({
          stripe_connect_charges_ok: account.charges_enabled  ?? false,
          stripe_connect_payouts_ok: account.payouts_enabled  ?? false,
        })
        .eq('stripe_connect_account_id', account.id)
      break
    }

    // ── Subscription created ───────────────────────────────────────────────
    case 'customer.subscription.created': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub  = event.data.object as any
      const meta = (sub.metadata ?? {}) as Record<string, string>
      if (!meta.shop_id || !meta.tier) break

      const periodStart = sub.current_period_start ?? sub.billing_cycle_anchor ?? null
      const periodEnd   = sub.current_period_end   ?? null

      await supabase.from('subscriptions').upsert({
        shop_id:                  meta.shop_id,
        stripe_subscription_id:   sub.id,
        stripe_customer_id:       typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
        tier:                     meta.tier,
        status:                   sub.status,
        billing_cycle:            meta.billing_cycle ?? 'monthly',
        current_period_start:     periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end:       periodEnd   ? new Date(periodEnd   * 1000).toISOString() : null,
        cancel_at_period_end:     sub.cancel_at_period_end ?? false,
      }, { onConflict: 'stripe_subscription_id' })

      await supabase
        .from('shops')
        .update({
          tier:                    meta.tier,
          stripe_subscription_id:  sub.id,
          subscription_status:     sub.status,
          subscription_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        })
        .eq('id', meta.shop_id)
      break
    }

    // ── Subscription updated (renewal, plan change, cancel flag) ──────────
    case 'customer.subscription.updated': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub  = event.data.object as any
      const meta = (sub.metadata ?? {}) as Record<string, string>

      const periodEnd = sub.current_period_end ?? null

      await supabase
        .from('subscriptions')
        .update({
          status:               sub.status,
          current_period_start: sub.current_period_start
            ? new Date(sub.current_period_start * 1000).toISOString() : null,
          current_period_end:   periodEnd
            ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          updated_at:           new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)

      if (meta.shop_id) {
        await supabase
          .from('shops')
          .update({
            subscription_status:     sub.status,
            subscription_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString() : null,
          })
          .eq('id', meta.shop_id)
      }
      break
    }

    // ── Subscription cancelled (period ended) ─────────────────────────────
    case 'customer.subscription.deleted': {
      const sub  = event.data.object as Stripe.Subscription
      const meta = sub.metadata as Record<string, string>

      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)

      // Downgrade the shop back to free
      if (meta.shop_id) {
        await supabase
          .from('shops')
          .update({ tier: 'free', subscription_status: 'cancelled', stripe_subscription_id: null })
          .eq('id', meta.shop_id)
      }
      break
    }

    // ── Invoice paid (subscription renewal) ───────────────────────────────
    case 'invoice.payment_succeeded': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv = event.data.object as any
      const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id
      if (subId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId)
      }
      break
    }

    // ── Payment failed — mark subscription past_due ────────────────────────
    case 'invoice.payment_failed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv = event.data.object as any
      const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id
      if (subId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId)
      }
      break
    }

    // ── Refund processed ──────────────────────────────────────────────────
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const sessionId = charge.metadata?.stripe_session_id ?? charge.payment_intent as string

      if (sessionId) {
        const refundedTotal = charge.amount_refunded
        const isFullRefund  = charge.refunded

        await supabase
          .from('orders')
          .update({ order_status: isFullRefund ? 'refunded' : 'partially_refunded' })
          .eq('stripe_session_id', sessionId)

        // Update commission ledger if applicable
        await supabase
          .from('commission_ledger')
          .update({ refunded_pence: refundedTotal, refunded_at: new Date().toISOString() })
          .eq('stripe_session_id', sessionId)
      }
      break
    }

    default:
      // Unhandled event type — safe to ignore
      break
  }

  return NextResponse.json({ received: true })
}
