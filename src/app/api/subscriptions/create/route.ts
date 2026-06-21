import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login zaroori hai' }, { status: 401 })

  const { plan_id } = await req.json()

  const { data: plan } = await supabase
    .from('subscription_plans').select('*').eq('id', plan_id).eq('is_active', true).single()

  if (!plan) return NextResponse.json({ error: 'Plan nahi mila' }, { status: 404 })

  // Check existing active subscription
  const { data: existing } = await supabase
    .from('user_subscriptions').select('id').eq('user_id', user.id).eq('status', 'active')
    .gte('current_period_end', new Date().toISOString()).single()

  if (existing) return NextResponse.json({ error: 'Aapke paas pehle se active subscription hai' }, { status: 400 })

  // If plan has Razorpay plan ID, create subscription
  if (plan.razorpay_plan_id) {
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpay_plan_id,
      customer_notify: 1,
      total_count: plan.interval === 'yearly' ? 12 : 120,
    })
    return NextResponse.json({ subscription_id: subscription.id, key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID })
  }

  // Fallback: one-time payment for subscription
  const order = await razorpay.orders.create({
    amount: Math.round(plan.price * 100),
    currency: 'INR',
    receipt: `sub_${plan_id}_${user.id}`,
    notes: { plan_id, user_id: user.id, type: 'subscription' },
  })

  return NextResponse.json({ order_id: order.id, amount: order.amount, key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID })
}
