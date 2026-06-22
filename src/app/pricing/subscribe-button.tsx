'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

interface Props {
  planId: string
  planName: string
  price: number
  isActive: boolean
  isLoggedIn: boolean
  isPro: boolean
}

export function SubscribeButton({ planId, planName, price, isActive, isLoggedIn, isPro }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    if (!isLoggedIn) { router.push('/login'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }

      const Razorpay = (window as unknown as { Razorpay: new (options: object) => { open: () => void } }).Razorpay
      const rzp = new Razorpay({
        key: data.key,
        subscription_id: data.subscription_id,
        name: 'DesignMarket',
        description: planName,
        handler: async () => {
          await fetch('/api/subscriptions/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_id: planId, subscription_id: data.subscription_id }),
          })
          router.refresh()
        },
        theme: { color: '#4f46e5' },
      })
      rzp.open()
    } finally {
      setLoading(false)
    }
  }

  if (isActive) {
    return (
      <div className="flex items-center gap-2 justify-center py-2.5 px-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
        <Check size={15} /> Active Plan
      </div>
    )
  }

  return (
    <Button
      onClick={handleSubscribe}
      loading={loading}
      className={`w-full ${isPro ? '' : ''}`}
      variant={isPro ? 'primary' : 'outline'}
      size="lg"
    >
      {isLoggedIn ? 'Subscribe' : 'Login to Subscribe'}
    </Button>
  )
}
