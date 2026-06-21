import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatPrice } from '@/lib/utils'
import { PayoutActions } from './payout-actions'
import { SettleMonthButton } from './settle-month-button'

export default async function AdminPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*, creator:profiles(full_name, email, upi_id, bank_account, bank_ifsc)')
    .order('requested_at', { ascending: false })

  const { data: settlements } = await supabase
    .from('monthly_settlements').select('*').order('month', { ascending: false }).limit(6)

  const pending = withdrawals?.filter(w => w.status === 'pending') ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin — Payouts</h1>
        <a href="/admin/designs" className="text-sm text-indigo-600 hover:underline">← Designs</a>
      </div>

      {/* Monthly Settlement */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Pool Settlement</h2>
          <SettleMonthButton />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Month', 'Sub Revenue', 'Creator Pool (70%)', 'Total Downloads', 'Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {settlements?.map(s => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-medium">{s.month}</td>
                  <td className="px-3 py-2">{formatPrice(s.total_subscription_revenue)}</td>
                  <td className="px-3 py-2 text-green-600">{formatPrice(s.creator_pool)}</td>
                  <td className="px-3 py-2">{s.total_downloads}</td>
                  <td className="px-3 py-2">
                    <Badge variant={s.settled ? 'success' : 'warning'}>{s.settled ? 'Settled' : 'Pending'}</Badge>
                  </td>
                </tr>
              ))}
              {(!settlements || settlements.length === 0) && (
                <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400">Koi settlement nahi hai</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Withdrawals */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Pending Withdrawals <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-sm rounded-full">{pending.length}</span>
      </h2>
      <div className="space-y-4 mb-8">
        {pending.length === 0 && <p className="text-gray-400 text-sm">Koi pending withdrawal nahi hai</p>}
        {pending.map(w => (
          <div key={w.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">{formatPrice(w.amount)}</p>
              <p className="text-sm text-gray-500">{w.creator?.full_name} ({w.creator?.email})</p>
              <p className="text-xs text-gray-400 mt-1">
                {w.creator?.upi_id ? `UPI: ${w.creator.upi_id}` : w.creator?.bank_account ? `Bank: ${w.creator.bank_account} | IFSC: ${w.creator.bank_ifsc}` : 'Payment details missing'}
              </p>
              <p className="text-xs text-gray-400">{formatDate(w.requested_at)}</p>
            </div>
            <PayoutActions withdrawalId={w.id} creatorId={w.creator_id} amount={w.amount} />
          </div>
        ))}
      </div>

      {/* All Withdrawals History */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal History</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Creator', 'Amount', 'Status', 'Date'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {withdrawals?.map(w => (
              <tr key={w.id}>
                <td className="px-4 py-3">{w.creator?.full_name}</td>
                <td className="px-4 py-3 font-medium">{formatPrice(w.amount)}</td>
                <td className="px-4 py-3">
                  <Badge variant={w.status === 'completed' ? 'success' : w.status === 'failed' ? 'danger' : 'warning'}>{w.status}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-400">{formatDate(w.requested_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
