'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface PageSeoRow {
  id: string; page_path: string; meta_title: string; meta_description: string
  og_title: string; og_description: string; og_image: string; focus_keyword: string
}

export default function SeoTab() {
  const [pages, setPages] = useState<PageSeoRow[]>([])
  const [editingPath, setEditingPath] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<PageSeoRow>>({})
  const [topicInput, setTopicInput] = useState('')
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])
  const [topicMatchWeak, setTopicMatchWeak] = useState(false)
  const [loading, setLoading] = useState(false)
  const [primaryKeywords, setPrimaryKeywords] = useState<string[]>([])
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [savingKeywords, setSavingKeywords] = useState(false)

  const loadKeywords = async () => {
    try {
      const res = await fetch('/api/admin/settings', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data)) return
      const get = (key: string) => data.find((s: { key: string; value: string }) => s.key === key)?.value || ''

      // Fallback: primary = seo_keywords_primary || seo_keywords || blog_keywords
      const primaryRaw = get('seo_keywords_primary') || get('seo_keywords') || get('blog_keywords')
      const secondaryRaw = get('seo_keywords_secondary')
      setPrimaryKeywords(primaryRaw ? primaryRaw.split(',').map((k: string) => k.trim()).filter(Boolean) : [])
      setSecondaryKeywords(secondaryRaw ? secondaryRaw.split(',').map((k: string) => k.trim()).filter(Boolean) : [])
    } catch { /* ignore */ }
  }

  const saveKeywords = async (tier: 'primary' | 'secondary', kws: string[]) => {
    setSavingKeywords(true)
    const key = tier === 'primary' ? 'seo_keywords_primary' : 'seo_keywords_secondary'
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, value: kws.join(', ') }),
      })
      if (res.ok) {
        if (tier === 'primary') setPrimaryKeywords(kws)
        else setSecondaryKeywords(kws)
        toast.success('Keywords saved')
      } else {
        toast.error('Failed to save keywords')
      }
    } finally {
      setSavingKeywords(false)
    }
  }

  const allKeywords = [...primaryKeywords, ...secondaryKeywords]

  const addKeyword = (kw: string, tier: 'primary' | 'secondary' = 'secondary') => {
    const trimmed = kw.trim().toLowerCase()
    if (!trimmed || allKeywords.some(k => k.toLowerCase() === trimmed)) return
    if (tier === 'primary') {
      saveKeywords('primary', [...primaryKeywords, trimmed].sort())
    } else {
      saveKeywords('secondary', [...secondaryKeywords, trimmed].sort())
    }
  }

  const removeKeyword = (kw: string, tier: 'primary' | 'secondary') => {
    if (tier === 'primary') {
      saveKeywords('primary', primaryKeywords.filter(k => k !== kw))
    } else {
      saveKeywords('secondary', secondaryKeywords.filter(k => k !== kw))
    }
  }

  const promoteKeyword = (kw: string) => {
    // Move from secondary to primary
    const newSecondary = secondaryKeywords.filter(k => k !== kw)
    const newPrimary = [...primaryKeywords, kw].sort()
    saveKeywords('secondary', newSecondary)
    saveKeywords('primary', newPrimary)
  }

  const demoteKeyword = (kw: string) => {
    // Move from primary to secondary
    const newPrimary = primaryKeywords.filter(k => k !== kw)
    const newSecondary = [...secondaryKeywords, kw].sort()
    saveKeywords('primary', newPrimary)
    saveKeywords('secondary', newSecondary)
  }

  const loadPages = async () => {
    const res = await fetch('/api/seo', { credentials: 'include' })
    const data = await res.json()
    if (Array.isArray(data)) setPages(data)
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
    setTopicMatchWeak(false)
    try {
      const res = await fetch('/api/seo/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'keywords', context: topicInput }),
      })
      const data = await res.json()
      if (data.keywords) {
        setSuggestedKeywords(data.keywords)
        if (data.topic_match === false) setTopicMatchWeak(true)
      }
    } catch {
      toast.error('Suggestion failed')
    } finally {
      setLoading(false)
    }
  }

  const KeywordPill = ({ kw, tier }: { kw: string; tier: 'primary' | 'secondary' }) => (
    <span className={`inline-flex items-center gap-1 text-xs font-dm px-3 py-1.5 rounded-full border ${
      tier === 'primary'
        ? 'bg-sea-gold/15 text-sea-gold border-sea-gold/25'
        : 'bg-sea-gold/5 text-sea-blue border-sea-gold/10'
    }`}>
      {kw}
      <button
        onClick={() => tier === 'primary' ? demoteKeyword(kw) : promoteKeyword(kw)}
        disabled={savingKeywords}
        title={tier === 'primary' ? 'Demote to secondary' : 'Promote to primary'}
        className="w-4 h-4 flex items-center justify-center rounded-full bg-transparent text-sea-blue hover:text-sea-gold transition-colors cursor-pointer text-[0.6rem] leading-none border-none"
      >{tier === 'primary' ? '↓' : '↑'}</button>
      <button
        onClick={() => removeKeyword(kw, tier)}
        disabled={savingKeywords}
        className="w-4 h-4 flex items-center justify-center rounded-full bg-sea-gold/20 text-sea-gold hover:bg-red-600 hover:text-white transition-colors cursor-pointer text-[0.6rem] leading-none border-none"
      >×</button>
    </span>
  )

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

      {/* Primary Keywords */}
      <div className="mb-6">
        <h3 className="font-cormorant text-lg text-sea-white mb-3">Primary Keywords</h3>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
          <p className="text-xs text-sea-blue font-dm mb-3">
            Core identity — always included in AI-generated content.
          </p>
          {primaryKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {primaryKeywords.map((kw) => <KeywordPill key={kw} kw={kw} tier="primary" />)}
            </div>
          ) : (
            <p className="text-xs text-sea-blue/50 font-dm mb-3 italic">No primary keywords yet.</p>
          )}
        </div>
      </div>

      {/* Secondary Keywords */}
      <div className="mb-6">
        <h3 className="font-cormorant text-lg text-sea-white mb-3">Secondary Keywords</h3>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
          <p className="text-xs text-sea-blue font-dm mb-3">
            Topical themes — woven in when relevant. Suggestions and imports land here.
          </p>
          {secondaryKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {secondaryKeywords.map((kw) => <KeywordPill key={kw} kw={kw} tier="secondary" />)}
            </div>
          ) : (
            <p className="text-xs text-sea-blue/50 font-dm mb-3 italic">No secondary keywords yet.</p>
          )}

          {/* Add keyword */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { addKeyword(newKeyword); setNewKeyword('') } }}
              placeholder="Add a keyword..."
              className="flex-1 px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold placeholder:text-sea-border min-h-[44px]"
            />
            <button
              onClick={() => { addKeyword(newKeyword); setNewKeyword('') }}
              disabled={!newKeyword.trim() || savingKeywords}
              className="px-4 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all disabled:opacity-50"
            >Add</button>
          </div>

          {/* Suggest keywords */}
          <div className="border-t border-sea-gold/10 pt-3">
            <div className="flex gap-2 items-center mb-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Topic for suggestions (e.g. Warriors Basketball)..."
                className="flex-1 px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold placeholder:text-sea-border min-h-[44px]"
              />
              <button onClick={handleSuggestKeywords} disabled={loading} className="px-4 min-h-[44px] bg-transparent text-sea-gold font-dm text-xs tracking-[0.15em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50 flex-shrink-0">
                {loading ? 'Thinking...' : 'Suggest'}
              </button>
            </div>
            {topicMatchWeak && (
              <p className="text-xs text-amber-400 font-dm mt-2 bg-amber-900/20 border border-amber-500/20 rounded px-3 py-2">
                Suggestions may not match your topic. Try more specific terms.
              </p>
            )}
            {suggestedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedKeywords.map((kw, i) => {
                  const alreadyAdded = allKeywords.some(k => k.toLowerCase() === kw.toLowerCase())
                  return (
                    <button
                      key={i}
                      onClick={() => { if (!alreadyAdded) addKeyword(kw, 'secondary') }}
                      disabled={alreadyAdded || savingKeywords}
                      className={`inline-flex items-center gap-1 text-xs font-dm px-3 py-1.5 rounded-full border transition-all min-h-[36px] ${
                        alreadyAdded
                          ? 'bg-green-900/20 border-green-500/20 text-green-400/60 cursor-default'
                          : 'bg-sea-gold/5 border-sea-gold/20 text-sea-gold cursor-pointer hover:bg-sea-gold/15'
                      }`}
                    >
                      {alreadyAdded ? '✓' : '+'} {kw}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
