import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://farmmap.co.uk'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: shops } = await supabase
    .from('shops')
    .select('slug, updated_at')
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })

  const shopUrls: MetadataRoute.Sitemap = (shops ?? []).map(shop => ({
    url: `${SITE_URL}/shop/${shop.slug}`,
    lastModified: new Date(shop.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    ...shopUrls,
  ]
}
