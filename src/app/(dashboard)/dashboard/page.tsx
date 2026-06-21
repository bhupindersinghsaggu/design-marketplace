import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Download, Package, Wallet } from 'lucide-react'
import Link from 'next/link'
import { WithdrawButton } from './withdraw-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: designs } = await supabase
    .from('designs').select('*, category:categories(name)').eq('creator_id', user.id).order('created_at', { ascending: false })
  const { data: earnings } = await supabase
    .from('earnings').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }).limit(10)
  const { data: withdrawals } = await supabase
    .from('withdrawals').select('*').eq('creator_id', user.id).order('requested_at', { ascending: false }).limit(5)
  const { data: activeSub } = await supabase
    .from('user_subscriptions').select('*, plan:subscription_plans(name)').eq('user_id', user.id)
    .eq('status', 'active').gte('current_period_end', new Date().toISOString()).single()

  const totalEarnings = profile?.total_earnings ?? 0
  const totalWithdrawn = profile?.total_withdrawn ?? 0
  const availableBalance = totalEarnings - totalWithdrawn
  const totalDownloads = designs?.reduce((a, d) => a + d.downloads_count, 0) ?? 0

  const statusBadge = (status: string) => {
    const map: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
      pending: 'warning', approved: 'success', rejected: 'danger'
    }
    return <Badge variant={map[status] ?? 'default'}>{status}</Badge>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Namaste, {profile?.full_name ?? 'Creator'}!</p>
        </div>
        <Link href="/upload"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Design Upload
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Wallet, label: 'Total Kamaaye', value: formatPrice(totalEarnings), color: 'text-green-600' },
          { icon: TrendingUp, label: 'Available Balance', value: formatPrice(availableBalance), color: 'text-indigo-600' },
          { icon: Package, label: 'Total Designs', value: designs?.length ?? 0, color: 'text-gray-700' },
          { icon: Download, label: 'Total Downloads', value: totalDownloads, color: 'text-gray-700' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Active Subscription */}
      {activeSub && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-800">Active Subscription: {activeSub.plan?.name}</p>
            <p className="text-xs text-indigo-600 mt-0.5">Valid till: {formatDate(activeSub.current_period_end)}</p>
          </div>
          <Badge variant="premium">Active</Badge>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* My Designs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mere Designs</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {designs && designs.length > 0 ? designs.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <Link href={`/design/${d.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block">
                    {d.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{d.category?.name}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400"><Download size={10} className="inline mr-1" />{d.downloads_count}</span>
                  </div>
                </div>
                <div className="ml-3">{statusBadge(d.status)}</div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-400 text-sm">Abhi koi design nahi hai</div>
            )}
          </div>
        </div>

        {/* Earnings & Withdrawal */}
        <div className="space-y-6">
          {/* Withdraw */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Paise Nikaalein</h2>
            <p className="text-sm text-gray-500 mb-4">Available: <strong className="text-green-600">{formatPrice(availableBalance)}</strong></p>
            <WithdrawButton availableBalance={availableBalance} profile={profile} />
          </div>

          {/* Recent Earnings */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Earnings</h2>
            <div className="space-y-3">
              {earnings && earnings.length > 0 ? earnings.map(e => (
                <div key={e.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 capitalize">{e.type === 'purchase' ? 'Design Sale' : 'Subscription Pool'}</p>
                    <p className="text-xs text-gray-400">{formatDate(e.created_at)}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">+{formatPrice(e.amount)}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-400">Abhi koi earning nahi hai</p>
              )}
            </div>
          </div>

          {/* Withdrawals */}
          {withdrawals && withdrawals.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Withdrawal History</h2>
              <div className="space-y-3">
                {withdrawals.map(w => (
                  <div key={w.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{formatPrice(w.amount)}</p>
                      <p className="text-xs text-gray-400">{formatDate(w.requested_at)}</p>
                    </div>
                    <Badge variant={w.status === 'completed' ? 'success' : w.status === 'failed' ? 'danger' : 'warning'}>
                      {w.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
