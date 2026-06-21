import { createClient } from '@/lib/supabase/server'
import { DesignCard } from '@/components/design/design-card'
import { Design } from '@/types'
import { Search } from 'lucide-react'

interface BrowsePageProps {
  searchParams: Promise<{ q?: string; category?: string; type?: string }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('designs')
    .select('*, creator:profiles(full_name, avatar_url), category:categories(name, slug)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (params.q) query = query.ilike('title', `%${params.q}%`)
  if (params.type) query = query.eq('type', params.type)
  if (params.category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', params.category).single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  const { data: designs } = await query.limit(48)
  const { data: categories } = await supabase.from('categories').select('*')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search & Filters */}
      <div className="mb-8">
        <form className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Design search karein..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Search
          </button>
        </form>

        {/* Type Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Sab', value: '' },
            { label: 'Free', value: 'free' },
            { label: 'Premium', value: 'premium' },
          ].map(f => (
            <a key={f.value} href={`/browse?${params.q ? `q=${params.q}&` : ''}${f.value ? `type=${f.value}` : ''}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                (params.type ?? '') === f.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
              }`}>
              {f.label}
            </a>
          ))}
          <span className="text-gray-300 mx-1">|</span>
          {categories?.map(cat => (
            <a key={cat.id} href={`/browse?category=${cat.slug}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                params.category === cat.slug
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
              }`}>
              {cat.icon} {cat.name}
            </a>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mb-4 text-sm text-gray-500">
        {designs?.length ?? 0} designs mile
      </div>
      {designs && designs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(designs as Design[]).map(d => <DesignCard key={d.id} design={d} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3" />
          <p>Koi design nahi mila. Filter change karke dekhein.</p>
        </div>
      )}
    </div>
  )
}
