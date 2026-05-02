'use client'

import { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'

const CATEGORIES = [
  'Vegetables',
  'Fruit',
  'Meat & Poultry',
  'Dairy & Eggs',
  'Bread & Bakery',
  'Preserves & Condiments',
  'Honey & Beeswax',
  'Drinks',
  'Flowers & Plants',
  'Other',
]

const VAT_OPTIONS = [
  { label: '0% (Zero-rated)', value: 0 },
  { label: '5% (Reduced rate)', value: 5 },
  { label: '20% (Standard rate)', value: 20 },
]

interface FormErrors {
  name?: string
  category?: string
  price?: string
  short_description?: string
  stock_quantity?: string
  form?: string
}

export default function NewProductPage() {
  const params   = useParams<{ shopSlug: string }>()
  const router   = useRouter()
  const shopSlug = params.shopSlug

  const [isPending, startTransition] = useTransition()

  const [name, setName]                         = useState('')
  const [category, setCategory]                 = useState('')
  const [priceStr, setPriceStr]                 = useState('')
  const [vatRate, setVatRate]                   = useState(0)
  const [shortDesc, setShortDesc]               = useState('')
  const [stockMode, setStockMode]               = useState<'unlimited' | 'limited'>('unlimited')
  const [stockQty, setStockQty]                 = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState('5')
  const [errors, setErrors]                     = useState<FormErrors>({})

  function validate(): boolean {
    const next: FormErrors = {}

    if (!name.trim()) {
      next.name = 'Product name is required.'
    }
    if (!category) {
      next.category = 'Please select a category.'
    }
    const penceFloat = parseFloat(priceStr)
    if (!priceStr || isNaN(penceFloat) || penceFloat < 0) {
      next.price = 'Enter a valid price (e.g. 2.50).'
    }
    if (shortDesc.length > 300) {
      next.short_description = 'Short description must be 300 characters or fewer.'
    }
    if (stockMode === 'limited') {
      const qty = parseInt(stockQty, 10)
      if (!stockQty || isNaN(qty) || qty < 0) {
        next.stock_quantity = 'Enter a valid stock quantity.'
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const pricePence = Math.round(parseFloat(priceStr) * 100)

    startTransition(async () => {
      try {
        const res = await fetch('/api/products', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopSlug,
            name:              name.trim(),
            price_pence:       pricePence,
            category,
            short_description: shortDesc.trim() || undefined,
            vat_rate:          vatRate,
            stock_quantity:    stockMode === 'limited' ? parseInt(stockQty, 10) : undefined,
            stock_status:      stockMode === 'unlimited' ? 'in_stock' : undefined,
            low_stock_threshold: stockMode === 'limited' ? parseInt(lowStockThreshold, 10) : undefined,
          }),
        })

        const json = await res.json()

        if (!res.ok) {
          setErrors({ form: json.error ?? 'Something went wrong. Please try again.' })
          return
        }

        router.push(`/dashboard/${shopSlug}/products`)
      } catch {
        setErrors({ form: 'Network error. Please try again.' })
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link
        href={`/dashboard/${shopSlug}/products`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to products
      </Link>

      <h1
        className="text-xl font-bold text-gray-900 mb-6"
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        Add product
      </h1>

      {errors.form && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Product name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            placeholder="e.g. Heritage Tomatoes"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            <option value="">Select a category…</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
        </div>

        {/* Price + VAT */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">£</span>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={priceStr}
                onChange={e => setPriceStr(e.target.value)}
                className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
          </div>

          <div>
            <label htmlFor="vat" className="block text-sm font-medium text-gray-700 mb-1">
              VAT rate
            </label>
            <select
              id="vat"
              value={vatRate}
              onChange={e => setVatRate(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              {VAT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Short description */}
        <div>
          <label htmlFor="short_desc" className="block text-sm font-medium text-gray-700 mb-1">
            Short description
            <span className="ml-1 text-gray-400 font-normal">({shortDesc.length}/300)</span>
          </label>
          <textarea
            id="short_desc"
            value={shortDesc}
            onChange={e => setShortDesc(e.target.value)}
            rows={3}
            maxLength={300}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
            placeholder="Brief description shown on the shop page…"
          />
          {errors.short_description && (
            <p className="mt-1 text-xs text-red-600">{errors.short_description}</p>
          )}
        </div>

        {/* Stock */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Stock</p>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="stockMode"
                value="unlimited"
                checked={stockMode === 'unlimited'}
                onChange={() => setStockMode('unlimited')}
                className="accent-green-600"
              />
              Unlimited
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="stockMode"
                value="limited"
                checked={stockMode === 'limited'}
                onChange={() => setStockMode('limited')}
                className="accent-green-600"
              />
              Enter quantity
            </label>
          </div>

          {stockMode === 'limited' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="stock_qty" className="block text-xs text-gray-500 mb-1">
                  Quantity in stock
                </label>
                <input
                  id="stock_qty"
                  type="number"
                  min="0"
                  step="1"
                  value={stockQty}
                  onChange={e => setStockQty(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  placeholder="0"
                />
                {errors.stock_quantity && (
                  <p className="mt-1 text-xs text-red-600">{errors.stock_quantity}</p>
                )}
              </div>
              <div>
                <label htmlFor="low_stock" className="block text-xs text-gray-500 mb-1">
                  Low stock alert threshold
                </label>
                <input
                  id="low_stock"
                  type="number"
                  min="0"
                  step="1"
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 cursor-pointer"
            style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Saving…' : 'Add product'}
          </button>
          <Link
            href={`/dashboard/${shopSlug}/products`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      <p className="mt-4 text-xs text-gray-400">
        New products are submitted for review. They will appear on your shop once approved.
      </p>
    </div>
  )
}
