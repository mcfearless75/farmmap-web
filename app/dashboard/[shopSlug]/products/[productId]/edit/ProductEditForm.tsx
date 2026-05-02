'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react'
import { formatPence } from '@/lib/tiers'

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

const STATUS_MAP = {
  pending:  { label: 'Pending review', Icon: Clock,        colour: '#b45309', bg: '#fef3c718' },
  approved: { label: 'Approved',       Icon: CheckCircle,  colour: '#15803d', bg: '#f0fdf418' },
  rejected: { label: 'Rejected',       Icon: XCircle,      colour: '#b91c1c', bg: '#fef2f218' },
  archived: { label: 'Archived',       Icon: XCircle,      colour: '#6b7280', bg: '#f9fafb18' },
} as const

type ProductStatus = keyof typeof STATUS_MAP

interface Product {
  id: string
  name: string
  slug: string
  price_pence: number
  category: string
  short_description: string | null
  vat_rate: number
  stock_quantity: number | null
  stock_status: string
  low_stock_threshold: number | null
  active: boolean
  status: string
  moderation_note: string | null
  created_at: string
  updated_at: string
}

interface Props {
  shopSlug: string
  product:  Product
}

interface FormErrors {
  name?: string
  category?: string
  price?: string
  short_description?: string
  stock_quantity?: string
  form?: string
}

export default function ProductEditForm({ shopSlug, product }: Props) {
  const router    = useRouter()
  const [isPending, startTransition]       = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const [name, setName]         = useState(product.name)
  const [category, setCategory] = useState(product.category)
  const [priceStr, setPriceStr] = useState((product.price_pence / 100).toFixed(2))
  const [vatRate, setVatRate]   = useState(product.vat_rate ?? 0)
  const [shortDesc, setShortDesc] = useState(product.short_description ?? '')
  const [stockMode, setStockMode] = useState<'unlimited' | 'limited'>(
    product.stock_quantity !== null ? 'limited' : 'unlimited'
  )
  const [stockQty, setStockQty]   = useState(product.stock_quantity?.toString() ?? '')
  const [lowStockThreshold, setLowStockThreshold] = useState(
    product.low_stock_threshold?.toString() ?? '5'
  )
  const [active, setActive]     = useState(product.active)
  const [errors, setErrors]     = useState<FormErrors>({})
  const [successMsg, setSuccessMsg] = useState('')

  const status     = (product.status as ProductStatus) in STATUS_MAP
    ? (product.status as ProductStatus)
    : 'pending'
  const statusInfo = STATUS_MAP[status]
  const canDelete  = product.status === 'pending' || product.status === 'archived'

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

    setSuccessMsg('')
    const pricePence = Math.round(parseFloat(priceStr) * 100)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/products/${product.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:               name.trim(),
            price_pence:        pricePence,
            category,
            short_description:  shortDesc.trim() || null,
            vat_rate:           vatRate,
            stock_quantity:     stockMode === 'limited' ? parseInt(stockQty, 10) : null,
            stock_status:       stockMode === 'unlimited' ? 'in_stock' : undefined,
            low_stock_threshold: stockMode === 'limited' ? parseInt(lowStockThreshold, 10) : null,
            active,
          }),
        })

        const json = await res.json()

        if (!res.ok) {
          setErrors({ form: json.error ?? 'Something went wrong. Please try again.' })
          return
        }

        setSuccessMsg('Product updated successfully.')
      } catch {
        setErrors({ form: 'Network error. Please try again.' })
      }
    })
  }

  function handleDelete() {
    if (!confirm('Delete this product? This cannot be undone.')) return

    startDeleteTransition(async () => {
      try {
        const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
        const json = await res.json()

        if (!res.ok) {
          setErrors({ form: json.error ?? 'Could not delete product.' })
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

      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Edit product
        </h1>

        {/* Moderation status badge */}
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: `${statusInfo.colour}18`, color: statusInfo.colour }}
        >
          <statusInfo.Icon className="w-3.5 h-3.5" />
          {statusInfo.label}
        </span>
      </div>

      {/* Rejection note */}
      {product.status === 'rejected' && product.moderation_note && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <p className="font-medium mb-0.5">Moderation note</p>
          <p>{product.moderation_note}</p>
        </div>
      )}

      {/* Success banner */}
      {successMsg && (
        <div className="mb-5 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

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

        {/* Published toggle */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-700">Published</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {product.status === 'approved'
                ? 'Visible to customers when enabled.'
                : 'Only available once the product is approved.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            disabled={product.status !== 'approved'}
            onClick={() => setActive(v => !v)}
            className={[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-1',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              active ? 'bg-green-600' : 'bg-gray-200',
            ].join(' ')}
          >
            <span
              className={[
                'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                active ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 cursor-pointer"
              style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? 'Saving…' : 'Save changes'}
            </button>
            <Link
              href={`/dashboard/${shopSlug}/products`}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </Link>
          </div>

          {canDelete && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isDeleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />}
              {isDeleting ? 'Deleting…' : 'Delete product'}
            </button>
          )}
        </div>
      </form>

      {/* Metadata */}
      <div className="mt-4 flex gap-6 text-xs text-gray-400">
        <span>
          Created{' '}
          {new Date(product.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
        <span>
          Updated{' '}
          {new Date(product.updated_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
        <span>Listed at {formatPence(product.price_pence)}</span>
      </div>
    </div>
  )
}
