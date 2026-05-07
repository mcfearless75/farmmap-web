import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPence } from '@/lib/tiers'
import { ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params:      Promise<{ shopSlug: string }>
  searchParams: Promise<{ status?: string }>
}

export const metadata: Metadata = {
  title: 'Orders — Farmmap Dashboard',
  robots: { index: false },
}

type OrderStatus =
  | 'pending' | 'accepted' | 'preparing' | 'dispatched' | 'delivered'
  | 'cancelled' | 'refunded' | 'partially_refunded' | 'disputed'

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

const FILTER_GROUPS: Record<string, OrderStatus[]> = {
  pending:   ['pending'],
  active:    ['accepted', 'preparing', 'dispatched'],
  completed: ['delivered', 'cancelled', 'refunded', 'partially_refunded', 'disputed'],
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })
}

export default async function OrdersPage({ params, searchParams }: Props) {
  const { shopSlug }    = await params
  const { status: filterKey } = await searchParams
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

  const tier = (shop.tier as string) ?? 'free'

  if (tier === 'free' || tier === 'bronze') {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
          Orders
        </h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm text-amber-800 mb-3">
            Order management requires Silver tier or above.
          </p>
          <Link
            href={`/dashboard/${shopSlug}/upgrade`}
            className="inline-block px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
            style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
          >
            Upgrade to Silver — £60/month
          </Link>
        </div>
      </div>
    )
  }

  let query = supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, item_count, amount_total, order_status, placed_at, created_at')
    .eq('shop_id', shop.id)
    .order('placed_at', { ascending: false, nullsFirst: false })

  if (filterKey && FILTER_GROUPS[filterKey]) {
    query = query.in('order_status', FILTER_GROUPS[filterKey])
  }

  const { data: orders } = await query

  const filters: { key: string; label: string }[] = [
    { key: '',          label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'active',    label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ]

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
            Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orders?.length ?? 0} order{orders?.length !== 1 ? 's' : ''}
            {filterKey ? ` — ${filters.find(f => f.key === filterKey)?.label ?? ''}` : ''}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {filters.map(f => {
          const isActive = (filterKey ?? '') === f.key
          return (
            <Link
              key={f.key}
              href={f.key ? `/dashboard/${shopSlug}/orders?status=${f.key}` : `/dashboard/${shopSlug}/orders`}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={
                isActive
                  ? { background: '#15803d18', color: '#15803d' }
                  : { color: '#6b7280' }
              }
              {...(isActive ? { 'aria-current': 'page' as const } : {})}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {!orders?.length ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 mb-1">No orders yet</p>
          <p className="text-xs text-gray-400">
            Orders placed by customers on your shop will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm" aria-label="Orders">
            <thead>
              <tr className="border-b border-gray-100">
                {['Order', 'Customer', 'Items', 'Total', 'Status', 'Placed', ''].map(h => (
                  <th
                    key={h}
                    scope="col"
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => {
                const status  = (order.order_status as string) ?? 'pending'
                const colour  = STATUS_COLOURS[status] ?? '#6b7280'
                const label   = STATUS_LABELS[status]  ?? status
                const dateStr = order.placed_at ?? order.created_at
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">
                      {order.order_number ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">
                      {order.item_count}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">
                      {formatPence(order.amount_total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: `${colour}18`, color: colour }}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {dateStr ? formatDate(dateStr) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/${shopSlug}/orders/${order.id}`}
                        className="text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
