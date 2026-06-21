import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login zaroori hai' }, { status: 401 })

  const { amount } = await req.json()
  if (!amount || amount < 100) return NextResponse.json({ error: 'Minimum ₹100 chahiye' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile nahi mila' }, { status: 404 })

  const available = profile.total_earnings - profile.total_withdrawn
  if (amount > available) return NextResponse.json({ error: 'Itna balance nahi hai' }, { status: 400 })

  // Check for pending withdrawal
  const { data: pending } = await supabase
    .from('withdrawals').select('id').eq('creator_id', user.id).eq('status', 'pending').single()
  if (pending) return NextResponse.json({ error: 'Aapki ek withdrawal request pehle se pending hai' }, { status: 400 })

  await supabase.from('withdrawals').insert({
    creator_id: user.id,
    amount,
    status: 'pending',
  })

  return NextResponse.json({ success: true })
}
