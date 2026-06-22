import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { DesignCard } from '@/components/design/design-card'
import { Button } from '@/components/ui/button'
import { Design } from '@/types'
import { ArrowRight, Download, Upload, Star } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: designs } = await supabase
    .from('designs')
    .select('*, creator:profiles(full_name, avatar_url), category:categories(name, slug)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(8)

  const { data: categories } = await supabase.from('categories').select('*')

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Free & Premium<br />Design Resources
          </h1>
          <p className="text-indigo-200 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Download CDR, SVG, PSD, AI files. Share your designs and earn money.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 w-full sm:w-auto">
                Browse Designs <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                Join for Free
              </Button>
            </Link>
          </div>
          <div className="flex justify-center gap-12 mt-14">
            {[
              { icon: Download, label: 'Downloads', value: '10K+' },
              { icon: Upload, label: 'Designs', value: '500+' },
              { icon: Star, label: 'Creators', value: '100+' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <Icon className="w-5 h-5 mx-auto mb-1 text-indigo-300" />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-indigo-300 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.map(cat => (
              <Link key={cat.id} href={`/browse?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-center">
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Designs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Latest Designs</h2>
          <Link href="/browse" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {designs && designs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(designs as Design[]).map(d => <DesignCard key={d.id} design={d} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p>No designs yet. Be the first to upload!</p>
            <Link href="/upload" className="mt-2 inline-block text-indigo-600 hover:underline">Upload a Design</Link>
          </div>
        )}
      </section>

      {/* CTA - Upload */}
      <section className="bg-indigo-50 border-t border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Become a Creator, Earn Money</h2>
          <p className="text-gray-600 mb-6">Upload your designs — earn 70% commission on every sale</p>
          <Link href="/register">
            <Button size="lg">
              <Upload size={16} /> Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
