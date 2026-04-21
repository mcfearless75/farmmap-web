import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function formatPostcode(postcode: string): string {
  return postcode.toUpperCase().trim()
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

export function getCountryLabel(code: string): string {
  const map: Record<string, string> = {
    'GB-ENG': 'England',
    'GB-SCT': 'Scotland',
    'GB-WLS': 'Wales',
    'GB-NIR': 'Northern Ireland',
    'IE': 'Republic of Ireland',
  }
  return map[code] ?? code
}

export function formatAddress(shop: {
  address_line1: string
  address_line2?: string | null
  town: string
  county: string
  postcode: string
}): string {
  return [shop.address_line1, shop.address_line2, shop.town, shop.county, shop.postcode]
    .filter(Boolean)
    .join(', ')
}
