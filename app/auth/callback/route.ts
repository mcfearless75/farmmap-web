import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/sign-in?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/auth/sign-in?error=exchange_failed`)
  }

  // Look up which shop this user owns so we can land them in the right place
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: shop } = await supabase
      .from('shops')
      .select('slug')
      .eq('owner_user_id', user.id)
      .single()

    if (shop?.slug) {
      return NextResponse.redirect(`${origin}/dashboard/${shop.slug}`)
    }
  }

  // Fallback: redirect to wherever `next` says, or /dashboard
  return NextResponse.redirect(`${origin}${next}`)
}
