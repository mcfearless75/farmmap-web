'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart'

export default function CartButton() {
  const count = useCart(s => s.itemCount())
  const openCart = useCart(s => s.openCart)

  if (count === 0) return null

  return (
    <button
      onClick={openCart}
      aria-label={`View basket — ${count} item${count !== 1 ? 's' : ''}`}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-xl cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-95"
      style={{ background: 'var(--forest)', color: '#fff', fontFamily: 'var(--font-poppins)' }}
    >
      <ShoppingCart className="w-5 h-5" />
      <span className="text-sm font-semibold">{count}</span>
    </button>
  )
}
