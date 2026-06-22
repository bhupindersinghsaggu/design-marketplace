import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { AdminDesignActions } from './actions'
import { AdminFileDownload } from './admin-file-download'
import Image from 'next/image'

export default async function AdminDesignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: designs } = await supabase
    .from('designs')
    .select('*, creator:profiles(full_name, email), category:categories(name), files:design_files(*)')
    .order('created_at', { ascending: false })

  const pending = designs?.filter(d => d.status === 'pending') ?? []
  const others = designs?.filter(d => d.status !== 'pending') ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin — Designs</h1>
        <a href="/admin/payouts" className="text-sm text-indigo-600 hover:underline">View Payouts →</a>
      </div>

      {/* Pending */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Pending Review <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-sm rounded-full">{pending.length}</span>
      </h2>
      <div className="space-y-4 mb-10">
        {pending.length === 0 && <p className="text-gray-400 text-sm">No pending designs</p>}
        {pending.map(d => (
          <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-5 flex gap-5">
            <div className="w-24 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {d.preview_url ? (
                <Image src={d.preview_url} alt={d.title} width={96} height={80} className="object-cover w-full h-full" />
              ) : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No img</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{d.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    By: {d.creator?.full_name} ({d.creator?.email}) • {d.category?.name} • {formatDate(d.created_at)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={d.type === 'free' ? 'free' : 'premium'}>{d.type}</Badge>
                    {d.type === 'premium' && <span className="text-sm font-medium text-gray-700">₹{d.price}</span>}
                  </div>
                  {d.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{d.description}</p>}
                  {d.files && d.files.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {d.files.map((f: { file_key: string; original_name: string; file_type: string; file_size: number }) => (
                        <AdminFileDownload key={f.file_key} fileKey={f.file_key} fileName={f.original_name} fileType={f.file_type} fileSize={f.file_size} />
                      ))}
                    </div>
                  )}
                </div>
                <AdminDesignActions designId={d.id} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* All other designs */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">All Designs ({others.length})</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Creator</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {others.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{d.title}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{d.creator?.full_name}</td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{d.creator?.email}</td>
                <td className="px-4 py-3"><Badge variant={d.type === 'free' ? 'free' : 'premium'}>{d.type}</Badge></td>
                <td className="px-4 py-3">
                  <Badge variant={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'danger' : 'warning'}>{d.status}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{formatDate(d.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
