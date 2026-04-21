import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page not found — Farmmap',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🌿</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-6">
          This shop listing may have moved or been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors"
        >
          Back to the map
        </Link>
      </div>
    </div>
  )
}
