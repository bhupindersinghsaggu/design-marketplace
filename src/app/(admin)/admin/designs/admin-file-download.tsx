'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'

interface Props {
  fileKey: string
  fileName: string
  fileType: string
  fileSize: number
}

export function AdminFileDownload({ fileKey, fileName, fileType, fileSize }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    const res = await fetch('/api/admin/designs/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_key: fileKey, file_name: fileName }),
    })
    const data = await res.json()
    if (data.url) {
      const a = document.createElement('a')
      a.href = data.url
      a.download = fileName
      a.click()
    }
    setLoading(false)
  }

  const sizeMB = (fileSize / 1024 / 1024).toFixed(1)

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-300 rounded-lg text-xs font-medium text-gray-700 transition-colors disabled:opacity-50"
    >
      <Download size={12} />
      {loading ? 'Downloading...' : `${fileName} (${sizeMB} MB)`}
      <span className="uppercase text-gray-400 font-normal">.{fileType}</span>
    </button>
  )
}
