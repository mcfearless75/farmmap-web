import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

interface PostBody {
  shopSlug:                      string
  name:                          string
  postcode_prefixes:             string | string[]
  product_categories?:           string[]
  delivery_fee_pence:            number
  free_delivery_threshold_pence?: number | null
  lead_time_days:                number
  active:                        boolean
}

/**
 * POST /api/zones
 * Creates a delivery zone for the authenticated shop owner.
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const sessionClient = await createServerClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json() as PostBody
  const { shopSlug, name, postcode_prefixes, product_categories, delivery_fee_pence, free_delivery_threshold_pence, lead_time_days, active } = body

  if (!shopSlug || !name) {
    return NextResponse.json({ error: 'shopSlug and name are required' }, { status: 400 })
  }

  // Verify shop ownership
  const { data: shop } = await sessionClient
    .from('shops')
    .select('id, tier')
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found or not owned by you' }, { status: 403 })
  }

  const tier = shop.tier ?? 'free'
  if (tier !== 'silver' && tier !== 'gold') {
    return NextResponse.json({ error: 'Delivery zones require Silver tier or above' }, { status: 403 })
  }

  // Normalise postcode prefixes — accept comma-string or array
  const prefixes = Array.isArray(postcode_prefixes)
    ? postcode_prefixes.map((p: string) => p.trim().toUpperCase()).filter(Boolean)
    : String(postcode_prefixes).split(',').map((p: string) => p.trim().toUpperCase()).filter(Boolean)

  const adminClient = createClient(url, key)
  const { data: zone, error } = await adminClient
    .from('delivery_zones')
    .insert({
      shop_id:                       shop.id,
      name:                          name.trim(),
      postcode_prefixes:             prefixes,
      product_categories:            product_categories ?? [],
      delivery_fee_pence:            delivery_fee_pence,
      free_delivery_threshold_pence: free_delivery_threshold_pence ?? null,
      lead_time_days:                lead_time_days ?? 1,
      active:                        active ?? true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ zone }, { status: 201 })
}
