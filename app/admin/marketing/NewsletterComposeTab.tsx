'use client'

import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import MediaPicker from '../create/MediaPicker'

interface EmailSeed {
  id: string
  title: string
  subject_line: string
  primary_keyword: string
  starter: string
  status: string
}

interface Campaign {
  id: string
  content_type: string
  subject: string
  preview_text: string | null
  status: string
  sent_at: string | null
  recipient_count: number
  target_tags: string[] | null
  created_at: string
}

export default function NewsletterComposeTab() {
  // Newsletter settings
  const [showSettings, setShowSettings] = useState(false)
  const [nlSettings, setNlSettings] = useState<Record<string, string>>({})
  const [nlEditing, setNlEditing] = useState<Record<string, string>>({})
  const [nlSaving, setNlSaving] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Compose form
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [heroImage, setHeroImage] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  // Email seeds
  const [seeds, setSeeds] = useState<EmailSeed[]>([])
  const [seedFilter, setSeedFilter] = useState<'imported' | 'drafted' | 'all'>('imported')
  const [draftingSeed, setDraftingSeed] = useState<string | null>(null)

  // Past campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null)

  // Load tags
  const loadTags = async () => {
    const res = await fetch('/api/subscribe/tags', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setAllTags(data)
    }
  }

  // Load newsletter settings
  const loadNlSettings = async () => {
    const res = await fetch('/api/admin/settings', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        const map: Record<string, string> = {}
        for (const s of data as { key: string; value: string }[]) {
          if (s.key.startsWith('newsletter_')) map[s.key] = s.value
        }
        setNlSettings(map)
      }
    }
  }

  // Load seeds
  const loadSeeds = useCallback(async () => {
    const res = await fetch(`/api/content-library?asset_type=email_seed${seedFilter !== 'all' ? `&status=${seedFilter}` : ''}`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setSeeds(data)
    }
  }, [seedFilter])

  // Load campaigns
  const loadCampaigns = async () => {
    const res = await fetch('/api/mailers', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setCampaigns(data)
    }
  }

  useEffect(() => { loadTags(); loadCampaigns() }, [])
  useEffect(() => { loadSeeds() }, [loadSeeds])
  useEffect(() => { if (showSettings) loadNlSettings() }, [showSettings])

  const saveNlSetting = async (key: string) => {
    setNlSaving(key)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ key, value: nlEditing[key] }),
    })
    if (res.ok) {
      toast.success('Saved')
      setNlSettings(prev => ({ ...prev, [key]: nlEditing[key] }))
      setNlEditing(prev => { const n = { ...prev }; delete n[key]; return n })
    } else {
      toast.error('Failed')
    }
    setNlSaving(null)
  }

  const handlePreviewEmail = async () => {
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/newsletter/preview', { credentials: 'include' })
      if (res.ok) setPreviewHtml(await res.text())
      else toast.error('Preview failed')
    } catch { toast.error('Preview failed') }
    finally { setLoadingPreview(false) }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSaveDraft = async () => {
    if (!subject.trim()) return toast.error('Subject line required')
    setSaving(true)
    try {
      const res = await fetch('/api/mailers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content_type: 'standalone_email',
          subject,
          body_html: bodyHtml,
          hero_image: heroImage || null,
          cta_url: ctaUrl || null,
          cta_text: ctaText || null,
          target_tags: selectedTags.length > 0 ? selectedTags : null,
          status: 'draft',
        }),
      })
      if (res.ok) {
        toast.success('Draft saved')
        setSubject(''); setBodyHtml(''); setHeroImage(''); setCtaUrl(''); setCtaText(''); setSelectedTags([])
        loadCampaigns()
      } else {
        toast.error('Save failed')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSendNow = async () => {
    if (!subject.trim()) return toast.error('Subject line required')
    setSending(true)
    try {
      // Create campaign
      const createRes = await fetch('/api/mailers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content_type: 'standalone_email',
          subject,
          body_html: bodyHtml,
          hero_image: heroImage || null,
          cta_url: ctaUrl || null,
          cta_text: ctaText || null,
          target_tags: selectedTags.length > 0 ? selectedTags : null,
          status: 'draft',
        }),
      })
      const campaign = await createRes.json()
      if (!campaign.id) { toast.error('Failed to create campaign'); return }

      // Send it
      const sendRes = await fetch('/api/mailers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ campaign_id: campaign.id }),
      })
      const result = await sendRes.json()
      if (sendRes.ok) {
        toast.success(`Sent to ${result.recipientCount} subscribers`)
        setSubject(''); setBodyHtml(''); setHeroImage(''); setCtaUrl(''); setCtaText(''); setSelectedTags([])
        loadCampaigns()
      } else {
        toast.error(result.error || 'Send failed')
      }
    } finally {
      setSending(false)
    }
  }

  const handleDraftFromSeed = async (seedId: string) => {
    setDraftingSeed(seedId)
    try {
      const res = await fetch(`/api/content-library/${seedId}/create-mailer-draft`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        toast.success('Mailer draft created')
        loadSeeds()
        loadCampaigns()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed')
      }
    } finally {
      setDraftingSeed(null)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    setSendingCampaign(campaignId)
    try {
      const res = await fetch('/api/mailers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ campaign_id: campaignId }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(`Sent to ${result.recipientCount} subscribers`)
        loadCampaigns()
      } else {
        toast.error(result.error || 'Send failed')
      }
    } finally {
      setSendingCampaign(null)
    }
  }

  return (
    <div>
      {/* Newsletter Settings Collapsible */}
      <div className="mb-6">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-sm text-sea-blue font-dm bg-transparent border-none cursor-pointer hover:text-sea-gold transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showSettings ? 'rotate-90' : ''}`}>
            <path d="M9 18l6-6-6-6" />
          </svg>
          Newsletter Settings
        </button>
        {showSettings && (
          <div className="mt-3 bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 space-y-4">
            <p className="text-xs text-sea-blue font-dm">Configure email newsletter schedule and template.</p>
            {/* Cadence */}
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Send Cadence</label>
              <select
                value={'newsletter_cadence' in nlEditing ? nlEditing.newsletter_cadence : nlSettings.newsletter_cadence || ''}
                onChange={(e) => setNlEditing({ ...nlEditing, newsletter_cadence: e.target.value })}
                onFocus={() => { if (!('newsletter_cadence' in nlEditing)) setNlEditing({ ...nlEditing, newsletter_cadence: nlSettings.newsletter_cadence || '' }) }}
                className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded min-h-[44px]"
              >
                <option value="">Not set</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {'newsletter_cadence' in nlEditing && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => saveNlSetting('newsletter_cadence')} disabled={nlSaving === 'newsletter_cadence'} className="px-4 py-2 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer rounded disabled:opacity-50 min-h-[44px]">{nlSaving === 'newsletter_cadence' ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setNlEditing(prev => { const n = { ...prev }; delete n.newsletter_cadence; return n })} className="px-4 py-2 bg-transparent text-sea-blue font-dm text-xs uppercase border border-sea-border cursor-pointer rounded min-h-[44px]">Cancel</button>
                </div>
              )}
            </div>
            {/* Next Send */}
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Next Send Date</label>
              <input
                type="date"
                value={'newsletter_next_send' in nlEditing ? nlEditing.newsletter_next_send : nlSettings.newsletter_next_send || ''}
                onChange={(e) => setNlEditing({ ...nlEditing, newsletter_next_send: e.target.value })}
                onFocus={() => { if (!('newsletter_next_send' in nlEditing)) setNlEditing({ ...nlEditing, newsletter_next_send: nlSettings.newsletter_next_send || '' }) }}
                className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded min-h-[44px]"
              />
              {'newsletter_next_send' in nlEditing && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => saveNlSetting('newsletter_next_send')} disabled={nlSaving === 'newsletter_next_send'} className="px-4 py-2 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer rounded disabled:opacity-50 min-h-[44px]">{nlSaving === 'newsletter_next_send' ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setNlEditing(prev => { const n = { ...prev }; delete n.newsletter_next_send; return n })} className="px-4 py-2 bg-transparent text-sea-blue font-dm text-xs uppercase border border-sea-border cursor-pointer rounded min-h-[44px]">Cancel</button>
                </div>
              )}
            </div>
            {/* Template Notes */}
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Email Template Notes</label>
              <textarea
                value={'newsletter_template_notes' in nlEditing ? nlEditing.newsletter_template_notes : nlSettings.newsletter_template_notes || ''}
                onChange={(e) => setNlEditing({ ...nlEditing, newsletter_template_notes: e.target.value })}
                onFocus={() => { if (!('newsletter_template_notes' in nlEditing)) setNlEditing({ ...nlEditing, newsletter_template_notes: nlSettings.newsletter_template_notes || '' }) }}
                rows={2}
                placeholder="Custom intro/outro text for newsletters..."
                className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded resize-y"
              />
              {'newsletter_template_notes' in nlEditing && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => saveNlSetting('newsletter_template_notes')} disabled={nlSaving === 'newsletter_template_notes'} className="px-4 py-2 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer rounded disabled:opacity-50 min-h-[44px]">{nlSaving === 'newsletter_template_notes' ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setNlEditing(prev => { const n = { ...prev }; delete n.newsletter_template_notes; return n })} className="px-4 py-2 bg-transparent text-sea-blue font-dm text-xs uppercase border border-sea-border cursor-pointer rounded min-h-[44px]">Cancel</button>
                </div>
              )}
            </div>
            <button
              onClick={handlePreviewEmail}
              disabled={loadingPreview}
              className="w-full sm:w-auto px-6 py-3 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all min-h-[44px] rounded disabled:opacity-50"
            >
              {loadingPreview ? 'Loading...' : 'Preview Email'}
            </button>
          </div>
        )}
      </div>

      {/* Quick Compose */}
      <h3 className="font-cormorant text-lg text-sea-white mb-3">Compose Newsletter</h3>
      <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-6 mb-6 space-y-4">
        <div>
          <label className="block text-xs text-sea-blue mb-1 font-dm">Subject Line</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your newsletter subject..."
            className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded min-h-[44px]"
          />
        </div>
        <div>
          <label className="block text-xs text-sea-blue mb-1 font-dm">Body</label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={5}
            placeholder="Write your newsletter content..."
            className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded resize-y"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-sea-blue mb-1 font-dm">CTA URL</label>
            <input
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://theseastarsf.com"
              className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs text-sea-blue mb-1 font-dm">CTA Text</label>
            <input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Visit Us"
              className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded min-h-[44px]"
            />
          </div>
        </div>

        {/* Hero Image */}
        <div>
          <label className="block text-xs text-sea-blue mb-2 font-dm">Hero Image (optional)</label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPicker(true)}
              className="px-4 py-2.5 min-h-[44px] bg-transparent text-sea-gold font-dm text-xs tracking-[0.15em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all"
            >
              {heroImage ? 'Change Image' : 'Choose Image'}
            </button>
            {heroImage && (
              <button
                onClick={() => setHeroImage('')}
                className="px-3 py-2.5 min-h-[44px] text-xs text-red-400 font-dm bg-transparent border border-red-400/20 cursor-pointer hover:bg-red-900/10 transition-all rounded"
              >
                Remove
              </button>
            )}
          </div>
          {heroImage && <img src={heroImage} alt="" className="w-20 h-20 object-cover rounded mt-2" />}
          <MediaPicker isOpen={showPicker} mode="single" onSelect={(urls) => { setHeroImage(urls[0] || ''); setShowPicker(false) }} onClose={() => setShowPicker(false)} />
        </div>

        {/* Tag Targeting */}
        {allTags.length > 0 && (
          <div>
            <label className="block text-xs text-sea-blue mb-2 font-dm">
              Send to: {selectedTags.length === 0 ? 'All Active Subscribers' : selectedTags.join(', ')}
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 min-h-[44px] text-xs font-dm rounded cursor-pointer transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-sea-gold/20 border-sea-gold/40 text-sea-gold border'
                      : 'bg-transparent border border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving || !subject.trim()}
            className="px-6 py-2.5 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleSendNow}
            disabled={sending || !subject.trim()}
            className="px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {sending ? 'Sending...' : 'Send Now'}
          </button>
        </div>
      </div>

      {/* Email Seeds */}
      <div className="mb-6">
        <h3 className="font-cormorant text-lg text-sea-white mb-3">Email Seeds</h3>
        <div className="flex gap-2 mb-3">
          {(['imported', 'drafted', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSeedFilter(f)}
              className={`px-3 py-2 text-[0.65rem] font-dm tracking-[0.1em] uppercase rounded border cursor-pointer transition-all min-h-[44px] ${
                seedFilter === f
                  ? 'bg-sea-gold/10 border-sea-gold/30 text-sea-gold'
                  : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {seeds.map((seed) => (
            <div key={seed.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sea-white font-dm truncate">{seed.title || seed.subject_line}</p>
                <p className="text-[0.65rem] text-sea-blue/50 font-dm">{seed.primary_keyword}</p>
              </div>
              <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded flex-shrink-0 ${
                seed.status === 'drafted' ? 'bg-green-900/30 text-green-400' : 'bg-sea-gold/10 text-sea-gold'
              }`}>{seed.status}</span>
              {seed.status === 'imported' && (
                <button
                  onClick={() => handleDraftFromSeed(seed.id)}
                  disabled={draftingSeed === seed.id}
                  className="text-xs text-sea-gold bg-transparent border border-sea-gold/20 rounded px-3 py-1.5 cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50 font-dm flex-shrink-0 min-h-[44px]"
                >
                  {draftingSeed === seed.id ? 'Creating...' : 'Draft'}
                </button>
              )}
            </div>
          ))}
          {seeds.length === 0 && <p className="text-center py-4 text-sea-blue text-xs font-dm">No email seeds. Import a content pack to get started.</p>}
        </div>
      </div>

      {/* Past Campaigns */}
      <h3 className="font-cormorant text-lg text-sea-white mb-3">Past Campaigns</h3>
      <div className="space-y-2">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sea-light font-dm truncate">{c.subject || 'No subject'}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                <span className="text-[0.65rem] text-sea-blue font-dm">{c.content_type} &middot; {new Date(c.created_at).toLocaleDateString()}</span>
                {c.recipient_count > 0 && <span className="text-[0.65rem] text-sea-blue font-dm">&middot; {c.recipient_count} sent</span>}
                {c.target_tags && c.target_tags.length > 0 && (
                  <span className="text-[0.65rem] text-sea-gold/60 font-dm">&middot; {c.target_tags.join(', ')}</span>
                )}
              </div>
            </div>
            <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded flex-shrink-0 ${
              c.status === 'sent' ? 'bg-green-900/30 text-green-400' :
              c.status === 'scheduled' ? 'bg-yellow-900/30 text-yellow-400' :
              c.status === 'failed' ? 'bg-red-900/30 text-red-400' :
              'bg-sea-gold/10 text-sea-gold'
            }`}>{c.status}</span>
            {c.status === 'draft' && (
              <button
                onClick={() => handleSendCampaign(c.id)}
                disabled={sendingCampaign === c.id}
                className="text-xs text-sea-gold bg-transparent border border-sea-gold/20 rounded px-3 py-1.5 cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50 font-dm flex-shrink-0 min-h-[44px]"
              >
                {sendingCampaign === c.id ? 'Sending...' : 'Send'}
              </button>
            )}
          </div>
        ))}
        {campaigns.length === 0 && <p className="text-center py-6 text-sea-blue text-sm font-dm">No campaigns yet.</p>}
      </div>

      {/* Email Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 bg-[#06080d]/95 backdrop-blur-xl z-[200] overflow-y-auto p-4 md:p-16">
          <button
            className="fixed top-4 right-4 bg-transparent border border-sea-border text-sea-gold text-xl w-10 h-10 flex items-center justify-center cursor-pointer hover:border-sea-gold transition-all z-[201] rounded"
            onClick={() => setPreviewHtml(null)}
          >
            &times;
          </button>
          <div className="max-w-[600px] mx-auto mt-12">
            <h3 className="font-cormorant text-xl text-sea-white mb-4">Email Preview</h3>
            <div className="bg-white rounded-lg overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                className="w-full min-h-[600px] border-none"
                title="Newsletter Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
