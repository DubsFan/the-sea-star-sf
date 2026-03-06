'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type UserRole = 'super_admin' | 'admin' | 'social_admin' | 'crew'

interface SessionData {
  username: string
  role: UserRole
  displayName: string
}

const SessionContext = createContext<SessionData | null>(null)
export const useSession = () => useContext(SessionContext)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/admin') {
      setAuthenticated(true)
      return
    }

    fetch('/api/auth/session', { credentials: 'include' })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json()
          setSession(data)
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  if (pathname === '/admin') return <>{children}</>
  if (authenticated === null) {
    return <div className="min-h-screen bg-[#06080d] flex items-center justify-center text-sea-gold">Loading...</div>
  }
  if (!authenticated) return null

  const isSuperAdmin = session?.role === 'super_admin'
  const isAdminOrAbove = session?.role === 'super_admin' || session?.role === 'admin'
  const isSocialAdmin = session?.role === 'social_admin'
  const canSeeContent = isAdminOrAbove || isSocialAdmin

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: DashboardIcon },
    ...(!isSocialAdmin ? [
      { label: 'Menu', href: '/admin/menu', icon: MenuIcon },
      { label: 'Wine', href: '/admin/wine', icon: WineIcon },
    ] : []),
    { label: 'Blog', href: '/admin/blog', icon: BlogIcon },
    { label: 'Media', href: '/admin/media', icon: MediaIcon },
    ...(canSeeContent ? [{ label: 'Subscribers', href: '/admin/subscribers', icon: SubsIcon }] : []),
    { label: 'Messages', href: '/admin/messages', icon: MsgIcon },
    ...(isAdminOrAbove ? [{ label: 'Users', href: '/admin/users', icon: UsersIcon }] : []),
    ...(isSuperAdmin ? [{ label: 'Settings', href: '/admin/settings', icon: SettingsIcon }] : []),
  ]

  // Mobile: show first 5 in tab bar, rest in "More"
  const mobileMain = navItems.slice(0, 5)
  const mobileMore = navItems.slice(5)

  return (
    <SessionContext.Provider value={session}>
      <div className="min-h-screen bg-[#06080d] flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-[#0a0e18] border-r border-sea-gold/10 p-6 flex-col flex-shrink-0 fixed inset-y-0 left-0 z-40">
          <Link href="/" className="block mb-1 no-underline">
            <Image src="/sea-star-logo.png" alt="The Sea Star" width={140} height={40} className="object-contain" />
          </Link>
          <p className="text-[0.55rem] tracking-[0.3em] uppercase text-sea-blue mb-6">Admin Portal</p>
          {session && (
            <div className="mb-6 pb-4 border-b border-sea-gold/10">
              <p className="text-sm text-sea-white font-dm">Hi, {session.displayName}</p>
              <span className="text-[0.6rem] tracking-[0.15em] uppercase text-sea-gold/60 font-dm">
                {session.role === 'super_admin' ? 'Super Admin' : session.role === 'admin' ? 'El Jefe' : session.role === 'social_admin' ? 'Social Admin' : 'Crew'}
              </span>
            </div>
          )}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-dm rounded transition-all no-underline ${pathname === item.href ? 'bg-sea-gold/10 text-sea-gold' : 'text-sea-blue hover:text-sea-gold hover:bg-sea-gold/5'}`}
              >
                <item.icon active={pathname === item.href} />
                {item.label}
              </Link>
            ))}
          </nav>
          <button onClick={handleLogout} className="mt-auto px-4 py-2.5 text-sm font-dm text-sea-blue hover:text-sea-rose transition-colors bg-transparent border-none cursor-pointer text-left">
            Logout
          </button>
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0a0e18] border-b border-sea-gold/10 sticky top-0 z-40">
          <Link href="/" className="no-underline">
            <Image src="/sea-star-logo.png" alt="The Sea Star" width={100} height={30} className="object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            {session && (
              <span className="text-xs text-sea-blue font-dm">{session.displayName}</span>
            )}
            <button onClick={handleLogout} className="text-xs text-sea-rose font-dm bg-transparent border-none cursor-pointer">
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 md:ml-64 pb-24 md:pb-8 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#0a0e18] border-t border-sea-gold/10 flex z-40 safe-bottom">
          {mobileMain.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 pt-2.5 no-underline transition-colors min-h-[56px] ${pathname === item.href ? 'text-sea-gold' : 'text-sea-blue'}`}
            >
              <item.icon active={pathname === item.href} />
              <span className="text-[0.55rem] mt-1 font-dm">{item.label}</span>
            </Link>
          ))}
          {mobileMore.length > 0 && (
            <MobileMoreMenu items={mobileMore} pathname={pathname} />
          )}
        </nav>
      </div>
    </SessionContext.Provider>
  )
}

function MobileMoreMenu({ items, pathname }: { items: { label: string; href: string; icon: React.FC<{ active: boolean }> }[]; pathname: string }) {
  const [open, setOpen] = useState(false)
  const isActive = items.some((i) => i.href === pathname)

  return (
    <div className="flex-1 relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex flex-col items-center justify-center py-2 pt-2.5 min-h-[56px] bg-transparent border-none cursor-pointer ${isActive ? 'text-sea-gold' : 'text-sea-blue'}`}
      >
        <MoreIcon active={isActive} />
        <span className="text-[0.55rem] mt-1 font-dm">More</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 mr-1 bg-[#0a0e18] border border-sea-gold/20 rounded-lg overflow-hidden shadow-xl z-50 min-w-[160px]">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-dm no-underline transition-colors ${pathname === item.href ? 'text-sea-gold bg-sea-gold/10' : 'text-sea-blue hover:text-sea-gold'}`}
              >
                <item.icon active={pathname === item.href} />
                {item.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Simple SVG icons for nav
function DashboardIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}
function MenuIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
}
function WineIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M8 2h8l-1 7a5 5 0 01-10 0L8 2zM12 15v6M8 21h8"/></svg>
}
function BlogIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h6"/></svg>
}
function MediaIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
}
function SubsIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M4 4h16v16H4z"/><path d="M4 8l8 5 8-5"/></svg>
}
function MsgIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
}
function UsersIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
}
function SettingsIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
}
function MoreIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
}
