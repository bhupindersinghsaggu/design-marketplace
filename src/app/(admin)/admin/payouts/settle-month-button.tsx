'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function SettleMonthButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function settle() {
    setLoading(true)
    const res = await fetch('/api/admin/settle-month', { method: 'POST' })
    const data = await res.json()
    setMsg(data.message ?? data.error)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-sm text-gray-600">{msg}</span>}
      <Button size="sm" onClick={settle} loading={loading}>Settle Month</Button>
    </div>
  )
}
