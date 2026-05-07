import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatPence } from '@/lib/tiers'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ shopSlug: string }>
}

export const metadata: Metadata = {
  title: 'Products — Farmmap Dashboard',
  robots: { index: false },
}

const STATUS_MAP = {
  pending:  { label: 'Pending review', Icon: Clock,         colour: '#b45309' },
  approved: { label: 'Approved',       Icon: CheckCircle,   colour: '#15803d' },
  rejected: { label: 'Rejected',       Icon: XCircle,       colour: '#b91c1c' },
  archived: { label: 'Archived',       Icon: XCircle,       colour: '#6b7280' },
} as const

export default async function ProductsPage({ params }: Props) {
  const { shopSlug } = await params
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

  const tier = shop.tier ?? 'free'

  if (tier === 'free') {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
          Products
        </h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm text-amber-800 mb-3">
            Product management requires Bronze tier or above.
          </p>
          <Link
            href={`/dashboard/${shopSlug}/upgrade`}
            className="inline-block px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
          >
            Upgrade to Bronze — £20/month
          </Link>
        </div>
      </div>
    )
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price_pence, category, status, active, stock_status, stock_quantity, created_at')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
            Products
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {products?.length ?? 0} products
            {tier === 'bronze' ? ' — display only (enquiry)' : ' — orderable online'}
          </p>
        </div>
        <Link
          href={`/dashboard/${shopSlug}/products/new`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
        >
          <Plus className="w-4 h-4" />
          Add product
        </Link>
      </div>

      {!products?.length ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400 mb-3">No products yet</p>
          <Link
            href={`/dashboard/${shopSlug}/products/new`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
          >
            <Plus className="w-4 h-4" />
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm" aria-label="Products">
            <thead>
              <tr className="border-b border-gray-100">
                {['Product', 'Price', 'Category', 'Status', 'Stock', ''].map(h => (
                  <th key={h} scope="col" className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => {
                const s = STATUS_MAP[p.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pending
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{p.name}</span>
                      {!p.active && (
                        <span className="ml-2 text-xs text-gray-400">(unpublished)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">
                      {formatPence(p.price_pence)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: `${s.colour}18`, color: s.colour }}
                      >
                        <s.Icon className="w-3 h-3" aria-hidden="true" />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.stock_quantity !== null
                        ? `${p.stock_quantity} left`
                        : p.stock_status.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/${shopSlug}/products/${p.id}/edit`}
                        className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        Edit
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
