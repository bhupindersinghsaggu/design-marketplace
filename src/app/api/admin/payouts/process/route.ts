import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { withdrawal_id, creator_id, amount, action } = await req.json()

  if (action === 'complete') {
    await supabase.from('withdrawals').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', withdrawal_id)

    // Update creator's total_withdrawn
    const { data: creator } = await supabase.from('profiles').select('total_withdrawn').eq('id', creator_id).single()
    await supabase.from('profiles').update({
      total_withdrawn: (creator?.total_withdrawn ?? 0) + amount
    }).eq('id', creator_id)
  } else {
    await supabase.from('withdrawals').update({ status: 'failed' }).eq('id', withdrawal_id)
  }

  return NextResponse.json({ success: true })
}
