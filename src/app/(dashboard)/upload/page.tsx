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
  const [progress, setProgress] = useState('')

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

  async function uploadFileToR2(presignedUrl: string, file: File, mimeType?: string): Promise<boolean> {
    const res = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': mimeType || file.type || 'application/octet-stream' },
    })
    return res.ok
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = e.currentTarget

    try {
      // Step 1: Create design + get presigned URLs
      setProgress('Creating design record...')
      const title = (form.elements.namedItem('title') as HTMLInputElement).value
      const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value
      const category_id = (form.elements.namedItem('category_id') as HTMLSelectElement).value
      const price = (form.elements.namedItem('price') as HTMLInputElement)?.value ?? '0'
      const tags = (form.elements.namedItem('tags') as HTMLInputElement).value

      const res = await fetch('/api/designs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, category_id, type, price, tags,
          previewName: preview?.name,
          previewType: preview?.type,
          files: files.map(f => ({ name: f.name, type: f.type, size: f.size })),
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }

      const { design_id, previewUpload, fileUploads } = data

      // Step 2: Upload preview directly to R2
      if (preview && previewUpload) {
        setProgress('Uploading preview...')
        await uploadFileToR2(previewUpload.url, preview)
      }

      // Step 3: Upload design files directly to R2
      for (let i = 0; i < fileUploads.length; i++) {
        const fu = fileUploads[i]
        const file = files.find(f => f.name === fu.name)
        if (!file) continue
        setProgress(`Uploading file (${i + 1}/${fileUploads.length}): ${fu.name}`)
        await uploadFileToR2(fu.url, file, fu.type)
      }

      // Step 4: Save file records in DB
      setProgress('Finalizing...')
      await fetch('/api/designs/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          design_id,
          preview_key: previewUpload?.key,
          files: fileUploads.map((fu: { key: string; name: string; type: string; size: number }) => ({
            key: fu.key, name: fu.name, type: fu.type, size: fu.size,
          })),
        }),
      })

      setSuccess(true)
    } catch {
      setError('Upload failed, please try again')
    }

    setLoading(false)
    setProgress('')
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Design Uploaded!</h2>
        <p className="text-gray-500 mt-2">Your design will go live after admin review.</p>
        <Button className="mt-6" onClick={() => { setSuccess(false); setFiles([]); setPreview(null); setPreviewUrl('') }}>
          Upload Another
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Design</h1>
      <p className="text-gray-500 mb-8">After uploading, admin will review it before it goes live.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Design Title *" name="title" placeholder="e.g. Business Card Template" required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows={3} placeholder="Describe your design..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category_id" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select a category</option>
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

        <Input label="Tags (comma separated)" name="tags" placeholder="e.g. logo, modern, business" />

        {/* Preview Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preview Image (PNG/JPG) *</label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors overflow-hidden relative">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-400">
                <FileUp className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm">Click to choose a preview image</span>
              </div>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={handlePreview} required />
          </label>
        </div>

        {/* Design Files */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Design Files (CDR, SVG, PSD, AI, ZIP) *
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
            <FileUp className="w-6 h-6 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Choose files (you can select multiple)</span>
            <input type="file" multiple accept=".cdr,.svg,.psd,.ai,.png,.jpg,.jpeg,.zip" className="sr-only" onChange={handleFiles} required />
          </label>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700 truncate">{f.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                      <X size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {progress && (
          <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-3 rounded-lg">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
            {progress}
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" loading={loading} size="lg" className="w-full">
          <Upload size={16} /> Upload Design
        </Button>
      </form>
    </div>
  )
}
