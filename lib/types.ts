export type UserRole = 'user' | 'farm_owner' | 'moderator' | 'admin'

export type ShopStatus = 'pending' | 'approved' | 'rejected' | 'archived'

export type ModerationAction = 'approve' | 'reject' | 'edit' | 'delete'

export interface Shop {
  id: string
  name: string
  slug: string
  address_line1: string
  address_line2: string | null
  town: string
  county: string
  postcode: string
  country: string
  latitude: number | null
  longitude: number | null
  description: string | null
  phone: string | null
  email: string | null
  website: string | null
  opening_hours: OpeningHours | null
  product_categories: string[]
  owner_user_id: string | null
  verified: boolean
  status: ShopStatus
  listing_type: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OpeningHours {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
  seasonal_notes?: string
}

export interface ConfirmationStatement {
  id: string
  key: string
  label: string
  category: 'status' | 'product' | 'facility' | 'payment'
  active: boolean
  display_order: number
  created_at: string
}

export interface Confirmation {
  id: string
  shop_id: string
  user_id: string
  confirmation_statement_id: string
  created_at: string
}

export interface Photo {
  id: string
  shop_id: string
  uploaded_by: string
  storage_path: string
  caption: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface ShopEdit {
  id: string
  shop_id: string
  submitted_by: string
  proposed_data: Partial<Shop>
  status: 'pending' | 'approved' | 'rejected'
  moderator_id: string | null
  moderator_note: string | null
  created_at: string
  reviewed_at: string | null
}

export interface OwnershipClaim {
  id: string
  shop_id: string
  claimant_user_id: string
  evidence: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
}

export interface ModerationLog {
  id: string
  moderator_id: string
  entity_type: 'shop' | 'photo' | 'claim' | 'edit'
  entity_id: string
  action: ModerationAction
  reason: string | null
  created_at: string
}

export interface ConfirmationCount {
  confirmation_statement_id: string
  label: string
  key: string
  count: number
}

export const PRODUCT_CATEGORIES = [
  'Dairy',
  'Meat',
  'Vegetables',
  'Fruit',
  'Bakery',
  'Eggs',
  'Honey',
  'Flowers',
  'Ice Cream',
  'Farmgate',
  'Farm Shop',
  'Pick Your Own',
  'Raw Milk',
  'Preserves',
  'Other',
] as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]

export const COUNTRIES = [
  { value: 'GB-ENG', label: 'England' },
  { value: 'GB-SCT', label: 'Scotland' },
  { value: 'GB-WLS', label: 'Wales' },
  { value: 'GB-NIR', label: 'Northern Ireland' },
  { value: 'IE', label: 'Republic of Ireland' },
] as const
