'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

export function AdminDesignActions({ designId }: { designId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action)
    await fetch('/api/admin/designs/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ design_id: designId, action, reason }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleAction('approve')} loading={loading === 'approve'}>
          <Check size={13} /> Approve
        </Button>
        <Button size="sm" variant="danger" onClick={() => setShowReject(!showReject)}>
          <X size={13} /> Reject
        </Button>
      </div>
      {showReject && (
        <div className="flex gap-2 mt-1">
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Rejection reason..."
            className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
          />
          <Button size="sm" variant="danger" onClick={() => handleAction('reject')} loading={loading === 'reject'}>
            Send
          </Button>
        </div>
      )}
    </div>
  )
}
