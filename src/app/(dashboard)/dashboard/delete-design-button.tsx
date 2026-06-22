'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DeleteDesignButton({ designId, title }: { designId: string; title: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/designs/${designId}/delete`, { method: 'DELETE' })
    setLoading(false)
    setConfirm(false)
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Sure?</span>
        <button onClick={handleDelete} disabled={loading}
          className="text-xs px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
          {loading ? '...' : 'Yes'}
        </button>
        <button onClick={() => setConfirm(false)}
          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
          No
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirm(true)} title={`Delete "${title}"`}
      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
      <Trash2 size={14} />
    </button>
  )
}
