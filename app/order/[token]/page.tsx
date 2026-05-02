import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { formatPence } from '@/lib/tiers'
import { CheckCircle, Circle } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export const metadata: Metadata = {
  title: 'Track your order — Farmmap',
}

interface OrderItem {
  name:        string
  qty:         number
  price_pence: number
  total_pence: number
}

interface DeliveryAddress {
  line1?:    string
  line2?:    string
  city?:     string
  county?:   string
  postcode?: string
}

type StepKey = 'placed' | 'accepted' | 'preparing' | 'dispatched' | 'delivered'

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'placed',     label: 'Placed' },
  { key: 'accepted',   label: 'Accepted' },
  { key: 'preparing',  label: 'Preparing' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered',  label: 'Delivered' },
]

const STATUS_STEP_INDEX: Record<string, number> = {
  pending:    0,
  accepted:   1,
  preparing:  2,
  dispatched: 3,
  delivered:  4,
}

const STATUS_COLOURS: Record<string, string> = {
  pending:            '#b45309',
  accepted:           '#1d4ed8',
  preparing:          '#4338ca',
  dispatched:         '#7c3aed',
  delivered:          '#15803d',
  cancelled:          '#6b7280',
  refunded:           '#b91c1c',
  partially_refunded: '#b91c1c',
  disputed:           '#b91c1c',
}

const STATUS_LABELS: Record<string, string> = {
  pending:            'Pending',
  accepted:           'Accepted',
  preparing:          'Preparing',
  dispatched:         'Dispatched',
  delivered:          'Delivered',
  cancelled:          'Cancelled',
  refunded:           'Refunded',
  partially_refunded: 'Part refunded',
  disputed:           'Disputed',
}

const CANCELLED_STATUSES = new Set(['cancelled', 'refunded', 'partially_refunded', 'disputed'])

export default async function OrderTrackingPage({ params }: Props) {
  const { token } = await params

  const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Service temporarily unavailable.</p>
      </main>
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, customer_name, shop_name,
      amount_total, subtotal_pence, delivery_fee_pence,
      order_status, placed_at, created_at,
      accepted_at, dispatched_at, delivered_at,
      delivery_address, order_items
    `)
    .eq('tracking_token', token)
    .single()

  if (!order) notFound()

  const status    = (order.order_status as string) ?? 'pending'
  const colour    = STATUS_COLOURS[status] ?? '#6b7280'
  const label     = STATUS_LABELS[status]  ?? status
  const isCancelled = CANCELLED_STATUSES.has(status)
  const isDelivered = status === 'delivered'
  const stepIndex = STATUS_STEP_INDEX[status] ?? 0
  const items     = (order.order_items as OrderItem[] | null) ?? []
  const address   = order.delivery_address as DeliveryAddress | null

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header band */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 text-center">
        <p className="text-xs text-gray-400 mb-0.5">Farmmap order tracking</p>
        <p className="font-mono text-sm font-semibold text-gray-700">
          {order.order_number ?? token.slice(0, 12)}
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Status badge */}
        <div className="text-center">
          <span
            className="inline-block text-base font-bold px-5 py-2 rounded-full"
            style={{ background: `${colour}18`, color: colour }}
          >
            {label}
          </span>
          {isDelivered && (
            <p className="text-sm text-gray-500 mt-3">
              Thank you for your order! We hope you enjoy it.
            </p>
          )}
          {isCancelled && (
            <p className="text-sm text-gray-500 mt-3">
              This order has been {label.toLowerCase()}. Please contact the shop if you have any questions.
            </p>
          )}
        </div>

        {/* Progress stepper — only show for non-cancelled */}
        {!isCancelled && (
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-5">
            <div className="flex items-center justify-between relative">
              {/* Connecting line */}
              <div className="absolute left-5 right-5 top-4 h-0.5 bg-gray-100" />
              <div
                className="absolute left-5 top-4 h-0.5 bg-green-600 transition-all"
                style={{ width: stepIndex === 0 ? '0%' : `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
              />

              {STEPS.map((step, i) => {
                const done    = i <= stepIndex
                const current = i === stepIndex
                return (
                  <div key={step.key} className="relative flex flex-col items-center gap-1.5 z-10">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors"
                      style={
                        done
                          ? { background: '#15803d', borderColor: '#15803d' }
                          : { background: '#fff', borderColor: '#e5e7eb' }
                      }
                    >
                      {done
                        ? <CheckCircle className="w-4 h-4 text-white" />
                        : <Circle className="w-3 h-3 text-gray-300" />
                      }
                    </div>
                    <span
                      className="text-xs font-medium whitespace-nowrap"
                      style={{ color: done ? '#15803d' : (current ? '#374151' : '#9ca3af') }}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Shop + summary */}
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">
            {order.shop_name}
          </p>

          {items.length > 0 ? (
            <div className="space-y-2 mb-4">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.qty > 1 && <span className="text-gray-400 mr-1">{item.qty}×</span>}
                    {item.name}
                  </span>
                  <span className="font-medium text-gray-900 tabular-nums ml-4">
                    {formatPence(item.total_pence)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="pt-3 border-t border-gray-50 space-y-1">
            {order.subtotal_pence != null && order.delivery_fee_pence != null && order.delivery_fee_pence > 0 && (
              <>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatPence(order.subtotal_pence)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery</span>
                  <span className="tabular-nums">{formatPence(order.delivery_fee_pence)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1">
              <span>Total</span>
              <span className="tabular-nums">{formatPence(order.amount_total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        {address && (
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">
              Delivery address
            </p>
            <address className="not-italic text-sm text-gray-600 space-y-0.5">
              {address.line1    && <p>{address.line1}</p>}
              {address.line2    && <p>{address.line2}</p>}
              {address.city     && <p>{address.city}</p>}
              {address.county   && <p>{address.county}</p>}
              {address.postcode && <p className="font-medium">{address.postcode}</p>}
            </address>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Powered by{' '}
          <a href="https://farmmap.co.uk" className="underline hover:text-gray-600">
            Farmmap
          </a>
        </p>
      </div>
    </main>
  )
}
