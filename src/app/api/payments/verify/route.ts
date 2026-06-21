import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { CREATOR_SHARE, PLATFORM_COMMISSION } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, design_id } = await req.json()

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  if (expectedSignature !== razorpay_signature)
    return NextResponse.json({ error: 'Payment verify nahi hua' }, { status: 400 })

  const { data: design } = await supabase
    .from('designs').select('id, price, creator_id').eq('id', design_id).single()

  if (!design) return NextResponse.json({ error: 'Design nahi mila' }, { status: 404 })

  const amount = design.price ?? 0
  const platformFee = amount * PLATFORM_COMMISSION
  const creatorEarning = amount * CREATOR_SHARE

  // Record purchase
  const { error } = await supabase.from('purchases').insert({
    buyer_id: user.id,
    design_id,
    amount,
    platform_fee: platformFee,
    creator_earning: creatorEarning,
    razorpay_payment_id,
  })

  if (error) return NextResponse.json({ error: 'Purchase save nahi hua' }, { status: 500 })

  // Credit creator earnings
  await supabase.from('earnings').insert({
    creator_id: design.creator_id,
    design_id,
    amount: creatorEarning,
    type: 'purchase',
  })

  // Update creator total earnings
  await supabase.rpc('increment_earnings', {
    user_id: design.creator_id,
    amount: creatorEarning,
  })

  // Record download
  await supabase.from('downloads').insert({
    user_id: user.id,
    design_id,
    download_type: 'purchase',
  })

  return NextResponse.json({ success: true })
}
