'use client'

import Link from 'next/link'
import { MapPin, CheckCircle } from 'lucide-react'
import type { Shop } from '@/lib/types'

interface ShopListPanelProps {
  shops: Pick<Shop, 'id' | 'name' | 'slug' | 'town' | 'county' | 'product_categories' | 'verified' | 'description'>[]
}

export default function ShopListPanel({ shops }: ShopListPanelProps) {
  if (!shops.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--bark)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--sage-pale)' }}>
          <MapPin className="w-5 h-5" style={{ color: 'var(--forest)' }} />
        </div>
        <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}>
          No shops found
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--bark)' }}>Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div>
      {shops.map(shop => (
        <Link
          key={shop.id}
          href={`/shop/${shop.slug}`}
          className="flex flex-col gap-1.5 px-4 py-3.5 transition-colors duration-150 cursor-pointer"
          style={{ borderBottom: '1px solid var(--sand)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="flex items-start justify-between gap-2">
            <span
              className="font-semibold text-sm leading-tight"
              style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}
            >
              {shop.name}
            </span>
            {shop.verified && (
              <CheckCircle
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: 'var(--gold)' }}
                aria-label="Verified owner"
              />
            )}
          </div>

          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--bark)' }}>
            <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
            {shop.town}{shop.county ? `, ${shop.county}` : ''}
          </span>

          {shop.product_categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {shop.product_categories.slice(0, 4).map(cat => (
                <span
                  key={cat}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--sage-pale)',
                    color: 'var(--forest)',
                    fontWeight: 500,
                    fontFamily: 'var(--font-poppins)',
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}
