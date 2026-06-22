import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { DesignDetailPage } from '@/components/design/design-detail-page'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: design } = await supabase
    .from('designs')
    .select('title, description, preview_url, type, price, meta_title, meta_description, slug')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!design) return { title: 'Design Not Found — DesignMarket' }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://design-marketplace-two.vercel.app'
  const canonical = design.slug ? `${baseUrl}/products/${design.slug}` : `${baseUrl}/design/${id}`

  const title = design.meta_title || `${design.title} — ${design.type === 'free' ? 'Free' : `₹${design.price}`} Download | DesignMarket`
  const description = design.meta_description || design.description
    || `Download ${design.title} ${design.type === 'free' ? 'for free' : `for ₹${design.price}`}. CDR, SVG, PSD, AI formats on DesignMarket.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description,
      images: design.preview_url ? [{ url: design.preview_url, width: 1200, height: 630 }] : [],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: design.preview_url ? [design.preview_url] : [] },
  }
}

export default async function DesignPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // If design has a slug, redirect to /products/[slug] (301 for SEO)
  const { data: design } = await supabase
    .from('designs')
    .select('slug, status')
    .eq('id', id)
    .single()

  if (!design) notFound()
  if (design.slug && design.status === 'approved') {
    redirect(`/products/${design.slug}`)
  }

  return <DesignDetailPage id={id} />
}
