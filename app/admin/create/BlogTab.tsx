'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import ChannelRow from './ChannelRow'
import MediaPicker from './MediaPicker'
import {
  computeNextDayOfWeek,
  computeEventPresetDate,
  rollForwardIfWeekend,
  type DayOfWeek,
} from '@/lib/campaign-timing'

interface BlogPost {
  id: string; title: string; slug: string; body: string; excerpt: string; meta_description: string
  images: string[]; status: string; is_published: boolean; published_at: string | null
  emailed_at: string | null; social_posted_at: string | null; created_at: string
}

interface BlogSeed {
  id: string; title: string; primary_keyword: string; starter: string; status: string
}

interface Setting {
  key: string; value: string
}

interface UpcomingEvent {
  id: string; title: string; starts_at: string
}

export default function BlogTab({ isAdminOrAbove }: { isAdminOrAbove: boolean }) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [rawInput, setRawInput] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [useSourceImage, setUseSourceImage] = useState(true)
  const [mailerHeroImage, setMailerHeroImage] = useState('')
  const [showMailerPicker, setShowMailerPicker] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<{ title: string; body: string; excerpt: string; meta_description: string } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishActions, setPublishActions] = useState({ site: 'now', social: 'schedule', mailer: 'draft' })
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [showTimingPanel, setShowTimingPanel] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [scheduledDates, setScheduledDates] = useState<{ site?: string; social?: string; mailer?: string }>({})

  // Publishing Defaults
  const [showDefaults, setShowDefaults] = useState(false)
  const [defaults, setDefaults] = useState({
    blog_default_mode: 'schedule',
    blog_default_day_of_week: 'tuesday',
    blog_default_time_local: '10:00',
    social_default_mode: 'schedule',
    social_default_delay_days: '2',
    social_default_time_local: '18:00',
    newsletter_default_mode: 'draft',
    newsletter_default_day_of_week: 'thursday',
    newsletter_default_time_local: '09:00',
  })
  const [savingDefaults, setSavingDefaults] = useState(false)
  const defaultsLoadedRef = useRef(false)

  // Blog Seeds
  const [seeds, setSeeds] = useState<BlogSeed[]>([])
  const [seedFilter, setSeedFilter] = useState<'imported' | 'drafted' | 'all'>('imported')
  const [generatingSeed, setGeneratingSeed] = useState<string | null>(null)

  // Blog Ideas
  const [blogIdeas, setBlogIdeas] = useState<Array<{ title: string; description: string; target_keyword: string }>>([])
  const [loadingIdeas, setLoadingIdeas] = useState(false)

  // AI Writing Style
  const [showStyle, setShowStyle] = useState(false)
  const [styleSettings, setStyleSettings] = useState<Record<string, string>>({})
  const [styleEditing, setStyleEditing] = useState<Record<string, string>>({})
  const [savingStyle, setSavingStyle] = useState<string | null>(null)

  const loadPublishDefaults = async () => {
    try {
      const res = await fetch('/api/admin/settings', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data)) return
      const get = (key: string) => data.find((s: Setting) => s.key === key)?.value

      const blogMode = get('blog_default_mode') || 'schedule'
      const blogDay = (get('blog_default_day_of_week') || 'tuesday') as DayOfWeek
      const blogTime = get('blog_default_time_local') || '10:00'
      const socialMode = get('social_default_mode') || 'schedule'
      const socialDelay = get('social_default_delay_days') || '2'
      const socialTime = get('social_default_time_local') || '18:00'
      const newsletterMode = get('newsletter_default_mode') || 'draft'
      const newsletterDay = (get('newsletter_default_day_of_week') || 'thursday') as DayOfWeek
      const newsletterTime = get('newsletter_default_time_local') || '09:00'

      // Update defaults state for the Publishing Defaults section
      setDefaults({
        blog_default_mode: blogMode,
        blog_default_day_of_week: blogDay,
        blog_default_time_local: blogTime,
        social_default_mode: socialMode,
        social_default_delay_days: socialDelay,
        social_default_time_local: socialTime,
        newsletter_default_mode: newsletterMode,
        newsletter_default_day_of_week: newsletterDay,
        newsletter_default_time_local: newsletterTime,
      })

      // Set channel actions
      setPublishActions({
        site: blogMode === 'schedule' ? 'schedule' : 'now',
        social: socialMode,
        mailer: newsletterMode,
      })

      // Compute default scheduled dates
      const dates: { site?: string; social?: string; mailer?: string } = {}
      if (blogMode === 'schedule') {
        dates.site = computeNextDayOfWeek(blogDay, blogTime)
      }
      if (socialMode === 'schedule') {
        // Social: delay days from now at socialTime
        const delayDays = parseInt(socialDelay, 10) || 2
        const future = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000)
        const p = future.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
        const raw = `${p}T${socialTime}:00`
        dates.social = rollForwardIfWeekend(new Date(raw).toISOString())
      }
      if (newsletterMode === 'schedule') {
        dates.mailer = computeNextDayOfWeek(newsletterDay, newsletterTime)
      }
      setScheduledDates(dates)
      defaultsLoadedRef.current = true
    } catch { /* use defaults */ }
  }

  const loadUpcomingEvents = async () => {
    try {
      const res = await fetch('/api/events?scope=public', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) {
        const now = new Date()
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const upcoming = data.filter((e: UpcomingEvent) => {
          const d = new Date(e.starts_at)
          return d >= now && d <= weekFromNow
        })
        setUpcomingEvents(upcoming)
        if (upcoming.length > 0) setSelectedEventId(upcoming[0].id)
      }
    } catch { /* ignore */ }
  }

  const openTimingPanel = () => {
    loadPublishDefaults()
    loadUpcomingEvents()
    setShowTimingPanel(true)
  }

  const handleGetBlogIdeas = async () => {
    setLoadingIdeas(true)
    try {
      const res = await fetch('/api/seo/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'content_ideas' }),
      })
      const data = await res.json()
      if (data.ideas) setBlogIdeas(data.ideas)
    } catch {
      toast.error('Failed to get ideas')
    } finally {
      setLoadingIdeas(false)
    }
  }

  const loadSeeds = useCallback(async () => {
    const res = await fetch(`/api/content-library?asset_type=blog_seed${seedFilter !== 'all' ? `&status=${seedFilter}` : ''}`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setSeeds(data)
    }
  }, [seedFilter])

  useEffect(() => { loadSeeds() }, [loadSeeds])

  const loadStyleSettings = async () => {
    const res = await fetch('/api/admin/settings', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        const map: Record<string, string> = {}
        for (const s of data as Setting[]) {
          if (s.key === 'seo_keywords') map['seo_keywords'] = s.value
          if (s.key === 'blog_keywords' && !map['seo_keywords']) map['seo_keywords'] = s.value
          if (s.key === 'blog_tone_notes') map[s.key] = s.value
        }
        setStyleSettings(map)
      }
    }
  }

  useEffect(() => { if (showStyle) loadStyleSettings() }, [showStyle])

  const saveStyleSetting = async (key: string) => {
    setSavingStyle(key)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ key, value: styleEditing[key] }),
    })
    if (res.ok) {
      toast.success('Saved')
      setStyleSettings(prev => ({ ...prev, [key]: styleEditing[key] }))
      setStyleEditing(prev => { const n = { ...prev }; delete n[key]; return n })
    } else {
      toast.error('Failed to save')
    }
    setSavingStyle(null)
  }

  const handleGenerateFromSeed = async (seedId: string) => {
    setGeneratingSeed(seedId)
    try {
      const res = await fetch(`/api/content-library/${seedId}/generate-blog-draft`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Draft created: ${data.title}`)
        loadSeeds()
        loadPosts()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Generation failed')
      }
    } finally {
      setGeneratingSeed(null)
    }
  }

  const loadPosts = async () => {
    const res = await fetch('/api/blog', { credentials: 'include' })
    const data = await res.json()
    if (Array.isArray(data)) setPosts(data)
  }

  useEffect(() => { loadPosts() }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    const urls: string[] = []
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const formData = new FormData()
      formData.append('file', files[i])
      formData.append('bucket', 'Drink Images')
      const res = await fetch('/api/media', { credentials: 'include', method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) urls.push(data.url)
    }
    setPhotos((prev) => [...prev, ...urls])
    setUploading(false)
    toast.success(`${urls.length} photo(s) uploaded`)
  }

  const handleGenerate = async () => {
    if (!rawInput.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_input: rawInput, focus_keyword: focusKeyword || undefined }),
      })
      const data = await res.json()
      if (data.title) {
        setPreview(data)
        setEditTitle(data.title)
        setEditBody(data.body)
        setEditingPostId(null)
        toast.success('Post generated!')
      } else {
        toast.error(data.error || 'Generation failed')
      }
    } catch {
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    const isUpdate = !!editingPostId
    const res = await fetch('/api/blog', {
      method: isUpdate ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(isUpdate ? { id: editingPostId } : {}),
        title: editTitle,
        body: editBody,
        excerpt: preview?.excerpt || '',
        meta_description: preview?.meta_description || '',
        images: photos,
      }),
    })
    if (res.ok) {
      const savedPost = await res.json()
      toast.success(isUpdate ? 'Draft updated' : 'Draft saved')
      if (!isUpdate && savedPost?.id) setEditingPostId(savedPost.id)
      loadPosts()
    }
  }

  const handlePublish = async (postId: string) => {
    // Validate: schedule without date → error
    if (publishActions.site === 'schedule' && !scheduledDates.site) {
      toast.error('Pick a date for website scheduling'); return
    }
    if (publishActions.social === 'schedule' && !scheduledDates.social) {
      toast.error('Pick a date for social scheduling'); return
    }
    if (publishActions.mailer === 'schedule' && !scheduledDates.mailer) {
      toast.error('Pick a date for newsletter scheduling'); return
    }

    setPublishing(true)
    try {
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          site: { action: publishActions.site, scheduledFor: scheduledDates.site },
          social: { action: publishActions.social, scheduledFor: scheduledDates.social },
          mailer: { action: publishActions.mailer, scheduledFor: scheduledDates.mailer, hero_image: !useSourceImage && mailerHeroImage ? mailerHeroImage : undefined },
        }),
      })
      if (res.ok) {
        toast.success('Published!')
        setPreview(null)
        setEditingPostId(null)
        setRawInput('')
        setPhotos([])
        setShowTimingPanel(false)
        setScheduledDates({})
        loadPublishDefaults() // reload defaults (don't mutate them)
        loadPosts()
      } else {
        toast.error('Publish failed')
      }
    } finally {
      setPublishing(false)
    }
  }

  const handleEditPost = (post: BlogPost) => {
    setEditingPostId(post.id)
    setEditTitle(post.title)
    setEditBody(post.body)
    setPhotos(post.images || [])
    setPreview({ title: post.title, body: post.body, excerpt: post.excerpt, meta_description: post.meta_description })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    const res = await fetch('/api/blog', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Deleted'); loadPosts() }
  }

  const handleMarkReady = async (postId: string) => {
    const res = await fetch('/api/blog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: postId, status: 'ready' }),
    })
    if (res.ok) { toast.success('Marked as ready for review'); loadPosts() }
  }

  const getStatusBadge = (post: BlogPost) => {
    if (post.status === 'scheduled') return { label: 'Scheduled', cls: 'bg-yellow-900/30 text-yellow-400' }
    if (post.is_published || post.status === 'published') return { label: 'Published', cls: 'bg-green-900/30 text-green-400' }
    if (post.status === 'ready') return { label: 'Ready', cls: 'bg-cyan-900/30 text-cyan-400' }
    return { label: 'Draft', cls: 'bg-sea-gold/10 text-sea-gold' }
  }

  return (
    <div>
      <h2 className="font-cormorant text-2xl font-light text-sea-white mb-6">Blog Creator</h2>

      {/* Input Area */}
      <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-6 mb-6">
        <label className="block text-xs text-sea-blue mb-2 font-dm">What happened this week?</label>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          rows={4}
          placeholder="Type 5 sentences about what's been happening at The Sea Star..."
          className="w-full px-4 py-3 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none mb-3 placeholder:text-sea-border"
        />
        <div className="mb-3">
          <label className="block text-xs text-sea-blue mb-1 font-dm">SEO Focus Keyword (optional)</label>
          <input
            type="text"
            value={focusKeyword}
            onChange={(e) => setFocusKeyword(e.target.value)}
            placeholder="e.g. dogpatch cocktail bar"
            className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold placeholder:text-sea-border"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-sea-blue mb-2 font-dm">Photos (up to 5)</label>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowPicker(true)} disabled={photos.length >= 5} className="px-4 py-2.5 min-h-[44px] bg-transparent text-sea-gold font-dm text-xs tracking-[0.15em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50">
              Add from Media
            </button>
            <label className="inline-flex items-center px-3 py-2.5 min-h-[44px] text-xs text-sea-blue/60 font-dm cursor-pointer hover:text-sea-blue transition-colors">
              or upload directly
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
          {uploading && <p className="text-xs text-sea-gold mt-1">Uploading...</p>}
          {photos.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {photos.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-20 h-20 object-cover rounded" />
                  <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center border-none cursor-pointer">×</button>
                </div>
              ))}
            </div>
          )}
          <MediaPicker isOpen={showPicker} mode="multiple" maxFiles={5 - photos.length} onSelect={(urls) => { setPhotos(p => [...p, ...urls]); setShowPicker(false) }} onClose={() => setShowPicker(false)} />
        </div>
        <button onClick={handleGenerate} disabled={generating || !rawInput.trim()} className="w-full sm:w-auto px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50">
          {generating ? 'Generating...' : 'Generate Post'}
        </button>
      </div>

      {/* Preview / Edit */}
      {preview && (
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-6 mb-6">
          <h3 className="font-cormorant text-xl text-sea-white mb-4">{editingPostId ? 'Editing Draft' : 'Preview'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Title</label>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Body (HTML)</label>
              <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={8} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none" />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Rendered Preview</label>
              <div className="bg-[#06080d] border border-sea-gold/5 rounded p-4">
                <h4 className="font-cormorant text-xl text-sea-white mb-3">{editTitle}</h4>
                <div className="text-sm text-sea-blue font-dm leading-relaxed space-y-3" dangerouslySetInnerHTML={{ __html: editBody }} />
              </div>
            </div>

            {/* Campaign Timing Panel */}
            {isAdminOrAbove && editingPostId && showTimingPanel && (
              <div className="border-t border-sea-gold/10 pt-4">
                <label className="block text-xs text-sea-blue mb-3 font-dm tracking-[0.1em] uppercase">Campaign Timing</label>

                <div className="space-y-3 mb-4">
                  <ChannelRow
                    label="Website"
                    value={publishActions.site}
                    onChange={(v) => setPublishActions(a => ({ ...a, site: v }))}
                    scheduledFor={scheduledDates.site}
                    onScheduledForChange={(iso) => setScheduledDates(d => ({ ...d, site: iso }))}
                  />
                  <ChannelRow
                    label="Social Media"
                    value={publishActions.social}
                    onChange={(v) => setPublishActions(a => ({ ...a, social: v }))}
                    scheduledFor={scheduledDates.social}
                    onScheduledForChange={(iso) => setScheduledDates(d => ({ ...d, social: iso }))}
                  />
                  <ChannelRow
                    label="Newsletter"
                    value={publishActions.mailer}
                    onChange={(v) => setPublishActions(a => ({ ...a, mailer: v }))}
                    scheduledFor={scheduledDates.mailer}
                    onScheduledForChange={(iso) => setScheduledDates(d => ({ ...d, mailer: iso }))}
                    allowDraft
                  />
                </div>

                {/* Mailer hero image option */}
                {publishActions.mailer !== 'skip' && publishActions.mailer !== 'draft' && (
                  <div className="mb-4 space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                      <input type="checkbox" checked={useSourceImage} onChange={(e) => setUseSourceImage(e.target.checked)} className="w-5 h-5 accent-[#c9a54e]" />
                      <span className="text-xs text-sea-blue font-dm">Use blog featured image</span>
                    </label>
                    {!useSourceImage && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setShowMailerPicker(true)} className="px-4 py-2.5 min-h-[44px] bg-transparent text-sea-gold font-dm text-xs tracking-[0.15em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all">
                          Choose Hero Image
                        </button>
                        {mailerHeroImage && <img src={mailerHeroImage} alt="" className="w-12 h-12 object-cover rounded" />}
                        <MediaPicker isOpen={showMailerPicker} mode="single" onSelect={(urls) => { setMailerHeroImage(urls[0] || ''); setShowMailerPicker(false) }} onClose={() => setShowMailerPicker(false)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Event-aware timing chips */}
                {upcomingEvents.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-sea-blue font-dm mb-2">
                      Upcoming event{upcomingEvents.length > 1 ? 's' : ''} this week:
                    </p>
                    {upcomingEvents.length > 1 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {upcomingEvents.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => setSelectedEventId(ev.id)}
                            className={`px-3 py-1.5 text-[0.65rem] font-dm rounded border cursor-pointer transition-all min-h-[44px] ${
                              selectedEventId === ev.id
                                ? 'bg-sea-gold/10 border-sea-gold/30 text-sea-gold'
                                : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
                            }`}
                          >
                            {ev.title} ({new Date(ev.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedEventId && (() => {
                      const ev = upcomingEvents.find(e => e.id === selectedEventId)
                      if (!ev) return null
                      const socialTime = defaults.social_default_time_local || '18:00'
                      return (
                        <div className="flex flex-wrap gap-2">
                          {([
                            { key: '2-before' as const, label: '2 days before' },
                            { key: 'day-of' as const, label: 'Day of event' },
                            { key: 'day-after' as const, label: 'Day after' },
                          ]).map((chip) => (
                            <button
                              key={chip.key}
                              onClick={() => {
                                const iso = computeEventPresetDate(ev.starts_at, chip.key, socialTime)
                                const rolled = rollForwardIfWeekend(iso)
                                setScheduledDates(d => ({
                                  ...d,
                                  social: rolled,
                                  ...(publishActions.mailer === 'schedule' ? { mailer: rolled } : {}),
                                }))
                                setPublishActions(a => ({ ...a, social: 'schedule' }))
                              }}
                              className="px-3 py-1.5 text-[0.65rem] font-dm rounded-full border cursor-pointer transition-all min-h-[44px] bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20"
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )}

                <p className="text-[0.6rem] text-sea-blue/40 font-dm mb-3">
                  Runs on the selected date. Exact send time may vary on the current hosting plan.
                </p>

                <button
                  onClick={() => handlePublish(editingPostId)}
                  disabled={publishing}
                  className="w-full px-6 py-3 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50 min-h-[48px]"
                >
                  {publishing ? 'Publishing...' : 'Confirm & Publish'}
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleSaveDraft} className="px-6 py-2.5 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all">
                {editingPostId ? 'Update Draft' : 'Save Draft'}
              </button>
              {editingPostId && (
                <button onClick={() => handleMarkReady(editingPostId)} className="px-6 py-2.5 bg-cyan-900/20 text-cyan-400 font-dm text-xs tracking-[0.2em] uppercase border border-cyan-500/30 cursor-pointer hover:bg-cyan-900/30 transition-all">
                  Mark Ready
                </button>
              )}
              {isAdminOrAbove && editingPostId && !showTimingPanel && (
                <button onClick={openTimingPanel} className="px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer">
                  Publish Everywhere
                </button>
              )}
              {editingPostId && (
                <button onClick={() => { setPreview(null); setEditingPostId(null); setPhotos([]); setShowTimingPanel(false) }} className="px-6 py-2.5 bg-transparent text-sea-blue font-dm text-xs tracking-[0.2em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold transition-all">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Past Posts */}
      <h3 className="font-cormorant text-lg text-sea-white mb-3">Past Posts</h3>
      <div className="space-y-2">
        {posts.map((post) => {
          const badge = getStatusBadge(post)
          const isExpanded = expandedPostId === post.id
          return (
            <div key={post.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                className="w-full p-3 flex items-center gap-3 bg-transparent border-none cursor-pointer text-left min-h-[56px]"
              >
                {post.images?.[0] && (
                  <img src={post.images[0]} alt="" className="w-[80px] h-[80px] object-cover rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-sea-white font-dm truncate">{post.title}</p>
                  <p className="text-[0.65rem] text-sea-blue font-dm">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                {post.social_posted_at && <span className="text-[0.55rem] font-dm px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400 flex-shrink-0">Social</span>}
              </button>
              {isExpanded && (
                <div className="border-t border-sea-gold/10 p-3 space-y-3">
                  {post.images?.[0] && (
                    <img src={post.images[0]} alt="" className="w-full max-w-sm rounded" />
                  )}
                  {post.excerpt && <p className="text-xs text-sea-blue font-dm leading-relaxed">{post.excerpt}</p>}
                  <div className="text-sm text-sea-light font-dm leading-relaxed line-clamp-4" dangerouslySetInnerHTML={{ __html: post.body?.slice(0, 500) || '' }} />
                  <div className="flex gap-2 flex-wrap">
                    {!post.is_published && post.status !== 'published' && (
                      <button onClick={() => handleEditPost(post)} className="px-4 min-h-[44px] text-xs text-sea-gold bg-transparent border border-sea-gold/20 rounded cursor-pointer hover:bg-sea-gold/10 transition-all font-dm">Edit</button>
                    )}
                    {isAdminOrAbove && (
                      <button onClick={() => handleDeletePost(post.id)} className="px-4 min-h-[44px] text-xs text-sea-rose bg-transparent border border-sea-rose/20 rounded cursor-pointer hover:bg-red-900/10 transition-all font-dm">Delete</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {posts.length === 0 && <p className="text-center py-6 text-sea-blue text-sm font-dm">No posts yet.</p>}
      </div>

      {/* Blog Seeds */}
      <div className="mt-8">
        <h3 className="font-cormorant text-lg text-sea-white mb-3">Blog Seeds</h3>
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
                <p className="text-sm text-sea-white font-dm truncate">{seed.title}</p>
                <p className="text-[0.65rem] text-sea-blue/50 font-dm">{seed.primary_keyword}</p>
              </div>
              <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded flex-shrink-0 ${
                seed.status === 'drafted' ? 'bg-green-900/30 text-green-400' : 'bg-sea-gold/10 text-sea-gold'
              }`}>{seed.status}</span>
              {seed.status === 'imported' && (
                <button
                  onClick={() => handleGenerateFromSeed(seed.id)}
                  disabled={generatingSeed === seed.id}
                  className="text-xs text-sea-gold bg-transparent border border-sea-gold/20 rounded px-3 py-1.5 cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50 font-dm flex-shrink-0 min-h-[44px]"
                >
                  {generatingSeed === seed.id ? 'Generating...' : 'Generate Draft'}
                </button>
              )}
            </div>
          ))}
          {seeds.length === 0 && <p className="text-center py-4 text-sea-blue text-xs font-dm">No blog seeds. Import a content pack to get started.</p>}
        </div>
      </div>

      {/* Blog Ideas */}
      <div className="mt-8">
        <h3 className="font-cormorant text-lg text-sea-white mb-3">Blog Ideas</h3>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
          <button onClick={handleGetBlogIdeas} disabled={loadingIdeas} className="px-5 py-2.5 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all disabled:opacity-50">
            {loadingIdeas ? 'Thinking...' : 'Get Blog Ideas'}
          </button>
          {blogIdeas.length > 0 && (
            <div className="mt-4 space-y-3">
              {blogIdeas.map((idea, i) => (
                <div key={i} className="border border-sea-gold/10 rounded p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-sea-white font-dm">{idea.title}</p>
                    <p className="text-xs text-sea-blue font-dm mt-1">{idea.description}</p>
                    <p className="text-[0.6rem] text-sea-gold/60 font-dm mt-1">Target: {idea.target_keyword}</p>
                  </div>
                  <button
                    onClick={() => {
                      setRawInput(idea.title + (idea.description ? '. ' + idea.description : ''))
                      setFocusKeyword(idea.target_keyword || '')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                      toast.success('Loaded into blog creator')
                    }}
                    className="px-4 py-2 min-h-[44px] bg-transparent text-sea-gold font-dm text-xs tracking-[0.15em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all flex-shrink-0"
                  >
                    Use This
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Writing Style */}
      <div className="mt-8">
        <button
          onClick={() => setShowStyle(!showStyle)}
          className="flex items-center gap-2 text-sm text-sea-blue font-dm bg-transparent border-none cursor-pointer hover:text-sea-gold transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showStyle ? 'rotate-90' : ''}`}>
            <path d="M9 18l6-6-6-6" />
          </svg>
          AI Writing Style
        </button>
        {showStyle && (
          <div className="mt-3 bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 space-y-4">
            <p className="text-xs text-sea-blue font-dm">These settings guide the AI when generating blog posts.</p>
            {[
              { key: 'seo_keywords', label: 'SEO Keywords & Topics', placeholder: 'Dogpatch, craft cocktails, dog-friendly, jukebox...' },
              { key: 'blog_tone_notes', label: 'Tone & Style Notes', placeholder: 'Topics to emphasize, phrases to use, things to avoid...' },
            ].map(({ key, label, placeholder }) => {
              const isEditing = key in styleEditing
              return (
                <div key={key}>
                  <label className="block text-xs text-sea-blue mb-1 font-dm">{label}</label>
                  <textarea
                    value={isEditing ? styleEditing[key] : styleSettings[key] || ''}
                    onChange={(e) => setStyleEditing({ ...styleEditing, [key]: e.target.value })}
                    onFocus={() => { if (!isEditing) setStyleEditing({ ...styleEditing, [key]: styleSettings[key] || '' }) }}
                    rows={2}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded resize-y"
                  />
                  {isEditing && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => saveStyleSetting(key)} disabled={savingStyle === key} className="px-4 py-2 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all rounded disabled:opacity-50 min-h-[44px]">
                        {savingStyle === key ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setStyleEditing(prev => { const n = { ...prev }; delete n[key]; return n })} className="px-4 py-2 bg-transparent text-sea-blue font-dm text-xs tracking-[0.15em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold transition-all rounded min-h-[44px]">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Publishing Defaults */}
      {isAdminOrAbove && (
        <div className="mt-8">
          <button
            onClick={() => { setShowDefaults(!showDefaults); if (!defaultsLoadedRef.current) loadPublishDefaults() }}
            className="flex items-center gap-2 text-sm text-sea-blue font-dm bg-transparent border-none cursor-pointer hover:text-sea-gold transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showDefaults ? 'rotate-90' : ''}`}>
              <path d="M9 18l6-6-6-6" />
            </svg>
            Publishing Defaults
          </button>
          {showDefaults && (
            <div className="mt-3 bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 space-y-5">
              <p className="text-xs text-sea-blue font-dm">These defaults pre-fill the Campaign Timing panel when you publish.</p>

              {/* Blog cadence */}
              <div>
                <label className="block text-xs text-sea-blue mb-2 font-dm">Blog usually goes out</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['now', 'schedule'].map(opt => (
                    <button key={opt} onClick={() => setDefaults(d => ({ ...d, blog_default_mode: opt }))}
                      className={`min-h-[44px] px-3 py-1.5 text-[0.65rem] font-dm tracking-[0.1em] uppercase rounded border cursor-pointer transition-all ${
                        defaults.blog_default_mode === opt ? 'bg-sea-gold/15 border-sea-gold/40 text-sea-gold' : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
                      }`}>{opt}</button>
                  ))}
                </div>
                {defaults.blog_default_mode === 'schedule' && (
                  <div className="flex flex-wrap gap-2">
                    <select value={defaults.blog_default_day_of_week} onChange={e => setDefaults(d => ({ ...d, blog_default_day_of_week: e.target.value }))}
                      className="min-h-[44px] px-3 py-2 text-xs font-dm bg-sea-dark border border-sea-gold/20 rounded text-sea-blue outline-none" style={{ colorScheme: 'dark' }}>
                      {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                    <input type="time" value={defaults.blog_default_time_local} onChange={e => setDefaults(d => ({ ...d, blog_default_time_local: e.target.value }))}
                      className="min-h-[44px] px-3 py-2 text-xs font-dm bg-sea-dark border border-sea-gold/20 rounded text-sea-blue outline-none" style={{ colorScheme: 'dark' }} />
                  </div>
                )}
              </div>

              {/* Social cadence */}
              <div>
                <label className="block text-xs text-sea-blue mb-2 font-dm">Social usually goes out</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['skip', 'now', 'schedule'].map(opt => (
                    <button key={opt} onClick={() => setDefaults(d => ({ ...d, social_default_mode: opt }))}
                      className={`min-h-[44px] px-3 py-1.5 text-[0.65rem] font-dm tracking-[0.1em] uppercase rounded border cursor-pointer transition-all ${
                        defaults.social_default_mode === opt ? 'bg-sea-gold/15 border-sea-gold/40 text-sea-gold' : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
                      }`}>{opt}</button>
                  ))}
                </div>
                {defaults.social_default_mode === 'schedule' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-sea-blue font-dm">Delay</label>
                    <input type="number" min="0" max="14" value={defaults.social_default_delay_days} onChange={e => setDefaults(d => ({ ...d, social_default_delay_days: e.target.value }))}
                      className="min-h-[44px] w-16 px-3 py-2 text-xs font-dm bg-sea-dark border border-sea-gold/20 rounded text-sea-blue outline-none" style={{ colorScheme: 'dark' }} />
                    <span className="text-xs text-sea-blue font-dm">days at</span>
                    <input type="time" value={defaults.social_default_time_local} onChange={e => setDefaults(d => ({ ...d, social_default_time_local: e.target.value }))}
                      className="min-h-[44px] px-3 py-2 text-xs font-dm bg-sea-dark border border-sea-gold/20 rounded text-sea-blue outline-none" style={{ colorScheme: 'dark' }} />
                  </div>
                )}
              </div>

              {/* Newsletter cadence */}
              <div>
                <label className="block text-xs text-sea-blue mb-2 font-dm">Newsletter usually</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['skip', 'draft', 'schedule'].map(opt => (
                    <button key={opt} onClick={() => setDefaults(d => ({ ...d, newsletter_default_mode: opt }))}
                      className={`min-h-[44px] px-3 py-1.5 text-[0.65rem] font-dm tracking-[0.1em] uppercase rounded border cursor-pointer transition-all ${
                        defaults.newsletter_default_mode === opt ? 'bg-sea-gold/15 border-sea-gold/40 text-sea-gold' : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
                      }`}>{opt}</button>
                  ))}
                </div>
                {defaults.newsletter_default_mode === 'schedule' && (
                  <div className="flex flex-wrap gap-2">
                    <select value={defaults.newsletter_default_day_of_week} onChange={e => setDefaults(d => ({ ...d, newsletter_default_day_of_week: e.target.value }))}
                      className="min-h-[44px] px-3 py-2 text-xs font-dm bg-sea-dark border border-sea-gold/20 rounded text-sea-blue outline-none" style={{ colorScheme: 'dark' }}>
                      {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                    <input type="time" value={defaults.newsletter_default_time_local} onChange={e => setDefaults(d => ({ ...d, newsletter_default_time_local: e.target.value }))}
                      className="min-h-[44px] px-3 py-2 text-xs font-dm bg-sea-dark border border-sea-gold/20 rounded text-sea-blue outline-none" style={{ colorScheme: 'dark' }} />
                  </div>
                )}
              </div>

              <button
                onClick={async () => {
                  setSavingDefaults(true)
                  try {
                    const keys = [
                      { key: 'blog_default_mode', value: defaults.blog_default_mode },
                      { key: 'blog_default_day_of_week', value: defaults.blog_default_day_of_week },
                      { key: 'blog_default_time_local', value: defaults.blog_default_time_local },
                      { key: 'social_default_mode', value: defaults.social_default_mode },
                      { key: 'social_default_delay_days', value: defaults.social_default_delay_days },
                      { key: 'social_default_time_local', value: defaults.social_default_time_local },
                      { key: 'newsletter_default_mode', value: defaults.newsletter_default_mode },
                      { key: 'newsletter_default_day_of_week', value: defaults.newsletter_default_day_of_week },
                      { key: 'newsletter_default_time_local', value: defaults.newsletter_default_time_local },
                    ]
                    for (const s of keys) {
                      const res = await fetch('/api/admin/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(s),
                      })
                      if (!res.ok) { toast.error(`Failed to save ${s.key}`); setSavingDefaults(false); return }
                    }
                    toast.success('Defaults saved')
                    defaultsLoadedRef.current = false // force reload next time
                  } catch {
                    toast.error('Failed to save defaults')
                  } finally {
                    setSavingDefaults(false)
                  }
                }}
                disabled={savingDefaults}
                className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50"
              >
                {savingDefaults ? 'Saving...' : 'Save Defaults'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
