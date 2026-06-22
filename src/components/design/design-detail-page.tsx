import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatPrice, getFileTypeLabel, fileSizeLabel } from '@/lib/utils'
import { Download, FileType, User, Calendar, Tag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { DownloadButton } from '@/app/design/[id]/download-button'

export async function DesignDetailPage({ id }: { id: string }) {
  const supabase = await createClient()

  const { data: design } = await supabase
    .from('designs')
    .select('*, creator:profiles(id, full_name, avatar_url, bio), category:categories(name, slug, icon), files:design_files(*)')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!design) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let hasAccess = design.type === 'free'
  let hasPurchased = false
  let hasActiveSubscription = false

  if (user && design.type === 'premium') {
    const { data: purchase } = await supabase
      .from('purchases').select('id').eq('buyer_id', user.id).eq('design_id', id).single()
    hasPurchased = !!purchase

    const { data: sub } = await supabase
      .from('user_subscriptions').select('id').eq('user_id', user.id).eq('status', 'active')
      .gte('current_period_end', new Date().toISOString()).single()
    hasActiveSubscription = !!sub

    hasAccess = hasPurchased || hasActiveSubscription
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 rounded-2xl overflow-hidden aspect-[4/3] relative">
            {design.preview_url ? (
              <Image src={design.preview_url} alt={design.title} fill className="object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Preview</div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{design.title}</h1>
                {design.category && (
                  <Link href={`/browse?category=${design.category.slug}`}
                    className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
                    {design.category.icon} {design.category.name}
                  </Link>
                )}
              </div>
              <Badge variant={design.type === 'free' ? 'free' : 'premium'} className="text-sm px-3 py-1">
                {design.type === 'free' ? 'Free' : 'Premium'}
              </Badge>
            </div>

            {design.description && (
              <p className="mt-4 text-gray-600 leading-relaxed">{design.description}</p>
            )}

            {design.tags?.length > 0 && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Tag size={14} className="text-gray-400" />
                {design.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">{tag}</span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Download size={14} /> {design.downloads_count} downloads</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(design.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><User size={14} /> Creator</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-700 font-semibold">{design.creator?.full_name?.[0]?.toUpperCase() ?? 'C'}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{design.creator?.full_name ?? 'Creator'}</p>
                {design.creator?.bio && <p className="text-xs text-gray-500 mt-0.5">{design.creator.bio}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><FileType size={14} /> Available Files</h3>
            <div className="space-y-2">
              {design.files?.map((file: { id: string; file_type: string; file_size: number | null; original_name: string | null }) => (
                <div key={file.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{getFileTypeLabel(file.file_type)}</span>
                    {file.file_size && <span className="text-xs text-gray-400 ml-2">{fileSizeLabel(file.file_size)}</span>}
                  </div>
                  <Badge variant="default">.{file.file_type}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {design.type === 'free' ? (
              <DownloadButton designId={design.id} designType="free" isLoggedIn={!!user} />
            ) : hasAccess ? (
              <DownloadButton designId={design.id} designType="premium" isLoggedIn={!!user} hasAccess />
            ) : (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(design.price ?? 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">or free with a subscription</p>
                </div>
                {user ? (
                  <>
                    <DownloadButton designId={design.id} designType="premium" isLoggedIn price={design.price ?? 0} />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                      <div className="relative flex justify-center"><span className="px-2 bg-white text-xs text-gray-400">or</span></div>
                    </div>
                    <Link href="/pricing"><Button variant="outline" className="w-full">Get Subscription — ₹99/month</Button></Link>
                  </>
                ) : (
                  <>
                    <Link href="/login"><Button className="w-full">Login to Download</Button></Link>
                    <Link href="/pricing"><Button variant="outline" className="w-full">View Plans</Button></Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
