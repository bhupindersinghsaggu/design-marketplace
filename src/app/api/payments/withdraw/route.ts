import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { amount } = await req.json()
  if (!amount || amount < 100) return NextResponse.json({ error: 'Minimum withdrawal amount is ₹100' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const available = profile.total_earnings - profile.total_withdrawn
  if (amount > available) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

  // Check for pending withdrawal
  const { data: pending } = await supabase
    .from('withdrawals').select('id').eq('creator_id', user.id).eq('status', 'pending').single()
  if (pending) return NextResponse.json({ error: 'You already have a pending withdrawal request' }, { status: 400 })

  await supabase.from('withdrawals').insert({
    creator_id: user.id,
    amount,
    status: 'pending',
  })

  return NextResponse.json({ success: true })
}
