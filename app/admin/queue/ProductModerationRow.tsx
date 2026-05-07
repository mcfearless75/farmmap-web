'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props {
  product: {
    id: string
    name: string
    price_pence: number
    category: string
    status: string
    created_at: string
    shops: { name: string; slug: string } | null
  }
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export default function ProductModerationRow({ product }: Props) {
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejectMode, setRejectMode] = useState(false)
  const [note, setNote] = useState('')

  if (!visible) return null

  async function moderate(action: 'approve' | 'reject') {
    if (action === 'reject' && !rejectMode) {
      setRejectMode(true)
      return
    }
    if (action === 'reject' && !note.trim()) {
      setError('Enter a moderation note before rejecting.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/products/${product.id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Request failed (${res.status})`)
      }

      setVisible(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-sm font-medium text-gray-900">{product.name}</span>
          <div className="text-xs text-gray-400 mt-0.5">
            {product.shops?.name ?? 'Unknown shop'} &middot; {product.category} &middot;{' '}
            {formatPence(product.price_pence)} &middot;{' '}
            {new Date(product.created_at).toLocaleDateString('en-GB')}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled={loading}
            onClick={() => moderate('approve')}
            className="flex items-center gap-1 text-xs border px-2.5 py-1 rounded-lg disabled:opacity-50"
            style={{ color: '#15803d', borderColor: '#bbf7d0' }}
          >
            <CheckCircle className="w-3 h-3" />
            Approve
          </button>

          <button
            disabled={loading}
            onClick={() => moderate('reject')}
            className="flex items-center gap-1 text-xs border px-2.5 py-1 rounded-lg disabled:opacity-50"
            style={{ color: '#b91c1c', borderColor: '#fecaca' }}
          >
            <XCircle className="w-3 h-3" />
            Reject
          </button>
        </div>
      </div>

      {rejectMode && (
        <div className="mt-2 flex flex-col gap-1.5">
          <textarea
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-red-300"
            rows={2}
            placeholder="Moderation note (required)"
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={loading}
          />
          <div className="flex items-center gap-2">
            <button
              disabled={loading || !note.trim()}
              onClick={() => moderate('reject')}
              className="text-xs border px-2.5 py-1 rounded-lg disabled:opacity-50"
              style={{ color: '#b91c1c', borderColor: '#fecaca' }}
            >
              {loading ? 'Rejecting…' : 'Confirm rejection'}
            </button>
            <button
              disabled={loading}
              onClick={() => { setRejectMode(false); setNote(''); setError(null) }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
