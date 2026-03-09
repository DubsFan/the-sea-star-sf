'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface PageSeoRow {
  id: string; page_path: string; meta_title: string; meta_description: string
  og_title: string; og_description: string; og_image: string; focus_keyword: string
}

interface ContentIdea {
  title: string; description: string; target_keyword: string
}

export default function SeoPage() {
  const [pages, setPages] = useState<PageSeoRow[]>([])
  const [editingPath, setEditingPath] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<PageSeoRow>>({})
  const [keywords, setKeywords] = useState('')
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(false)

  const loadPages = async () => {
    const res = await fetch('/api/seo')
    const data = await res.json()
    if (Array.isArray(data)) setPages(data)
  }

  // Load keywords from settings
  const loadKeywords = async () => {
    const res = await fetch('/api/admin/stats')
    if (res.ok) {
      // Just load from site_settings directly
    }
  }

  useEffect(() => { loadPages(); loadKeywords() }, [])

  const handleEdit = (page: PageSeoRow) => {
    setEditingPath(page.page_path)
    setForm({ ...page })
  }

  const handleSave = async () => {
    const res = await fetch('/api/seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('SEO updated')
      setEditingPath(null)
      loadPages()
    } else {
      toast.error('Save failed')
    }
  }

  const handleSuggestKeywords = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seo/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'keywords', context: keywords }),
      })
      const data = await res.json()
      if (data.keywords) setSuggestedKeywords(data.keywords)
    } catch {
      toast.error('Suggestion failed')
    } finally {
      setLoading(false)
    }
  }

  const handleContentIdeas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seo/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'content_ideas', context: keywords }),
      })
      const data = await res.json()
      if (data.ideas) setContentIdeas(data.ideas)
    } catch {
      toast.error('Suggestion failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-cormorant text-3xl font-light text-sea-white mb-8">SEO Controls</h1>

      {/* Page-Level SEO */}
      <div className="mb-8">
        <h2 className="font-cormorant text-lg text-sea-white mb-3">Page Metadata</h2>
        <div className="space-y-3">
          {pages.map((page) => (
            <div key={page.page_path} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
              {editingPath === page.page_path ? (
                <div className="space-y-3">
                  <p className="text-xs text-sea-gold font-dm font-medium">{page.page_path}</p>
                  <div>
                    <label className="block text-xs text-sea-blue mb-1 font-dm">Meta Title</label>
                    <input type="text" value={form.meta_title || ''} onChange={(e) => setForm(f => ({ ...f, meta_title: e.target.value }))} className="w-full px-3 py-2 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
                  </div>
                  <div>
                    <label className="block text-xs text-sea-blue mb-1 font-dm">Meta Description</label>
                    <textarea value={form.meta_description || ''} onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none" />
                    <p className="text-[0.6rem] text-sea-blue/50 font-dm mt-1">{(form.meta_description || '').length}/160</p>
                  </div>
                  <div>
                    <label className="block text-xs text-sea-blue mb-1 font-dm">Focus Keyword</label>
                    <input type="text" value={form.focus_keyword || ''} onChange={(e) => setForm(f => ({ ...f, focus_keyword: e.target.value }))} className="w-full px-3 py-2 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="px-4 py-2 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all">Save</button>
                    <button onClick={() => setEditingPath(null)} className="px-4 py-2 bg-transparent text-sea-blue font-dm text-xs tracking-[0.15em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold transition-all">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-sea-gold font-dm font-medium mb-1">{page.page_path}</p>
                    <p className="text-sm text-sea-light font-dm truncate">{page.meta_title}</p>
                    <p className="text-xs text-sea-blue font-dm mt-1 line-clamp-2">{page.meta_description}</p>
                  </div>
                  <button onClick={() => handleEdit(page)} className="text-xs text-sea-blue hover:text-sea-gold bg-transparent border-none cursor-pointer font-dm flex-shrink-0">Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Keyword Strategy */}
      <div className="mb-8">
        <h2 className="font-cormorant text-lg text-sea-white mb-3">Keyword Strategy</h2>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
          <label className="block text-xs text-sea-blue mb-1 font-dm">Current Keywords</label>
          <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="craft cocktails, dogpatch bar, sf nightlife..." className="w-full px-3 py-2 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold mb-3 placeholder:text-sea-border" />
          <button onClick={handleSuggestKeywords} disabled={loading} className="px-4 py-2 bg-transparent text-sea-gold font-dm text-xs tracking-[0.15em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50">
            {loading ? 'Thinking...' : 'Suggest Keywords'}
          </button>
          {suggestedKeywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedKeywords.map((kw, i) => (
                <span key={i} className="text-xs font-dm px-2 py-1 rounded bg-sea-gold/10 text-sea-gold">{kw}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Ideas */}
      <div className="mb-8">
        <h2 className="font-cormorant text-lg text-sea-white mb-3">Content Ideas</h2>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
          <button onClick={handleContentIdeas} disabled={loading} className="px-4 py-2 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all disabled:opacity-50">
            {loading ? 'Thinking...' : 'Give Me 5 Blog Ideas'}
          </button>
          {contentIdeas.length > 0 && (
            <div className="mt-4 space-y-3">
              {contentIdeas.map((idea, i) => (
                <div key={i} className="border border-sea-gold/10 rounded p-3">
                  <p className="text-sm text-sea-white font-dm">{idea.title}</p>
                  <p className="text-xs text-sea-blue font-dm mt-1">{idea.description}</p>
                  <p className="text-[0.6rem] text-sea-gold/60 font-dm mt-1">Target: {idea.target_keyword}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
