'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export default function DeleteShopButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('shops').delete().eq('id', id)
    router.push('/admin/shops')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  )
}
