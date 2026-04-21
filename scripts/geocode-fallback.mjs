/**
 * Fallback geocoder for shops that Nominatim couldn't match on full address.
 * Tries 3 strategies per shop:
 *   1. name + town + county
 *   2. postcode only
 *   3. town + county (places at town centre — better than nothing)
 *
 * Usage: node scripts/geocode-fallback.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

// Load .env.local
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

const HEADERS = { 'User-Agent': 'Farmmap/1.0 (contact@farmmap.co.uk)' }
const DELAY   = 1100  // Nominatim rate limit: 1 req/sec

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function nominatim(q) {
  if (!q?.trim()) return null
  await sleep(DELAY)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=gb,ie`
    const res  = await fetch(url, { headers: HEADERS })
    const data = await res.json()
    if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch { /* ignore */ }
  return null
}

async function geocodeFallback(shop) {
  const { name, town, county, postcode } = shop

  // Strategy 1: name + town + county
  const q1 = [name, town, county].filter(Boolean).join(', ')
  const r1  = await nominatim(q1)
  if (r1) return { coords: r1, strategy: 'name+town+county' }

  // Strategy 2: postcode alone
  if (postcode?.trim()) {
    const r2 = await nominatim(postcode)
    if (r2) return { coords: r2, strategy: 'postcode' }
  }

  // Strategy 3: town + county (approximate — marks shop at town centre)
  const q3 = [town, county].filter(Boolean).join(', ')
  const r3  = await nominatim(q3)
  if (r3) return { coords: r3, strategy: 'town+county (approx)' }

  return null
}

async function main() {
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, address_line1, town, county, postcode')
    .is('latitude', null)
    .eq('status', 'approved')
    .order('name')

  if (error) { console.error(error); process.exit(1) }

  console.log(`Found ${shops.length} shops without coordinates\n`)

  const estMins = Math.ceil((shops.length * 3 * 1.1) / 60)
  console.log(`Worst-case estimate (3 attempts per shop): ~${estMins} minutes\n`)

  let ok = 0, fail = 0

  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i]
    const label = shop.name.slice(0, 38).padEnd(38)
    process.stdout.write(`[${String(i + 1).padStart(3)}/${shops.length}] ${label} `)

    const result = await geocodeFallback(shop)

    if (result) {
      const { coords, strategy } = result
      const { error: updateErr } = await supabase
        .from('shops')
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq('id', shop.id)

      if (updateErr) {
        process.stdout.write(`ERROR: ${updateErr.message}\n`)
        fail++
      } else {
        process.stdout.write(`✓ ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}  [${strategy}]\n`)
        ok++
      }
    } else {
      process.stdout.write(`✗ not found\n`)
      fail++
    }
  }

  console.log(`\nDone. Geocoded: ${ok}, Still missing: ${fail}`)
}

main().catch(err => { console.error(err); process.exit(1) })
