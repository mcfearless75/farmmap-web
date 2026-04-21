import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

interface Props {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

const PAGE_SIZE = 30

export default async function AdminShops({ searchParams }: Props) {
  const { q, status, page } = await searchParams
  const currentPage = parseInt(page ?? '1', 10)
  const offset = (currentPage - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from('shops')
    .select('id, name, slug, status, town, county, country, product_categories, verified, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q) query = query.ilike('name', `%${q}%`)
  if (status) query = query.eq('status', status)

  const { data: shops, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Shops <span className="text-sm font-normal text-gray-400">({count?.toLocaleString() ?? 0})</span>
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/shops/new"
            className="flex items-center gap-2 px-3 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add shop
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <form className="flex-1 min-w-48">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search shops…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
        </form>
        <div className="flex gap-1">
          {['', 'approved', 'pending', 'rejected', 'archived'].map(s => (
            <Link
              key={s}
              href={`/admin/shops?${s ? `status=${s}` : ''}${q ? `&q=${q}` : ''}`}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                (status ?? '') === s
                  ? 'bg-green-700 text-white border-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-green-400'
              }`}
            >
              {s || 'All'}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden sm:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs hidden md:table-cell">Products</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(shops ?? []).map(shop => (
                <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{shop.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{shop.country}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500 text-xs">
                    {shop.town}{shop.county ? `, ${shop.county}` : ''}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(shop.product_categories as string[]).slice(0, 2).map((cat: string) => (
                        <span key={cat} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      shop.status === 'approved' ? 'bg-green-50 text-green-700' :
                      shop.status === 'pending'  ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {shop.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/shops/${shop.id}/edit`}
                        className="text-xs text-green-700 hover:underline"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/shop/${shop.slug}`}
                        target="_blank"
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/shops?page=${currentPage - 1}${status ? `&status=${status}` : ''}${q ? `&q=${q}` : ''}`}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/admin/shops?page=${currentPage + 1}${status ? `&status=${status}` : ''}${q ? `&q=${q}` : ''}`}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
