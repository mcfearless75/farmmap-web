import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order confirmed — Farmmap',
  robots: { index: false },
}

export default function CheckoutSuccessPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#f9fafb' }}
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
        <CheckCircle
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: '#15803D' }}
        />
        <h1
          className="text-xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Order confirmed!
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Your payment was successful. The farm shop will be in touch to arrange
          delivery or collection. A confirmation has been sent to your email.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--forest)', fontFamily: 'var(--font-poppins)' }}
        >
          Back to Farmmap
        </Link>
      </div>
    </div>
  )
}
