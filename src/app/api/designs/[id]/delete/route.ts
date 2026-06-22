import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteFromR2 } from '@/lib/r2'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  // Fetch design + files
  const { data: design } = await supabase
    .from('designs')
    .select('*, files:design_files(*)')
    .eq('id', id)
    .single()

  if (!design) return NextResponse.json({ error: 'Design not found' }, { status: 404 })

  // Only creator or admin can delete
  if (!isAdmin && design.creator_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Delete files from R2
  const files = design.files ?? []
  await Promise.allSettled(files.map((f: { file_key: string }) => deleteFromR2(f.file_key)))

  // Delete preview from R2
  if (design.preview_url) {
    const key = design.preview_url.replace(`${process.env.R2_PUBLIC_URL}/`, '')
    await deleteFromR2(key).catch(() => {})
  }

  // Delete design record (cascades to design_files)
  const { error } = await supabase.from('designs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
