import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { Check } from 'lucide-react'
import { SubscribeButton } from './subscribe-button'
import { SubscriptionPlan } from '@/types'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: plans } = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('price')
  const { data: { user } } = await supabase.auth.getUser()

  let activeSub = null
  if (user) {
    const { data } = await supabase.from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', user.id).eq('status', 'active')
      .gte('current_period_end', new Date().toISOString()).single()
    activeSub = data
  }

  const monthly = plans?.filter(p => p.interval === 'monthly') ?? []
  const yearly = plans?.filter(p => p.interval === 'yearly') ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-500 mt-3">Unlimited downloads of all premium designs</p>
        {activeSub && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <Check size={14} className="text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Active: {activeSub.plan?.name} — valid until {new Date(activeSub.current_period_end).toLocaleDateString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Monthly Plans */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Plans</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {monthly.map(plan => (
          <PlanCard key={plan.id} plan={plan} isActive={activeSub?.plan_id === plan.id} isLoggedIn={!!user} />
        ))}
      </div>

      {/* Yearly Plans */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Yearly Plans <span className="text-sm font-normal text-green-600 ml-2">Save 33%</span></h2>
      <div className="grid md:grid-cols-2 gap-6">
        {yearly.map(plan => (
          <PlanCard key={plan.id} plan={plan} isActive={activeSub?.plan_id === plan.id} isLoggedIn={!!user} />
        ))}
      </div>
    </div>
  )
}

function PlanCard({ plan, isActive, isLoggedIn }: { plan: SubscriptionPlan; isActive: boolean; isLoggedIn: boolean }) {
  const isPro = plan.tier === 'pro'
  return (
    <div className={`relative bg-white rounded-2xl border-2 p-7 ${isPro ? 'border-indigo-500' : 'border-gray-200'}`}>
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
          Most Popular
        </div>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        <div className="flex items-end gap-1 mt-2">
          <span className="text-3xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
          <span className="text-gray-500 mb-1">/{plan.interval === 'monthly' ? 'month' : 'year'}</span>
        </div>
      </div>
      <ul className="space-y-2 mb-6">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <Check size={15} className="text-green-500 mt-0.5 flex-shrink-0" /> {f}
          </li>
        ))}
      </ul>
      <SubscribeButton planId={plan.id} planName={plan.name} price={plan.price} isActive={isActive} isLoggedIn={isLoggedIn} isPro={isPro} />
    </div>
  )
}
