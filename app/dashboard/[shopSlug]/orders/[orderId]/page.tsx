import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPence } from '@/lib/tiers'
import { OrderActions } from './OrderActions'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ shopSlug: string; orderId: string }>
}

export const metadata: Metadata = {
  title: 'Order Detail — Farmmap Dashboard',
  robots: { index: false },
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
  postcode?: string
  county?:   string
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function OrderDetailPage({ params }: Props) {
  const { shopSlug, orderId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: shop } = await supabase
    .from('shops')
    .select('id, tier')
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) redirect('/')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_email,
      amount_total, subtotal_pence, delivery_fee_pence, vat_pence,
      application_fee_pence, order_status, placed_at, created_at,
      accepted_at, dispatched_at, delivered_at,
      delivery_address, order_items, shop_note, tracking_token,
      stripe_connect_account_id
    `)
    .eq('id', orderId)
    .eq('shop_id', shop.id)
    .single()

  if (!order) notFound()

  const status  = (order.order_status as string) ?? 'pending'
  const colour  = STATUS_COLOURS[status] ?? '#6b7280'
  const label   = STATUS_LABELS[status]  ?? status
  const items   = (order.order_items as OrderItem[] | null) ?? []
  const address = order.delivery_address as DeliveryAddress | null

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">
            <a
              href={`/dashboard/${shopSlug}/orders`}
              className="hover:text-gray-600 cursor-pointer transition-colors"
            >
              Orders
            </a>
            {' / '}
            <span className="font-mono">{order.order_number ?? orderId.slice(0, 8)}</span>
          </p>
          <h1
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {order.order_number ?? 'Order'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {order.placed_at ? formatDate(order.placed_at) : formatDate(order.created_at)}
          </p>
        </div>
        <span
          className="inline-block text-sm font-semibold px-3 py-1 rounded-full"
          style={{ background: `${colour}18`, color: colour }}
        >
          {label}
        </span>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left column — 2/3 */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Order items */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">Items</h2>
            </div>
            {items.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Product', 'Qty', 'Unit price', 'Total'].map(h => (
                      <th key={h} className="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-5 py-3 text-gray-500 tabular-nums">{item.qty}</td>
                      <td className="px-5 py-3 text-gray-500 tabular-nums">{formatPence(item.price_pence)}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900 tabular-nums">{formatPence(item.total_pence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-4 text-sm text-gray-400">No item details available.</p>
            )}

            {/* Totals */}
            <div className="px-5 py-3 border-t border-gray-50 space-y-1">
              {order.subtotal_pence != null && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatPence(order.subtotal_pence)}</span>
                </div>
              )}
              {order.delivery_fee_pence != null && order.delivery_fee_pence > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery</span>
                  <span className="tabular-nums">{formatPence(order.delivery_fee_pence)}</span>
                </div>
              )}
              {order.vat_pence != null && order.vat_pence > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>VAT</span>
                  <span className="tabular-nums">{formatPence(order.vat_pence)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total</span>
                <span className="tabular-nums">{formatPence(order.amount_total)}</span>
              </div>
              {order.application_fee_pence != null && order.application_fee_pence > 0 && (
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Platform fee deducted</span>
                  <span className="tabular-nums">{formatPence(order.application_fee_pence)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer details */}
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Customer</h2>
            <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
            <p className="text-sm text-gray-500">{order.customer_email}</p>
          </div>

          {/* Delivery address */}
          {address && (
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Delivery address</h2>
              <address className="not-italic text-sm text-gray-600 space-y-0.5">
                {address.line1    && <p>{address.line1}</p>}
                {address.line2    && <p>{address.line2}</p>}
                {address.city     && <p>{address.city}</p>}
                {address.county   && <p>{address.county}</p>}
                {address.postcode && <p className="font-medium">{address.postcode}</p>}
              </address>
            </div>
          )}

          {/* Timeline */}
          {(order.accepted_at || order.dispatched_at || order.delivered_at) && (
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h2>
              <div className="space-y-2 text-sm">
                {order.placed_at    && <p className="text-gray-500"><span className="font-medium text-gray-700">Placed</span> — {formatDate(order.placed_at)}</p>}
                {order.accepted_at  && <p className="text-gray-500"><span className="font-medium text-gray-700">Accepted</span> — {formatDate(order.accepted_at)}</p>}
                {order.dispatched_at && <p className="text-gray-500"><span className="font-medium text-gray-700">Dispatched</span> — {formatDate(order.dispatched_at)}</p>}
                {order.delivered_at && <p className="text-gray-500"><span className="font-medium text-gray-700">Delivered</span> — {formatDate(order.delivered_at)}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right column — 1/3 */}
        <div className="w-72 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Actions</h2>
            <OrderActions
              orderId={orderId}
              orderStatus={status}
              trackingToken={order.tracking_token as string | null}
              shopNote={order.shop_note as string | null}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
