'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'

// ── Types ──

interface CsvPreviewResult {
  name: string
  checksum: string
  blog_seed_count: number
  email_seed_count: number
  faq_count: number
  errors: string[]
}

interface SmartPreviewResult {
  preview_id: string
  checksum: string
  blog_ideas: Array<{ title: string; primary_keyword: string; starter: string }>
  faqs: Array<{ question: string; answer: string; category: string }>
  keywords: string[]
  event_ideas: Array<{ title: string; description: string; date_hint: string }>
  email_ideas: Array<{ subject_line: string; primary_keyword: string; starter: string }>
}

type ImportMode = 'smart' | 'csv'

// ── Main Component ──

export default function ContentPackImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [mode, setMode] = useState<ImportMode>('smart')

  return (
    <div className="fixed inset-0 bg-[#06080d]/95 backdrop-blur-xl z-[200] overflow-y-auto p-4 md:p-16">
      <button
        className="fixed top-4 right-4 bg-transparent border border-sea-border text-sea-gold text-xl w-10 h-10 flex items-center justify-center cursor-pointer hover:border-sea-gold transition-all z-[201] rounded"
        onClick={onClose}
      >
        &times;
      </button>
      <div className="max-w-lg mx-auto mt-12">
        <h2 className="font-cormorant text-2xl text-sea-white mb-4">Import Content</h2>

        {/* Mode toggle */}
        <div className="flex gap-0 mb-6 border-b border-sea-gold/10">
          <button
            onClick={() => setMode('smart')}
            className={`px-4 py-3 min-h-[44px] font-dm text-sm tracking-[0.1em] uppercase border-none cursor-pointer transition-all ${
              mode === 'smart' ? 'text-sea-gold border-b-2 border-sea-gold bg-sea-gold/5' : 'text-sea-blue hover:text-sea-gold bg-transparent'
            }`}
          >
            Smart Import
          </button>
          <button
            onClick={() => setMode('csv')}
            className={`px-4 py-3 min-h-[44px] font-dm text-sm tracking-[0.1em] uppercase border-none cursor-pointer transition-all ${
              mode === 'csv' ? 'text-sea-gold border-b-2 border-sea-gold bg-sea-gold/5' : 'text-sea-blue hover:text-sea-gold bg-transparent'
            }`}
          >
            CSV Import
          </button>
        </div>

        {mode === 'smart' ? (
          <SmartImportPane onClose={onClose} onImported={onImported} />
        ) : (
          <CsvImportPane onClose={onClose} onImported={onImported} />
        )}
      </div>
    </div>
  )
}

// ── Smart Import ──

