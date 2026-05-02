import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  LayoutDashboard, Package, MapPin, ShoppingBag,
  TrendingUp, Settings, ArrowLeft, Zap
} from 'lucide-react'

interface Props {
  children: React.ReactNode
  params:   Promise<{ shopSlug: string }>
}

export default async function DashboardLayout({ children, params }: Props) {
  const { shopSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, tier, subscription_status')
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) redirect('/')

  const tier    = (shop.tier as string) ?? 'free'
  const tierMap: Record<string, { label: string; colour: string }> = {
    free:   { label: 'Free',   colour: '#6b7280' },
    bronze: { label: 'Bronze', colour: '#b45309' },
    silver: { label: 'Silver', colour: '#475569' },
    gold:   { label: 'Gold',   colour: '#a16207' },
  }
  const tierInfo = tierMap[tier] ?? tierMap.free

  const nav = [
    { href: `/dashboard/${shopSlug}`,          label: 'Overview',  Icon: LayoutDashboard },
    { href: `/dashboard/${shopSlug}/products`, label: 'Products',  Icon: Package },
    { href: `/dashboard/${shopSlug}/orders`,   label: 'Orders',    Icon: ShoppingBag,  silverOnly: true },
    { href: `/dashboard/${shopSlug}/zones`,    label: 'Delivery',  Icon: MapPin,       silverOnly: true },
    { href: `/dashboard/${shopSlug}/stats`,    label: 'Analytics', Icon: TrendingUp },
    { href: `/dashboard/${shopSlug}/settings`, label: 'Settings',  Icon: Settings },
    { href: `/dashboard/${shopSlug}/upgrade`,  label: 'Upgrade',   Icon: Zap,          upgradeOnly: true },
  ]

  const isSilverPlus = tier === 'silver' || tier === 'gold'

  return (
    <div className="min-h-screen flex" style={{ background: '#f9fafb' }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col">
        {/* Shop header */}
        <div className="px-4 py-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Farmmap
          </Link>
          <p className="text-sm font-semibold text-gray-900 truncate">{shop.name}</p>
          <span
            className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${tierInfo.colour}20`, color: tierInfo.colour }}
          >
            {tierInfo.label}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, label, Icon, silverOnly, upgradeOnly }) => {
            if (silverOnly && !isSilverPlus) return null
            if (upgradeOnly && tier === 'gold')  return null
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                style={upgradeOnly ? { color: '#15803d', fontWeight: 600 } : {}}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* View public page link */}
        <div className="px-4 py-4 border-t border-gray-100">
          <Link
            href={`/shop/${shopSlug}`}
            target="_blank"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            View public page →
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto">
        {children}
      </div>
    </div>
  )
}
