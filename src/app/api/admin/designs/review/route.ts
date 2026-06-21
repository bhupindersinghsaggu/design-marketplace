import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { design_id, action, reason } = await req.json()

  if (!['approve', 'reject'].includes(action))
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  await supabase.from('designs').update({
    status: action === 'approve' ? 'approved' : 'rejected',
    rejection_reason: action === 'reject' ? reason : null,
  }).eq('id', design_id)

  return NextResponse.json({ success: true })
}
