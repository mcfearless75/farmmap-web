'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  orderId:     string
  orderStatus: string
  trackingToken: string | null
  shopNote:    string | null
}

type Transition = {
  label:  string
  status: string
  style:  'primary' | 'destructive'
}

const TRANSITIONS: Record<string, Transition[]> = {
  pending: [
    { label: 'Accept order',    status: 'accepted',   style: 'primary' },
    { label: 'Cancel order',    status: 'cancelled',  style: 'destructive' },
  ],
  accepted: [
    { label: 'Mark preparing',  status: 'preparing',  style: 'primary' },
    { label: 'Cancel order',    status: 'cancelled',  style: 'destructive' },
  ],
  preparing: [
    { label: 'Mark dispatched', status: 'dispatched', style: 'primary' },
    { label: 'Cancel order',    status: 'cancelled',  style: 'destructive' },
  ],
  dispatched: [
    { label: 'Mark delivered',  status: 'delivered',  style: 'primary' },
  ],
}

export function OrderActions({ orderId, orderStatus, trackingToken, shopNote }: Props) {
  const router = useRouter()
  const [loading, setLoading]     = useState(false)
  const [note, setNote]           = useState(shopNote ?? '')
  const [noteSaving, setNoteSaving] = useState(false)
  const [copied, setCopied]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const transitions = TRANSITIONS[orderStatus] ?? []

  async function updateStatus(newStatus: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ order_status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to update status')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function saveNote() {
    setNoteSaving(true)
    try {
      await fetch(`/api/orders/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ shop_note: note }),
      })
      router.refresh()
    } finally {
      setNoteSaving(false)
    }
  }

  function copyTrackingLink() {
    if (!trackingToken) return
    const url = `https://farmmap.co.uk/order/${trackingToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {transitions.length > 0 && (
        <div className="space-y-2">
          {transitions.map(t => (
            <button
              key={t.status}
              onClick={() => updateStatus(t.status)}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity cursor-pointer disabled:opacity-50"
              style={
                t.style === 'primary'
                  ? { background: '#15803d', color: '#fff', fontFamily: 'var(--font-poppins)' }
                  : { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontFamily: 'var(--font-poppins)' }
              }
            >
              {loading ? 'Updating…' : t.label}
            </button>
          ))}
        </div>
      )}

      {trackingToken && (
        <div className="pt-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Tracking link
          </p>
          <button
            onClick={copyTrackingLink}
            className="w-full text-left px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer truncate"
          >
            {copied ? 'Copied!' : `farmmap.co.uk/order/${trackingToken}`}
          </button>
        </div>
      )}

      <div className="pt-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
          Shop note (internal)
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={saveNote}
          rows={3}
          placeholder="Add a note visible only to you…"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-200 text-gray-700"
        />
        {noteSaving && (
          <p className="text-xs text-gray-400 mt-1">Saving…</p>
        )}
      </div>
    </div>
  )
}
