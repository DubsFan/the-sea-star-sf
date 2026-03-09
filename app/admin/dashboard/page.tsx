'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '../session-context'

interface Stats {
  subscribers: number
  totalPosts: number
  publishedPosts: number
  unreadMessages: number
  upcomingEvents: number
  socialConfigured: boolean
  weeklyBlogPublished: boolean
  weeklySocialPosted: boolean
  weeklyMessagesRead: boolean
}

interface ActivityItem {
  id: string
  action: string
  summary: string
  actor: string
  created_at: string
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const session = useSession()
  const displayName = session?.displayName || 'there'
  const isCrew = session?.role === 'crew'
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(setStats).catch(() => {})
    fetch('/api/admin/activity').then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d)) setActivity(d) }).catch(() => {})
  }, [])

  return (
    <div className="max-w-4xl">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-cormorant text-2xl md:text-3xl font-light text-sea-white">
          {getGreeting()}, {displayName}
        </h1>
      </div>

      {/* Status Pills */}
      {stats && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1 scrollbar-hide">
          <StatusPill href="/admin/messages" label={`${stats.unreadMessages} unread`} highlight={stats.unreadMessages > 0} />
          <StatusPill href="/admin/subscribers" label={`${stats.subscribers} subs`} />
          <StatusPill href="/admin/create" label={`${stats.publishedPosts} posts`} />
          <StatusPill label={stats.socialConfigured ? 'Social: Active' : 'Social: Off'} highlight={!stats.socialConfigured} />
          {stats.upcomingEvents > 0 && (
            <StatusPill href="/admin/create?tab=events" label={`${stats.upcomingEvents} events`} />
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <QuickAction href="/admin/menu" title="Update Menu" icon={<MenuQAIcon />} />
        <QuickAction href="/admin/create?tab=blog" title="New Blog" icon={<BlogQAIcon />} />
        <QuickAction href="/admin/create?tab=social" title="New Social Post" icon={<SocialQAIcon />} />
        <QuickAction href="/admin/create?tab=events" title="New Event" icon={<EventQAIcon />} />
      </div>

      {/* Weekly Checklist */}
      {stats && !isCrew && (
        <div className="mb-8">
          <h2 className="font-cormorant text-lg text-sea-white mb-3">This Week</h2>
          <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 space-y-3">
            <CheckItem done={stats.weeklyBlogPublished} label="Publish a blog post" href="/admin/create?tab=blog" />
            <CheckItem done={stats.weeklySocialPosted} label="Post to social media" href="/admin/create?tab=social" />
            <CheckItem done={stats.weeklyMessagesRead} label="Check messages" href="/admin/messages" />
            <CheckItem done={false} label="Review menu for accuracy" href="/admin/menu" />
          </div>
        </div>
      )}

      {/* SEO Health */}
      {stats && !isCrew && (
        <div className="mb-8">
          <h2 className="font-cormorant text-lg text-sea-white mb-3">SEO Health</h2>
          <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <HealthIndicator
                label="Blog freshness"
                status={stats.weeklyBlogPublished ? 'green' : 'yellow'}
                detail={stats.weeklyBlogPublished ? 'Posted this week' : 'No post this week'}
              />
              <HealthIndicator
                label="Social activity"
                status={stats.weeklySocialPosted ? 'green' : stats.socialConfigured ? 'yellow' : 'red'}
                detail={stats.weeklySocialPosted ? 'Posted this week' : stats.socialConfigured ? 'Not posted yet' : 'Not configured'}
              />
              <HealthIndicator
                label="Subscriber base"
                status={stats.subscribers > 0 ? 'green' : 'red'}
                detail={`${stats.subscribers} active`}
              />
              <HealthIndicator
                label="Events"
                status={stats.upcomingEvents > 0 ? 'green' : 'yellow'}
                detail={stats.upcomingEvents > 0 ? `${stats.upcomingEvents} upcoming` : 'None scheduled'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="mb-8">
        <h2 className="font-cormorant text-lg text-sea-white mb-3">Recent Activity</h2>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg overflow-hidden">
          {activity.length === 0 ? (
            <p className="text-sm text-sea-blue font-dm p-4">No recent activity. Activity will appear here as you publish, post, and send.</p>
          ) : (
            <div className="divide-y divide-sea-gold/5">
              {activity.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                  <ActivityDot action={item.action} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-sea-light font-dm truncate">{item.summary}</p>
                    <p className="text-[0.65rem] text-sea-blue/60 font-dm mt-0.5">
                      {item.actor} &middot; {formatTimeAgo(item.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help */}
      <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 mb-8">
        <p className="text-sm text-sea-blue font-dm">
          Need help? Text or call GG anytime.
        </p>
      </div>
    </div>
  )
}

function StatusPill({ href, label, highlight }: { href?: string; label: string; highlight?: boolean }) {
  const cls = `flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-dm whitespace-nowrap transition-colors ${
    highlight
      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
      : 'bg-[#0a0e18] text-sea-blue border border-sea-gold/10 hover:border-sea-gold/30'
  }`
  if (href) return <Link href={href} className={`${cls} no-underline`}>{label}</Link>
  return <span className={cls}>{label}</span>
}

function QuickAction({ href, title, icon }: { href: string; title: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-2 bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 min-h-[80px] hover:border-sea-gold/30 transition-all no-underline group">
      <div className="text-sea-blue group-hover:text-sea-gold transition-colors">{icon}</div>
      <span className="text-xs text-sea-blue group-hover:text-sea-gold font-dm text-center transition-colors">{title}</span>
    </Link>
  )
}

function CheckItem({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 no-underline group">
      <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${done ? 'bg-emerald-500/20 border-emerald-500/40' : 'border-sea-gold/20'}`}>
        {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
      </div>
      <span className={`text-sm font-dm ${done ? 'text-sea-blue/50 line-through' : 'text-sea-light group-hover:text-sea-gold'} transition-colors`}>{label}</span>
    </Link>
  )
}

function HealthIndicator({ label, status, detail }: { label: string; status: 'green' | 'yellow' | 'red'; detail: string }) {
  const dotColor = status === 'green' ? 'bg-emerald-400' : status === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-start gap-2">
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
      <div>
        <p className="text-xs text-sea-light font-dm">{label}</p>
        <p className="text-[0.65rem] text-sea-blue/60 font-dm">{detail}</p>
      </div>
    </div>
  )
}

function ActivityDot({ action }: { action: string }) {
  let color = 'bg-sea-blue/30'
  if (action.includes('published')) color = 'bg-emerald-400'
  if (action.includes('social') || action.includes('posted')) color = 'bg-purple-400'
  if (action.includes('mailer') || action.includes('sent')) color = 'bg-blue-400'
  if (action.includes('archived')) color = 'bg-sea-blue/30'
  if (action.includes('scheduled')) color = 'bg-yellow-400'
  return <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${color}`} />
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

// Quick action icons
function MenuQAIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
}
function BlogQAIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h6"/></svg>
}
function SocialQAIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
}
function EventQAIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
}
