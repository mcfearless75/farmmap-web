import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Clock, CheckCircle, XCircle } from 'lucide-react'

export default async function QueuePage() {
  const supabase = await createClient()

  const [
    { data: pendingShops },
    { data: pendingPhotos },
    { data: pendingEdits },
    { data: pendingClaims },
  ] = await Promise.all([
    supabase.from('shops').select('id, name, slug, town, county, created_at').eq('status', 'pending').order('created_at'),
    supabase.from('photos').select('id, shop_id, storage_path, created_at, shops(name, slug)').eq('status', 'pending').order('created_at').limit(20),
    supabase.from('shop_edits').select('id, shop_id, proposed_data, created_at, shops(name, slug)').eq('status', 'pending').order('created_at').limit(20),
    supabase.from('ownership_claims').select('id, shop_id, evidence, created_at, shops(name, slug)').eq('status', 'pending').order('created_at').limit(20),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Moderation Queue</h1>

      {/* Pending shops */}
      <section>
        <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Pending shops ({pendingShops?.length ?? 0})
        </h2>
        {pendingShops?.length ? (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {pendingShops.map(shop => (
              <QueueShopRow key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <EmptyState label="No pending shops" />
        )}
      </section>

      {/* Pending edits */}
      {(pendingEdits?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            Pending edits ({pendingEdits?.length ?? 0})
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {pendingEdits?.map(edit => (
              <div key={edit.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {(edit.shops as any)?.name}
                  </span>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(edit.created_at).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <Link
                  href={`/admin/shops/${edit.shop_id}/edit`}
                  className="text-xs text-green-700 hover:underline"
                >
                  Review →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending ownership claims */}
      {(pendingClaims?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Ownership claims ({pendingClaims?.length ?? 0})
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {pendingClaims?.map(claim => (
              <div key={claim.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {(claim.shops as any)?.name}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 max-w-lg">{claim.evidence}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(claim.created_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function QueueShopRow({ shop }: { shop: any }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
      <div>
        <span className="text-sm font-medium text-gray-900">{shop.name}</span>
        <div className="text-xs text-gray-400 mt-0.5">
          {shop.town}{shop.county ? `, ${shop.county}` : ''} ·{' '}
          {new Date(shop.created_at).toLocaleDateString('en-GB')}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/shops/${shop.id}/edit`}
          className="flex items-center gap-1 text-xs text-green-700 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-50"
        >
          <CheckCircle className="w-3 h-3" />
          Review
        </Link>
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-8 text-center text-sm text-gray-400">
      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
      {label}
    </div>
  )
}
