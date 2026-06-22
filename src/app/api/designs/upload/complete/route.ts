import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MIME_TO_TYPE: Record<string, string> = {
  'application/x-cdr': 'cdr',
  'application/cdr': 'cdr',
  'application/coreldraw': 'cdr',
  'image/x-cdr': 'cdr',
  'image/svg+xml': 'svg',
  'image/vnd.adobe.photoshop': 'psd',
  'application/postscript': 'ai',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/x-zip': 'zip',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { design_id, preview_key, files } = await req.json()

  if (preview_key) {
    const preview_url = `${process.env.R2_PUBLIC_URL}/${preview_key}`
    await supabase.from('designs').update({ preview_url }).eq('id', design_id).eq('creator_id', user.id)
  }

  for (const f of (files ?? [])) {
    const ext = (f.key as string).split('.').pop()?.toLowerCase() ?? ''
    const file_type = MIME_TO_TYPE[f.type] ?? ext
    await supabase.from('design_files').insert({
      design_id,
      file_type,
      file_url: `${process.env.R2_PUBLIC_URL}/${f.key}`,
      file_key: f.key,
      file_size: f.size,
      original_name: f.name,
    })
  }

  return NextResponse.json({ success: true, design_id })
}
