'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { SessionContext, type SessionData } from './session-context'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
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

  // Fetch unread message count
  useEffect(() => {
    if (!authenticated || pathname === '/admin') return
    fetch('/api/contact?unread_count=true', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.count != null) setUnreadCount(data.count) })
      .catch(() => {})
  }, [authenticated, pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { credentials: 'include', method: 'POST' })
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

  // Primary nav: Home, Menu, Create, Inbox
  const primaryNav = [
    { label: 'Home', href: '/admin/dashboard', icon: HomeIcon },
    ...(!isSocialAdmin ? [{ label: 'Menu', href: '/admin/menu', icon: MenuIcon }] : []),
    ...(canSeeContent ? [{ label: 'Create', href: '/admin/create', icon: CreateIcon }] : []),
    { label: 'Inbox', href: '/admin/messages', icon: InboxIcon, badge: unreadCount },
  ]

  // More menu items
  const moreItems = [
    ...(canSeeContent ? [{ label: 'Marketing', href: '/admin/marketing', icon: MarketingIcon }] : []),
    ...(isAdminOrAbove ? [{ label: 'Users', href: '/admin/users', icon: UsersIcon }] : []),
    ...(isSuperAdmin ? [{ label: 'Settings', href: '/admin/settings', icon: SettingsIcon }] : []),
  ]

  const allNav = [...primaryNav, ...moreItems]

  // For mobile: show primary + More button
  const mobileMain = primaryNav.slice(0, 4)

  // Check if Create tab is active (matches /admin/create or /admin/blog)
  const isCreateActive = pathname.startsWith('/admin/create') || pathname === '/admin/blog'
  const isMarketingActive = pathname.startsWith('/admin/marketing') || pathname === '/admin/subscribers' || pathname === '/admin/media' || pathname === '/admin/seo'

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
            {allNav.map((item) => {
              const active = item.href === '/admin/create'
                ? isCreateActive
                : item.href === '/admin/marketing'
                ? isMarketingActive
                : pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-dm rounded transition-all no-underline relative ${active ? 'bg-sea-gold/10 text-sea-gold' : 'text-sea-blue hover:text-sea-gold hover:bg-sea-gold/5'}`}
                >
                  <item.icon active={active} />
                  {item.label}
                  {'badge' in item && (item as { badge?: number }).badge ? (
                    <span className="ml-auto bg-red-500 text-white text-[0.6rem] font-dm font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                      {(item as { badge: number }).badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
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
          {mobileMain.map((item) => {
            const active = item.href === '/admin/create'
              ? isCreateActive
              : pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 pt-2.5 no-underline transition-colors min-h-[56px] relative ${active ? 'text-sea-gold' : 'text-sea-blue'}`}
              >
                <div className="relative">
                  <item.icon active={active} />
                  {'badge' in item && (item as { badge?: number }).badge ? (
                    <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[0.5rem] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">
                      {(item as { badge: number }).badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[0.55rem] mt-1 font-dm">{item.label}</span>
              </Link>
            )
          })}
          {moreItems.length > 0 && (
            <MobileMoreMenu items={moreItems} pathname={pathname} />
          )}
        </nav>
      </div>
    </SessionContext.Provider>
  )
}

function MobileMoreMenu({ items, pathname }: { items: { label: string; href: string; icon: React.FC<{ active: boolean }> }[]; pathname: string }) {
  const [open, setOpen] = useState(false)
  const isItemActive = (href: string) => href === '/admin/marketing' ? pathname.startsWith('/admin/marketing') : pathname === href
  const isActive = items.some((i) => isItemActive(i.href))

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
            {items.map((item) => {
              const active = isItemActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-dm no-underline transition-colors ${active ? 'text-sea-gold bg-sea-gold/10' : 'text-sea-blue hover:text-sea-gold'}`}
                >
                  <item.icon active={active} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// SVG Icons
function HomeIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/></svg>
}
function MenuIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
}
function CreateIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? '#c9a96e' : 'none'} stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8" stroke={active ? '#06080d' : '#6b7a99'} strokeWidth="2"/></svg>
}
function InboxIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
}
function MediaIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
}
function SubsIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M4 4h16v16H4z"/><path d="M4 8l8 5 8-5"/></svg>
}
function SeoIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6"/></svg>
}
function MarketingIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a96e' : '#6b7a99'} strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
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
