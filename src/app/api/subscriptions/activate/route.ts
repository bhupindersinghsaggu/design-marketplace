import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan_id, subscription_id } = await req.json()

  const { data: plan } = await supabase
    .from('subscription_plans').select('*').eq('id', plan_id).single()

  if (!plan) return NextResponse.json({ error: 'Plan nahi mila' }, { status: 404 })

  const now = new Date()
  const periodEnd = new Date(now)
  if (plan.interval === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1)
  else periodEnd.setFullYear(periodEnd.getFullYear() + 1)

  await supabase.from('user_subscriptions').insert({
    user_id: user.id,
    plan_id,
    status: 'active',
    razorpay_subscription_id: subscription_id ?? null,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
  })

  return NextResponse.json({ success: true })
}
