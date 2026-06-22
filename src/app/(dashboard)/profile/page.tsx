'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Save, KeyRound } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<{ full_name: string; bio: string; email: string; avatar_url: string } | null>(null)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setFullName(data.full_name ?? '')
        setBio(data.bio ?? '')
        setAvatarPreview(data.avatar_url ?? '')
      }
    })
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setError('')

    // Preview locally
    setAvatarPreview(URL.createObjectURL(file))

    // Get presigned URL
    const res = await fetch('/api/profile/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type }),
    })
    const { url, publicUrl } = await res.json()

    // Upload to R2
    await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })

    // Save to profile
    await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: publicUrl }),
    })

    setAvatarPreview(publicUrl)
    setUploadingAvatar(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, bio }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setError(data.error); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (!profile) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading...</div>
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center border-4 border-white shadow-md">
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-indigo-600">
                {fullName?.[0]?.toUpperCase() ?? 'U'}
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50"
          >
            {uploadingAvatar ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera size={14} />
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{fullName || 'No name set'}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <p className="text-xs text-gray-400 mt-1">Click the photo to change it</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <Input
          label="Full Name"
          id="full_name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Your name"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Write something about yourself..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            value={profile.email}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600 font-medium">Profile saved!</p>}

        <Button type="submit" loading={saving} className="w-full" size="lg">
          <Save size={16} /> Save Profile
        </Button>
      </form>

      {/* Password Reset */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 text-sm">Change Password</p>
            <p className="text-xs text-gray-500 mt-0.5">A reset link will be sent to your email</p>
          </div>
          <Link href="/forgot-password">
            <Button variant="outline" size="sm">
              <KeyRound size={14} /> Reset
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
