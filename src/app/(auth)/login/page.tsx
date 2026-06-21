'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  email: z.string().email('Valid email daalen'),
  password: z.string().min(6, 'Password kam se kam 6 characters ka hona chahiye'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError('')
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) { setError(error.message); return }
    router.push('/browse')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Wapas aaiye!</h1>
          <p className="text-gray-500 mt-1">Apne account mein login karein</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email" id="email" type="email" placeholder="aap@example.com"
            error={errors.email?.message} {...register('email')} />
          <Input label="Password" id="password" type="password" placeholder="••••••••"
            error={errors.password?.message} {...register('password')} />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            Login Karein
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Account nahi hai?{' '}
          <Link href="/register" className="text-indigo-600 font-medium hover:underline">Register Karein</Link>
        </p>
      </div>
    </div>
  )
}
