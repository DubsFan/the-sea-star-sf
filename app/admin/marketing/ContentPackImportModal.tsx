'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'

interface PreviewResult {
  name: string
  checksum: string
  blog_seed_count: number
  email_seed_count: number
  faq_count: number
  errors: string[]
}

export default function ContentPackImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [blogCsv, setBlogCsv] = useState<File | null>(null)
  const [emailCsv, setEmailCsv] = useState<File | null>(null)
  const [faqCsv, setFaqCsv] = useState<File | null>(null)
  const [briefMd, setBriefMd] = useState<File | null>(null)
  const [briefTxt, setBriefTxt] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
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
    <div className="fixed inset-0 bg-[#06080d]/95 backdrop-blur-xl z-[200] overflow-y-auto p-4 md:p-16">
      <button
        className="fixed top-4 right-4 bg-transparent border border-sea-border text-sea-gold text-xl w-10 h-10 flex items-center justify-center cursor-pointer hover:border-sea-gold transition-all z-[201] rounded"
        onClick={onClose}
      >
        &times;
      </button>
      <div className="max-w-lg mx-auto mt-12">
        <h2 className="font-cormorant text-2xl text-sea-white mb-6">Import Content Pack</h2>

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
    </div>
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
