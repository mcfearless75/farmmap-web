import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TIER_CONFIG } from '@/lib/tiers'
import type { Tier } from '@/lib/tiers'
import type { Metadata } from 'next'
import { ShopSettingsForm } from './ShopSettingsForm'

interface Props {
  params: Promise<{ shopSlug: string }>
}

export const metadata: Metadata = {
  title: 'Shop Settings — Farmmap Dashboard',
  robots: { index: false },
}

export default async function SettingsPage({ params }: Props) {
  const { shopSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: shop } = await supabase
    .from('shops')
    .select(`
      id, name, tagline, hero_image_url, logo_url, accent_colour,
      tier, stripe_connect_account_id, stripe_connect_charges_ok,
      stripe_connect_payouts_ok, stripe_subscription_id, subscription_status
    `)
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) redirect('/')

  const tier = (shop.tier ?? 'free') as Tier

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your shop branding and account</p>
      </div>

      <ShopSettingsForm
        shopSlug={shopSlug}
        shop={{
          name:                       shop.name ?? '',
          tagline:                    shop.tagline ?? '',
          hero_image_url:             shop.hero_image_url ?? '',
          logo_url:                   shop.logo_url ?? '',
          accent_colour:              shop.accent_colour ?? '#15803d',
          tier,
          stripe_connect_account_id:  shop.stripe_connect_account_id ?? null,
          stripe_connect_charges_ok:  shop.stripe_connect_charges_ok ?? false,
          stripe_connect_payouts_ok:  shop.stripe_connect_payouts_ok ?? false,
          subscription_status:        shop.subscription_status ?? null,
        }}
      />
    </div>
  )
}
