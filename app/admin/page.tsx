import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Store, Clock, CheckCircle, Image as ImageIcon, Plus } from 'lucide-react'

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { count: totalApproved },
    { count: pendingShops },
    { count: pendingPhotos },
    { count: pendingEdits },
  ] = await Promise.all([
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('photos').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('shop_edits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  return { totalApproved, pendingShops, pendingPhotos, pendingEdits }
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const stats = await getStats(supabase)

  const { data: recentShops } = await supabase
    .from('shops')
    .select('id, name, slug, status, created_at, town, country')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/admin/shops/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add shop
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Live shops', value: stats.totalApproved ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending shops', value: stats.pendingShops ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', href: '/admin/queue' },
          { label: 'Pending photos', value: stats.pendingPhotos ?? 0, icon: ImageIcon, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/queue' },
          { label: 'Pending edits', value: stats.pendingEdits ?? 0, icon: Store, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/queue' },
        ].map(({ label, value, icon: Icon, color, bg, href }) => {
          const card = (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className={`w-9 h-9 ${bg} ${color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </div>
          )
          return href ? (
            <Link key={label} href={href}>{card}</Link>
          ) : (
            <div key={label}>{card}</div>
          )
        })}
      </div>

      {/* Recent shops */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Recent shops</h2>
          <Link href="/admin/shops" className="text-xs text-green-700 hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {(recentShops ?? []).map(shop => (
            <div key={shop.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
              <div>
                <Link href={`/admin/shops/${shop.id}/edit`} className="font-medium text-sm text-gray-900 hover:text-green-700">
                  {shop.name}
                </Link>
                <div className="text-xs text-gray-400 mt-0.5">{shop.town} · {shop.country}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  shop.status === 'approved'
                    ? 'bg-green-50 text-green-700'
                    : shop.status === 'pending'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {shop.status}
                </span>
                <Link
                  href={`/shop/${shop.slug}`}
                  target="_blank"
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
