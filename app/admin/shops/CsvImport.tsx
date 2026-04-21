'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ParsedRow {
  name: string
  address_line1: string
  town: string
  county: string
  postcode: string
  country: string
  description: string
  phone: string
  email: string
  website: string
  product_categories: string[]
  payment_methods: string[]
  opening_hours: Record<string, string> | null
  listing_type: string
}

interface ImportResult {
  inserted: number
  skipped: number
  errors: string[]
}

// Map country strings from CSV to our codes
function normaliseCountry(raw: string): string {
  const r = raw.toLowerCase().trim()
  if (r.includes('northern ireland') || r.includes('ni')) return 'GB-NIR'
  if (r.includes('republic') || r.includes('ireland') || r === 'ie') return 'IE'
  if (r.includes('scotland')) return 'GB-SCT'
  if (r.includes('wales') || r.includes('cymru')) return 'GB-WLS'
  if (r.includes('england')) return 'GB-ENG'
  if (r.startsWith('gb-')) return r.toUpperCase()
  return 'GB-ENG'
}

// Parse a CSV string into arrays of row objects (handles quoted commas)
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/)
  if (!lines.length) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    // Simple CSV split that handles quoted fields
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { cells.push(current); current = ''; continue }
      current += ch
    }
    cells.push(current)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (cells[idx] ?? '').trim() })
    rows.push(row)
  }
  return rows
}

function rawToPayload(row: Record<string, string>): ParsedRow | null {
  const name = row.name?.trim()
  if (!name) return null

  const productsRaw = row.products ?? row.product_categories ?? ''
  const categories = productsRaw
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean)

  const paymentRaw = row.payment_methods ?? row.payment ?? ''
  const payments = paymentRaw
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean)

  const hoursRaw = row.opening_hours ?? row.hours ?? ''
  const opening_hours = hoursRaw ? { notes: hoursRaw } : null

  return {
    name,
    address_line1: row.address ?? row.address_line1 ?? '',
    town: row.town ?? '',
    county: row.county ?? '',
    postcode: row.postcode ?? '',
    country: normaliseCountry(row.country ?? 'England'),
    description: row.description ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    website: row.website ?? '',
    product_categories: categories,
    payment_methods: payments,
    opening_hours,
    listing_type: row.listing_type ?? 'farm_shop',
  }
}

export default function CsvImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [rowCount, setRowCount] = useState(0)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const rows = parseCsv(text)
      const valid = rows.map(r => rawToPayload(r)).filter(Boolean) as ParsedRow[]
      setParsed(valid)
      setRowCount(rows.length)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!parsed.length) return
    setImporting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const errors: string[] = []
    let inserted = 0
    let skipped = 0

    // Batch in chunks of 50
    const CHUNK = 50
    for (let i = 0; i < parsed.length; i += CHUNK) {
      const chunk = parsed.slice(i, i + CHUNK).map(row => ({
        name: row.name,
        slug: slugify(row.name) + '-' + Math.random().toString(36).slice(2, 6),
        listing_type: row.listing_type,
        address_line1: row.address_line1,
        town: row.town,
        county: row.county,
        postcode: row.postcode,
        country: row.country,
        description: row.description || null,
        phone: row.phone || null,
        email: row.email || null,
        website: row.website || null,
        opening_hours: row.opening_hours,
        product_categories: row.product_categories,
        payment_methods: row.payment_methods,
        status: 'approved',
        verified: false,
        created_by: user?.id ?? null,
      }))

      const { error } = await supabase.from('shops').insert(chunk)
      if (error) {
        errors.push(`Chunk ${i / CHUNK + 1}: ${error.message}`)
        skipped += chunk.length
      } else {
        inserted += chunk.length
      }
    }

    setResult({ inserted, skipped, errors })
    setImporting(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">CSV Import</h2>
        <p className="text-sm text-gray-500">
          Import shops in bulk from a CSV file. Expected columns:{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">name, address, town, county, postcode, country, products, payment_methods, description, opening_hours, website</code>
        </p>

        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {fileName ? (
              <span className="font-medium text-gray-700">{fileName} · {rowCount} rows · {parsed.length} valid</span>
            ) : (
              'Click to select a CSV file'
            )}
          </p>
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </div>

        {parsed.length > 0 && !result && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 bg-green-50 px-4 py-3 rounded-lg">
              Ready to import <strong>{parsed.length}</strong> shops. All will be set to{' '}
              <strong>approved</strong> status and appear on the map immediately.
            </div>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              {importing ? `Importing ${parsed.length} shops…` : `Import ${parsed.length} shops`}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
              <CheckCircle className="w-4 h-4" />
              {result.inserted} shops imported successfully
            </div>
            {result.skipped > 0 && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {result.skipped} rows skipped
              </div>
            )}
            {result.errors.map((err, i) => (
              <div key={i} className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{err}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
