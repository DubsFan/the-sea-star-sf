'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import NotesThread from './NotesThread'

interface DraftItem {
  id: string
  type: string
  title: string
  status: string
  updated_at: string
  note_count: number
  image_url: string | null
}

const TYPE_LABELS: Record<string, string> = {
  blog_post: 'Blog',
  event: 'Event',
  social_campaign: 'Social',
  mailer_campaign: 'Email',
}

const TYPE_COLORS: Record<string, string> = {
  blog_post: 'bg-blue-900/30 text-blue-400',
  event: 'bg-purple-900/30 text-purple-400',
  social_campaign: 'bg-pink-900/30 text-pink-400',
  mailer_campaign: 'bg-teal-900/30 text-teal-400',
}

function timeAgo(dateStr: string): string {
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

export default function DraftsTab({ isAdminOrAbove, onSwitchTab }: { isAdminOrAbove: boolean; onSwitchTab: (tab: string) => void }) {
  const searchParams = useSearchParams()
  const initialStatusFilter = searchParams.get('status') || 'all'

  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadDrafts = useCallback(async () => {
    const res = await fetch('/api/drafts', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setDrafts(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadDrafts()
    const interval = setInterval(loadDrafts, 30000)
    return () => clearInterval(interval)
  }, [loadDrafts])

  const filtered = drafts.filter((d) => {
    if (typeFilter !== 'all' && d.type !== typeFilter) return false
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    return true
  })

  const updateStatus = async (item: DraftItem, newStatus: string) => {
    setUpdating(item.id)
    const tableMap: Record<string, string> = {
      blog_post: 'blog',
      event: 'events',
      social_campaign: 'social',
      mailer_campaign: 'mailers',
    }
    const apiRoute = `/api/${tableMap[item.type]}`
    try {
      const res = await fetch(apiRoute, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: item.id, status: newStatus }),
      })
      if (res.ok) {
        toast.success(newStatus === 'ready' ? 'Marked as ready' : 'Back to draft')
        await loadDrafts()
      } else {
        toast.error('Update failed')
      }
    } finally {
      setUpdating(null)
    }
  }

  const handlePublish = async (item: DraftItem) => {
    setUpdating(item.id)
    const publishRoutes: Record<string, string> = {
      blog_post: '/api/blog/publish',
      event: '/api/events/publish',
    }
    const route = publishRoutes[item.type]
    if (!route) {
      // Social: post via social/post
      try {
        const postRes = await fetch('/api/social/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ campaign_id: item.id }),
        })
        if (postRes.ok) {
          toast.success('Posted!')
          await loadDrafts()
        } else {
          toast.error('Post failed')
        }
      } finally {
        setUpdating(null)
      }
      return
    }
    try {
      const res = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: item.id,
          site: { action: 'now' },
          social: { action: 'skip' },
          mailer: { action: 'skip' },
        }),
      })
      if (res.ok) {
        toast.success('Published!')
        await loadDrafts()
      } else {
        toast.error('Publish failed')
      }
    } finally {
      setUpdating(null)
    }
  }

  const handleEdit = (item: DraftItem) => {
    const tabMap: Record<string, string> = {
      blog_post: 'blog',
      event: 'events',
      social_campaign: 'social',
      mailer_campaign: 'email',
    }
    onSwitchTab(tabMap[item.type])
  }

  return (
    <div>
      <h2 className="font-cormorant text-2xl font-light text-sea-white mb-6">Drafts &amp; Review</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Type filter */}
        {['all', 'blog_post', 'social_campaign', 'event', 'mailer_campaign'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-2 text-[0.65rem] font-dm tracking-[0.1em] uppercase rounded border cursor-pointer transition-all min-h-[44px] ${
              typeFilter === t
                ? 'bg-sea-gold/10 border-sea-gold/30 text-sea-gold'
                : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
            }`}
          >
            {t === 'all' ? 'All Types' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-6">
        {['all', 'draft', 'ready'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 text-[0.65rem] font-dm tracking-[0.1em] uppercase rounded border cursor-pointer transition-all min-h-[44px] ${
              statusFilter === s
                ? 'bg-sea-gold/10 border-sea-gold/30 text-sea-gold'
                : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
            }`}
          >
            {s === 'all' ? 'All Status' : s}
          </button>
        ))}
      </div>

      {/* Draft cards */}
      {loading ? (
        <p className="text-center py-8 text-sea-blue text-sm font-dm">Loading drafts...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-sea-blue text-sm font-dm">No drafts matching filters.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg overflow-hidden">
              {/* Card header */}
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full p-3 flex items-center gap-3 bg-transparent border-none cursor-pointer text-left min-h-[56px]"
              >
                {item.image_url && (
                  <img src={item.image_url} alt="" className="w-[80px] h-[80px] object-cover rounded flex-shrink-0" />
                )}
                <span className={`text-[0.55rem] font-dm px-2 py-0.5 rounded flex-shrink-0 ${TYPE_COLORS[item.type]}`}>
                  {TYPE_LABELS[item.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-sea-white font-dm truncate">{item.title}</p>
                  <p className="text-[0.6rem] text-sea-blue/50 font-dm mt-0.5">
                    {item.note_count > 0 && `${item.note_count} note${item.note_count > 1 ? 's' : ''} · `}
                    Updated {timeAgo(item.updated_at)}
                  </p>
                </div>
                <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded flex-shrink-0 ${
                  item.status === 'ready' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-sea-gold/10 text-sea-gold'
                }`}>
                  {item.status}
                </span>
              </button>

              {/* Expanded detail */}
              {expandedId === item.id && (
                <div className="border-t border-sea-gold/10 p-3 space-y-4">
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {item.status === 'draft' && (
                      <button
                        onClick={() => updateStatus(item, 'ready')}
                        disabled={updating === item.id}
                        className="px-4 min-h-[44px] bg-cyan-900/20 text-cyan-400 font-dm text-xs tracking-[0.1em] uppercase border border-cyan-500/30 rounded cursor-pointer hover:bg-cyan-900/30 transition-all disabled:opacity-50"
                      >
                        Mark Ready
                      </button>
                    )}
                    {item.status === 'ready' && (
                      <button
                        onClick={() => updateStatus(item, 'draft')}
                        disabled={updating === item.id}
                        className="px-4 min-h-[44px] bg-transparent text-sea-blue font-dm text-xs tracking-[0.1em] uppercase border border-sea-border rounded cursor-pointer hover:border-sea-gold transition-all disabled:opacity-50"
                      >
                        Back to Draft
                      </button>
                    )}
                    {item.status === 'ready' && isAdminOrAbove && (
                      <button
                        onClick={() => handlePublish(item)}
                        disabled={updating === item.id}
                        className="px-4 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.1em] uppercase border-none rounded cursor-pointer hover:bg-sea-gold-light transition-all disabled:opacity-50"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-4 min-h-[44px] bg-transparent text-sea-gold font-dm text-xs tracking-[0.1em] uppercase border border-sea-gold/20 rounded cursor-pointer hover:bg-sea-gold/10 transition-all"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Notes thread */}
                  <NotesThread entityType={item.type} entityId={item.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
