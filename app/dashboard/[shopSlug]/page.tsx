import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Package, ShoppingBag, TrendingUp, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import { TIER_CONFIG, formatPence } from '@/lib/tiers'
import type { Tier } from '@/lib/tiers'
import type { Metadata } from 'next'

interface Props {
  params:      Promise<{ shopSlug: string }>
  searchParams: Promise<Record<string, string>>
}

export const metadata: Metadata = {
  title: 'Shop Dashboard — Farmmap',
  robots: { index: false },
}

export default async function DashboardOverviewPage({ params, searchParams }: Props) {
  const { shopSlug }    = await params
  const { upgrade_success, connect_success, connect_error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: shop } = await supabase
    .from('shops')
    .select(`
      id, name, slug, tier, subscription_status, subscription_period_end,
      stripe_connect_account_id, stripe_connect_charges_ok, stripe_connect_payouts_ok,
      verified
    `)
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) redirect('/')

  const tier = (shop.tier ?? 'free') as Tier

  // Quick stats
  const [{ count: productCount }, { count: orderCount }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_slug', shopSlug),
  ])

  // Commission this month
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: commissionRows } = await supabase
    .from('commission_ledger')
    .select('commission_pence, order_subtotal_pence')
    .eq('shop_id', shop.id)
    .gte('created_at', monthStart.toISOString())

  const monthlyGross      = commissionRows?.reduce((s, r) => s + r.order_subtotal_pence, 0) ?? 0
  const monthlyCommission = commissionRows?.reduce((s, r) => s + r.commission_pence,     0) ?? 0

  const tierConfig = tier !== 'free' ? TIER_CONFIG[tier] : null

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Flash messages */}
      {upgrade_success && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Upgrade successful — welcome to {tier.charAt(0).toUpperCase() + tier.slice(1)}!
        </div>
      )}
      {connect_success && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Stripe account connected successfully.
        </div>
      )}
      {connect_error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Stripe Connect error: {connect_error}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
          {shop.name}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {tier === 'free'
            ? 'Free listing — upgrade to Bronze to unlock your branded shop page'
            : `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier${shop.subscription_period_end ? ` · renews ${new Date(shop.subscription_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}`
          }
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Products',         value: productCount ?? 0,           Icon: Package,    href: 'products' },
          { label: 'Orders (total)',    value: orderCount   ?? 0,           Icon: ShoppingBag, href: 'orders' },
          { label: 'Sales this month', value: formatPence(monthlyGross),   Icon: TrendingUp,  href: 'stats' },
          { label: 'Commission owed',  value: formatPence(monthlyCommission), Icon: TrendingUp, href: 'stats' },
        ].map(({ label, value, Icon, href }) => (
          <Link
            key={label}
            href={`/dashboard/${shopSlug}/${href}`}
            className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{label}</span>
              <Icon className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
              {value}
            </p>
          </Link>
        ))}
      </div>

      {/* Stripe Connect status (Silver/Gold) */}
      {(tier === 'silver' || tier === 'gold') && (
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Stripe Connect</h2>
          {shop.stripe_connect_account_id ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {shop.stripe_connect_charges_ok
                  ? <CheckCircle className="w-4 h-4 text-green-600" />
                  : <AlertCircle className="w-4 h-4 text-amber-500" />}
                <span className={shop.stripe_connect_charges_ok ? 'text-green-700' : 'text-amber-700'}>
                  {shop.stripe_connect_charges_ok ? 'Accepting payments' : 'Payments pending Stripe verification'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {shop.stripe_connect_payouts_ok
                  ? <CheckCircle className="w-4 h-4 text-green-600" />
                  : <AlertCircle className="w-4 h-4 text-amber-500" />}
                <span className={shop.stripe_connect_payouts_ok ? 'text-green-700' : 'text-amber-700'}>
                  {shop.stripe_connect_payouts_ok ? 'Payouts enabled' : 'Payouts pending verification'}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-amber-700 mb-3">
                Your Stripe account isn't connected yet. Customers can't buy until this is set up.
              </p>
              <a
                href={`/api/stripe/connect?shop=${shopSlug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
              >
                Connect Stripe account
              </a>
            </div>
          )}
        </div>
      )}

      {/* Upgrade prompt (free/bronze) */}
      {tier !== 'gold' && (
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4" style={{ color: '#15803d' }} />
                {tier === 'free'  ? 'Upgrade to Bronze — £20/month' : ''}
                {tier === 'bronze' ? 'Upgrade to Silver — £60/month' : ''}
                {tier === 'silver' ? 'Upgrade to Gold — £100/month'  : ''}
              </h2>
              <p className="text-sm text-gray-500">
                {tier === 'free'   && 'Get a branded shop page, product catalogue, and enquiry forms.'}
                {tier === 'bronze' && 'Unlock full online ordering, delivery zones, and order management.'}
                {tier === 'silver' && 'Priority placement, marketing rotation, and up to 1,000 products.'}
              </p>
            </div>
            <Link
              href={`/dashboard/${shopSlug}/upgrade`}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
