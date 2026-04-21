import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Farmmap',
  description: 'How Farmmap collects, uses, and protects your personal data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}
        >
          Privacy Policy
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--bark)' }}>
          Last updated: 1 May 2025
        </p>

        <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed" style={{ color: 'var(--bark)' }}>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>1. Who we are</h2>
            <p>
              Farmmap is operated by <strong>Derrywilligan Farm Ltd</strong>, a company registered in Northern Ireland
              (Company No. NI667971), 167 Armagh Road, Newry, BT35 6PX.
            </p>
            <p className="mt-2">
              Contact: <a href="mailto:contact@farmmap.co.uk" className="underline" style={{ color: 'var(--forest)' }}>contact@farmmap.co.uk</a>
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>2. What data we collect</h2>
            <p>We may collect the following personal data:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Shop owners:</strong> name, email address, business name and address, phone number, and any information submitted via the shop listing form.</li>
              <li><strong>Visitors:</strong> IP address, browser type, pages visited, and referrer — collected automatically via server logs and analytics.</li>
              <li><strong>Contact enquiries:</strong> name and email address when you contact us directly.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To display farm shop listings on the Farmmap directory.</li>
              <li>To verify and moderate shop listings before publication.</li>
              <li>To respond to enquiries and provide support.</li>
              <li>To improve and maintain the website.</li>
              <li>To comply with our legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>4. Legal basis for processing</h2>
            <p>We process personal data under the following legal bases (UK GDPR Art. 6):</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Legitimate interests</strong> — operating and improving the directory.</li>
              <li><strong>Contractual necessity</strong> — publishing a shop listing you have submitted.</li>
              <li><strong>Legal obligation</strong> — where required by law.</li>
              <li><strong>Consent</strong> — where you have explicitly opted in (e.g. marketing communications).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>5. Data sharing</h2>
            <p>
              We do not sell your personal data. We may share data with trusted third-party processors
              (hosting, analytics, email) who are contractually obliged to protect it. Public listing
              information (business name, address, phone, website) is published on the directory by design.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>6. Retention</h2>
            <p>
              We retain personal data for as long as necessary to fulfil the purposes described in this
              policy or as required by law. Shop listing data is retained while the listing is active.
              You may request deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>7. Your rights</h2>
            <p>Under UK GDPR you have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Rectify inaccurate data.</li>
              <li>Erase your data (right to be forgotten).</li>
              <li>Restrict or object to processing.</li>
              <li>Data portability.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, email{' '}
              <a href="mailto:contact@farmmap.co.uk" className="underline" style={{ color: 'var(--forest)' }}>contact@farmmap.co.uk</a>.
              We will respond within 30 days. You also have the right to lodge a complaint with the
              Information Commissioner's Office (ICO) at{' '}
              <a href="https://ico.org.uk" className="underline" style={{ color: 'var(--forest)' }} target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>8. Cookies</h2>
            <p>
              We use cookies to operate the site and analyse traffic. See our{' '}
              <a href="/cookies" className="underline" style={{ color: 'var(--forest)' }}>Cookie Policy</a> for details.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>9. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be notified via the
              website. Continued use of Farmmap after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>10. Governing law</h2>
            <p>
              This policy is governed by the laws of Northern Ireland and the United Kingdom.
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
