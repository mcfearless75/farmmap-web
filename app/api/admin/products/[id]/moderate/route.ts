import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface ModerateBody {
  action: 'approve' | 'reject'
  note?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify the requesting user is admin or moderator
  const authClient = await createClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const adminClient = await createAdminClient()

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !['admin', 'moderator'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: ModerateBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { action, note } = body

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  if (action === 'reject' && !note?.trim()) {
    return NextResponse.json({ error: 'A moderation note is required when rejecting' }, { status: 400 })
  }

  const updates =
    action === 'approve'
      ? {
          status: 'approved',
          active: true,
          moderation_note: null,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
        }
      : {
          status: 'rejected',
          active: false,
          moderation_note: note?.trim() ?? null,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
        }

  const { data: product, error: updateError } = await adminClient
    .from('products')
    .update(updates)
    .eq('id', id)
    .select('id, status')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, product })
}
