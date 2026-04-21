/**
 * Geocodes all shops in Supabase that have null lat/lng.
 * Uses Nominatim (OSM) — 1 req/sec rate limit.
 *
 * Usage:
 *   node scripts/geocode-shops.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function geocode(shop) {
  const q = [shop.address_line1, shop.town, shop.postcode]
    .filter(Boolean).join(', ')
  if (!q.trim()) return null

  await new Promise(r => setTimeout(r, 1100))

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=gb,ie`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Farmmap/1.0 (contact@farmmap.co.uk)' }
    })
    const data = await res.json()
    if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch (e) {
    console.error(`  Geocode error for ${shop.name}:`, e.message)
  }
  return null
}

async function main() {
  // Fetch all shops missing coordinates
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, address_line1, town, postcode')
    .is('latitude', null)
    .eq('status', 'approved')

  if (error) { console.error(error); process.exit(1) }

  console.log(`Found ${shops.length} shops without coordinates`)
  if (!shops.length) { console.log('Nothing to do.'); return }

  const estMins = Math.ceil((shops.length * 1.1) / 60)
  console.log(`Estimated time: ~${estMins} minutes\n`)

  let ok = 0, fail = 0

  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i]
    process.stdout.write(`[${i + 1}/${shops.length}] ${shop.name.slice(0, 40).padEnd(40)} `)

    const coords = await geocode(shop)

    if (coords) {
      const { error: updateErr } = await supabase
        .from('shops')
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq('id', shop.id)

      if (updateErr) {
        process.stdout.write(`ERROR: ${updateErr.message}\n`)
        fail++
      } else {
        process.stdout.write(`✓ ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}\n`)
        ok++
      }
    } else {
      process.stdout.write(`✗ not found\n`)
      fail++
    }
  }

  console.log(`\nDone. Geocoded: ${ok}, Failed/not found: ${fail}`)
}

main().catch(err => { console.error(err); process.exit(1) })
