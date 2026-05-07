import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

export const metadata: Metadata = {
  title: 'Order confirmed — Farmmap',
  robots: { index: false },
}

interface SearchParams {
  session_id?: string
}

interface OrderRow {
  order_number: string | null
  tracking_token: string | null
  shop_name: string | null
}

async function fetchOrder(sessionId: string): Promise<OrderRow | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnon) return null

  const supabase = createClient(supabaseUrl, supabaseAnon)
  const { data, error } = await supabase
    .from('orders')
    .select('order_number, tracking_token, shop_name')
    .eq('stripe_session_id', sessionId)
    .single()

  if (error || !data) return null
  return data as OrderRow
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { session_id: sessionId } = await searchParams
  const order = sessionId ? await fetchOrder(sessionId) : null

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#f9fafb' }}
    >
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-semibold"
          style={{ color: '#15803d', fontFamily: 'var(--font-poppins)' }}
        >
          Farmmap
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
        <CheckCircle
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: '#15803d' }}
        />
        <h1
          className="text-xl font-bold mb-2"
          style={{ color: '#15803d', fontFamily: 'var(--font-poppins)' }}
        >
          Order confirmed!
        </h1>

        {order?.order_number && (
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Order reference: <span className="text-gray-900">{order.order_number}</span>
          </p>
        )}

        <p className="text-sm text-gray-500 leading-relaxed mb-6 mt-2">
          Your payment was successful.{order?.shop_name ? ` ${order.shop_name}` : ' The farm shop'} will
          be in touch to arrange delivery or collection. A confirmation has been sent to your email.
        </p>

        {order?.tracking_token && (
          <Link
            href={`/order/${order.tracking_token}`}
            className="inline-block w-full px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 mb-3"
            style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
          >
            Track your order →
          </Link>
        )}

        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
        >
          Back to Farmmap
        </Link>
      </div>
    </div>
  )
}
