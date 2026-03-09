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

interface FaqItem {
  id: string
  question: string
  answer: string
  category: string
  is_public: boolean
  show_on_homepage: boolean
  sort_order: number
  status: string
}

interface LibraryItem {
  primary_keyword: string | null
}

export default function SeoTab() {
  const [pages, setPages] = useState<PageSeoRow[]>([])
  const [editingPath, setEditingPath] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<PageSeoRow>>({})
  const [keywords, setKeywords] = useState('')
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [faqLoading, setFaqLoading] = useState(false)
  const [packKeywords, setPackKeywords] = useState<string[]>([])

  const loadFaqs = async () => {
    setFaqLoading(true)
    try {
      const res = await fetch('/api/content-library?asset_type=faq', { credentials: 'include' })
      const data = await res.json()
      if (Array.isArray(data)) setFaqs(data)
    } catch {
      toast.error('Failed to load FAQs')
    } finally {
      setFaqLoading(false)
    }
  }

  const loadPackKeywords = async () => {
    try {
      const res = await fetch('/api/content-library', { credentials: 'include' })
      const data = await res.json()
      if (Array.isArray(data)) {
        const kws = Array.from(new Set(
          data
            .map((item: LibraryItem) => item.primary_keyword)
            .filter((kw: string | null): kw is string => !!kw)
        )) as string[]
        setPackKeywords(kws.sort())
      }
    } catch {
      /* silently ignore */
    }
  }

  const patchFaq = async (id: string, updates: Partial<FaqItem>) => {
    try {
      const res = await fetch(`/api/content-library/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        setFaqs(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
        toast.success('FAQ updated')
      } else {
        toast.error('Update failed')
      }
    } catch {
      toast.error('Update failed')
    }
  }

  const loadPages = async () => {
    const res = await fetch('/api/seo', { credentials: 'include' })
    const data = await res.json()
    if (Array.isArray(data)) setPages(data)
  }

  useEffect(() => { loadPages(); loadFaqs(); loadPackKeywords() }, [])

  const handleEdit = (page: PageSeoRow) => {
    setEditingPath(page.page_path)
    setForm({ ...page })
  }

  const handleSave = async () => {
    const res = await fetch('/api/seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
    <div>
      {/* Page-Level SEO */}
      <div className="mb-8">
        <h3 className="font-cormorant text-lg text-sea-white mb-3">Page Metadata</h3>
        <div className="space-y-3">
          {pages.map((page) => (
            <div key={page.page_path} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
              {editingPath === page.page_path ? (
                <div className="space-y-3">
                  <p className="text-xs text-sea-gold font-dm font-medium">{page.page_path}</p>
                  <div>
                    <label className="block text-xs text-sea-blue mb-1 font-dm">Meta Title</label>
                    <input type="text" value={form.meta_title || ''} onChange={(e) => setForm(f => ({ ...f, meta_title: e.target.value }))} className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold min-h-[44px]" />
                  </div>
                  <div>
                    <label className="block text-xs text-sea-blue mb-1 font-dm">Meta Description</label>
                    <textarea value={form.meta_description || ''} onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none" />
                    <p className="text-[0.6rem] text-sea-blue/50 font-dm mt-1">{(form.meta_description || '').length}/160</p>
                  </div>
                  <div>
                    <label className="block text-xs text-sea-blue mb-1 font-dm">Focus Keyword</label>
                    <input type="text" value={form.focus_keyword || ''} onChange={(e) => setForm(f => ({ ...f, focus_keyword: e.target.value }))} className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold min-h-[44px]" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="px-5 py-2.5 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all">Save</button>
                    <button onClick={() => setEditingPath(null)} className="px-5 py-2.5 min-h-[44px] bg-transparent text-sea-blue font-dm text-xs tracking-[0.15em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold transition-all">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-sea-gold font-dm font-medium mb-1">{page.page_path}</p>
                    <p className="text-sm text-sea-light font-dm truncate">{page.meta_title}</p>
                    <p className="text-xs text-sea-blue font-dm mt-1 line-clamp-2">{page.meta_description}</p>
                  </div>
                  <button onClick={() => handleEdit(page)} className="text-xs text-sea-blue hover:text-sea-gold bg-transparent border border-sea-gold/10 rounded px-3 py-2 min-h-[44px] cursor-pointer font-dm flex-shrink-0 transition-colors">Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Keyword Strategy */}
      <div className="mb-8">
        <h3 className="font-cormorant text-lg text-sea-white mb-3">Keyword Strategy</h3>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
          <label className="block text-xs text-sea-blue mb-1 font-dm">Current Keywords</label>
          <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="craft cocktails, dogpatch bar, sf nightlife..." className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold mb-3 placeholder:text-sea-border min-h-[44px]" />
          <button onClick={handleSuggestKeywords} disabled={loading} className="px-5 py-2.5 min-h-[44px] bg-transparent text-sea-gold font-dm text-xs tracking-[0.15em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50">
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
        <h3 className="font-cormorant text-lg text-sea-white mb-3">Content Ideas</h3>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
          <button onClick={handleContentIdeas} disabled={loading} className="px-5 py-2.5 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all disabled:opacity-50">
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

      {/* FAQ Manager */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-cormorant text-lg text-sea-white">FAQ Manager</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-sea-blue font-dm">
              {faqs.filter(f => f.is_public).length} public / {faqs.length} total
            </span>
            <a
              href="/faq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sea-gold font-dm hover:underline min-h-[44px] flex items-center"
            >
              Preview /faq →
            </a>
          </div>
        </div>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
          {faqLoading ? (
            <p className="text-xs text-sea-blue font-dm">Loading FAQs...</p>
          ) : faqs.length === 0 ? (
            <p className="text-xs text-sea-blue font-dm">No FAQ items found. Create FAQs via the Content Library API.</p>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="border border-sea-gold/10 rounded p-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-sea-white font-dm font-medium">{faq.question}</p>
                      <p className="text-xs text-sea-blue font-dm mt-1 line-clamp-2">{faq.answer}</p>
                      {faq.category && (
                        <span className="inline-block text-[0.6rem] text-sea-gold/60 font-dm mt-1 px-2 py-0.5 rounded bg-sea-gold/5 border border-sea-gold/10">
                          {faq.category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                        <span className="text-[0.6rem] text-sea-blue font-dm uppercase tracking-wider">Public</span>
                        <input
                          type="checkbox"
                          checked={faq.is_public}
                          onChange={() => patchFaq(faq.id, { is_public: !faq.is_public })}
                          className="w-5 h-5 accent-[#c9a959] cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                        <span className="text-[0.6rem] text-sea-blue font-dm uppercase tracking-wider">Homepage</span>
                        <input
                          type="checkbox"
                          checked={faq.show_on_homepage}
                          onChange={() => patchFaq(faq.id, { show_on_homepage: !faq.show_on_homepage })}
                          className="w-5 h-5 accent-[#c9a959] cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-sea-gold/5">
                    <span className="text-[0.6rem] text-sea-blue font-dm uppercase tracking-wider">Order</span>
                    <input
                      type="number"
                      value={faq.sort_order}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val)) {
                          setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, sort_order: val } : f))
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val)) patchFaq(faq.id, { sort_order: val })
                      }}
                      className="w-16 px-2 py-1.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-xs outline-none focus:border-sea-gold text-center min-h-[44px]"
                    />
                    <span className="text-[0.6rem] font-dm ml-auto" style={{ color: faq.status === 'published' ? '#c9a959' : '#5a6a8a' }}>
                      {faq.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Pack Keywords */}
      <div className="mb-8">
        <h3 className="font-cormorant text-lg text-sea-white mb-3">Content Pack Keywords</h3>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
          {packKeywords.length === 0 ? (
            <p className="text-xs text-sea-blue font-dm">No keywords found in the content library.</p>
          ) : (
            <>
              <p className="text-xs text-sea-blue font-dm mb-3">
                {packKeywords.length} unique keyword{packKeywords.length !== 1 ? 's' : ''} across all library items
              </p>
              <div className="flex flex-wrap gap-2">
                {packKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs font-dm px-3 py-1.5 rounded-full bg-sea-gold/10 text-sea-gold border border-sea-gold/15 hover:bg-sea-gold/20 transition-colors"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
