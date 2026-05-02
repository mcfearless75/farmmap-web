'use client'

import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/lib/cart'
import type { CartItem } from '@/lib/cart'

type Props = Omit<CartItem, 'quantity'>

export default function AddToCartButton({ id, shopSlug, shopName, name, price, unit, image }: Props) {
  const addItem = useCart(s => s.addItem)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem({ id, shopSlug, shopName, name, price, unit, image })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      onClick={handleAdd}
      className="flex items-center gap-1.5 w-full justify-center px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer"
      style={{
        background: added ? '#15803D' : 'var(--forest)',
        color: '#fff',
        fontFamily: 'var(--font-poppins)',
      }}
    >
      {added
        ? <><Check className="w-3.5 h-3.5" /> Added</>
        : <><ShoppingCart className="w-3.5 h-3.5" /> Add to basket</>
      }
    </button>
  )
}
