import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://design-marketplace-two.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/browse', '/design/', '/pricing'],
        disallow: ['/dashboard', '/profile', '/upload', '/admin', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
