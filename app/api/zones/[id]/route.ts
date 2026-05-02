import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

type RouteContext = { params: Promise<{ id: string }> }

interface PatchBody {
  shopSlug:                       string
  name?:                          string
  postcode_prefixes?:             string | string[]
  product_categories?:            string[]
  delivery_fee_pence?:            number
  free_delivery_threshold_pence?: number | null
  lead_time_days?:                number
  active?:                        boolean
}

interface DeleteBody {
  shopSlug: string
}

async function resolveOwnership(sessionClient: Awaited<ReturnType<typeof createServerClient>>, userId: string, zoneId: string) {
  // Join via shop ownership to verify the user owns the zone
  const { data: zone } = await sessionClient
    .from('delivery_zones')
    .select('id, shop_id, shops!inner(owner_user_id)')
    .eq('id', zoneId)
    .single()

  if (!zone) return null

  const shopOwner = (zone.shops as unknown as { owner_user_id: string })?.owner_user_id
  if (shopOwner !== userId) return null

  return zone
}

/**
 * PATCH /api/zones/[id]
 * Update a delivery zone. Verifies shop ownership.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params

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

  const zone = await resolveOwnership(sessionClient, user.id, id)
  if (!zone) {
    return NextResponse.json({ error: 'Zone not found or not owned by you' }, { status: 403 })
  }

  const body = await req.json() as PatchBody

  const updates: Record<string, unknown> = {}

  if (body.name !== undefined)                          updates.name                          = body.name.trim()
  if (body.delivery_fee_pence !== undefined)            updates.delivery_fee_pence            = body.delivery_fee_pence
  if (body.free_delivery_threshold_pence !== undefined) updates.free_delivery_threshold_pence = body.free_delivery_threshold_pence
  if (body.lead_time_days !== undefined)                updates.lead_time_days                = body.lead_time_days
  if (body.active !== undefined)                        updates.active                        = body.active
  if (body.product_categories !== undefined)            updates.product_categories            = body.product_categories

  if (body.postcode_prefixes !== undefined) {
    updates.postcode_prefixes = Array.isArray(body.postcode_prefixes)
      ? body.postcode_prefixes.map((p: string) => p.trim().toUpperCase()).filter(Boolean)
      : String(body.postcode_prefixes).split(',').map((p: string) => p.trim().toUpperCase()).filter(Boolean)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const adminClient = createClient(url, key)
  const { data: updated, error } = await adminClient
    .from('delivery_zones')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ zone: updated })
}

/**
 * DELETE /api/zones/[id]
 * Delete a delivery zone. Verifies shop ownership.
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params

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

  const zone = await resolveOwnership(sessionClient, user.id, id)
  if (!zone) {
    return NextResponse.json({ error: 'Zone not found or not owned by you' }, { status: 403 })
  }

  // Consume body (shopSlug present for consistency but ownership already verified above)
  await req.json() as DeleteBody

  const adminClient = createClient(url, key)
  const { error } = await adminClient
    .from('delivery_zones')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
