import Link from 'next/link'
import { XCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Payment cancelled — Farmmap',
  robots: { index: false },
}

interface SearchParams {
  shop?: string
}

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { shop: shopSlug } = await searchParams

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#f9fafb' }}
    >
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-semibold"
          style={{ color: '#15803d', fontFamily: 'var(--font-poppins)' }}
        >
          Farmmap
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
        <XCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h1
          className="text-xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Payment cancelled
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Your order wasn&apos;t placed. Your basket is saved — go back and continue
          when you&apos;re ready.
        </p>

        {shopSlug ? (
          <Link
            href={`/shop/${shopSlug}`}
            className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
          >
            Return to shop
          </Link>
        ) : (
          <Link
            href="/map"
            className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
          >
            Browse shops
          </Link>
        )}
      </div>
    </div>
  )
}
