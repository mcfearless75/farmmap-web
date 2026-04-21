import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import ShopMiniMap from '@/components/map/ShopMiniMap'
import { formatAddress, getCountryLabel } from '@/lib/utils'
import {
  MapPin, Phone, Mail, Globe, Clock, CheckCircle,
  ArrowLeft, Store, Shield
} from 'lucide-react'
import type { Shop, ConfirmationCount, OpeningHours } from '@/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('shops')
    .select('name, town, county, description')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (!data) return { title: 'Shop not found — Farmmap' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://farmmap.co.uk'
  const shopUrl = `${siteUrl}/shop/${slug}`
  const description = data.description ?? `${data.name} is a farm shop in ${data.town}, ${data.county}. Find it on Farmmap — the UK and Ireland farm shop directory.`

  return {
    title: `${data.name} — Farm Shop in ${data.town}`,
    description,
    alternates: { canonical: shopUrl },
    openGraph: {
      title: `${data.name} — Farm Shop`,
      description,
      url: shopUrl,
      siteName: 'Farmmap',
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${data.name} — Farm Shop`,
      description,
    },
  }
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

function HoursTable({ hours }: { hours: OpeningHours }) {
  return (
    <div className="text-sm space-y-1">
      {DAYS.map(day => {
        const val = hours[day]
        if (!val) return null
        return (
          <div key={day} className="flex gap-3">
            <span className="capitalize text-gray-500 w-24 shrink-0">{day}</span>
            <span className="text-gray-900">{val}</span>
          </div>
        )
      })}
      {hours.seasonal_notes && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2">
          {hours.seasonal_notes}
        </p>
      )}
    </div>
  )
}

function ConfirmationBar({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{count}</span>
    </div>
  )
}

export default async function ShopPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (!shop) notFound()

  // Confirmation counts
  const { data: confirmationRows } = await supabase
    .from('confirmations')
    .select('confirmation_statement_id, confirmation_statements(label, key)')
    .eq('shop_id', shop.id)

  const countMap: Record<string, { label: string; count: number }> = {}
  for (const row of confirmationRows ?? []) {
    const raw = row.confirmation_statements
    const stmt = (Array.isArray(raw) ? raw[0] : raw) as { label: string; key: string } | null
    if (!stmt) continue
    const id = row.confirmation_statement_id
    if (!countMap[id]) countMap[id] = { label: stmt.label, count: 0 }
    countMap[id].count++
  }

  const confirmations = Object.values(countMap)
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)

  // Approved photos
  const { data: photos } = await supabase
    .from('photos')
    .select('id, storage_path, caption')
    .eq('shop_id', shop.id)
    .eq('status', 'approved')
    .limit(10)

  const typedShop = shop as unknown as Shop
  const hours = typedShop.opening_hours as OpeningHours | null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://farmmap.co.uk'
  const shopUrl = `${siteUrl}/shop/${slug}`

  // Build LocalBusiness JSON-LD (FoodEstablishment subtype where applicable)
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': shopUrl,
    name: typedShop.name,
    url: shopUrl,
    ...(typedShop.phone && { telephone: typedShop.phone }),
    ...(typedShop.email && { email: typedShop.email }),
    ...(typedShop.website && { sameAs: [typedShop.website.startsWith('http') ? typedShop.website : `https://${typedShop.website}`] }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: [typedShop.address_line1, typedShop.address_line2].filter(Boolean).join(', '),
      addressLocality: typedShop.town,
      addressRegion: typedShop.county,
      postalCode: typedShop.postcode,
      addressCountry: typedShop.country.startsWith('IE') ? 'IE' : 'GB',
    },
    ...(typedShop.latitude && typedShop.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: typedShop.latitude,
        longitude: typedShop.longitude,
      },
    }),
    ...(typedShop.description && { description: typedShop.description }),
    ...(photos && photos.length > 0 && {
      image: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${photos[0].storage_path}`,
    }),
    ...(hours && {
      openingHoursSpecification: DAYS
        .filter(d => hours[d])
        .map(d => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: `https://schema.org/${d.charAt(0).toUpperCase() + d.slice(1)}`,
          description: hours[d],
        })),
    }),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Farmmap', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: typedShop.name, item: shopUrl },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/" className="font-semibold text-green-700 text-sm">Farmmap</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500 truncate">{typedShop.name}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{typedShop.name}</h1>
              <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{formatAddress(typedShop)}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {getCountryLabel(typedShop.country)}
              </div>
            </div>
            {typedShop.verified && (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs px-2.5 py-1.5 rounded-full border border-amber-200 shrink-0">
                <Shield className="w-3.5 h-3.5" />
                Verified owner
              </div>
            )}
          </div>

          {/* Product tags */}
          {typedShop.product_categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {typedShop.product_categories.map(cat => (
                <span
                  key={cat}
                  className="text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-0.5 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Location mini-map */}
        {typedShop.latitude && typedShop.longitude && (
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="relative h-48 bg-gray-100">
              <ShopMiniMap
                lat={typedShop.latitude}
                lng={typedShop.longitude}
                name={typedShop.name}
              />
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${typedShop.latitude}&mlon=${typedShop.longitude}#map=15/${typedShop.latitude}/${typedShop.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ borderTop: '1px solid #f3f4f6', color: '#15803D' }}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              Open in OpenStreetMap
            </a>
          </div>
        )}

        {/* Photos */}
        {photos && photos.length > 0 && (
          <div className="rounded-xl overflow-hidden">
            <div className={`grid gap-2 ${photos.length === 1 ? '' : 'grid-cols-2'}`}>
              {photos.slice(0, 4).map((photo, i) => (
                <div
                  key={photo.id}
                  className={`relative bg-gray-200 ${
                    i === 0 && photos.length > 1 ? 'col-span-2 h-52' : 'h-32'
                  }`}
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${photo.storage_path}`}
                    alt={photo.caption ?? typedShop.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {typedShop.description && (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">About this shop</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {typedShop.description}
            </p>
          </div>
        )}

        {/* Visitor confirmations */}
        {confirmations.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Confirmed by visitors
            </h2>
            {confirmations.map(c => (
              <ConfirmationBar key={c.label} count={c.count} label={c.label} />
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Contact */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Contact</h2>
            {typedShop.phone && (
              <a href={`tel:${typedShop.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-700">
                <Phone className="w-4 h-4 shrink-0" />
                {typedShop.phone}
              </a>
            )}
            {typedShop.email && (
              <a href={`mailto:${typedShop.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-700 break-all">
                <Mail className="w-4 h-4 shrink-0" />
                {typedShop.email}
              </a>
            )}
            {typedShop.website && (
              <a
                href={typedShop.website.startsWith('http') ? typedShop.website : `https://${typedShop.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-700 break-all"
              >
                <Globe className="w-4 h-4 shrink-0" />
                {typedShop.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {!typedShop.phone && !typedShop.email && !typedShop.website && (
              <p className="text-sm text-gray-400">No contact details listed</p>
            )}
          </div>

          {/* Opening hours */}
          {hours && (
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Opening hours
              </h2>
              <HoursTable hours={hours} />
            </div>
          )}
        </div>

        {/* Suggest edit / report */}
        <div className="flex gap-3 text-xs text-gray-400 justify-center pt-2 pb-6">
          <Link href={`/shop/${slug}/suggest-edit`} className="hover:text-gray-600">
            Suggest an edit
          </Link>
          <span>·</span>
          <Link href={`/shop/${slug}/report`} className="hover:text-gray-600">
            Report a problem
          </Link>
        </div>
      </main>
    </div>
  )
}
