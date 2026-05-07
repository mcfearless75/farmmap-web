'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props {
  shop: {
    id: string
    name: string
    slug: string
    town: string | null
    county: string | null
    created_at: string
  }
}

export default function ShopModerationRow({ shop }: Props) {
  const [hidden, setHidden] = useState(false)
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (hidden) return null

  async function moderate(action: 'approve' | 'reject') {
    setLoading(action)
    setError(null)

    try {
      const res = await fetch(`/api/admin/shops/${shop.id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Request failed')
      }

      setHidden(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
      <div>
        <span className="text-sm font-medium text-gray-900">{shop.name}</span>
        <div className="text-xs text-gray-400 mt-0.5">
          {shop.town}{shop.county ? `, ${shop.county}` : ''} ·{' '}
          {new Date(shop.created_at).toLocaleDateString('en-GB')}
        </div>
        {error && (
          <div className="text-xs text-red-600 mt-1">{error}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => moderate('approve')}
          disabled={loading !== null}
          className="flex items-center gap-1 text-xs border px-2.5 py-1 rounded-lg disabled:opacity-50"
          style={{ color: '#15803d', borderColor: '#bbf7d0' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <CheckCircle className="w-3 h-3" />
          {loading === 'approve' ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={() => moderate('reject')}
          disabled={loading !== null}
          className="flex items-center gap-1 text-xs border px-2.5 py-1 rounded-lg disabled:opacity-50"
          style={{ color: '#b91c1c', borderColor: '#fecaca' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fff1f2')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <XCircle className="w-3 h-3" />
          {loading === 'reject' ? 'Rejecting…' : 'Reject'}
        </button>
        <Link
          href={`/admin/shops/${shop.id}/edit`}
          className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50"
        >
          Review →
        </Link>
      </div>
    </div>
  )
}
