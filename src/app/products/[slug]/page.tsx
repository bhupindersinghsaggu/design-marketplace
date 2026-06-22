import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DesignDetailPage } from '@/components/design/design-detail-page'

interface Props { params: Promise<{ slug: string }> }

async function getDesignBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('designs')
    .select('id, title, description, preview_url, type, price, meta_title, meta_description')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()
  return data
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const design = await getDesignBySlug(slug)
  if (!design) return { title: 'Design Not Found — DesignMarket' }

  const title = design.meta_title || `${design.title} — ${design.type === 'free' ? 'Free' : `₹${design.price}`} Download | DesignMarket`
  const description = design.meta_description || design.description
    || `Download ${design.title} ${design.type === 'free' ? 'for free' : `for ₹${design.price}`}. CDR, SVG, PSD, AI formats on DesignMarket.`
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://design-marketplace-two.vercel.app'

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/products/${slug}` },
    openGraph: {
      title, description,
      images: design.preview_url ? [{ url: design.preview_url, width: 1200, height: 630 }] : [],
    },
    twitter: { card: 'summary_large_image', title, description, images: design.preview_url ? [design.preview_url] : [] },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const design = await getDesignBySlug(slug)
  if (!design) notFound()
  return <DesignDetailPage id={design.id} />
}
