'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from '../session-context'
import ChannelRow from '../create/ChannelRow'

interface Stats {
  subscribers: number
  totalPosts: number
  publishedPosts: number
  unreadMessages: number
  upcomingEvents: number
  pendingReview: number
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

interface DraftItem {
  id: string
  type: string
  title: string
  status: string
  image_url: string | null
  content: Record<string, unknown>
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
  const [readyItems, setReadyItems] = useState<DraftItem[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [publishState, setPublishState] = useState<Record<string, { site: string; social: string; mailer: string; publishing?: boolean }>>({})

  const loadReadyItems = () => {
    fetch('/api/drafts', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((d: DraftItem[]) => {
        const ready = Array.isArray(d) ? d.filter(item => item.status === 'ready') : []
        setReadyItems(ready)
        const state: typeof publishState = {}
        for (const item of ready) {
          if (!publishState[item.id]) {
            state[item.id] = { site: 'now', social: 'now', mailer: 'skip' }
          }
        }
        if (Object.keys(state).length) setPublishState(prev => ({ ...state, ...prev }))
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' }).then(r => r.ok ? r.json() : null).then(setStats).catch(() => {})
    fetch('/api/admin/activity', { credentials: 'include' }).then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d)) setActivity(d) }).catch(() => {})
    loadReadyItems()
  }, [])

