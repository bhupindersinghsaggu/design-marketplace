'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, X, Trash2 } from 'lucide-react'

export function AdminDesignActions({ designId }: { designId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | 'delete' | null>(null)
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  async function handleDelete() {
    setLoading('delete')
    await fetch(`/api/designs/${designId}/delete`, { method: 'DELETE' })
    setLoading(null)
    setConfirmDelete(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleAction('approve')} loading={loading === 'approve'}>
          <Check size={13} /> Approve
        </Button>
        <Button size="sm" variant="danger" onClick={() => setShowReject(!showReject)}>
          <X size={13} /> Reject
        </Button>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete design">
            <Trash2 size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Delete?</span>
            <button onClick={handleDelete} disabled={loading === 'delete'}
              className="text-xs px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
              {loading === 'delete' ? '...' : 'Yes'}
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
              No
            </button>
          </div>
        )}
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
