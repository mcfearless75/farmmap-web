import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import {
  Map as MapIcon, ArrowRight, CheckCircle, MapPin,
  Leaf, Wheat, Egg, Flower2, ShoppingBasket, Store,
  Droplets, Package, Milk, Search, ListChecks, Navigation,
} from 'lucide-react'
import HeroVideo from '@/components/HeroVideo'
import type { Shop } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Farmmap — UK & Ireland Farm Shop Directory',
  description: 'Find farm shops near you across the UK and Ireland. Browse 950+ farm shops selling direct — meat, dairy, vegetables, eggs, bakery and more.',
}

type FeaturedShop = Pick<Shop,
  'id' | 'name' | 'slug' | 'town' | 'county' | 'country' |
  'product_categories' | 'verified' | 'description'
>

const CATEGORIES = [
  { label: 'Dairy',         Icon: Milk,          bg: '#F0FDF4', color: '#15803D' },
  { label: 'Meat',          Icon: Leaf,           bg: '#FEF2F2', color: '#991B1B' },
  { label: 'Vegetables',    Icon: Leaf,           bg: '#F0FDF4', color: '#166534' },
  { label: 'Bakery',        Icon: Wheat,          bg: '#FFFBEB', color: '#92400E' },
  { label: 'Eggs',          Icon: Egg,            bg: '#FFFBEB', color: '#B45309' },
  { label: 'Honey',         Icon: Flower2,        bg: '#FEF9C3', color: '#854D0E' },
  { label: 'Pick Your Own', Icon: ShoppingBasket, bg: '#F0FDF4', color: '#15803D' },
  { label: 'Farm Shop',     Icon: Store,          bg: '#F5F0E1', color: '#5C3D2E' },
  { label: 'Raw Milk',      Icon: Droplets,       bg: '#EFF6FF', color: '#1D4ED8' },
  { label: 'Preserves',     Icon: Package,        bg: '#FDF4FF', color: '#7E22CE' },
  { label: 'Flowers',       Icon: Flower2,        bg: '#FDF2F8', color: '#9D174D' },
  { label: 'Farmgate',      Icon: MapPin,         bg: '#F1F5F9', color: '#334155' },
]

const COUNTRY_LABELS: Record<string, string> = {
  'GB-ENG': 'England',
  'GB-SCT': 'Scotland',
  'GB-WLS': 'Wales',
  'GB-NIR': 'N. Ireland',
  'IE':     'Ireland',
}

