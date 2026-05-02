export interface SanityProduct {
  _id: string
  name: string
  description: string | null
  price: number          // in £ e.g. 4.50
  unit: string           // e.g. "per kg", "per dozen", "each"
  category: string
  images: SanityImage[]
  available: boolean
  shopSlug: string
}

export interface SanityImage {
  _key: string
  asset: { _ref: string; _type: 'reference' }
}
