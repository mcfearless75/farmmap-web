import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_FIELDS = ['name', 'tagline', 'hero_image_url', 'logo_url', 'accent_colour'] as const
type AllowedField = typeof ALLOWED_FIELDS[number]

type PatchBody = Partial<Record<AllowedField, string>>

/**
 * PATCH /api/shops/[shopSlug]/settings
 * Updates shop branding fields. Verifies ownership before writing.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  // Auth check via session client
  const sessionClient = await createServerClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Verify ownership
  const { data: shop } = await sessionClient
    .from('shops')
    .select('id')
    .eq('slug', shopSlug)
    .eq('owner_user_id', user.id)
    .single()

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found or not owned by you' }, { status: 403 })
  }

  // Parse and whitelist body
  const raw = await req.json() as Record<string, unknown>

  const updates: PatchBody = {}
  for (const field of ALLOWED_FIELDS) {
    if (field in raw && typeof raw[field] === 'string') {
      updates[field] = raw[field] as string
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  // Validate tagline length
  if (updates.tagline !== undefined && updates.tagline.length > 120) {
    return NextResponse.json({ error: 'Tagline must be 120 characters or fewer' }, { status: 422 })
  }

  // Write via service role client
  const adminClient = createClient(url, key)
  const { data: updated, error } = await adminClient
    .from('shops')
    .update(updates)
    .eq('id', shop.id)
    .select('id, name, tagline, hero_image_url, logo_url, accent_colour')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ shop: updated })
}
