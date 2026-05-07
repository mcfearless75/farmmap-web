import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 })
  }

  // Auth via cookie session
  const userClient = await createServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    shopSlug,
    name,
    slug: rawSlug,
    price_pence,
    category,
    short_description,
    vat_rate,
    stock_quantity,
    stock_status,
    low_stock_threshold,
  } = body as Record<string, unknown>

  if (!shopSlug || typeof shopSlug !== 'string') {
    return NextResponse.json({ error: 'shopSlug is required' }, { status: 400 })
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (price_pence === undefined || typeof price_pence !== 'number' || !Number.isInteger(price_pence) || price_pence < 0) {
    return NextResponse.json({ error: 'price_pence must be a non-negative integer' }, { status: 400 })
  }
  if (!category || typeof category !== 'string') {
    return NextResponse.json({ error: 'category is required' }, { status: 400 })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // Verify shop ownership
  const { data: shop } = await admin
    .from('shops')
    .select('id')
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found or not owned by you' }, { status: 403 })
  }

  const slug = (rawSlug && typeof rawSlug === 'string' && rawSlug.trim())
    ? rawSlug.trim()
    : slugify(name.trim())

  const { data: product, error } = await admin
    .from('products')
    .insert({
      shop_id:            shop.id,
      name:               name.trim(),
      slug,
      price_pence,
      category,
      short_description:  short_description ?? null,
      vat_rate:           vat_rate          ?? 0,
      stock_quantity:     stock_quantity    ?? null,
      stock_status:       stock_status      ?? 'in_stock',
      low_stock_threshold: low_stock_threshold ?? 5,
      status:             'pending',
      active:             false,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A product with that slug already exists in this shop' }, { status: 409 })
    }
    console.error('[products/create]', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }

  return NextResponse.json({ data: product }, { status: 201 })
}
