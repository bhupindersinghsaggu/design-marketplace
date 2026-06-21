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
  full_name: z.string().min(2, 'Naam kam se kam 2 characters ka hona chahiye'),
  email: z.string().email('Valid email daalen'),
  password: z.string().min(6, 'Password kam se kam 6 characters ka hona chahiye'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords match nahi kar rahe',
  path: ['confirm_password'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError('')
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } },
    })
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Email verify karein!</h2>
          <p className="text-gray-500 mt-2">Aapke email pe confirmation link bheja gaya hai.</p>
          <Link href="/login" className="mt-4 inline-block text-indigo-600 font-medium hover:underline">
            Login pe jaaiye
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Account Banaaiye</h1>
          <p className="text-gray-500 mt-1">Free mein join karein, designs download karein</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Pura Naam" id="full_name" placeholder="Aapka naam"
            error={errors.full_name?.message} {...register('full_name')} />
          <Input label="Email" id="email" type="email" placeholder="aap@example.com"
            error={errors.email?.message} {...register('email')} />
          <Input label="Password" id="password" type="password" placeholder="••••••••"
            error={errors.password?.message} {...register('password')} />
          <Input label="Password Confirm Karein" id="confirm_password" type="password" placeholder="••••••••"
            error={errors.confirm_password?.message} {...register('confirm_password')} />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            Register Karein
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Pehle se account hai?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">Login Karein</Link>
        </p>
      </div>
    </div>
  )
}
