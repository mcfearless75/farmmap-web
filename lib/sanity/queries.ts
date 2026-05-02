import { getSanityClient } from './client'
import type { SanityProduct } from './types'

export async function getShopProducts(shopSlug: string): Promise<SanityProduct[]> {
  const client = getSanityClient()
  if (!client) return []

  return client.fetch<SanityProduct[]>(
    `*[_type == "product" && shopSlug == $shopSlug && available == true]
      | order(category asc, name asc) {
        _id, name, description, price, unit, images, category, available, shopSlug
      }`,
    { shopSlug }
  )
}
