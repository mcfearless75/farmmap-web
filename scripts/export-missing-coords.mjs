/**
 * Exports all approved shops with no coordinates to a CSV file.
 * Usage: node scripts/export-missing-coords.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync } from 'fs'

// Load .env.local without dotenv
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const { data: shops, error } = await supabase
  .from('shops')
  .select('id, name, address_line1, address_line2, town, county, postcode, country')
  .is('latitude', null)
  .eq('status', 'approved')
  .order('name')

if (error) { console.error(error); process.exit(1) }

// CSV output
const header = 'id,name,address_line1,address_line2,town,county,postcode,country'
const rows = shops.map(s => [
  s.id,
  `"${(s.name ?? '').replace(/"/g, '""')}"`,
  `"${(s.address_line1 ?? '').replace(/"/g, '""')}"`,
  `"${(s.address_line2 ?? '').replace(/"/g, '""')}"`,
  `"${(s.town ?? '').replace(/"/g, '""')}"`,
  `"${(s.county ?? '').replace(/"/g, '""')}"`,
  `"${(s.postcode ?? '').replace(/"/g, '""')}"`,
  s.country ?? '',
].join(','))

const csv = [header, ...rows].join('\n')
writeFileSync('missing-coords.csv', csv, 'utf8')

console.log(`Exported ${shops.length} shops to missing-coords.csv`)
