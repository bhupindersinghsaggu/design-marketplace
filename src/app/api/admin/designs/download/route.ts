import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedDownloadUrl } from '@/lib/r2'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { file_key, file_name } = await req.json()
  if (!file_key) return NextResponse.json({ error: 'file_key zaroori hai' }, { status: 400 })

  const url = await getPresignedDownloadUrl(file_key)
  return NextResponse.json({ url, file_name })
}
