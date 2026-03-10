'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import NotesThread from './NotesThread'
import MediaPicker from './MediaPicker'

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DraftItem {
  id: string
  type: string
  title: string
  status: string
  updated_at: string
  note_count: number
  image_url: string | null
  content: Record<string, any>
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

const TAB_MAP: Record<string, string> = {
  blog_post: 'blog',
  event: 'events',
  social_campaign: 'social',
  mailer_campaign: 'newsletter',
}

const API_MAP: Record<string, string> = {
  blog_post: 'blog',
  event: 'events',
  social_campaign: 'social',
  mailer_campaign: 'mailers',
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

const inputCls = 'w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none'
const btnOutline = 'px-4 min-h-[44px] bg-transparent text-sea-gold font-dm text-xs tracking-[0.1em] uppercase border border-sea-gold/20 rounded cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50'
const btnCyan = 'px-4 min-h-[44px] bg-cyan-900/20 text-cyan-400 font-dm text-xs tracking-[0.1em] uppercase border border-cyan-500/30 rounded cursor-pointer hover:bg-cyan-900/30 transition-all disabled:opacity-50'
const btnGold = 'px-4 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.1em] uppercase border-none rounded cursor-pointer hover:bg-sea-gold-light transition-all disabled:opacity-50'

export default function DraftsTab({ isAdminOrAbove, onSwitchTab }: { isAdminOrAbove: boolean; onSwitchTab: (tab: string) => void }) {
  const searchParams = useSearchParams()
  const initialStatusFilter = searchParams.get('status') || 'all'

  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<string>('')

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
    try {
      const res = await fetch(`/api/${API_MAP[item.type]}`, {
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
    try {
      if (item.type === 'social_campaign') {
        const postRes = await fetch('/api/social/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ campaign_id: item.id }),
        })
        if (postRes.ok) { toast.success('Posted!'); await loadDrafts() }
        else toast.error('Post failed')
      } else if (item.type === 'mailer_campaign') {
        const sendRes = await fetch('/api/mailers/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ campaign_id: item.id }),
        })
        if (sendRes.ok) { toast.success('Email sent!'); await loadDrafts() }
        else toast.error('Send failed')
      } else {
        const publishRoutes: Record<string, string> = {
          blog_post: '/api/blog/publish',
          event: '/api/events/publish',
        }
        const route = publishRoutes[item.type]
        if (!route) return
        const res = await fetch(route, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: item.id, site: { action: 'now' }, social: { action: 'skip' }, mailer: { action: 'skip' } }),
        })
        if (res.ok) { toast.success('Published!'); await loadDrafts() }
        else toast.error('Publish failed')
      }
    } finally {
      setUpdating(null)
    }
  }

  const startEditing = (item: DraftItem) => {
    setEditingId(item.id)
    setEditFields({ ...item.content })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditFields({})
  }

  const saveEdits = async (item: DraftItem) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/${API_MAP[item.type]}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: item.id, ...editFields }),
      })
      if (res.ok) {
        toast.success('Saved!')
        setEditingId(null)
        setEditFields({})
        await loadDrafts()
      } else {
        toast.error('Save failed')
      }
    } finally {
      setSaving(false)
    }
  }

  const openPicker = (target: string) => {
    setPickerTarget(target)
    setShowPicker(true)
  }

  const handlePickerSelect = (urls: string[]) => {
    if (!urls.length) return
    if (pickerTarget === 'images') {
      setEditFields(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }))
    } else {
      setEditFields(prev => ({ ...prev, [pickerTarget]: urls[0] }))
    }
    setShowPicker(false)
  }

  const ef = (key: string) => editFields[key] || ''
  const setEf = (key: string, val: any) => setEditFields(prev => ({ ...prev, [key]: val }))

  // --- Inline editor renderers per type ---

  const renderBlogEditor = (item: DraftItem) => {
    const isEditing = editingId === item.id
    const c = isEditing ? editFields : item.content
    const images = (c.images || []) as string[]
    return (
      <div className="space-y-3">
        {/* Preview image */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((url: string, i: number) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="w-24 h-24 object-cover rounded" />
                {isEditing && (
                  <button onClick={() => setEf('images', images.filter((_: string, j: number) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center cursor-pointer">×</button>
                )}
              </div>
            ))}
          </div>
        )}
        {isEditing ? (
          <>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Title</label>
              <input value={ef('title')} onChange={e => setEf('title', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Excerpt</label>
              <textarea value={ef('excerpt')} onChange={e => setEf('excerpt', e.target.value)} rows={2} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Body</label>
              <textarea value={ef('body')} onChange={e => setEf('body', e.target.value)} rows={8} className={inputCls} />
            </div>
            <button onClick={() => openPicker('images')} className={btnOutline}>Add Images</button>
          </>
        ) : (
          <>
            {c.excerpt && <p className="text-sm text-sea-light/80 font-dm italic">{c.excerpt}</p>}
            {c.body && (
              <div className="text-sm text-sea-light font-dm leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {c.body.length > 500 ? c.body.slice(0, 500) + '...' : c.body}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const renderSocialEditor = (item: DraftItem) => {
    const isEditing = editingId === item.id
    const c = isEditing ? editFields : item.content
    return (
      <div className="space-y-3">
        {/* Social mockup preview */}
        {(c.image_url || c.facebook_caption) && !isEditing && (
          <div className="bg-white rounded-lg max-w-sm overflow-hidden shadow-lg">
            {c.image_url && <img src={c.image_url} alt="" className="w-full aspect-square object-cover" />}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#0a3d62] flex items-center justify-center text-white text-xs font-bold">SS</div>
                <span className="text-sm font-semibold text-gray-900">The Sea Star SF</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap line-clamp-4">{c.facebook_caption || c.instagram_caption}</p>
            </div>
          </div>
        )}
        {isEditing ? (
          <>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Facebook Caption</label>
              <textarea value={ef('facebook_caption')} onChange={e => setEf('facebook_caption', e.target.value)} rows={3} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Instagram Caption</label>
              <textarea value={ef('instagram_caption')} onChange={e => setEf('instagram_caption', e.target.value)} rows={3} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Image</label>
              {c.image_url && <img src={c.image_url} alt="" className="w-24 h-24 object-cover rounded mb-2" />}
              <button onClick={() => openPicker('image_url')} className={btnOutline}>{c.image_url ? 'Change Image' : 'Add Image'}</button>
            </div>
          </>
        ) : (
          <>
            {c.instagram_caption && c.facebook_caption && c.instagram_caption !== c.facebook_caption && (
              <div>
                <p className="text-[0.65rem] text-sea-blue/60 font-dm uppercase tracking-wider mb-1">Instagram</p>
                <p className="text-sm text-sea-light font-dm leading-relaxed whitespace-pre-wrap">{c.instagram_caption}</p>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const renderEventEditor = (item: DraftItem) => {
    const isEditing = editingId === item.id
    const c = isEditing ? editFields : item.content
    return (
      <div className="space-y-3">
        {c.featured_image && (
          <div className="relative">
            <img src={c.featured_image} alt="" className="w-full max-w-sm rounded" />
            {isEditing && (
              <button onClick={() => setEf('featured_image', null)} className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center cursor-pointer">×</button>
            )}
          </div>
        )}
        {isEditing ? (
          <>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Title</label>
              <input value={ef('title')} onChange={e => setEf('title', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Short Description</label>
              <textarea value={ef('short_description')} onChange={e => setEf('short_description', e.target.value)} rows={2} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Full Description (HTML)</label>
              <textarea value={ef('description_html')} onChange={e => setEf('description_html', e.target.value)} rows={5} className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Starts</label>
                <input type="datetime-local" value={(ef('starts_at') || '').slice(0, 16)} onChange={e => setEf('starts_at', e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Ends</label>
                <input type="datetime-local" value={(ef('ends_at') || '').slice(0, 16)} onChange={e => setEf('ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputCls} />
              </div>
            </div>
            <button onClick={() => openPicker('featured_image')} className={btnOutline}>{c.featured_image ? 'Change Image' : 'Add Image'}</button>
          </>
        ) : (
          <>
            {c.short_description && <p className="text-sm text-sea-light/80 font-dm">{c.short_description}</p>}
            {c.starts_at && (
              <p className="text-xs text-sea-blue font-dm">
                {new Date(c.starts_at).toLocaleString()}{c.ends_at ? ` — ${new Date(c.ends_at).toLocaleString()}` : ''}
              </p>
            )}
            {c.description_html && (
              <div className="text-sm text-sea-light font-dm leading-relaxed max-h-32 overflow-y-auto" dangerouslySetInnerHTML={{ __html: c.description_html }} />
            )}
          </>
        )}
      </div>
    )
  }

  const renderMailerEditor = (item: DraftItem) => {
    const isEditing = editingId === item.id
    const c = isEditing ? editFields : item.content
    return (
      <div className="space-y-3">
        {c.hero_image && (
          <div className="relative">
            <img src={c.hero_image} alt="" className="w-full max-w-sm rounded" />
            {isEditing && (
              <button onClick={() => setEf('hero_image', null)} className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center cursor-pointer">×</button>
            )}
          </div>
        )}
        {isEditing ? (
          <>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Subject</label>
              <input value={ef('subject')} onChange={e => setEf('subject', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Body (HTML)</label>
              <textarea value={ef('body_html')} onChange={e => setEf('body_html', e.target.value)} rows={8} className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">CTA URL</label>
                <input value={ef('cta_url')} onChange={e => setEf('cta_url', e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">CTA Text</label>
                <input value={ef('cta_text')} onChange={e => setEf('cta_text', e.target.value)} placeholder="Learn More" className={inputCls} />
              </div>
            </div>
            <button onClick={() => openPicker('hero_image')} className={btnOutline}>{c.hero_image ? 'Change Image' : 'Add Hero Image'}</button>
          </>
        ) : (
          <>
            {c.subject && <p className="text-sm text-sea-white font-dm font-medium">{c.subject}</p>}
            {c.body_html && (
              <div className="bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: c.body_html }} />
              </div>
            )}
            {c.cta_url && (
              <p className="text-xs text-sea-blue font-dm">CTA: {c.cta_text || c.cta_url}</p>
            )}
            {c.target_tags?.length > 0 && (
              <p className="text-xs text-sea-blue/60 font-dm">Tags: {c.target_tags.join(', ')}</p>
            )}
          </>
        )}
      </div>
    )
  }

  const renderEditor = (item: DraftItem) => {
    switch (item.type) {
      case 'blog_post': return renderBlogEditor(item)
      case 'social_campaign': return renderSocialEditor(item)
      case 'event': return renderEventEditor(item)
      case 'mailer_campaign': return renderMailerEditor(item)
      default: return null
    }
  }

  return (
    <div>
      <h2 className="font-cormorant text-2xl font-light text-sea-white mb-6">Drafts &amp; Review</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
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
                onClick={() => { setExpandedId(expandedId === item.id ? null : item.id); if (editingId === item.id) cancelEditing() }}
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
                  {/* Inline content preview / editor */}
                  {renderEditor(item)}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {editingId === item.id ? (
                      <>
                        <button onClick={() => saveEdits(item)} disabled={saving} className={btnGold}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={cancelEditing} disabled={saving} className={btnOutline}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditing(item)} className={btnOutline}>Edit</button>
                        {item.status === 'draft' && (
                          <button onClick={() => updateStatus(item, 'ready')} disabled={updating === item.id} className={btnCyan}>
                            Mark Ready
                          </button>
                        )}
                        {item.status === 'ready' && (
                          <button onClick={() => updateStatus(item, 'draft')} disabled={updating === item.id} className={btnOutline}>
                            Back to Draft
                          </button>
                        )}
                        {item.status === 'ready' && isAdminOrAbove && (
                          <button onClick={() => handlePublish(item)} disabled={updating === item.id} className={btnGold}>
                            {item.type === 'mailer_campaign' ? 'Send' : item.type === 'social_campaign' ? 'Post' : 'Publish'}
                          </button>
                        )}
                        <button
                          onClick={() => onSwitchTab(TAB_MAP[item.type])}
                          className="px-4 min-h-[44px] text-sea-blue/50 font-dm text-[0.6rem] tracking-[0.1em] uppercase cursor-pointer hover:text-sea-blue transition-all bg-transparent border-none"
                        >
                          Open in {TYPE_LABELS[item.type]} Tab
                        </button>
                      </>
                    )}
                  </div>

                  {/* Notes thread */}
                  <NotesThread entityType={item.type} entityId={item.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Shared MediaPicker */}
      <MediaPicker
        isOpen={showPicker}
        mode={pickerTarget === 'images' ? 'multiple' : 'single'}
        onSelect={handlePickerSelect}
        onClose={() => setShowPicker(false)}
      />
    </div>
  )
}
