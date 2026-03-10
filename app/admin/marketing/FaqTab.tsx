'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface FaqItem {
  id: string
  question: string
  answer: string
  category: string | null
  is_public: boolean
  show_on_homepage: boolean
  sort_order: number
  status: string
  metadata: Record<string, unknown> | null
}

export default function FaqTab({ isAdminOrAbove }: { isAdminOrAbove: boolean }) {
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [saving, setSaving] = useState(false)

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')
  const [editCategory, setEditCategory] = useState('')

  const loadFaqs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/content-library?asset_type=faq', { credentials: 'include' })
      const data = await res.json()
      if (Array.isArray(data)) setFaqs(data)
    } catch {
      toast.error('Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFaqs() }, [])

  const categories = Array.from(new Set(faqs.map(f => f.category).filter((c): c is string => !!c))).sort()

  const filteredFaqs = categoryFilter
    ? faqs.filter(f => f.category === categoryFilter)
    : faqs

  const handleAdd = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error('Question and answer are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/content-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          asset_type: 'faq',
          question: newQuestion,
          answer: newAnswer,
          category: newCategory || undefined,
        }),
      })
      if (res.ok) {
        toast.success('FAQ added')
        setNewQuestion('')
        setNewAnswer('')
        setNewCategory('')
        setShowAdd(false)
        loadFaqs()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to add FAQ')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePatch = async (id: string, updates: Partial<FaqItem>) => {
    try {
      const res = await fetch(`/api/content-library/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        setFaqs(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
        toast.success('Updated')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Update failed')
      }
    } catch {
      toast.error('Update failed')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editQuestion.trim() || !editAnswer.trim()) return
    await handlePatch(editingId, {
      question: editQuestion,
      answer: editAnswer,
      category: editCategory || null,
    })
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    try {
      const res = await fetch(`/api/content-library/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast.success('Deleted')
        setFaqs(prev => prev.filter(f => f.id !== id))
      } else {
        toast.error('Delete failed')
      }
    } catch {
      toast.error('Delete failed')
    }
  }

  const startEdit = (faq: FaqItem) => {
    setEditingId(faq.id)
    setEditQuestion(faq.question)
    setEditAnswer(faq.answer)
    setEditCategory(faq.category || '')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="font-cormorant text-2xl font-light text-sea-white">FAQ</h2>
          <span className="text-xs text-sea-blue font-dm">
            {faqs.filter(f => f.is_public).length} public / {faqs.length} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/faq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sea-gold font-dm hover:underline min-h-[44px] flex items-center"
          >
            Preview /faq
          </a>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all"
          >
            {showAdd ? 'Cancel' : 'Add FAQ'}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 mb-6 space-y-3">
          <div>
            <label className="block text-xs text-sea-blue mb-1 font-dm">Question</label>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g. Do you allow dogs?"
              className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold placeholder:text-sea-border min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs text-sea-blue mb-1 font-dm">Answer (plain text)</label>
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={3}
              placeholder="Yes! We're a dog-friendly bar..."
              className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none placeholder:text-sea-border"
            />
          </div>
          <div>
            <label className="block text-xs text-sea-blue mb-1 font-dm">Category (optional)</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Pets, Hours, Events"
              className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold placeholder:text-sea-border min-h-[44px]"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !newQuestion.trim() || !newAnswer.trim()}
            className="px-5 py-2.5 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save FAQ'}
          </button>
        </div>
      )}

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-3 py-1.5 text-xs font-dm rounded-full border cursor-pointer transition-all min-h-[36px] ${
              !categoryFilter
                ? 'bg-sea-gold/10 border-sea-gold/30 text-sea-gold'
                : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={`px-3 py-1.5 text-xs font-dm rounded-full border cursor-pointer transition-all min-h-[36px] ${
                categoryFilter === cat
                  ? 'bg-sea-gold/10 border-sea-gold/30 text-sea-gold'
                  : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* FAQ list */}
      {loading ? (
        <p className="text-xs text-sea-blue font-dm py-4">Loading FAQs...</p>
      ) : filteredFaqs.length === 0 ? (
        <p className="text-center py-8 text-sea-blue text-sm font-dm">
          {faqs.length === 0 ? 'No FAQs yet. Add your first one above.' : 'No FAQs in this category.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
              {editingId === faq.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold min-h-[44px]"
                  />
                  <textarea
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none"
                  />
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Category (optional)"
                    className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold placeholder:text-sea-border min-h-[44px]"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="px-4 py-2 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 min-h-[44px] bg-transparent text-sea-blue font-dm text-xs tracking-[0.15em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold transition-all">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-sea-white font-dm font-medium">{faq.question}</p>
                      <p className="text-xs text-sea-blue font-dm mt-1 leading-relaxed">{faq.answer}</p>
                      {faq.category && (
                        <span className="inline-block text-[0.6rem] text-sea-gold/60 font-dm mt-2 px-2 py-0.5 rounded bg-sea-gold/5 border border-sea-gold/10">
                          {faq.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-sea-gold/5 flex-wrap">
                    <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={faq.is_public}
                        onChange={() => handlePatch(faq.id, { is_public: !faq.is_public })}
                        className="w-5 h-5 accent-[#c9a959] cursor-pointer"
                      />
                      <span className="text-[0.65rem] text-sea-blue font-dm uppercase tracking-wider">Public</span>
                    </label>
                    <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={faq.show_on_homepage}
                        onChange={() => handlePatch(faq.id, { show_on_homepage: !faq.show_on_homepage })}
                        className="w-5 h-5 accent-[#c9a959] cursor-pointer"
                      />
                      <span className="text-[0.65rem] text-sea-blue font-dm uppercase tracking-wider">Homepage</span>
                    </label>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button onClick={() => startEdit(faq)} className="px-3 py-1.5 min-h-[44px] text-xs text-sea-blue bg-transparent border border-sea-gold/10 rounded cursor-pointer hover:text-sea-gold hover:border-sea-gold/20 transition-all font-dm">Edit</button>
                      {isAdminOrAbove && (
                        <button onClick={() => handleDelete(faq.id)} className="px-3 py-1.5 min-h-[44px] text-xs text-sea-rose bg-transparent border border-sea-rose/20 rounded cursor-pointer hover:bg-red-900/10 transition-all font-dm">Delete</button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
