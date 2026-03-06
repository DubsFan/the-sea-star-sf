'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/admin') {
      setAuthenticated(true)
      return
    }

    fetch('/api/menu', { credentials: 'include' })
      .then((r) => {
        if (r.ok) {
          setAuthenticated(true)
        } else {
          setAuthenticated(false)
          router.push('/admin')
        }
      })
      .catch(() => {
        setAuthenticated(false)
        router.push('/admin')
      })
  }, [pathname, router])

  useEffect(() => {
    if (authenticated && pathname !== '/admin') {
      fetch('/api/contact')
        .catch(() => {})
    }
  }, [authenticated, pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  if (pathname === '/admin') return <>{children}</>
  if (authenticated === null) {
    return <div className="min-h-screen bg-[#06080d] flex items-center justify-center text-sea-gold">Loading...</div>
  }
  if (!authenticated) return null

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Menu', href: '/admin/menu' },
    { label: 'Blog', href: '/admin/blog' },
    { label: 'Subscribers', href: '/admin/subscribers' },
    { label: 'Messages', href: '/admin/messages', badge: unreadCount },
  ]

  return (
    <div className="min-h-screen bg-[#06080d] flex">
      <aside className="w-64 bg-[#0a0e18] border-r border-sea-gold/10 p-6 flex flex-col">
        <Link href="/" className="font-playfair text-xl font-bold text-sea-gold mb-1 no-underline">The Sea Star</Link>
        <p className="text-[0.55rem] tracking-[0.3em] uppercase text-sea-blue mb-8">Admin Portal</p>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 text-sm font-dm rounded transition-all no-underline ${pathname === item.href ? 'bg-sea-gold/10 text-sea-gold' : 'text-sea-blue hover:text-sea-gold hover:bg-sea-gold/5'}`}
            >
              {item.label}
              {item.badge ? <span className="ml-2 bg-sea-rose/20 text-sea-rose text-xs px-1.5 py-0.5 rounded-full">{item.badge}</span> : null}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-auto px-4 py-2.5 text-sm font-dm text-sea-blue hover:text-sea-rose transition-colors bg-transparent border-none cursor-pointer text-left">
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
