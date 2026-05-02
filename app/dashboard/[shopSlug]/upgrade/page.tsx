'use client'

import { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { TIER_CONFIG, formatPence } from '@/lib/tiers'
import type { Tier } from '@/lib/tiers'

const TIER_ORDER: Array<Exclude<Tier, 'free'>> = ['bronze', 'silver', 'gold']

export default function UpgradePage() {
  const params       = useParams<{ shopSlug: string }>()
  const searchParams = useSearchParams()
  const shopSlug     = params.shopSlug

  const connectSuccess = searchParams.get('connect_success')
  const connectError   = searchParams.get('connect_error')
  const cancelled      = searchParams.get('cancelled')

  const [loading, setLoading] = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  async function handleUpgrade(tier: Exclude<Tier, 'free'>, cycle: 'monthly' | 'annual') {
    setLoading(`${tier}-${cycle}`)
    setError(null)
    try {
      const res  = await fetch('/api/subscriptions/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ shopSlug, tier, billingCycle: cycle }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to start upgrade. Please try again.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error — please check your connection.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-poppins)' }}>
        Upgrade your shop
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Pick a plan. Cancel any time — your products and data are never deleted.
      </p>

      {/* Flash messages */}
      {connectSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 mb-4">
          <Check className="w-4 h-4 shrink-0" />
          Stripe connected! Now choose a plan to complete your upgrade.
        </div>
      )}
      {connectError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Stripe connection failed: {connectError}. Please try again.
        </div>
      )}
      {cancelled && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Payment was cancelled. Your current tier is unchanged.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tier cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {TIER_ORDER.map(tier => {
          const cfg = TIER_CONFIG[tier]
          const isSilver = tier === 'silver'
          return (
            <div
              key={tier}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col"
              style={isSilver ? { borderColor: '#15803d', borderWidth: 2 } : {}}
            >
              {isSilver && (
                <div className="text-center text-xs font-semibold py-1.5 text-white" style={{ background: '#15803d' }}>
                  Most popular
                </div>
              )}
              <div className="p-5 flex-1 space-y-4">
                <div>
                  <h2 className="font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {cfg.name}
                  </h2>
                  <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-poppins)', color: '#14532d' }}>
                    {formatPence(cfg.priceMonthlyPence)}
                    <span className="text-sm font-normal text-gray-400">/mo</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    or {formatPence(cfg.priceAnnualPence)}/yr
                    {' '}(saves {formatPence(cfg.priceMonthlyPence * 12 - cfg.priceAnnualPence)})
                  </p>
                </div>

                {/* Feature list */}
                <ul className="space-y-1.5">
                  {cfg.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Silver requires Connect notice */}
                {cfg.requiresConnect && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
                    Requires a Stripe account. We'll guide you through setup — takes about 10 minutes.
                  </p>
                )}
              </div>

              {/* CTA buttons */}
              <div className="px-5 pb-5 space-y-2">
                {cfg.requiresConnect && (
                  <a
                    href={`/api/stripe/connect?shop=${shopSlug}`}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors cursor-pointer"
                  >
                    1. Connect Stripe first
                  </a>
                )}
                <button
                  onClick={() => handleUpgrade(tier, 'monthly')}
                  disabled={loading !== null}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity cursor-pointer"
                  style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
                >
                  {loading === `${tier}-monthly` && <Loader2 className="w-4 h-4 animate-spin" />}
                  {cfg.requiresConnect ? '2. ' : ''}Monthly — {formatPence(cfg.priceMonthlyPence)}/mo
                </button>
                <button
                  onClick={() => handleUpgrade(tier, 'annual')}
                  disabled={loading !== null}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity cursor-pointer"
                  style={{ background: '#14532d', fontFamily: 'var(--font-poppins)' }}
                >
                  {loading === `${tier}-annual` && <Loader2 className="w-4 h-4 animate-spin" />}
                  Annual — {formatPence(cfg.priceAnnualPence)}/yr
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center">
        All prices include VAT where applicable. You can cancel at any time from your dashboard.
        On cancellation, your shop reverts to the free tier at the end of the billing period.
      </p>
    </div>
  )
}
