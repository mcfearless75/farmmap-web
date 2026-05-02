import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import ProductEditForm from './ProductEditForm'

interface Props {
  params: Promise<{ shopSlug: string; productId: string }>
}

export const metadata: Metadata = {
  title: 'Edit Product — Farmmap Dashboard',
  robots: { index: false },
}

export default async function EditProductPage({ params }: Props) {
  const { shopSlug, productId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // Verify shop ownership
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) redirect('/')

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('shop_id', shop.id)
    .single()

  if (!product) redirect(`/dashboard/${shopSlug}/products`)

  return (
    <ProductEditForm
      shopSlug={shopSlug}
      product={product}
    />
  )
}