function SmartImportPane({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [pastedText, setPastedText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<SmartPreviewResult | null>(null)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  const toggleExclude = (key: string) => {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleParse = async () => {
    if (!pastedText.trim() && !file) {
      return toast.error('Paste text or upload a file')
    }
    setLoading(true)
    try {
      const fd = new FormData()
      if (file) fd.append('file', file)
      if (pastedText.trim()) fd.append('text', pastedText)

      const res = await fetch('/api/content-packs/smart-import?mode=preview', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const data = await res.json()
      if (res.ok) {
        setPreview(data)
        setExcluded(new Set())
      } else {
        toast.error(data.error || 'Parse failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async () => {
    if (!preview) return
    setLoading(true)
    try {
      const res = await fetch('/api/content-packs/smart-import?mode=commit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preview_id: preview.preview_id,
          checksum: preview.checksum,
          excluded: Array.from(excluded),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const parts: string[] = []
        if (data.blog_count) parts.push(`${data.blog_count} blog ideas`)
        if (data.email_count) parts.push(`${data.email_count} email ideas`)
        if (data.faq_count) parts.push(`${data.faq_count} FAQs`)
        if (data.keyword_count) parts.push(`${data.keyword_count} keywords`)
        toast.success(`Imported: ${parts.join(', ')}`)
        onImported()
        onClose()
      } else {
        toast.error(data.error || 'Import failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const totalIncluded = preview
    ? (preview.blog_ideas.length + preview.faqs.length + preview.keywords.length +
       preview.event_ideas.length + preview.email_ideas.length) - excluded.size
    : 0

  if (preview) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-sea-blue font-dm">
          AI parsed your content. Uncheck items you don&apos;t want to import.
        </p>

        {/* Blog Ideas */}
        {preview.blog_ideas.length > 0 && (
          <PreviewSection title={`Blog Ideas (${preview.blog_ideas.length})`}>
            {preview.blog_ideas.map((b, i) => (
              <ToggleItem key={`blog_${i}`} id={`blog_${i}`} excluded={excluded} onToggle={toggleExclude}>
                <span className="text-sea-light font-dm text-sm">{b.title}</span>
                <span className="text-sea-blue/50 font-dm text-xs ml-2">{b.primary_keyword}</span>
              </ToggleItem>
            ))}
          </PreviewSection>
        )}

        {/* Email Ideas */}
        {preview.email_ideas.length > 0 && (
          <PreviewSection title={`Email Ideas (${preview.email_ideas.length})`}>
            {preview.email_ideas.map((e, i) => (
              <ToggleItem key={`email_${i}`} id={`email_${i}`} excluded={excluded} onToggle={toggleExclude}>
                <span className="text-sea-light font-dm text-sm">{e.subject_line}</span>
              </ToggleItem>
            ))}
          </PreviewSection>
        )}

        {/* FAQs */}
        {preview.faqs.length > 0 && (
          <PreviewSection title={`FAQs (${preview.faqs.length})`}>
            {preview.faqs.map((f, i) => (
              <ToggleItem key={`faq_${i}`} id={`faq_${i}`} excluded={excluded} onToggle={toggleExclude}>
                <span className="text-sea-light font-dm text-sm">{f.question}</span>
              </ToggleItem>
            ))}
          </PreviewSection>
        )}

        {/* Keywords */}
        {preview.keywords.length > 0 && (
          <PreviewSection title={`Keywords (${preview.keywords.length})`}>
            <div className="flex flex-wrap gap-2">
              {preview.keywords.map((kw, i) => {
                const isExcluded = excluded.has(`kw_${i}`)
                return (
                  <button
                    key={`kw_${i}`}
                    onClick={() => toggleExclude(`kw_${i}`)}
                    className={`text-xs font-dm px-3 py-1.5 rounded-full border transition-all cursor-pointer min-h-[36px] ${
                      isExcluded
                        ? 'bg-transparent border-sea-gold/5 text-sea-blue/30 line-through'
                        : 'bg-sea-gold/10 border-sea-gold/20 text-sea-gold'
                    }`}
                  >
                    {kw}
                  </button>
                )
              })}
            </div>
          </PreviewSection>
        )}

        {/* Event Ideas */}
        {preview.event_ideas.length > 0 && (
          <PreviewSection title={`Event Ideas (${preview.event_ideas.length})`}>
            {preview.event_ideas.map((ev, i) => (
              <div key={i} className="text-sm text-sea-light font-dm py-1">
                {ev.title} {ev.date_hint && <span className="text-sea-blue/50 text-xs">({ev.date_hint})</span>}
              </div>
            ))}
            <p className="text-[0.6rem] text-sea-blue/40 font-dm mt-1">Event ideas are shown for reference — create them in the Events tab.</p>
          </PreviewSection>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleCommit}
            disabled={loading || totalIncluded === 0}
            className="px-6 py-3 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50 min-h-[44px] rounded"
          >
            {loading ? 'Importing...' : `Import ${totalIncluded} Selected`}
          </button>
          <button
            onClick={() => setPreview(null)}
            className="px-6 py-3 bg-transparent text-sea-blue font-dm text-xs tracking-[0.2em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold transition-all min-h-[44px] rounded"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-sea-blue font-dm">
        Paste notes, briefs, brainstorms, or upload a file. AI will classify content into blog ideas, FAQs, keywords, events, and emails.
      </p>

      <div>
        <label className="block text-xs text-sea-blue mb-1 font-dm">Paste text</label>
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          rows={8}
          placeholder="Paste meeting notes, content briefs, brainstorm ideas..."
          className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none placeholder:text-sea-border"
        />
      </div>

      <div>
        <label className="block text-xs text-sea-blue mb-1 font-dm">Or upload a file</label>
        <input
          type="file"
          accept=".txt,.md,.markdown,.csv,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm text-sea-blue font-dm"
        />
        <p className="text-[0.6rem] text-sea-blue/50 font-dm mt-0.5">Supports .txt, .md, .csv, .doc</p>
      </div>

      <button
        onClick={handleParse}
        disabled={loading || (!pastedText.trim() && !file)}
        className="w-full px-6 py-3 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50 min-h-[44px] rounded"
      >
        {loading ? 'Parsing with AI...' : 'Parse Content'}
      </button>
    </div>
  )
}

// ── CSV Import (preserved from original) ──

function CsvImportPane({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [blogCsv, setBlogCsv] = useState<File | null>(null)
  const [emailCsv, setEmailCsv] = useState<File | null>(null)
  const [faqCsv, setFaqCsv] = useState<File | null>(null)
  const [briefMd, setBriefMd] = useState<File | null>(null)
  const [briefTxt, setBriefTxt] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvPreviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const buildFormData = () => {
    const fd = new FormData()
    if (blogCsv) fd.append('blog_csv', blogCsv)
    if (emailCsv) fd.append('email_csv', emailCsv)
    if (faqCsv) fd.append('faq_csv', faqCsv)
    if (briefMd) fd.append('brief_md', briefMd)
    if (briefTxt) fd.append('brief_txt', briefTxt)
    return fd
  }

  const handlePreview = async () => {
    if (!blogCsv && !emailCsv && !faqCsv) return toast.error('Upload at least one CSV')
    setLoading(true)
    try {
      const res = await fetch('/api/content-packs/import?mode=preview', {
        method: 'POST',
        credentials: 'include',
        body: buildFormData(),
      })
      const data = await res.json()
      if (res.ok) {
        setPreview(data)
      } else {
        toast.error(data.error || 'Preview failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/content-packs/import?mode=commit', {
        method: 'POST',
        credentials: 'include',
        body: buildFormData(),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Imported: ${data.blog_seed_count} blog seeds, ${data.email_seed_count} email seeds, ${data.faq_count} FAQs`)
        onImported()
        onClose()
      } else {
        toast.error(data.error || 'Import failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p className="text-xs text-sea-blue font-dm mb-4">
        Advanced CSV import for structured content packs.
      </p>

      <form ref={formRef} className="space-y-4">
        <FileInput label="Blog CSV" accept=".csv" onChange={setBlogCsv} hint="Columns: ID, Primary Keyword, Title, Starter" />
        <FileInput label="Email CSV (newsletter + blog seeds)" accept=".csv" onChange={setEmailCsv} hint="Columns: ID, Primary Keyword, Subject Line, Starter" />
        <FileInput label="FAQ CSV" accept=".csv" onChange={setFaqCsv} hint="Columns: ID, Category, Question, Answer" />
        <FileInput label="Brief (.md, optional)" accept=".md,.markdown" onChange={setBriefMd} hint="Markdown brief for AI generation rules" />
        <FileInput label="Brief (.txt, optional)" accept=".txt" onChange={setBriefTxt} hint="Plain text brief for reference" />
      </form>

      {!preview && (
        <button
          onClick={handlePreview}
          disabled={loading || (!blogCsv && !emailCsv && !faqCsv)}
          className="mt-6 w-full px-6 py-3 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50 min-h-[44px] rounded"
        >
          {loading ? 'Validating...' : 'Preview Import'}
        </button>
      )}

      {preview && (
        <div className="mt-6 bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 space-y-3">
          <h3 className="font-cormorant text-lg text-sea-white">Preview: {preview.name}</h3>
          <div className="flex flex-wrap gap-4 text-sm font-dm">
            <span className="text-sea-light">{preview.blog_seed_count} blog seeds</span>
            {preview.email_seed_count > 0 && <span className="text-sea-light">{preview.email_seed_count} email seeds</span>}
            <span className="text-sea-light">{preview.faq_count} FAQs</span>
          </div>
          {preview.errors.length > 0 && (
            <div className="bg-red-900/10 border border-red-500/20 rounded p-3">
              <p className="text-xs text-red-400 font-dm font-medium mb-1">Validation Errors:</p>
              {preview.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-300 font-dm">{e}</p>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleCommit}
              disabled={loading || preview.errors.length > 0}
              className="px-6 py-3 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50 min-h-[44px] rounded"
            >
              {loading ? 'Importing...' : 'Confirm Import'}
            </button>
            <button
              onClick={() => setPreview(null)}
              className="px-6 py-3 bg-transparent text-sea-blue font-dm text-xs tracking-[0.2em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold transition-all min-h-[44px] rounded"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared Components ──

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
      <h4 className="font-cormorant text-base text-sea-white mb-3">{title}</h4>
      {children}
    </div>
  )
}

function ToggleItem({ id, excluded, onToggle, children }: {
  id: string
  excluded: Set<string>
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  const isExcluded = excluded.has(id)
  return (
    <button
      onClick={() => onToggle(id)}
      className={`flex items-center gap-3 w-full text-left py-2 px-2 rounded transition-all cursor-pointer bg-transparent border-none min-h-[44px] ${
        isExcluded ? 'opacity-30' : ''
      }`}
    >
      <span className={`w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center text-xs ${
        isExcluded
          ? 'border-sea-gold/10 bg-transparent'
          : 'border-sea-gold bg-sea-gold/20 text-sea-gold'
      }`}>
        {!isExcluded && '✓'}
      </span>
      <span className={isExcluded ? 'line-through' : ''}>{children}</span>
    </button>
  )
}

function FileInput({ label, accept, onChange, hint }: { label: string; accept: string; onChange: (f: File | null) => void; hint: string }) {
  return (
    <div>
      <label className="block text-xs text-sea-blue mb-1 font-dm">{label}</label>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="text-sm text-sea-blue font-dm"
      />
      <p className="text-[0.6rem] text-sea-blue/50 font-dm mt-0.5">{hint}</p>
    </div>
  )
}
