import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * /dashboard — finds the user's shop and redirects to their dashboard.
 * If they have no shop yet, shows a holding page.
 */
export default async function DashboardIndexPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: shop } = await supabase
    .from('shops')
    .select('slug')
    .eq('owner_user_id', user.id)
    .single()

  if (shop?.slug) redirect(`/dashboard/${shop.slug}`)

  // User is authenticated but has no shop assigned yet
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f9fafb' }}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: '#15803d' }}
        >
          <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-poppins)' }}>F</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
          Your shop is being set up
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          The Farmmap team will link your account to your shop shortly.
          You&apos;ll receive an email once everything is ready.
        </p>
        <p className="text-xs text-gray-400 mt-6">
          Signed in as <strong className="text-gray-500">{user.email}</strong>
        </p>
      </div>
    </div>
  )
}
