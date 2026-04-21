import ShopForm from '../ShopForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewShopPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/shops" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Add shop</h1>
      </div>
      <ShopForm mode="create" />
    </div>
  )
}
