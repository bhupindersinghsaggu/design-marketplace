import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedDownloadUrl } from '@/lib/r2'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login zaroori hai' }, { status: 401 })

  const { data: design } = await supabase
    .from('designs')
    .select('*, files:design_files(*)')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!design) return NextResponse.json({ error: 'Design nahi mila' }, { status: 404 })

  // Check access for premium
  if (design.type === 'premium') {
    const { data: purchase } = await supabase
      .from('purchases').select('id').eq('buyer_id', user.id).eq('design_id', id).single()

    const { data: sub } = await supabase
      .from('user_subscriptions').select('id').eq('user_id', user.id).eq('status', 'active')
      .gte('current_period_end', new Date().toISOString()).single()

    if (!purchase && !sub) {
      return NextResponse.json({ error: 'Yeh design premium hai. Pehle kharidein ya subscription lein.' }, { status: 403 })
    }
  }

  // Get main downloadable file (prefer CDR, then others)
  const fileOrder = ['cdr', 'ai', 'psd', 'svg', 'png', 'jpg']
  const files = design.files ?? []
  const file = fileOrder.map(t => files.find((f: { file_type: string }) => f.file_type === t)).find(Boolean) ?? files[0]

  if (!file) return NextResponse.json({ error: 'File nahi mili' }, { status: 404 })

  // Record download
  await supabase.from('downloads').insert({
    user_id: user.id,
    design_id: id,
    download_type: design.type === 'free' ? 'free' : 'subscription',
  })

  // Increment downloads count
  await supabase.from('designs').update({ downloads_count: design.downloads_count + 1 }).eq('id', id)

  const url = await getPresignedDownloadUrl(file.file_key)
  return NextResponse.json({ url })
}
