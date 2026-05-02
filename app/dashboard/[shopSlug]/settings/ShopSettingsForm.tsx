'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle, AlertCircle, ExternalLink, Palette,
  Image, Type, Store, CreditCard, BadgePercent, Trash2
} from 'lucide-react'
import type { Tier } from '@/lib/tiers'
import { TIER_CONFIG } from '@/lib/tiers'

interface ShopData {
  name:                      string
  tagline:                   string
  hero_image_url:            string
  logo_url:                  string
  accent_colour:             string
  tier:                      Tier
  stripe_connect_account_id: string | null
  stripe_connect_charges_ok: boolean
  stripe_connect_payouts_ok: boolean
  subscription_status:       string | null
}

interface Props {
  shopSlug: string
  shop:     ShopData
}

type ActiveTab = 'branding' | 'stripe' | 'subscription'

function maskAccountId(id: string): string {
  if (id.length <= 8) return id
  return `${id.slice(0, 5)}***${id.slice(-3)}`
}

export function ShopSettingsForm({ shopSlug, shop }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('branding')

  // Branding form state
  const [name,          setName]         = useState(shop.name)
  const [tagline,       setTagline]      = useState(shop.tagline)
  const [heroUrl,       setHeroUrl]      = useState(shop.hero_image_url)
  const [logoUrl,       setLogoUrl]      = useState(shop.logo_url)
  const [accentColour,  setAccentColour] = useState(shop.accent_colour)

  const [saving,        setSaving]       = useState(false)
  const [brandingMsg,   setBrandingMsg]  = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Subscription cancel state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling,        setCancelling]         = useState(false)
  const [cancelMsg,         setCancelMsg]          = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const tierConfig = shop.tier !== 'free' ? TIER_CONFIG[shop.tier as Exclude<Tier, 'free'>] : null

  const tierColourMap: Record<string, { label: string; colour: string }> = {
    free:   { label: 'Free',   colour: '#6b7280' },
    bronze: { label: 'Bronze', colour: '#b45309' },
    silver: { label: 'Silver', colour: '#475569' },
    gold:   { label: 'Gold',   colour: '#a16207' },
  }
  const tierInfo = tierColourMap[shop.tier] ?? tierColourMap.free

  async function handleBrandingSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setBrandingMsg(null)

    try {
      const res = await fetch(`/api/shops/${shopSlug}/settings`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, tagline, hero_image_url: heroUrl, logo_url: logoUrl, accent_colour: accentColour }),
      })

      if (!res.ok) {
        const json = await res.json() as { error?: string }
        setBrandingMsg({ type: 'error', text: json.error ?? 'Failed to save settings' })
      } else {
        setBrandingMsg({ type: 'success', text: 'Settings saved successfully' })
      }
    } catch {
      setBrandingMsg({ type: 'error', text: 'Network error — please try again' })
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelSubscription() {
    setCancelling(true)
    setCancelMsg(null)

    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ shopSlug }),
      })

      const json = await res.json() as { cancelled?: boolean; period_end?: number; error?: string }

      if (!res.ok || !json.cancelled) {
        setCancelMsg({ type: 'error', text: json.error ?? 'Failed to cancel subscription' })
      } else {
        const periodEnd = json.period_end
          ? new Date(json.period_end * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'the end of the current period'
        setCancelMsg({ type: 'success', text: `Your subscription will not renew — access continues until ${periodEnd}` })
        setShowCancelConfirm(false)
      }
    } catch {
      setCancelMsg({ type: 'error', text: 'Network error — please try again' })
    } finally {
      setCancelling(false)
    }
  }

  const tabs: { id: ActiveTab; label: string; Icon: React.ElementType }[] = [
    { id: 'branding',      label: 'Branding',      Icon: Palette     },
    { id: 'stripe',        label: 'Stripe Connect', Icon: CreditCard  },
    { id: 'subscription',  label: 'Subscription',   Icon: BadgePercent },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            style={activeTab === id
              ? { background: '#fff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { color: '#6b7280' }}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Section 1 — Branding */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Store className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Shop branding</h2>
          </div>

          {brandingMsg && (
            <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm mb-5 ${
              brandingMsg.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {brandingMsg.type === 'success'
                ? <CheckCircle className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />}
              {brandingMsg.text}
            </div>
          )}

          <form onSubmit={handleBrandingSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <Type className="w-3.5 h-3.5 inline mr-1" />
                Shop name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Tagline
                <span className="text-gray-400 font-normal ml-1">(max 120 chars)</span>
              </label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                maxLength={120}
                placeholder="Fresh produce direct from our Suffolk farm"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"
              />
              <p className="text-xs text-gray-400 mt-1">{tagline.length}/120</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <Image className="w-3.5 h-3.5 inline mr-1" />
                Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <Image className="w-3.5 h-3.5 inline mr-1" />
                Hero image URL
              </label>
              <input
                type="url"
                value={heroUrl}
                onChange={e => setHeroUrl(e.target.value)}
                placeholder="https://cdn.example.com/hero.jpg"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <Palette className="w-3.5 h-3.5 inline mr-1" />
                Accent colour
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColour}
                  onChange={e => setAccentColour(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <span className="text-sm font-mono text-gray-600">{accentColour}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 cursor-pointer"
                style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
              >
                {saving ? 'Saving…' : 'Save branding'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 2 — Stripe Connect */}
      {activeTab === 'stripe' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Stripe Connect</h2>
          </div>

          {shop.stripe_connect_account_id ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-mono text-gray-600">
                {maskAccountId(shop.stripe_connect_account_id)}
              </div>

              <div className="flex items-center gap-2.5 text-sm">
                {shop.stripe_connect_charges_ok
                  ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                <span className={shop.stripe_connect_charges_ok ? 'text-green-700' : 'text-amber-700'}>
                  {shop.stripe_connect_charges_ok ? 'Accepting payments' : 'Payments pending Stripe verification'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-sm">
                {shop.stripe_connect_payouts_ok
                  ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                <span className={shop.stripe_connect_payouts_ok ? 'text-green-700' : 'text-amber-700'}>
                  {shop.stripe_connect_payouts_ok ? 'Payouts enabled' : 'Payouts pending verification'}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-amber-700 mb-4">
                Your Stripe account is not connected. Customers cannot complete purchases until this is set up.
              </p>
              <a
                href={`/api/stripe/connect?shop=${shopSlug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
              >
                Connect Stripe account
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Section 3 — Subscription */}
      {activeTab === 'subscription' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <BadgePercent className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Subscription</h2>
          </div>

          <div className="space-y-4">
            {/* Tier badge */}
            <div className="flex items-center gap-3">
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: `${tierInfo.colour}20`, color: tierInfo.colour }}
              >
                {tierInfo.label}
              </span>
              {tierConfig && (
                <span className="text-sm text-gray-500">
                  £{(tierConfig.priceMonthlyPence / 100).toFixed(0)}/month
                </span>
              )}
            </div>

            {/* Status */}
            {shop.subscription_status && (
              <div className="text-sm text-gray-600">
                Status:{' '}
                <span className="font-medium capitalize text-gray-900">
                  {shop.subscription_status.replace(/_/g, ' ')}
                </span>
              </div>
            )}

            {cancelMsg && (
              <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm ${
                cancelMsg.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {cancelMsg.type === 'success'
                  ? <CheckCircle className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />}
                {cancelMsg.text}
              </div>
            )}

            {/* Cancel button / confirm */}
            {shop.tier !== 'free' && !cancelMsg?.type.includes('success') && (
              <div className="pt-2 border-t border-gray-100">
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity cursor-pointer"
                    style={{ background: '#b91c1c', fontFamily: 'var(--font-poppins)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancel subscription
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm text-red-800 font-medium">
                      Are you sure you want to cancel?
                    </p>
                    <p className="text-sm text-red-700">
                      You will keep access until the end of your current billing period. This cannot be undone from here.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelling}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 cursor-pointer"
                        style={{ background: '#b91c1c', fontFamily: 'var(--font-poppins)' }}
                      >
                        {cancelling ? 'Cancelling…' : 'Yes, cancel subscription'}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 cursor-pointer"
                      >
                        Keep subscription
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
