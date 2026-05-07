import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_UPDATE_FIELDS = new Set([
  'name', 'slug', 'price_pence', 'category', 'short_description',
  'vat_rate', 'stock_quantity', 'stock_status', 'low_stock_threshold', 'active',
])

interface RouteContext {
  params: Promise<{ id: string }>
}

async function getAdminAndUser(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return { error: NextResponse.json({ error: 'Server configuration error' }, { status: 503 }) }
  }

  const userClient = await createServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }) }
  }

  const admin = createClient(supabaseUrl, serviceKey)
  return { admin, user }
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const result = await getAdminAndUser(_req)
  if ('error' in result) return result.error

  const { admin, user } = result

  const { data: product, error } = await admin
    .from('products')
    .select('*, shops!inner(owner_user_id)')
    .eq('id', id)
    .eq('shops.owner_user_id', user.id)
    .single()

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json({ data: product })
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const result = await getAdminAndUser(req)
  if ('error' in result) return result.error

  const { admin, user } = result

  // Verify ownership via shop join
  const { data: existing } = await admin
    .from('products')
    .select('id, shops!inner(owner_user_id)')
    .eq('id', id)
    .eq('shops.owner_user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Product not found or not owned by you' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const incoming = body as Record<string, unknown>
  const updates: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(incoming)) {
    if (ALLOWED_UPDATE_FIELDS.has(key)) {
      updates[key] = value
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data: product, error } = await admin
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A product with that slug already exists in this shop' }, { status: 409 })
    }
    console.error('[products/patch]', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }

  return NextResponse.json({ data: product })
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const result = await getAdminAndUser(req)
  if ('error' in result) return result.error

  const { admin, user } = result

  const { data: product } = await admin
    .from('products')
    .select('id, status, shops!inner(owner_user_id)')
    .eq('id', id)
    .eq('shops.owner_user_id', user.id)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found or not owned by you' }, { status: 403 })
  }

  if (product.status !== 'pending' && product.status !== 'archived') {
    return NextResponse.json(
      { error: 'Only pending or archived products can be deleted' },
      { status: 422 }
    )
  }

  const { error } = await admin.from('products').delete().eq('id', id)

  if (error) {
    console.error('[products/delete]', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }

  return NextResponse.json({ data: { deleted: true } })
}
