import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Cookie Policy — Farmmap' }

export default function CookiesPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p><strong>Last updated:</strong> [DATE] · Derrywilligan Farm Ltd (NI667971)</p>

      <h2>What cookies are</h2>
      <p>Cookies are small text files stored on your device when you visit a website. They allow the site to remember information about your visit.</p>

      <h2>Cookies we use</h2>

      <h3>Essential cookies (always active)</h3>
      <table>
        <thead><tr><th>Name</th><th>Purpose</th><th>Duration</th></tr></thead>
        <tbody>
          <tr><td><code>sb-*-auth-token</code></td><td>Authentication session — keeps you logged in</td><td>Session / 1 week</td></tr>
        </tbody>
      </table>
      <p>Essential cookies cannot be switched off. They are required for the site to function.</p>

      <h3>Analytics cookies (optional)</h3>
      <p>We do not currently use analytics cookies. If we add them in future, we will update this policy and request your consent via the cookie banner.</p>

      <h3>Third-party cookies</h3>
      <p>Our map tiles are served by OpenFreeMaps. Map tile requests do not set cookies. If you use the "find me" button, your browser requests your GPS location — this data is not stored by us.</p>

      <h2>Managing cookies</h2>
      <p>You can delete or block cookies via your browser settings. Blocking essential cookies will prevent you from logging in. Anonymous map browsing does not require cookies.</p>

      <h2>Contact</h2>
      <p>Questions about our cookie use: contact@farmmap.co.uk</p>
    </>
  )
}
