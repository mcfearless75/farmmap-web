'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Store, LayoutDashboard, List, LogOut } from 'lucide-react'

export default function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/shops', label: 'Shops', icon: Store },
    { href: '/admin/queue', label: 'Queue', icon: List },
  ]

  return (
    <header className="bg-green-700 text-white px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-sm">Farmmap</Link>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  pathname === href
                    ? 'bg-white/20 font-medium'
                    : 'hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-green-200 hidden sm:block">{userEmail}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs hover:text-green-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
