import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'

export async function POST(req: NextRequest) {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { design_id } = await req.json()

  const { data: design } = await supabase
    .from('designs').select('id, title, price, type').eq('id', design_id).eq('status', 'approved').single()

  if (!design || design.type !== 'premium')
    return NextResponse.json({ error: 'Design not found or is free' }, { status: 400 })

  const { data: existing } = await supabase
    .from('purchases').select('id').eq('buyer_id', user.id).eq('design_id', design_id).single()

  if (existing) return NextResponse.json({ error: 'You have already purchased this design' }, { status: 400 })

  const order = await razorpay.orders.create({
    amount: Math.round((design.price ?? 0) * 100),
    currency: 'INR',
    receipt: `design_${design_id}_${user.id}`,
    notes: { design_id, user_id: user.id },
  })

  return NextResponse.json({
    order_id: order.id,
    amount: order.amount,
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  })
}
