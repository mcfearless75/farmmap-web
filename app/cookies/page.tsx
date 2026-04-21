import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | Farmmap',
  description: 'How Farmmap uses cookies and similar technologies.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}
        >
          Cookie Policy
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--bark)' }}>
          Last updated: 1 May 2025
        </p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--bark)' }}>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>1. What are cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website. They allow
              the site to remember your preferences and understand how you use it. Farmmap uses cookies
              and similar technologies as described below.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>2. Cookies we use</h2>

            <div className="mt-3 space-y-4">
              <div className="p-3 rounded-lg" style={{ background: '#fff', border: '1px solid var(--sand)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>Strictly necessary</p>
                <p>
                  Required for the site to function. These cannot be disabled. They include session
                  cookies that keep you signed in to the admin area and security tokens.
                </p>
              </div>

              <div className="p-3 rounded-lg" style={{ background: '#fff', border: '1px solid var(--sand)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>Analytics</p>
                <p>
                  We use anonymised analytics to understand how visitors use Farmmap (pages visited,
                  time on site, referral source). This data helps us improve the directory. No
                  personally identifiable information is collected via analytics cookies.
                </p>
              </div>

              <div className="p-3 rounded-lg" style={{ background: '#fff', border: '1px solid var(--sand)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>Map tiles</p>
                <p>
                  The interactive map is powered by OpenStreetMap tile servers. Loading map tiles
                  may result in your IP address being transmitted to tile servers. See the{' '}
                  <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" className="underline" style={{ color: 'var(--forest)' }} target="_blank" rel="noopener noreferrer">
                    OpenStreetMap Foundation Privacy Policy
                  </a>{' '}
                  for details.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>3. Managing cookies</h2>
            <p>
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>View the cookies stored on your device.</li>
              <li>Delete cookies individually or in bulk.</li>
              <li>Block cookies from specific or all websites.</li>
            </ul>
            <p className="mt-2">
              Note that disabling cookies may affect some functionality of Farmmap, such as the
              admin login area.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>4. Your consent</h2>
            <p>
              By continuing to use Farmmap, you consent to our use of cookies as described in this
              policy. You may withdraw consent at any time by adjusting your browser settings or
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>5. Changes to this policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Material changes will be notified
              on the website.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>6. Contact</h2>
            <p>
              Questions about our use of cookies? Email{' '}
              <a href="mailto:contact@farmmap.co.uk" className="underline" style={{ color: 'var(--forest)' }}>
                contact@farmmap.co.uk
              </a>{' '}
              or write to Derrywilligan Farm Ltd, 167 Armagh Road, Newry, BT35 6PX.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6" style={{ borderTop: '1px solid var(--sand)' }}>
          <a href="/" className="text-sm underline" style={{ color: 'var(--forest)' }}>← Back to Farmmap</a>
        </div>
      </div>
    </div>
  )
}
