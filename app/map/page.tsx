'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { List, Map as MapIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import MapFilters, { type Filters } from '@/components/map/MapFilters'
import ShopListPanel from '@/components/map/ShopListPanel'
import type { Shop } from '@/lib/types'
import Image from 'next/image'

const FarmMap = dynamic(() => import('@/components/map/FarmMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading map…</p>
      </div>
    </div>
  ),
})

type ShopSummary = Pick<Shop,
  'id' | 'name' | 'slug' | 'latitude' | 'longitude' |
  'town' | 'county' | 'country' | 'product_categories' | 'verified' | 'description'
>

export default function MapPage() {
  const [shops, setShops] = useState<ShopSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [filters, setFilters] = useState<Filters>({
    search: '',
    categories: [],
    country: '',
    verifiedOnly: false,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('shops')
      .select('id, name, slug, latitude, longitude, town, county, country, product_categories, verified, description')
      .eq('status', 'approved')
      .then(({ data }) => {
        setShops((data ?? []) as ShopSummary[])
        setLoading(false)
      })
  }, [])

  const filteredShops = useMemo(() => {
    const q = filters.search.toLowerCase().trim()
    return shops.filter(s => {
      if (q && !s.name.toLowerCase().includes(q) &&
          !s.town.toLowerCase().includes(q) &&
          !s.county.toLowerCase().includes(q)) return false
      if (filters.country && s.country !== filters.country) return false
      if (filters.verifiedOnly && !s.verified) return false
      if (filters.categories.length) {
        const has = filters.categories.some(cat => s.product_categories.includes(cat))
        if (!has) return false
      }
      return true
    })
  }, [shops, filters])

  const handleShopClick = useCallback((slug: string) => {
    window.location.href = `/shop/${slug}`
  }, [])

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 shrink-0 z-10"
        style={{ background: 'var(--forest-mid)', borderBottom: '1px solid var(--forest-dark)' }}
      >
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Farmmap"
            width={140}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <nav className="flex items-center gap-2">
          <div className="flex rounded-xl p-0.5" style={{ background: 'rgba(255,255,255,0.12)' }}>
            {(['map', 'list'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  view === v
                    ? 'bg-white text-green-800 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-poppins)' }}
              >
                {v === 'map' ? <MapIcon className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline capitalize">{v}</span>
              </button>
            ))}
          </div>

          <a
            href="/admin"
            className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
          >
            Admin
          </a>
        </nav>
      </header>

      {/* Filters */}
      <MapFilters
        filters={filters}
        onChange={setFilters}
        totalShops={shops.length}
        visibleShops={filteredShops.length}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {view === 'map' && (
          <div className="flex-1 relative">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--cream)' }}>
                <div className="text-center" style={{ color: 'var(--bark)' }}>
                  <div
                    className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                    style={{ borderColor: 'var(--forest)', borderTopColor: 'transparent' }}
                  />
                  <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Finding farm shops…
                  </p>
                </div>
              </div>
            ) : (
              <FarmMap shops={filteredShops} onShopClick={handleShopClick} />
            )}
          </div>
        )}

        {view === 'list' && (
          <div className="flex-1 overflow-y-auto" style={{ background: 'var(--cream)' }}>
            <ShopListPanel shops={filteredShops} />
          </div>
        )}

        {view === 'map' && !loading && (
          <div
            className="hidden lg:flex lg:w-80 lg:flex-col overflow-hidden"
            style={{ borderLeft: '1.5px solid var(--sand)', background: 'var(--cream)' }}
          >
            <div
              className="px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--sand)', background: '#fff' }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--bark)', fontFamily: 'var(--font-poppins)' }}>
                {filteredShops.length.toLocaleString()} farm shops
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ShopListPanel shops={filteredShops} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="hidden sm:flex items-center justify-between px-4 py-2 text-xs shrink-0"
        style={{ background: 'var(--forest-dark)', color: 'rgba(255,255,255,0.5)' }}
      >
        <span>© 2025 Derrywilligan Farm Ltd · farmmap.co.uk · Map data © OpenStreetMap contributors</span>
        <div className="flex gap-4">
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies'], ['Contact', 'mailto:contact@farmmap.co.uk']].map(([label, href]) => (
            <a key={href} href={href} className="hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
