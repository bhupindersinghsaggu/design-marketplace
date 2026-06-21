'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, FileUp } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const supabase = createClient()
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [type, setType] = useState<'free' | 'premium'>('free')
  const [files, setFiles] = useState<File[]>([])
  const [preview, setPreview] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data ?? []))
  }, [])

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  function handlePreview(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setPreview(f)
      setPreviewUrl(URL.createObjectURL(f))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('type', type)
    if (preview) formData.set('preview', preview)
    files.forEach(f => formData.append('files', f))

    const res = await fetch('/api/designs/upload', { method: 'POST', body: formData })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Design Upload Ho Gaya!</h2>
        <p className="text-gray-500 mt-2">Admin review ke baad aapka design live ho jayega.</p>
        <Button className="mt-6" onClick={() => { setSuccess(false); setFiles([]); setPreview(null); setPreviewUrl('') }}>
          Aur Upload Karein
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Design Upload Karein</h1>
      <p className="text-gray-500 mb-8">Upload ke baad admin review karega, phir live hoga.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Design ka Title *" name="title" placeholder="e.g. Business Card Template" required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows={3} placeholder="Design ke baare mein bataaiye..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category_id" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Category select karein</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Design Type</label>
          <div className="flex gap-3">
            {(['free', 'premium'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  type === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {t === 'free' ? 'Free' : 'Premium (Paid)'}
              </button>
            ))}
          </div>
        </div>

        {type === 'premium' && (
          <Input label="Price (₹) *" name="price" type="number" min="1" placeholder="e.g. 99" required />
        )}

        <Input label="Tags (comma se separate karein)" name="tags" placeholder="e.g. logo, modern, business" />

        {/* Preview Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preview Image (PNG/JPG) *</label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors overflow-hidden relative">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-400">
                <FileUp className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm">Preview image click karke choose karein</span>
              </div>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={handlePreview} required />
          </label>
        </div>

        {/* Design Files */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Design Files (CDR, SVG, PSD, AI) *</label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
            <FileUp className="w-6 h-6 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Files choose karein (multiple select kar sakte hain)</span>
            <input type="file" multiple accept=".cdr,.svg,.psd,.ai,.png,.jpg,.jpeg" className="sr-only" onChange={handleFiles} required />
          </label>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700 truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                    <X size={14} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={loading} size="lg" className="w-full">
          <Upload size={16} /> Design Upload Karein
        </Button>
      </form>
    </div>
  )
}
