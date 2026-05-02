export type Tier = 'free' | 'bronze' | 'silver' | 'gold'

export interface TierConfig {
  name: string
  priceMonthlyPence: number
  priceAnnualPence:  number
  stripeMonthlyPriceId: string
  stripeAnnualPriceId:  string
  commissionThresholdPence: number
  commissionRate:    number   // 0.03 = 3%
  maxProducts:       number
  displayPriority:   number
  requiresConnect:   boolean
  features:          string[]
}

/** Tier configuration — prices and rules per the Launch 2 spec */
export const TIER_CONFIG: Record<Exclude<Tier, 'free'>, TierConfig> = {
  bronze: {
    name:              'Bronze',
    priceMonthlyPence: 2000,   // £20/mo
    priceAnnualPence:  20000,  // £200/yr (saves £40)
    stripeMonthlyPriceId: process.env.STRIPE_BRONZE_MONTHLY_PRICE_ID ?? '',
    stripeAnnualPriceId:  process.env.STRIPE_BRONZE_ANNUAL_PRICE_ID  ?? '',
    commissionThresholdPence: 0,
    commissionRate:    0,
    maxProducts:       100,
    displayPriority:   10,
    requiresConnect:   false,
    features: [
      'Branded shop page with hero image & logo',
      'Up to 100 products (display-only with enquiry form)',
      'Photo gallery — up to 12 photos',
      'Customer enquiry inbox',
      'Performance dashboard',
      'Priority over free listings',
    ],
  },

  silver: {
    name:              'Silver',
    priceMonthlyPence: 6000,   // £60/mo
    priceAnnualPence:  60000,  // £600/yr
    stripeMonthlyPriceId: process.env.STRIPE_SILVER_MONTHLY_PRICE_ID ?? '',
    stripeAnnualPriceId:  process.env.STRIPE_SILVER_ANNUAL_PRICE_ID  ?? '',
    commissionThresholdPence: 2000,  // £20.00
    commissionRate:    0.03,         // 3%
    maxProducts:       500,
    displayPriority:   20,
    requiresConnect:   true,
    features: [
      'Everything in Bronze',
      'Full online ordering — customers pay you directly via Stripe',
      'Delivery zone configuration',
      'Order management dashboard',
      'Stock tracking with low-stock alerts',
      '3% commission on orders over £20',
    ],
  },

  gold: {
    name:              'Gold',
    priceMonthlyPence: 10000,  // £100/mo
    priceAnnualPence:  100000, // £1,000/yr
    stripeMonthlyPriceId: process.env.STRIPE_GOLD_MONTHLY_PRICE_ID ?? '',
    stripeAnnualPriceId:  process.env.STRIPE_GOLD_ANNUAL_PRICE_ID  ?? '',
    commissionThresholdPence: 3000,  // £30.00
    commissionRate:    0.05,         // 5%
    maxProducts:       1000,
    displayPriority:   30,
    requiresConnect:   true,
    features: [
      'Everything in Silver',
      'Priority placement in search & map',
      'Farmmap marketing rotation (newsletter, social, blog)',
      'Up to 1,000 products',
      '5% commission on orders over £30',
    ],
  },
}

/**
 * Calculate Farmmap application fee in pence for an order.
 * Fee is only charged on the product subtotal, not the delivery fee.
 */
export function calculateApplicationFee(
  subtotalPence: number,
  tier: Tier
): number {
  if (tier === 'free' || tier === 'bronze') return 0
  const cfg = TIER_CONFIG[tier]
  if (subtotalPence <= cfg.commissionThresholdPence) return 0
  return Math.round(subtotalPence * cfg.commissionRate)
}

/** Format pence as £X.XX */
export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}
