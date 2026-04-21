import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Content Policy — Farmmap' }

export default function ContentPolicyPage() {
  return (
    <>
      <h1>Content Policy</h1>
      <p><strong>Last updated:</strong> [DATE] · Derrywilligan Farm Ltd (NI667971)</p>
      <p>This policy explains what content is acceptable on Farmmap and how we handle content that breaches our standards.</p>

      <h2>What Farmmap is for</h2>
      <p>Farmmap is a directory of farm shops across the UK and Ireland. All content must be relevant to this purpose: farm businesses selling direct to the public.</p>

      <h2>Acceptable listings</h2>
      <ul>
        <li>Farm shops, farmgate sales, honesty boxes, pick-your-own operations, and farm-based market stalls.</li>
        <li>Each listing must represent a real, currently-trading business at a real address.</li>
        <li>Descriptions must be factual and written in your own words.</li>
      </ul>

      <h2>Not acceptable</h2>
      <ul>
        <li>Supermarkets, garden centres, or other non-farm retail (unless primarily farm-operated).</li>
        <li>Duplicate listings of the same shop.</li>
        <li>False or misleading information about a shop's products, hours, or location.</li>
        <li>Copied descriptions or photos from other websites without permission.</li>
        <li>Spam, promotional content unrelated to the farm shop.</li>
        <li>Defamatory, offensive, or discriminatory content of any kind.</li>
      </ul>

      <h2>Photos</h2>
      <ul>
        <li>You must own the photo or have explicit permission to use it on Farmmap.</li>
        <li>By uploading a photo you confirm this and grant Farmmap a licence to display it.</li>
        <li>No stock photos — real photos of the actual shop only.</li>
        <li>No photos of people without their consent.</li>
        <li>No sexually explicit, violent, or otherwise inappropriate imagery.</li>
      </ul>

      <h2>Visitor confirmations</h2>
      <p>Confirmations are structured tick-box statements ("This shop is trading", "They sell eggs"). They must only be made by people who have actually visited the shop recently. Gaming the confirmation system — confirming shops you haven't visited, organising bulk confirmations, or using multiple accounts — will result in account termination.</p>

      <h2>Ownership claims</h2>
      <p>Only the genuine owner or authorised manager of a farm shop may claim that listing. Evidence of ownership will be required. Fraudulent claims are a breach of our Terms of Use and may be reported to the appropriate authorities.</p>

      <h2>Enforcement</h2>
      <p>All listings and photos are moderated before publication. Content that breaches this policy will be rejected or removed. Repeat offenders will have their accounts suspended or deleted. Where content may be illegal, we reserve the right to report it to the relevant authorities.</p>

      <h2>Reporting</h2>
      <p>To report a listing or photo that breaches this policy, use the "Report a problem" link on the relevant shop page, or email contact@farmmap.co.uk.</p>
    </>
  )
}
