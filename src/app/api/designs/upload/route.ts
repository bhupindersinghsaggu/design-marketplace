import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedUploadUrl, getFileKey } from '@/lib/r2'

export const ALLOWED_EXTENSIONS = ['cdr', 'svg', 'psd', 'ai', 'png', 'jpg', 'jpeg', 'zip']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const body = await req.json()
  const { title, description, category_id, type, price, tags, meta_title, meta_description, slug, previewName, previewType, images, files } = body

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const price_val = type === 'premium' ? Number(price) : 0
  const tags_val: string[] = typeof tags === 'string'
    ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : tags ?? []

  const { data: design, error: designError } = await supabase
    .from('designs')
    .insert({ creator_id: user.id, title, description, category_id, type, price: price_val, tags: tags_val, status: 'pending', meta_title: meta_title || null, meta_description: meta_description || null, slug: slug || null })
    .select()
    .single()

  if (designError || !design) return NextResponse.json({ error: 'Failed to save design' }, { status: 500 })

  // Presigned URL for first/main preview (backward compat)
  let previewUpload: { url: string; key: string } | null = null
  if (previewName) {
    const ext = previewName.split('.').pop() ?? 'png'
    const key = getFileKey(design.id, `preview.${ext}`, 'preview')
    const url = await getPresignedUploadUrl(key, previewType || 'image/png')
    previewUpload = { url, key }
  }

  // Presigned URLs for additional carousel images
  const imageUploads: { url: string; key: string; name: string; type: string; order: number }[] = []
  for (let i = 0; i < (images ?? []).length; i++) {
    const img = images[i]
    const ext = (img.name as string).split('.').pop()?.toLowerCase() ?? 'jpg'
    const key = `previews/${design.id}/image_${i}.${ext}`
    const url = await getPresignedUploadUrl(key, img.type || 'image/jpeg')
    imageUploads.push({ url, key, name: img.name, type: img.type, order: i })
  }

  // Presigned URLs for design files
  const fileUploads: { url: string; key: string; name: string; type: string; size: number }[] = []
  for (const f of (files ?? [])) {
    const ext = (f.name as string).split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) continue
    const key = getFileKey(design.id, f.name, 'file')
    const mimeType = f.type || `application/x-${ext}`
    const url = await getPresignedUploadUrl(key, mimeType)
    fileUploads.push({ url, key, name: f.name, type: mimeType, size: f.size })
  }

  return NextResponse.json({ design_id: design.id, previewUpload, imageUploads, fileUploads })
}
