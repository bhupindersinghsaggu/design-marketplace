'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Profile } from '@/types'
import { formatPrice } from '@/lib/utils'

interface Props {
  availableBalance: number
  profile: Profile | null
}

export function WithdrawButton({ availableBalance, profile }: Props) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleWithdraw() {
    const amt = Number(amount)
    if (!amt || amt < 100) { setMessage('Minimum ₹100 withdraw kar sakte hain'); return }
    if (amt > availableBalance) { setMessage('Itna balance nahi hai'); return }
    if (!profile?.upi_id && !profile?.bank_account) {
      setMessage('Pehle UPI ya bank details dashboard mein add karein'); return
    }
    setLoading(true)
    const res = await fetch('/api/payments/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt }),
    })
    const data = await res.json()
    setLoading(false)
    setMessage(data.error ?? 'Withdrawal request submit ho gaya! Processing mein 1-2 din lagenge.')
    if (!data.error) setAmount('')
  }

  if (availableBalance < 100) {
    return <p className="text-sm text-gray-400">Minimum ₹100 chahiye withdrawal ke liye. Abhi balance: {formatPrice(availableBalance)}</p>
  }

  return (
    <div className="space-y-3">
      <Input
        type="number"
        placeholder={`Amount (max ${formatPrice(availableBalance)})`}
        value={amount}
        onChange={e => setAmount(e.target.value)}
        min={100}
        max={availableBalance}
      />
      {message && <p className="text-xs text-gray-600">{message}</p>}
      <Button onClick={handleWithdraw} loading={loading} className="w-full">
        Withdraw Request Karein
      </Button>
    </div>
  )
}
