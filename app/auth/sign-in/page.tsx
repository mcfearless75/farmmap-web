'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Metadata } from 'next'

// Note: metadata export is not supported in client components —
// title is set via the document directly if needed.

export default function SignInPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError('Could not send sign-in link. Please check your email address and try again.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f9fafb' }}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">

        {/* Logo mark */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: '#15803d' }}
          >
            <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-poppins)' }}>F</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
            Farmmap
          </h1>
          <p className="text-sm text-gray-500 mt-1">Shop owner sign in</p>
        </div>

        {sent ? (
          /* Success state */
          <div className="text-center space-y-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
              style={{ background: '#dcfce7' }}
            >
              <svg className="w-6 h-6" style={{ color: '#15803d' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
              Check your email
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              We sent a sign-in link to <strong className="text-gray-700">{email}</strong>.
              Click the link to access your dashboard.
            </p>
            <p className="text-xs text-gray-400 pt-2">
              Link expires in 1 hour. Check your spam folder if it doesn&apos;t arrive.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-xs text-green-700 hover:text-green-800 transition-colors cursor-pointer mt-2"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* Email form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                style={{ '--tw-ring-color': '#15803d' } as React.CSSProperties}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity cursor-pointer"
              style={{ background: '#15803d', fontFamily: 'var(--font-poppins)' }}
            >
              {loading ? 'Sending link…' : 'Send sign-in link'}
            </button>

            <p className="text-xs text-center text-gray-400 pt-1">
              No password needed — we&apos;ll email you a secure link.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