  const handleQuickPublish = async (item: DraftItem) => {
    const ps = publishState[item.id] || { site: 'now', social: 'now', mailer: 'skip' }
    setPublishState(p => ({ ...p, [item.id]: { ...ps, publishing: true } }))

    try {
      if (item.type === 'social_campaign') {
        const res = await fetch('/api/social/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ campaign_id: item.id }),
        })
        if (res.ok) {
          toast.success('Posted!')
          setReadyItems(prev => prev.filter(i => i.id !== item.id))
        } else {
          const data = await res.json()
          toast.error(data.error || 'Post failed')
        }
      } else if (item.type === 'mailer_campaign') {
        const res = await fetch('/api/mailers/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ campaign_id: item.id }),
        })
        const data = await res.json()
        if (res.ok) {
          toast.success(`Sent to ${data.recipientCount} subscribers`)
          setReadyItems(prev => prev.filter(i => i.id !== item.id))
        } else {
          toast.error(data.error || 'Send failed')
        }
      } else {
        const endpoint = item.type === 'blog_post' ? '/api/blog/publish' : '/api/events/publish'
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: item.id,
            site: { action: ps.site },
            social: { action: ps.social },
            mailer: { action: ps.mailer },
          }),
        })
        if (res.ok) {
          toast.success('Published!')
          setReadyItems(prev => prev.filter(i => i.id !== item.id))
        } else {
          const data = await res.json()
          toast.error(data.error || 'Publish failed')
        }
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setPublishState(p => ({ ...p, [item.id]: { ...ps, publishing: false } }))
    }
  }

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
          <StatusPill href="/admin/marketing?tab=email" label={`${stats.subscribers} subs`} />
          <StatusPill href="/admin/marketing?tab=blog" label={`${stats.publishedPosts} posts`} />
          <StatusPill label={stats.socialConfigured ? 'Social: Active' : 'Social: Off'} highlight={!stats.socialConfigured} />
          {stats.pendingReview > 0 && (
            <StatusPill href="/admin/marketing?tab=drafts&status=ready" label={`${stats.pendingReview} to review`} highlight />
          )}
          {stats.upcomingEvents > 0 && (
            <StatusPill href="/admin/marketing?tab=events" label={`${stats.upcomingEvents} events`} />
          )}
        </div>
      )}

      {/* Ready to Publish */}
      {readyItems.length > 0 && (
        <div className="mb-8">
          <h2 className="font-cormorant text-lg text-sea-white mb-3">Ready to Publish</h2>
          <div className="space-y-2">
            {readyItems.map(item => {
              const isExpanded = expandedId === item.id
              const ps = publishState[item.id] || { site: 'now', social: 'now', mailer: 'skip' }
              const typeBadge = item.type === 'blog_post' ? 'Blog' : item.type === 'event' ? 'Event' : item.type === 'social_campaign' ? 'Social' : 'Email'
              const badgeColor = item.type === 'blog_post' ? 'bg-blue-900/30 text-blue-400' : item.type === 'event' ? 'bg-purple-900/30 text-purple-400' : item.type === 'social_campaign' ? 'bg-pink-900/30 text-pink-400' : 'bg-sea-gold/10 text-sea-gold'
              const isSocial = item.type === 'social_campaign'
              const isMailer = item.type === 'mailer_campaign'

              return (
                <div key={item.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full p-3 flex items-center gap-3 bg-transparent border-none cursor-pointer text-left min-h-[56px]"
                  >
                    {item.image_url && <img src={item.image_url} alt="" className="w-[50px] h-[50px] object-cover rounded flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-sea-light font-dm truncate">{item.title}</p>
                    </div>
                    <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded flex-shrink-0 ${badgeColor}`}>{typeBadge}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-sea-blue transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-sea-gold/10 p-3 space-y-3">
                      {isSocial ? (
                        <button
                          onClick={() => handleQuickPublish(item)}
                          disabled={ps.publishing}
                          className="w-full px-6 py-3 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50 min-h-[44px] rounded"
                        >
                          {ps.publishing ? 'Posting...' : 'Post Now'}
                        </button>
                      ) : isMailer ? (
                        <button
                          onClick={() => handleQuickPublish(item)}
                          disabled={ps.publishing}
                          className="w-full px-6 py-3 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50 min-h-[44px] rounded"
                        >
                          {ps.publishing ? 'Sending...' : 'Send Now'}
                        </button>
                      ) : (
                        <>
                          <ChannelRow label="Site" value={ps.site} onChange={v => setPublishState(p => ({ ...p, [item.id]: { ...ps, site: v } }))} />
                          <ChannelRow label="Social" value={ps.social} onChange={v => setPublishState(p => ({ ...p, [item.id]: { ...ps, social: v } }))} />
                          <ChannelRow label="Newsletter" value={ps.mailer} onChange={v => setPublishState(p => ({ ...p, [item.id]: { ...ps, mailer: v } }))} allowDraft />
                          <button
                            onClick={() => handleQuickPublish(item)}
                            disabled={ps.publishing}
                            className="w-full px-6 py-3 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50 min-h-[44px] rounded"
                          >
                            {ps.publishing ? 'Publishing...' : 'Publish'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <QuickAction href="/admin/menu" title="Update Menu" icon={<MenuQAIcon />} />
        <QuickAction href="/admin/marketing?tab=blog" title="New Blog" icon={<BlogQAIcon />} />
        <QuickAction href="/admin/marketing?tab=social" title="New Social Post" icon={<SocialQAIcon />} />
        <QuickAction href="/admin/marketing?tab=events" title="New Event" icon={<EventQAIcon />} />
      </div>

      {/* Weekly Checklist */}
      {stats && !isCrew && (
        <div className="mb-8">
          <h2 className="font-cormorant text-lg text-sea-white mb-3">This Week</h2>
          <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 space-y-3">
            <CheckItem done={stats.weeklyBlogPublished} label="Publish a blog post" href="/admin/marketing?tab=blog" />
            <CheckItem done={stats.weeklySocialPosted} label="Post to social media" href="/admin/marketing?tab=social" />
            <CheckItem done={false} label="Review menu for accuracy" href="/admin/menu" />
          </div>
        </div>
      )}

      {/* SEO Health */}
      {stats && !isCrew && (
        <div className="mb-8">
          <h2 className="font-cormorant text-lg text-sea-white mb-3">SEO Health</h2>
          <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
