import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Privacy Policy — Farmmap' }

export default function PrivacyPage() {
  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-xs text-amber-700">
        Draft — legal review recommended before public launch.
      </div>
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> [DATE] · <strong>Operator:</strong> Derrywilligan Farm Ltd (NI667971), 167 Armagh Road, Newry, BT35 6PX · <strong>Contact:</strong> contact@farmmap.co.uk</p>

      <h2>1. Who we are</h2>
      <p>Farmmap is operated by Derrywilligan Farm Ltd. We are the data controller for personal data collected through Farmmap.co.uk.</p>

      <h2>2. What data we collect</h2>
      <ul>
        <li><strong>Account data:</strong> email address, password (hashed only — never stored in plain text), display name, and account type.</li>
        <li><strong>Content you submit:</strong> shop listings, edits, confirmations, photos, ownership claims — with timestamps and the account they came from.</li>
        <li><strong>Technical data:</strong> IP address (for security and rate limiting), browser type, device type, approximate location (if you use the "find me" map button).</li>
        <li><strong>Cookies:</strong> authentication session cookie (essential), and optional analytics cookies if you consent.</li>
      </ul>

      <h2>3. Why we collect it</h2>
      <ul>
        <li>To operate the directory and display farm shop listings.</li>
        <li>To authenticate you and protect your account.</li>
        <li>To prevent spam, abuse, and fraudulent listings.</li>
        <li>To email you about your submissions (approval, rejection, ownership claim outcomes).</li>
        <li>To improve the service over time.</li>
      </ul>

      <h2>4. Legal basis (UK GDPR)</h2>
      <ul>
        <li><strong>Contract</strong> — processing your account and submissions.</li>
        <li><strong>Legitimate interests</strong> — security, fraud prevention, abuse detection.</li>
        <li><strong>Consent</strong> — optional analytics cookies.</li>
      </ul>

      <h2>5. Who we share data with</h2>
      <p>We do not sell your data. We share limited data with:</p>
      <ul>
        <li><strong>Supabase</strong> — database and file storage host (data processed in EU).</li>
        <li><strong>Vercel</strong> — hosting (EU region where available).</li>
        <li><strong>Email provider</strong> (Resend or Postmark) — for transactional emails only.</li>
      </ul>

      <h2>6. How long we keep data</h2>
      <ul>
        <li>Account data: until you delete your account.</li>
        <li>Approved listings you created: retained as shared public data even if you delete your account (but your name is removed from the record).</li>
        <li>Confirmations: retained as anonymous aggregate counts after account deletion.</li>
        <li>Photos: deleted when your account is deleted.</li>
        <li>IP addresses in rate-limit logs: 30 days.</li>
      </ul>

      <h2>7. Your rights</h2>
      <p>Under UK GDPR you have the right to: access your data, correct it, delete your account, export your data, and object to certain processing. Contact us at contact@farmmap.co.uk to exercise any right.</p>

      <h2>8. Cookies</h2>
      <p>We use one essential cookie (authentication session). We do not set analytics or advertising cookies without your consent. See our <a href="/cookies">Cookie Policy</a> for full details.</p>

      <h2>9. Changes to this policy</h2>
      <p>We will notify registered users of material changes by email. The date at the top of this page always shows when it was last updated.</p>
    </>
  )
}
