'use client'

import { useEffect, useState, useCallback } from 'react'
import { renderDigestHtml, type DigestItem } from '@/lib/digest-template'

interface DigestBuilderProps {
  onDigestReady: (data: { subject: string; bodyHtml: string; items: DigestItem[] }) => void
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function DigestBuilder({ onDigestReady }: DigestBuilderProps) {
  const [blogs, setBlogs] = useState<Array<{ id: string; title: string; excerpt: string; slug: string; images?: string[]; featured_image?: string; created_at: string }>>([])
  const [events, setEvents] = useState<Array<{ id: string; title: string; short_description: string; slug: string; featured_image?: string; starts_at: string }>>([])
  const [selected, setSelected] = useState<DigestItem[]>([])
  const [intro, setIntro] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

  const now = new Date()
  const monthName = MONTHS[now.getMonth()]
  const year = now.getFullYear()
  const sinceDate = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const loadContent = useCallback(async () => {
    setLoading(true)
    try {
      const [blogRes, eventRes] = await Promise.all([
        fetch(`/api/blog?status=published&since=${sinceDate}`, { credentials: 'include' }),
        fetch(`/api/events?status=published&since=${sinceDate}`, { credentials: 'include' }),
      ])
      const blogData = blogRes.ok ? await blogRes.json() : []
      const eventData = eventRes.ok ? await eventRes.json() : []
      setBlogs(Array.isArray(blogData) ? blogData : [])
      setEvents(Array.isArray(eventData) ? eventData : [])

      // Auto-select all items
      const autoItems: DigestItem[] = [
        ...(Array.isArray(blogData) ? blogData : []).map((b: { title: string; excerpt?: string; featured_image?: string; images?: string[]; slug: string; created_at: string }) => ({
          title: b.title,
          excerpt: b.excerpt || '',
          image_url: b.featured_image || (b.images && b.images[0]) || undefined,
          url: `https://theseastarsf.com/blog/${b.slug}`,
          type: 'blog' as const,
          date: new Date(b.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        })),
        ...(Array.isArray(eventData) ? eventData : []).map((e: { title: string; short_description?: string; featured_image?: string; slug: string; starts_at: string }) => ({
          title: e.title,
          excerpt: e.short_description || '',
          image_url: e.featured_image || undefined,
          url: `https://theseastarsf.com/?event=${e.slug}#events`,
          type: 'event' as const,
          date: new Date(e.starts_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        })),
      ]
      setSelected(autoItems)
    } finally {
      setLoading(false)
    }
  }, [sinceDate])

  useEffect(() => { loadContent() }, [loadContent])

  useEffect(() => {
    if (!subject) setSubject(`The Sea Star Monthly \u2014 ${monthName} ${year}`)
  }, [monthName, year, subject])

  // Notify parent whenever digest data changes
  useEffect(() => {
    if (selected.length > 0 && subject) {
      const html = renderDigestHtml({ subject, intro, items: selected })
      onDigestReady({ subject, bodyHtml: html, items: selected })
    }
  }, [selected, subject, intro, onDigestReady])

  const toggleItem = (item: DigestItem) => {
    setSelected(prev => {
      const exists = prev.find(s => s.title === item.title && s.type === item.type)
      if (exists) return prev.filter(s => !(s.title === item.title && s.type === item.type))
      return [...prev, item]
    })
  }

  const isSelected = (title: string, type: string) => selected.some(s => s.title === title && s.type === type)

  const moveItem = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= selected.length) return
    const copy = [...selected]
    const temp = copy[index]
    copy[index] = copy[newIndex]
    copy[newIndex] = temp
    setSelected(copy)
  }

  const handlePreview = () => {
    const html = renderDigestHtml({ subject, intro, items: selected })
    setPreviewHtml(html)
  }

  if (loading) {
    return <p className="text-xs text-sea-gold font-dm py-4">Loading this month&apos;s content...</p>
  }

  const allItems: DigestItem[] = [
    ...blogs.map(b => ({
      title: b.title,
      excerpt: b.excerpt || '',
      image_url: b.featured_image || (b.images && b.images[0]) || undefined,
      url: `https://theseastarsf.com/blog/${b.slug}`,
      type: 'blog' as const,
      date: new Date(b.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    })),
    ...events.map(e => ({
      title: e.title,
      excerpt: e.short_description || '',
      image_url: e.featured_image || undefined,
      url: `https://theseastarsf.com/?event=${e.slug}#events`,
      type: 'event' as const,
      date: new Date(e.starts_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    })),
  ]

  return (
    <div className="space-y-4">
      {/* Subject */}
      <div>
        <label className="block text-xs text-sea-blue mb-1 font-dm">Subject Line</label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded min-h-[44px]"
        />
      </div>

      {/* Intro */}
      <div>
        <label className="block text-xs text-sea-blue mb-1 font-dm">Intro Message</label>
        <textarea
          value={intro}
          onChange={e => setIntro(e.target.value)}
          rows={3}
          placeholder="Hey neighbors! Here's what's been happening at The Sea Star this month..."
          className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded resize-y"
        />
      </div>

      {/* Content Picker */}
      <div>
        <label className="block text-xs text-sea-blue mb-2 font-dm tracking-[0.1em] uppercase">
          {monthName} Content ({selected.length} selected)
        </label>
        {allItems.length === 0 ? (
          <p className="text-xs text-sea-blue/60 font-dm py-2">No published content this month yet.</p>
        ) : (
          <div className="space-y-1">
            {allItems.map((item) => (
              <button
                key={`${item.type}-${item.title}`}
                onClick={() => toggleItem(item)}
                className={`w-full p-2 flex items-center gap-3 border-none cursor-pointer text-left rounded transition-all min-h-[52px] ${
                  isSelected(item.title, item.type)
                    ? 'bg-sea-gold/10 ring-1 ring-sea-gold/30'
                    : 'bg-transparent hover:bg-sea-gold/5'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${
                  isSelected(item.title, item.type) ? 'bg-sea-gold/20 border-sea-gold/40' : 'border-sea-gold/20'
                }`}>
                  {isSelected(item.title, item.type) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c9a54e" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
                  )}
                </div>
                {item.image_url && <img src={item.image_url} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-sea-light font-dm truncate">{item.title}</p>
                  <p className="text-[0.65rem] text-sea-blue/60 font-dm">{item.type} &middot; {item.date}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Order */}
      {selected.length > 1 && (
        <div>
          <label className="block text-xs text-sea-blue mb-2 font-dm tracking-[0.1em] uppercase">Order in Email</label>
          <div className="space-y-1">
            {selected.map((item, i) => (
              <div key={`order-${item.type}-${item.title}`} className="flex items-center gap-2 bg-[#0a0e18] border border-sea-gold/10 rounded p-2 min-h-[44px]">
                <span className="text-xs text-sea-blue/40 font-dm w-5 text-center flex-shrink-0">{i + 1}</span>
                <span className="text-sm text-sea-light font-dm flex-1 truncate">{item.title}</span>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveItem(i, -1)}
                    disabled={i === 0}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border border-sea-gold/10 text-sea-blue rounded cursor-pointer disabled:opacity-30 hover:border-sea-gold/30 transition-all"
                  >
                    &uarr;
                  </button>
                  <button
                    onClick={() => moveItem(i, 1)}
                    disabled={i === selected.length - 1}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border border-sea-gold/10 text-sea-blue rounded cursor-pointer disabled:opacity-30 hover:border-sea-gold/30 transition-all"
                  >
                    &darr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Button */}
      {selected.length > 0 && (
        <button
          onClick={handlePreview}
          className="w-full sm:w-auto px-6 py-3 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all min-h-[44px] rounded"
        >
          Preview Digest
        </button>
      )}

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 bg-[#06080d]/95 backdrop-blur-xl z-[200] overflow-y-auto p-4 md:p-16">
          <button
            className="fixed top-4 right-4 bg-transparent border border-sea-border text-sea-gold text-xl w-10 h-10 flex items-center justify-center cursor-pointer hover:border-sea-gold transition-all z-[201] rounded"
            onClick={() => setPreviewHtml(null)}
          >
            &times;
          </button>
          <div className="max-w-[600px] mx-auto mt-12">
            <h3 className="font-cormorant text-xl text-sea-white mb-4">Digest Preview</h3>
            <div className="bg-white rounded-lg overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                className="w-full min-h-[600px] border-none"
                title="Digest Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
