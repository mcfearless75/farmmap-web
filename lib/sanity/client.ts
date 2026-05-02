import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImage } from './types'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

// Return null when Sanity isn't configured (build-time safe)
export function getSanityClient() {
  if (!projectId) return null
  return createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: true })
}

export function urlFor(source: SanityImage) {
  const client = getSanityClient()
  if (!client) throw new Error('Sanity not configured')
  return imageUrlBuilder(client).image(source)
}
