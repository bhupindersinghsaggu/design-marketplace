'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface Props { withdrawalId: string; creatorId: string; amount: number }

export function PayoutActions({ withdrawalId, creatorId, amount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'complete' | 'fail' | null>(null)

  async function handle(action: 'complete' | 'fail') {
    setLoading(action)
    await fetch('/api/admin/payouts/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawal_id: withdrawalId, creator_id: creatorId, amount, action }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <Button size="sm" onClick={() => handle('complete')} loading={loading === 'complete'}>
        <Check size={13} /> Complete
      </Button>
      <Button size="sm" variant="danger" onClick={() => handle('fail')} loading={loading === 'fail'}>
        <X size={13} /> Fail
      </Button>
    </div>
  )
}
