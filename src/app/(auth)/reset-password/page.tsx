'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords match nahi kar rahe'); return }
    if (password.length < 6) { setError('Password kam se kam 6 characters ka hona chahiye'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Naya Password Set Karein</h1>
          <p className="text-gray-500 mt-1">Apna naya password daalen</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Naya Password" id="password" type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required />
          <Input label="Password Confirm Karein" id="confirm" type="password" placeholder="••••••••"
            value={confirm} onChange={e => setConfirm(e.target.value)} required />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Password Update Karein
          </Button>
        </form>
      </div>
    </div>
  )
}
