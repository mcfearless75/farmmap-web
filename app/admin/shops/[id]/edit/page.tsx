import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ShopForm from '../../ShopForm'
import DeleteShopButton from './DeleteShopButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditShopPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', id)
    .single()

  if (!shop) notFound()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/shops" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Edit: {shop.name}</h1>
        </div>
        <DeleteShopButton id={id} name={shop.name} />
      </div>
      <ShopForm shop={shop as any} mode="edit" />
    </div>
  )
}
