import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPence } from '@/lib/tiers'
import { MapPin, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import { ZonesClient } from './ZonesClient'

interface Props {
  params: Promise<{ shopSlug: string }>
}

export const metadata: Metadata = {
  title: 'Delivery Zones — Farmmap Dashboard',
  robots: { index: false },
}

export interface DeliveryZone {
  id:                              string
  name:                            string
  postcode_prefixes:               string[]
  product_categories:              string[]
  delivery_fee_pence:              number
  free_delivery_threshold_pence:   number | null
  lead_time_days:                  number
  active:                          boolean
}

export default async function ZonesPage({ params }: Props) {
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

  const tier = (shop.tier ?? 'free') as string

  if (tier === 'free' || tier === 'bronze') {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
          Delivery Zones
        </h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm text-amber-800 mb-3">
            Delivery zone configuration requires Silver tier or above.
          </p>
          <Link
            href={`/dashboard/${shopSlug}/upgrade`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
            style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
          >
            <Zap className="w-4 h-4" />
            Upgrade to Silver — £60/month
          </Link>
        </div>
      </div>
    )
  }

  const { data: zones } = await supabase
    .from('delivery_zones')
    .select(`
      id, name, postcode_prefixes, product_categories,
      delivery_fee_pence, free_delivery_threshold_pence,
      lead_time_days, active
    `)
    .eq('shop_id', shop.id)
    .order('name')

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
            Delivery Zones
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {zones?.length ?? 0} zone{(zones?.length ?? 0) !== 1 ? 's' : ''} configured
          </p>
        </div>
      </div>

      <ZonesClient
        shopSlug={shopSlug}
        shopId={shop.id}
        initialZones={(zones ?? []) as DeliveryZone[]}
        formatPence={formatPence}
      />
    </div>
  )
}
