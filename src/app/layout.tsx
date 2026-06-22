import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DesignMarket — Free & Premium Design Resources',
  description: 'Download CDR, SVG, PSD, AI files. Upload your designs and earn money.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar profile={profile} />
        <main>{children}</main>
      </body>
    </html>
  )
}
