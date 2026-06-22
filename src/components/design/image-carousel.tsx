'use client'
import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: string[]
  title: string
}

export function ImageCarousel({ images, title }: Props) {
  const [current, setCurrent] = useState(0)

  if (!images.length) {
    return (
      <div className="bg-gray-100 rounded-2xl aspect-[4/3] flex items-center justify-center text-gray-400">
        No Preview
      </div>
    )
  }

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-[4/3] group">
        <Image
          key={current}
          src={images[current]}
          alt={`${title} - ${current + 1}`}
          fill
          className="object-contain"
        />

        {images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-indigo-600 w-4' : 'bg-white/70'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                i === current ? 'border-indigo-600' : 'border-gray-200 hover:border-gray-400'
              }`}>
              <Image src={img} alt={`${title} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
