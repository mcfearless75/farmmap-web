'use client'

import { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { PRODUCT_CATEGORIES, COUNTRIES } from '@/lib/types'

export interface Filters {
  search: string
  categories: string[]
  country: string
  verifiedOnly: boolean
}

interface MapFiltersProps {
  filters: Filters
  onChange: (f: Filters) => void
  totalShops: number
  visibleShops: number
}

export default function MapFilters({ filters, onChange, totalShops, visibleShops }: MapFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  const toggleCategory = (cat: string) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat]
    update({ categories: next })
  }

  const activeFilterCount =
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.country ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0)

  const hasActiveFilters = filters.search || activeFilterCount > 0

  return (
    <div style={{ background: '#fff', borderBottom: '1.5px solid var(--sand)' }}>
      {/* Search row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--bark)' }} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by name, town or postcode…"
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            aria-label="Search farm shops"
            style={{
              width: '100%',
              paddingLeft: '2.25rem',
              paddingRight: filters.search ? '2rem' : '0.75rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              fontSize: '0.875rem',
              border: '1.5px solid var(--sand)',
              borderRadius: '12px',
              outline: 'none',
              fontFamily: 'var(--font-open-sans)',
              color: 'var(--forest-dark)',
              background: 'var(--cream)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--forest)'
              e.target.style.boxShadow = '0 0 0 3px rgba(21,128,61,0.1)'
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--sand)'
              e.target.style.boxShadow = 'none'
            }}
          />
          {filters.search && (
            <button
              onClick={() => update({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: 'var(--bark)' }}
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-label="Toggle filters"
          className="flex items-center gap-1.5 cursor-pointer transition-all duration-150"
          style={{
            padding: '0.5rem 0.875rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: '12px',
            border: '1.5px solid',
            borderColor: hasActiveFilters ? 'var(--forest)' : 'var(--sand)',
            background: hasActiveFilters ? 'var(--forest)' : '#fff',
            color: hasActiveFilters ? '#fff' : 'var(--bark)',
            fontFamily: 'var(--font-poppins)',
          }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span
              className="rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold"
              style={{ background: '#fff', color: 'var(--forest)' }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <span className="text-xs whitespace-nowrap hidden sm:block" style={{ color: 'var(--bark)', fontFamily: 'var(--font-poppins)' }}>
          <strong style={{ color: 'var(--forest)' }}>{visibleShops.toLocaleString()}</strong> of {totalShops.toLocaleString()}
        </span>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div style={{ padding: '0 0.75rem 0.875rem', borderTop: '1px solid var(--sand)', paddingTop: '0.75rem' }} className="space-y-3">
          {/* Country */}
          <div>
            <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--bark)', fontFamily: 'var(--font-poppins)' }}>
              Country / Region
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COUNTRIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => update({ country: filters.country === c.value ? '' : c.value })}
                  className="cursor-pointer transition-all duration-150"
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: '20px',
                    border: '1.5px solid',
                    borderColor: filters.country === c.value ? 'var(--forest)' : 'var(--sand)',
                    background: filters.country === c.value ? 'var(--sage-pale)' : '#fff',
                    color: filters.country === c.value ? 'var(--forest-dark)' : 'var(--bark)',
                    fontFamily: 'var(--font-poppins)',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--bark)', fontFamily: 'var(--font-poppins)' }}>
              Products
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className="cursor-pointer transition-all duration-150"
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: '20px',
                    border: '1.5px solid',
                    borderColor: filters.categories.includes(cat) ? 'var(--gold)' : 'var(--sand)',
                    background: filters.categories.includes(cat) ? 'var(--gold-light)' : '#fff',
                    color: filters.categories.includes(cat) ? '#713f12' : 'var(--bark)',
                    fontFamily: 'var(--font-poppins)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Verified toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={e => update({ verifiedOnly: e.target.checked })}
              style={{ accentColor: 'var(--forest)' }}
            />
            <span className="text-sm" style={{ color: 'var(--forest-dark)', fontFamily: 'var(--font-open-sans)' }}>
              Verified shops only
            </span>
          </label>

          {hasActiveFilters && (
            <button
              onClick={() => onChange({ search: '', categories: [], country: '', verifiedOnly: false })}
              className="text-xs cursor-pointer hover:underline"
              style={{ color: '#dc2626' }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
