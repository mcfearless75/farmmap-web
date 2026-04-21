/**
 * Seed script — imports farmmap_seed_data_v3.csv into Supabase.
 *
 * Usage:
 *   node scripts/seed-shops.mjs path/to/farmmap_seed_data_v3.csv
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (or copy .env.local to .env before running)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const csvPath = process.argv[2] ?? resolve(process.cwd(), '..', 'farmmap_seed_data_v3.csv')
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const lines = text.split(/\r?\n/)
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cells = []
    let cur = ''
    let inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue }
      if (ch === ',' && !inQ) { cells.push(cur); cur = ''; continue }
      cur += ch
    }
    cells.push(cur)
    const row = {}
    headers.forEach((h, idx) => { row[h] = (cells[idx] ?? '').trim() })
    rows.push(row)
  }
  return rows
}

// ── Normalise helpers ─────────────────────────────────────────────────────────
function normaliseCountry(raw = '') {
  const r = raw.toLowerCase().trim()
  if (r.includes('northern ireland') || r === 'ni') return 'GB-NIR'
  if (r.includes('republic of ireland') || r === 'republic of ireland') return 'IE'
  if (r === 'ireland' || r === 'ie') return 'IE'
  if (r.includes('scotland')) return 'GB-SCT'
  if (r.includes('wales')) return 'GB-WLS'
  if (r.includes('england')) return 'GB-ENG'
  if (r.startsWith('gb-')) return r.toUpperCase()
  return 'GB-ENG'
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function makeSlug(name, existing) {
  let base = slugify(name)
  let slug = base
  let n = 1
  while (existing.has(slug)) {
    slug = `${base}-${n++}`
  }
  existing.add(slug)
  return slug
}

function parseCategories(raw = '') {
  const map = {
    'eggs': 'Eggs',
    'dairy': 'Dairy',
    'meat': 'Meat',
    'veg': 'Vegetables',
    'vegetables': 'Vegetables',
    'bakery': 'Bakery',
    'baked goods': 'Bakery',
    'honey': 'Honey',
    'flowers': 'Flowers',
    'ice cream': 'Ice Cream',
    'icecream': 'Ice Cream',
    'farm shop': 'Farm Shop',
    'farmgate': 'Farmgate',
    'farmshop': 'Farm Shop',
    'milk': 'Dairy',
    'raw milk': 'Raw Milk',
    'fruit': 'Fruit',
    'preserves': 'Preserves',
    'other': 'Other',
  }
  return [...new Set(
    raw.split(/[,;]/)
      .map(s => s.trim().toLowerCase())
      .map(s => map[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : null))
      .filter(Boolean)
  )]
}

function parsePayments(raw = '') {
  return [...new Set(
    raw.split(/[,;]/)
      .map(s => s.trim())
      .filter(Boolean)
  )]
}

// ── Geocode via Nominatim (rate-limited) ──────────────────────────────────────
async function geocode(row) {
  const q = [row.address, row.town, row.postcode, row.country]
    .filter(Boolean).join(', ')
  if (!q.trim()) return { lat: null, lng: null }
  try {
    await new Promise(r => setTimeout(r, 1100)) // Nominatim rate limit: 1 req/sec
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=gb,ie`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Farmmap/1.0 (contact@farmmap.co.uk)' }
    })
    const data = await res.json()
    if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {}
  return { lat: null, lng: null }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Reading ${csvPath}…`)
  const text = readFileSync(csvPath, 'utf8')
  const rows = parseCsv(text)
  console.log(`Parsed ${rows.length} rows`)

  const slugs = new Set()
  const geocodeEnabled = process.argv.includes('--geocode')
  if (geocodeEnabled) {
    console.log('Geocoding enabled — this will take a while (1s per row)')
  }

  const shops = []
  for (const row of rows) {
    const name = row.name?.trim()
    if (!name) continue

    let lat = null, lng = null
    if (geocodeEnabled) {
      const g = await geocode(row)
      lat = g.lat; lng = g.lng
      if (lat) process.stdout.write('.')
      else process.stdout.write('x')
    }

    shops.push({
      name,
      slug: makeSlug(name, slugs),
      listing_type: row.listing_type || 'honesty_box',
      address_line1: row.address || '',
      town: row.town || '',
      county: row.county || '',
      postcode: row.postcode || '',
      country: normaliseCountry(row.country),
      latitude: lat,
      longitude: lng,
      description: row.description || null,
      phone: row.phone || null,
      email: row.email || null,
      website: row.website || null,
      opening_hours: row.opening_hours ? { notes: row.opening_hours } : null,
      product_categories: parseCategories(row.products || row.product_categories || ''),
      payment_methods: parsePayments(row.payment_methods || ''),
      status: 'approved',
      verified: false,
    })
  }

  if (geocodeEnabled) console.log('')
  console.log(`Prepared ${shops.length} shops — inserting in batches…`)

  const CHUNK = 50
  let inserted = 0, failed = 0
  for (let i = 0; i < shops.length; i += CHUNK) {
    const chunk = shops.slice(i, i + CHUNK)
    const { error } = await supabase.from('shops').insert(chunk)
    if (error) {
      console.error(`  Chunk ${Math.floor(i / CHUNK) + 1} error:`, error.message)
      failed += chunk.length
    } else {
      inserted += chunk.length
      process.stdout.write(`  ${inserted}/${shops.length}\r`)
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Failed: ${failed}`)
}

main().catch(err => { console.error(err); process.exit(1) })
