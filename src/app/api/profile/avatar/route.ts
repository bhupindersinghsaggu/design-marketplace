import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedUploadUrl } from '@/lib/r2'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileName, fileType } = await req.json()
  const ext = fileName.split('.').pop() ?? 'jpg'
  const key = `avatars/${user.id}/avatar.${ext}`
  const url = await getPresignedUploadUrl(key, fileType)
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({ url, key, publicUrl })
}