export default async function HomePage() {
  const supabase = await createClient()

  const [{ count }, { data: featured }] = await Promise.all([
    supabase
      .from('shops')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('shops')
      .select('id, name, slug, town, county, country, product_categories, verified, description')
      .eq('status', 'approved')
      .not('latitude', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const shops = (featured ?? []) as FeaturedShop[]
  const shopCount = count ?? 950

  return (
    <div style={{ background: 'var(--cream)', fontFamily: 'var(--font-open-sans)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background: 'var(--forest-mid)', borderBottom: '1px solid var(--forest-dark)' }}
      >
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Farmmap" width={140} height={40} className="h-10 w-auto" priority />
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/map"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-poppins)' }}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Browse Map
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer"
            style={{ background: 'var(--gold)', color: '#fff', fontFamily: 'var(--font-poppins)' }}
          >
            Add Your Shop
          </Link>
          <a
            href="/admin"
            className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-poppins)' }}
          >
            Admin
          </a>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        className="relative px-4 py-20 sm:py-28 text-center overflow-hidden"
        style={{ background: 'var(--forest-dark)' }}
      >
        <HeroVideo />

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(5,46,22,0.88) 0%, rgba(20,83,45,0.82) 60%, rgba(15,70,35,0.88) 100%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-3xl mx-auto">
          <p
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-poppins)' }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: '#4ADE80' }}
            />
            {shopCount.toLocaleString()}+ farm shops listed
          </p>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Find a Farm Shop
            <br />
            <span style={{ color: '#86EFAC' }}>Near You</span>
          </h1>

          <p
            className="text-base sm:text-lg mb-10 max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.75)', lineHeight: '1.7' }}
          >
            The UK &amp; Ireland&apos;s farm shop directory. Browse shops selling
            direct — meat, dairy, veg, eggs, honey and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/map"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              style={{ background: 'var(--gold)', color: '#fff', fontFamily: 'var(--font-poppins)' }}
            >
              <MapIcon className="w-4 h-4" />
              Browse the Map
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200 cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                fontFamily: 'var(--font-poppins)',
              }}
            >
              View All Shops
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            {['Free to browse', 'Verified listings', 'UK & Ireland'].map(t => (
              <span
                key={t}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-poppins)' }}
              >
                <CheckCircle className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <section className="py-8 px-4" style={{ background: '#fff', borderBottom: '1px solid var(--sand)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { value: `${shopCount.toLocaleString()}+`, label: 'Farm Shops' },
            { value: '5',                              label: 'Nations' },
            { value: '12+',                            label: 'Product Types' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p
                className="text-2xl sm:text-3xl font-bold"
                style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}
              >
                {value}
              </p>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--bark)' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Browse by category ──────────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-xl sm:text-2xl font-bold mb-2 text-center"
            style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}
          >
            Browse by Product
          </h2>
          <p className="text-sm text-center mb-8" style={{ color: 'var(--bark)' }}>
            Find shops stocking exactly what you&apos;re looking for
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {CATEGORIES.map(({ label, Icon, bg, color }) => (
              <Link
                key={label}
                href="/map"
                className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: bg, border: `1px solid ${bg}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                >
                  <Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />
                </div>
                <span
                  className="text-xs font-medium leading-tight"
                  style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured shops ──────────────────────────────────────────────── */}
      {shops.length > 0 && (
        <section className="py-14 px-4" style={{ background: '#fff' }}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2
                  className="text-xl sm:text-2xl font-bold"
                  style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}
                >
                  Recently Added
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--bark)' }}>
                  New farm shops joining the directory
                </p>
              </div>
              <Link
                href="/map"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors duration-150 hover:underline"
                style={{ color: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map(shop => (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.slug}`}
                  className="flex flex-col p-4 rounded-2xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: 'var(--cream)', border: '1px solid var(--sand)' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      className="font-semibold text-sm leading-tight"
                      style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}
                    >
                      {shop.name}
                    </h3>
                    {shop.verified && (
                      <CheckCircle
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--gold)' }}
                        aria-label="Verified"
                      />
                    )}
                  </div>

                  <p className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--bark)' }}>
                    <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                    {shop.town}{shop.county ? `, ${shop.county}` : ''}
                    {shop.country && COUNTRY_LABELS[shop.country]
                      ? ` · ${COUNTRY_LABELS[shop.country]}`
                      : ''}
                  </p>

                  {shop.description && (
                    <p
                      className="text-xs leading-relaxed mb-3 line-clamp-2"
                      style={{ color: 'var(--bark)' }}
                    >
                      {shop.description}
                    </p>
                  )}

                  {shop.product_categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {shop.product_categories.slice(0, 3).map(cat => (
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

            <div className="text-center mt-8">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  background: 'var(--forest)',
                  color: '#fff',
                  fontFamily: 'var(--font-poppins)',
                }}
              >
                Browse All {shopCount.toLocaleString()}+ Shops
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-xl sm:text-2xl font-bold text-center mb-2"
            style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}
          >
            How It Works
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: 'var(--bark)' }}>
            Find your nearest farm shop in three steps
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                Icon: Search,
                title: 'Search',
                desc: 'Search by location, county, or product type to find shops near you.',
              },
              {
                step: '2',
                Icon: MapIcon,
                title: 'Explore',
                desc: 'Browse pins on the interactive map or scroll through the full list.',
              },
              {
                step: '3',
                Icon: Navigation,
                title: 'Visit',
                desc: 'Get directions, check opening hours, and buy direct from the farmer.',
              },
            ].map(({ step, Icon, title, desc }) => (
              <div
                key={step}
                className="flex flex-col items-center text-center p-6 rounded-2xl"
                style={{ background: '#fff', border: '1px solid var(--sand)' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--sage-pale)' }}
                >
                  <Icon className="w-6 h-6" style={{ color: 'var(--forest)' }} aria-hidden="true" />
                </div>
                <span
                  className="text-xs font-semibold mb-1"
                  style={{ color: 'var(--gold)', fontFamily: 'var(--font-poppins)' }}
                >
                  Step {step}
                </span>
                <h3
                  className="font-bold text-base mb-2"
                  style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--bark)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ────────────────────────────────────────────────────── */}
      <section
        className="py-14 px-4 text-center"
        style={{ background: 'var(--forest-dark)' }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <ListChecks className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-white mb-3"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Own a farm shop?
          </h2>
          <p className="text-sm sm:text-base mb-8" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7' }}>
            List your shop on Farmmap for free. Reach thousands of customers
            looking to buy local across the UK and Ireland.
          </p>
          <a
            href="mailto:contact@farmmap.co.uk?subject=List my farm shop"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl"
            style={{ background: 'var(--gold)', color: '#fff', fontFamily: 'var(--font-poppins)' }}
          >
            Get Listed — It&apos;s Free
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 text-xs"
        style={{ background: '#0d3d1f', color: 'rgba(255,255,255,0.45)' }}
      >
        <span>© 2025 Derrywilligan Farm Ltd · farmmap.co.uk · Map data © OpenStreetMap contributors</span>
        <div className="flex gap-4 flex-wrap justify-center">
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies'], ['Contact', 'mailto:contact@farmmap.co.uk']].map(([label, href]) => (
            <a key={href} href={href} className="hover:text-white transition-colors cursor-pointer">
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
