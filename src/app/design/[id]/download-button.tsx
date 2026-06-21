'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Props {
  designId: string
  designType: 'free' | 'premium'
  isLoggedIn: boolean
  hasAccess?: boolean
  price?: number
}

export function DownloadButton({ designId, designType, isLoggedIn, hasAccess, price }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (!isLoggedIn) { router.push('/login'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/designs/${designId}/download`, { method: 'POST' })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      window.open(data.url, '_blank')
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase() {
    if (!isLoggedIn) { router.push('/login'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ design_id: designId }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }

      const Razorpay = (window as unknown as { Razorpay: new (options: object) => { open: () => void } }).Razorpay
      const rzp = new Razorpay({
        key: data.key,
        amount: data.amount,
        currency: 'INR',
        name: 'DesignMarket',
        description: 'Design Purchase',
        order_id: data.order_id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, design_id: designId }),
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

  if (designType === 'free' || hasAccess) {
    return (
      <Button onClick={handleDownload} loading={loading} className="w-full" size="lg">
        <Download size={16} /> {isLoggedIn ? 'Download Karein' : 'Login Karke Download Karein'}
      </Button>
    )
  }

  return (
    <Button onClick={handlePurchase} loading={loading} className="w-full" size="lg">
      <Download size={16} /> {formatPrice(price ?? 0)} mein Kharidein
    </Button>
  )
}
