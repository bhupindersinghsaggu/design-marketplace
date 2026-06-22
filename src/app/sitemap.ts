import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://design-marketplace-two.vercel.app'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/browse`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Dynamic design pages
  try {
    const supabase = await createClient()
    const { data: designs } = await supabase
      .from('designs')
      .select('id, updated_at, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    const designPages: MetadataRoute.Sitemap = (designs ?? []).map(d => ({
      url: `${baseUrl}/design/${d.id}`,
      lastModified: new Date(d.updated_at || d.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...designPages]
  } catch {
    return staticPages
  }
}
