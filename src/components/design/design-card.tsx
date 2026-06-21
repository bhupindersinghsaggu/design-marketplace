import Link from 'next/link'
import Image from 'next/image'
import { Design } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Download } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface DesignCardProps {
  design: Design
}

export function DesignCard({ design }: DesignCardProps) {
  return (
    <Link href={`/design/${design.id}`} className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview Image */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {design.preview_url ? (
          <Image
            src={design.preview_url}
            alt={design.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">No Preview</span>
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2">
          {design.type === 'free' ? (
            <Badge variant="free">Free</Badge>
          ) : (
            <Badge variant="premium">Premium</Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm truncate">{design.title}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">{design.creator?.full_name ?? 'Creator'}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Download size={12} /> {design.downloads_count}
            </span>
            {design.type === 'premium' && design.price ? (
              <span className="text-sm font-semibold text-indigo-600">{formatPrice(design.price)}</span>
            ) : (
              <span className="text-sm font-semibold text-emerald-600">Free</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
