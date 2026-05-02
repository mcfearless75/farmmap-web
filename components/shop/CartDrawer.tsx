'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react'
import { useCart } from '@/lib/cart'

export default function CartDrawer() {
  const items        = useCart(s => s.items)
  const isOpen       = useCart(s => s.isOpen)
  const closeCart    = useCart(s => s.closeCart)
  const removeItem   = useCart(s => s.removeItem)
  const updateQty    = useCart(s => s.updateQuantity)
  const total        = useCart(s => s.total())
  const clearCart    = useCart(s => s.clearCart)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      clearCart()
      window.location.href = data.url
    } catch {
      setError('Network error — please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping basket"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" style={{ color: 'var(--forest)' }} />
            <h2
              className="font-semibold text-gray-900 text-sm"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Basket ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close basket"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center pt-10">Your basket is empty</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3">
                {item.image && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold text-gray-900 leading-tight"
                    style={{ fontFamily: 'var(--font-poppins)' }}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.shopName}</p>
                  <p className="text-xs text-gray-400">{item.unit}</p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-4 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}
                    >
                      £{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Order total</span>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}
              >
                £{total.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Delivery arranged directly with the farm shop after payment.
            </p>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Redirecting…' : 'Proceed to payment'}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
