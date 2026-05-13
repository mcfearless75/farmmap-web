'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f9fafb' }}>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2.5rem', maxWidth: '480px', width: '100%', textAlign: 'center', border: '1px solid #e5e7eb' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>F</span>
        </div>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>Something went wrong</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{ marginTop: '1.5rem', background: '#15803d', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
