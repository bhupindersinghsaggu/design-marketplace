import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToR2, getFileKey } from '@/lib/r2'

const ALLOWED_TYPES: Record<string, string> = {
  'application/x-cdr': 'cdr',
  'image/svg+xml': 'svg',
  'image/vnd.adobe.photoshop': 'psd',
  'application/postscript': 'ai',
  'image/png': 'png',
  'image/jpeg': 'jpg',
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login zaroori hai' }, { status: 401 })

  const formData = await req.formData()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category_id = formData.get('category_id') as string
  const type = formData.get('type') as 'free' | 'premium'
  const price = type === 'premium' ? Number(formData.get('price')) : 0
  const tags = (formData.get('tags') as string ?? '').split(',').map(t => t.trim()).filter(Boolean)
  const previewFile = formData.get('preview') as File | null

  if (!title) return NextResponse.json({ error: 'Title zaroori hai' }, { status: 400 })

  // Create design record
  const { data: design, error: designError } = await supabase
    .from('designs')
    .insert({ creator_id: user.id, title, description, category_id, type, price, tags, status: 'pending' })
    .select()
    .single()

  if (designError || !design) return NextResponse.json({ error: 'Design save nahi hua' }, { status: 500 })

  // Upload preview
  if (previewFile) {
    const previewBuffer = Buffer.from(await previewFile.arrayBuffer())
    const previewKey = getFileKey(design.id, `preview.${previewFile.name.split('.').pop()}`, 'preview')
    const previewUrl = await uploadToR2(previewBuffer, previewKey, previewFile.type)
    await supabase.from('designs').update({ preview_url: previewUrl }).eq('id', design.id)
  }

  // Upload design files
  const fileEntries = formData.getAll('files') as File[]
  for (const file of fileEntries) {
    if (file.size > MAX_FILE_SIZE) continue
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const mimeType = file.type || `application/x-${ext}`
    const fileType = ALLOWED_TYPES[mimeType] ?? ext
    if (!['cdr', 'svg', 'psd', 'ai', 'png', 'jpg'].includes(fileType)) continue

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = getFileKey(design.id, file.name, 'file')
    const url = await uploadToR2(buffer, key, mimeType)

    await supabase.from('design_files').insert({
      design_id: design.id,
      file_type: fileType,
      file_url: url,
      file_key: key,
      file_size: file.size,
      original_name: file.name,
    })
  }

  return NextResponse.json({ success: true, design_id: design.id })
}
