'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Profile } from '@/types'
import { Upload, LayoutDashboard, LogOut, Shield, Search } from 'lucide-react'
import { useState } from 'react'

interface NavbarProps {
  profile: Profile | null
}

export function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DM</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">DesignMarket</span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Browse</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Pricing</Link>
            {profile && (
              <Link href="/upload" className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
                <Upload size={14} /> Upload
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/browse" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg md:hidden">
              <Search size={18} />
            </Link>
            {profile ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-700 font-semibold text-sm">
                      {profile.full_name?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {profile.full_name ?? 'User'}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <Link href="/upload" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Upload size={15} /> Design Upload
                    </Link>
                    {profile.role === 'admin' && (
                      <Link href="/admin" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Shield size={15} /> Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
