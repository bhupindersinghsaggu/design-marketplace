import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSettlementMonth, CREATOR_SHARE, PLATFORM_COMMISSION } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  // Get last month
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const month = getSettlementMonth(lastMonth)

  // Check if already settled
  const { data: existing } = await supabase
    .from('monthly_settlements').select('*').eq('month', month).single()
  if (existing?.settled) return NextResponse.json({ error: `${month} has already been settled` }, { status: 400 })

  // Total subscription revenue for last month
  const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: subscriptions } = await supabase
    .from('user_subscriptions')
    .select('plan:subscription_plans(price)')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  const totalRevenue = (subscriptions ?? []).reduce((sum: number, s: unknown) => {
    const plan = (s as { plan: { price: number }[] | { price: number } | null })?.plan
    const price = Array.isArray(plan) ? (plan[0]?.price ?? 0) : (plan?.price ?? 0)
    return sum + price
  }, 0)
  const platformCut = totalRevenue * PLATFORM_COMMISSION
  const creatorPool = totalRevenue * CREATOR_SHARE

  // Count downloads via subscription in that period
  const { data: downloads } = await supabase
    .from('downloads')
    .select('design_id, designs:designs(creator_id)')
    .eq('download_type', 'subscription')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)

  const totalDownloads = downloads?.length ?? 0

  if (totalDownloads > 0 && creatorPool > 0) {
    // Group by design
    const downloadMap: Record<string, { creator_id: string; count: number }> = {}
    for (const d of downloads ?? []) {
      const designs = d.designs as unknown as { creator_id: string } | { creator_id: string }[] | null
      const creatorId = Array.isArray(designs) ? designs[0]?.creator_id : designs?.creator_id
      if (!creatorId) continue
      if (!downloadMap[d.design_id]) downloadMap[d.design_id] = { creator_id: creatorId, count: 0 }
      downloadMap[d.design_id].count++
    }

    // Credit earnings per creator per design
    const earningsInserts = []
    const creatorTotals: Record<string, number> = {}

    for (const [design_id, { creator_id, count }] of Object.entries(downloadMap)) {
      const earning = (count / totalDownloads) * creatorPool
      earningsInserts.push({ creator_id, design_id, amount: earning, type: 'subscription_pool', settlement_month: month })
      creatorTotals[creator_id] = (creatorTotals[creator_id] ?? 0) + earning
    }

    if (earningsInserts.length > 0) {
      await supabase.from('earnings').insert(earningsInserts)
      for (const [creator_id, amount] of Object.entries(creatorTotals)) {
        const { data: cr } = await supabase.from('profiles').select('total_earnings').eq('id', creator_id).single()
        await supabase.from('profiles').update({ total_earnings: (cr?.total_earnings ?? 0) + amount }).eq('id', creator_id)
      }
    }
  }

  // Save settlement record
  const settlementData = {
    month,
    total_subscription_revenue: totalRevenue,
    platform_cut: platformCut,
    creator_pool: creatorPool,
    total_downloads: totalDownloads,
    settled: true,
  }

  if (existing) {
    await supabase.from('monthly_settlements').update(settlementData).eq('id', existing.id)
  } else {
    await supabase.from('monthly_settlements').insert(settlementData)
  }

  return NextResponse.json({
    message: `${month} settled successfully! Creator pool: ₹${creatorPool.toFixed(2)}, Downloads: ${totalDownloads}`
  })
}
