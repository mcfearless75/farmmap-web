import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use | Farmmap',
  description: 'Terms and conditions for using the Farmmap farm shop directory.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-poppins)', color: 'var(--forest-dark)' }}
        >
          Terms of Use
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--bark)' }}>
          Last updated: 1 May 2025
        </p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--bark)' }}>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>1. About Farmmap</h2>
            <p>
              Farmmap (<strong>farmmap.co.uk</strong>) is a UK and Ireland farm shop directory operated
              by <strong>Derrywilligan Farm Ltd</strong> (Company No. NI667971), 167 Armagh Road,
              Newry, BT35 6PX. By accessing or using this website you agree to these Terms of Use.
              If you do not agree, please do not use the site.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>2. Directory information</h2>
            <p>
              Farmmap provides a free-to-browse directory of farm shops across the UK and Ireland.
              Listings are submitted by shop operators or sourced from publicly available information.
              We make reasonable efforts to ensure accuracy but do not guarantee that listings are
              complete, current, or error-free. Always verify opening times and details directly with
              the shop before visiting.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>3. Submitting a listing</h2>
            <p>If you submit a shop listing to Farmmap, you confirm that:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>You are authorised to represent the business.</li>
              <li>All information provided is accurate and not misleading.</li>
              <li>The listing complies with our Content Policy.</li>
              <li>You will notify us promptly of any changes to your listing details.</li>
            </ul>
            <p className="mt-2">
              We reserve the right to approve, reject, or remove any listing at our sole discretion,
              including listings that are inaccurate, inappropriate, or in breach of these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>4. Prohibited conduct</h2>
            <p>You must not:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Submit false, misleading, or fraudulent listing information.</li>
              <li>Attempt to scrape, harvest, or bulk-download directory data without permission.</li>
              <li>Use the site in any way that violates applicable law.</li>
              <li>Interfere with or disrupt the operation of the website.</li>
              <li>Submit spam, duplicate listings, or listings for non-farm-shop businesses.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>5. Intellectual property</h2>
            <p>
              All content, design, and code on Farmmap (excluding third-party map data) is owned by
              or licensed to Derrywilligan Farm Ltd. Map data is © OpenStreetMap contributors, used
              under the Open Database Licence. You may not reproduce or redistribute Farmmap content
              without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>6. Disclaimer of warranties</h2>
            <p>
              Farmmap is provided "as is" without warranty of any kind. We do not guarantee
              uninterrupted access or that the directory is free from errors. Use the site at your
              own risk.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>7. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Derrywilligan Farm Ltd shall not be liable for
              any indirect, incidental, or consequential loss arising from your use of Farmmap,
              including reliance on directory information.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>8. Third-party links</h2>
            <p>
              Farmmap may link to third-party websites (e.g. individual shop websites). We are not
              responsible for the content, accuracy, or practices of those sites.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>9. Changes to the Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of Farmmap after any changes
              constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>10. Governing law</h2>
            <p>
              These Terms are governed by the laws of Northern Ireland. Any disputes shall be subject
              to the exclusive jurisdiction of the courts of Northern Ireland.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-poppins)' }}>11. Contact</h2>
            <p>
              Questions about these Terms? Email{' '}
              <a href="mailto:contact@farmmap.co.uk" className="underline" style={{ color: 'var(--forest)' }}>
                contact@farmmap.co.uk
              </a>.
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
