import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Terms of Use — Farmmap' }

export default function TermsPage() {
  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-xs text-amber-700">
        Draft — legal review recommended before public launch.
      </div>
      <h1>Terms of Use</h1>
      <p><strong>Last updated:</strong> [DATE] · Derrywilligan Farm Ltd (NI667971)</p>

      <h2>1. Who these terms are with</h2>
      <p>By using Farmmap.co.uk you agree to these terms with Derrywilligan Farm Ltd, registered in Northern Ireland (NI667971), 167 Armagh Road, Newry, BT35 6PX. Contact: contact@farmmap.co.uk</p>

      <h2>2. What Farmmap is</h2>
      <p>Farmmap is a directory of farm shops across the UK and Ireland. We provide an interactive map and shop listings. We are not responsible for the accuracy of shop information (hours, stock, trading status) — that information is provided by users and owners. Always check with a shop before visiting.</p>

      <h2>3. Your account</h2>
      <ul>
        <li>You must be at least 16 to create an account.</li>
        <li>You are responsible for keeping your password secure.</li>
        <li>You must not create accounts under false identities.</li>
        <li>We may suspend or delete accounts that breach these terms.</li>
      </ul>

      <h2>4. Content you submit</h2>
      <ul>
        <li>You confirm you have the right to submit any content (text, photos) you upload.</li>
        <li>You grant Farmmap a non-exclusive licence to display, resize, and distribute your content on the platform.</li>
        <li>You must not submit false, misleading, defamatory, or illegal content.</li>
        <li>You must not submit spam, duplicate listings, or content promoting non-farm businesses.</li>
        <li>All submissions are moderated before appearing publicly (except visitor confirmations, which are structured data).</li>
      </ul>

      <h2>5. Visitor confirmations</h2>
      <p>Confirmations are structured factual statements (e.g. "this shop is currently trading"). They are not reviews. By confirming a statement you represent that you have personally visited the shop recently and the statement is true to the best of your knowledge.</p>

      <h2>6. Farm owner listings</h2>
      <p>If you claim ownership of a listing, you confirm you are the owner or authorised manager of that farm business. Fraudulent claims will result in account termination and may be reported to the relevant authorities.</p>

      <h2>7. What we are not responsible for</h2>
      <ul>
        <li>The accuracy of listing data (hours, products, trading status).</li>
        <li>Transactions between you and any farm shop.</li>
        <li>Any loss or inconvenience from visiting a shop based on information on Farmmap.</li>
      </ul>

      <h2>8. Intellectual property</h2>
      <p>The Farmmap name, logo, and design are owned by Derrywilligan Farm Ltd. Map data is © OpenStreetMap contributors (ODbL). You may not copy or reproduce Farmmap content without written permission.</p>

      <h2>9. Governing law</h2>
      <p>These terms are governed by the laws of Northern Ireland. Disputes will be subject to the exclusive jurisdiction of the courts of Northern Ireland.</p>

      <h2>10. Changes</h2>
      <p>We may update these terms. We will notify registered users of material changes. Continued use of Farmmap after the effective date constitutes acceptance.</p>
    </>
  )
}
