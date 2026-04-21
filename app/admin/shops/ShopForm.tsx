'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { PRODUCT_CATEGORIES, COUNTRIES, type Shop } from '@/lib/types'
import { Loader2, MapPin } from 'lucide-react'

interface ShopFormProps {
  shop?: Partial<Shop>
  mode: 'create' | 'edit'
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const PAYMENT_OPTIONS = ['Cash', 'Card', 'Contactless', 'Revolut', 'QR', 'Other']

export default function ShopForm({ shop, mode }: ShopFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(shop?.name ?? '')
  const [slug, setSlug] = useState(shop?.slug ?? '')
  const [listingType, setListingType] = useState(shop?.listing_type ?? 'farm_shop')
  const [addressLine1, setAddressLine1] = useState(shop?.address_line1 ?? '')
  const [addressLine2, setAddressLine2] = useState(shop?.address_line2 ?? '')
  const [town, setTown] = useState(shop?.town ?? '')
  const [county, setCounty] = useState(shop?.county ?? '')
  const [postcode, setPostcode] = useState(shop?.postcode ?? '')
  const [country, setCountry] = useState(shop?.country ?? 'GB-NIR')
  const [latitude, setLatitude] = useState(shop?.latitude?.toString() ?? '')
  const [longitude, setLongitude] = useState(shop?.longitude?.toString() ?? '')
  const [description, setDescription] = useState(shop?.description ?? '')
  const [phone, setPhone] = useState(shop?.phone ?? '')
  const [email, setEmail] = useState(shop?.email ?? '')
  const [website, setWebsite] = useState(shop?.website ?? '')
  const [status, setStatus] = useState<string>(shop?.status ?? 'approved')
  const [verified, setVerified] = useState(shop?.verified ?? false)

  const [categories, setCategories] = useState<string[]>(shop?.product_categories ?? [])
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    (shop as any)?.payment_methods ?? []
  )
  const [hours, setHours] = useState<Record<string, string>>(
    shop?.opening_hours as Record<string, string> ?? {}
  )

  function handleNameBlur() {
    if (!slug) setSlug(slugify(name))
  }

  async function geocodeAddress() {
    const q = [addressLine1, town, postcode, country].filter(Boolean).join(', ')
    if (!q) return
    setGeocoding(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
      const res = await fetch(url, { headers: { 'User-Agent': 'Farmmap/1.0 (contact@farmmap.co.uk)' } })
      const data = await res.json()
      if (data.length) {
        setLatitude(parseFloat(data[0].lat).toFixed(6))
        setLongitude(parseFloat(data[0].lon).toFixed(6))
      }
    } finally {
      setGeocoding(false)
    }
  }

  function toggleCategory(cat: string) {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  function togglePayment(p: string) {
    setPaymentMethods(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function updateHours(day: string, val: string) {
    setHours(prev => ({ ...prev, [day]: val }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }

    const payload = {
      name,
      slug: slug || slugify(name),
      listing_type: listingType,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      town,
      county,
      postcode,
      country,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      description: description || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      opening_hours: Object.keys(hours).length ? hours : null,
      product_categories: categories,
      payment_methods: paymentMethods,
      status,
      verified,
      ...(mode === 'create' ? { created_by: user.id } : {}),
    }

    let opError: any
    if (mode === 'create') {
      const { error } = await supabase.from('shops').insert(payload)
      opError = error
    } else {
      const { error } = await supabase.from('shops').update(payload).eq('id', shop!.id!)
      opError = error
    }

    if (opError) {
      setError(opError.message)
      setSaving(false)
      return
    }

    router.push('/admin/shops')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Basic details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic details</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Shop name *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} onBlur={handleNameBlur} required />
          </div>
          <div>
            <label className="label">Slug *</label>
            <input className="input font-mono text-xs" value={slug} onChange={e => setSlug(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="label">Listing type</label>
          <select className="input" value={listingType} onChange={e => setListingType(e.target.value)}>
            <option value="farm_shop">Farm Shop</option>
            <option value="honesty_box">Honesty Box</option>
            <option value="farmgate">Farmgate</option>
            <option value="pyo">Pick Your Own</option>
            <option value="market_stall">Market Stall</option>
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-24 resize-y"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={3000}
          />
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Address</h2>

        <div>
          <label className="label">Address line 1</label>
          <input className="input" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
        </div>
        <div>
          <label className="label">Address line 2</label>
          <input className="input" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Town *</label>
            <input className="input" value={town} onChange={e => setTown(e.target.value)} required />
          </div>
          <div>
            <label className="label">County</label>
            <input className="input" value={county} onChange={e => setCounty(e.target.value)} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Postcode</label>
            <input className="input" value={postcode} onChange={e => setPostcode(e.target.value)} />
          </div>
          <div>
            <label className="label">Country *</label>
            <select className="input" value={country} onChange={e => setCountry(e.target.value)} required>
              {COUNTRIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Latitude</label>
            <input className="input font-mono text-xs" value={latitude} onChange={e => setLatitude(e.target.value)} />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input className="input font-mono text-xs" value={longitude} onChange={e => setLongitude(e.target.value)} />
          </div>
        </div>
        <button
          type="button"
          onClick={geocodeAddress}
          disabled={geocoding}
          className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 disabled:opacity-50"
        >
          {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          {geocoding ? 'Geocoding…' : 'Auto-geocode from address'}
        </button>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Contact</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Website</label>
          <input className="input" value={website} onChange={e => setWebsite(e.target.value)} />
        </div>
      </div>

      {/* Products & payment */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Products</h2>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                categories.includes(cat)
                  ? 'bg-green-700 text-white border-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-green-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div>
          <label className="label mb-2">Payment methods</label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => togglePayment(p)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  paymentMethods.includes(p)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Opening hours */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Opening hours</h2>
        {DAYS.map(day => (
          <div key={day} className="flex items-center gap-3">
            <label className="capitalize text-sm text-gray-500 w-24 shrink-0">{day}</label>
            <input
              className="input flex-1"
              placeholder="e.g. 9am – 5pm or Closed"
              value={hours[day] ?? ''}
              onChange={e => updateHours(day, e.target.value)}
            />
          </div>
        ))}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500 w-24 shrink-0">Notes</label>
          <input
            className="input flex-1"
            placeholder="e.g. Closed bank holidays"
            value={hours.seasonal_notes ?? ''}
            onChange={e => updateHours('seasonal_notes', e.target.value)}
          />
        </div>
      </div>

      {/* Status & flags */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Status</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="label">Listing status</label>
            <select className="input w-44" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-5">
            <input
              type="checkbox"
              checked={verified}
              onChange={e => setVerified(e.target.checked)}
              className="rounded border-gray-300 text-green-700"
            />
            <span className="text-sm text-gray-700">Verified by owner</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : mode === 'create' ? 'Create shop' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/shops')}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
