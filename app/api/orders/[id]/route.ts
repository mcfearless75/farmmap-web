import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type OrderStatus =
  | 'pending' | 'accepted' | 'preparing' | 'dispatched' | 'delivered'
  | 'cancelled' | 'refunded' | 'partially_refunded' | 'disputed'

const ALLOWED_STATUSES: OrderStatus[] = [
  'accepted', 'preparing', 'dispatched', 'delivered', 'cancelled',
]

interface PatchBody {
  order_status?: OrderStatus
  shop_note?:    string
}

function timestampsForStatus(status: OrderStatus): Partial<Record<string, string>> {
  const now = new Date().toISOString()
  if (status === 'accepted')   return { accepted_at: now }
  if (status === 'dispatched') return { dispatched_at: now }
  if (status === 'delivered')  return { delivered_at: now }
  return {}
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  // Auth check via cookie session
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id: orderId } = await params

  let body: PatchBody
  try {
    body = await req.json() as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (body.order_status && !ALLOWED_STATUSES.includes(body.order_status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey)

  // Verify order belongs to a shop owned by the current user
  const { data: order } = await serviceClient
    .from('orders')
    .select('id, shop_id')
    .eq('id', orderId)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const { data: shop } = await serviceClient
    .from('shops')
    .select('id')
    .eq('id', order.shop_id)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Build update payload
  const update: Record<string, unknown> = {}

  if (body.order_status) {
    update.order_status = body.order_status
    const timestamps = timestampsForStatus(body.order_status)
    Object.assign(update, timestamps)
  }

  if (typeof body.shop_note === 'string') {
    const trimmed = body.shop_note.trim().slice(0, 2000)
    update.shop_note = trimmed
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { data: updated, error } = await serviceClient
    .from('orders')
    .update(update)
    .eq('id', orderId)
    .eq('shop_id', shop.id)
    .select('id, order_number, order_status, shop_note, tracking_token, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: updated })
}
