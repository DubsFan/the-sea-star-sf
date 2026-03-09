'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useSession } from '../session-context'

type Tab = 'blog' | 'social' | 'events'

export default function CreateHub() {
  const session = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'blog')

  const isAdminOrAbove = session?.role === 'super_admin' || session?.role === 'admin'

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    router.replace(`/admin/create?tab=${tab}`, { scroll: false })
  }

  return (
    <div>
      {/* Tab Pills */}
      <div className="flex gap-2 mb-6">
        {(['blog', 'social', 'events'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`flex-1 py-3 text-xs font-dm tracking-[0.15em] uppercase rounded-lg border transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-sea-gold/10 border-sea-gold/30 text-sea-gold'
                : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
            }`}
          >
            {tab === 'blog' ? 'Blog' : tab === 'social' ? 'Social' : 'Events'}
          </button>
        ))}
      </div>

      {activeTab === 'blog' && <BlogTab isAdminOrAbove={isAdminOrAbove} />}
      {activeTab === 'social' && <SocialTab />}
      {activeTab === 'events' && <EventsTab isAdminOrAbove={isAdminOrAbove} />}
    </div>
  )
}

// ============================================================
// BLOG TAB
// ============================================================
interface BlogPost {
  id: string; title: string; slug: string; body: string; excerpt: string; meta_description: string
  images: string[]; status: string; is_published: boolean; published_at: string | null
  emailed_at: string | null; social_posted_at: string | null; created_at: string
}

function BlogTab({ isAdminOrAbove }: { isAdminOrAbove: boolean }) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [rawInput, setRawInput] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<{ title: string; body: string; excerpt: string; meta_description: string } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishActions, setPublishActions] = useState({ site: 'now', social: 'skip', mailer: 'skip' })

  const loadPosts = async () => {
    const res = await fetch('/api/blog')
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
      const res = await fetch('/api/menu/upload', { method: 'POST', body: formData })
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
    setPublishing(true)
    try {
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          site: { action: publishActions.site },
          social: { action: publishActions.social },
          mailer: { action: publishActions.mailer },
        }),
      })
      if (res.ok) {
        toast.success('Published!')
        setPreview(null)
        setEditingPostId(null)
        setRawInput('')
        setPhotos([])
        setPublishActions({ site: 'now', social: 'skip', mailer: 'skip' })
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

  const getStatusBadge = (post: BlogPost) => {
    if (post.status === 'scheduled') return { label: 'Scheduled', cls: 'bg-yellow-900/30 text-yellow-400' }
    if (post.is_published || post.status === 'published') return { label: 'Published', cls: 'bg-green-900/30 text-green-400' }
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
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="text-sm text-sea-blue font-dm" />
          {uploading && <p className="text-xs text-sea-gold mt-1">Uploading...</p>}
          {photos.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {photos.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-16 h-16 object-cover rounded" />
                  <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center border-none cursor-pointer">×</button>
                </div>
              ))}
            </div>
          )}
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

            {/* Publish Channel Actions */}
            {isAdminOrAbove && editingPostId && (
              <div className="border-t border-sea-gold/10 pt-4">
                <label className="block text-xs text-sea-blue mb-3 font-dm tracking-[0.1em] uppercase">Publish Channels</label>
                <div className="space-y-2">
                  <ChannelRow label="Website" value={publishActions.site} onChange={(v) => setPublishActions(a => ({ ...a, site: v }))} />
                  <ChannelRow label="Social Media" value={publishActions.social} onChange={(v) => setPublishActions(a => ({ ...a, social: v }))} />
                  <ChannelRow label="Email Newsletter" value={publishActions.mailer} onChange={(v) => setPublishActions(a => ({ ...a, mailer: v }))} />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleSaveDraft} className="px-6 py-2.5 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all">
                {editingPostId ? 'Update Draft' : 'Save Draft'}
              </button>
              {isAdminOrAbove && editingPostId && (
                <button onClick={() => handlePublish(editingPostId)} disabled={publishing} className="px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50">
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              )}
              {editingPostId && (
                <button onClick={() => { setPreview(null); setEditingPostId(null); setPhotos([]) }} className="px-6 py-2.5 bg-transparent text-sea-blue font-dm text-xs tracking-[0.2em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold transition-all">
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
          return (
            <div key={post.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sea-white font-dm truncate">{post.title}</p>
                <p className="text-[0.65rem] text-sea-blue font-dm">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
              {post.social_posted_at && <span className="text-[0.55rem] font-dm px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400 flex-shrink-0">Social</span>}
              {!post.is_published && post.status !== 'published' && (
                <button onClick={() => handleEditPost(post)} className="text-xs text-sea-blue hover:text-sea-gold bg-transparent border-none cursor-pointer font-dm flex-shrink-0">Edit</button>
              )}
              {isAdminOrAbove && (
                <button onClick={() => handleDeletePost(post.id)} className="text-xs text-sea-rose bg-transparent border-none cursor-pointer font-dm flex-shrink-0">Del</button>
              )}
            </div>
          )
        })}
        {posts.length === 0 && <p className="text-center py-6 text-sea-blue text-sm font-dm">No posts yet.</p>}
      </div>
    </div>
  )
}

// ============================================================
// SOCIAL TAB
// ============================================================
interface SocialCampaign {
  id: string; content_type: string; facebook_caption: string; instagram_caption: string
  image_url: string; status: string; posted_at: string | null; created_at: string
}

function SocialTab() {
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([])
  const [input, setInput] = useState('')
  const [fbCaption, setFbCaption] = useState('')
  const [igCaption, setIgCaption] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [posting, setPosting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const loadCampaigns = async () => {
    const res = await fetch('/api/social')
    const data = await res.json()
    if (Array.isArray(data)) setCampaigns(data)
  }

  useEffect(() => { loadCampaigns() }, [])

  const handleGenerate = async () => {
    if (!input.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, platform: 'both', context_type: 'standalone' }),
      })
      const data = await res.json()
      if (data.facebook_caption) setFbCaption(data.facebook_caption)
      if (data.instagram_caption) setIgCaption(data.instagram_caption)
      toast.success('Captions generated!')
    } catch {
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/menu/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) setImageUrl(data.url)
    setUploading(false)
  }

  const handlePostNow = async () => {
    if (!fbCaption && !igCaption) return toast.error('Generate captions first')
    setPosting(true)
    try {
      // Create campaign
      const createRes = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'standalone',
          facebook_caption: fbCaption,
          instagram_caption: igCaption,
          image_url: imageUrl || null,
        }),
      })
      const campaign = await createRes.json()

      // Post it
      const postRes = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaign.id }),
      })
      const results = await postRes.json()

      const fbOk = results.facebook?.success
      const igOk = results.instagram?.success
      if (fbOk || igOk) {
        toast.success(`Posted! FB: ${fbOk ? 'yes' : 'no'}, IG: ${igOk ? 'yes' : 'no'}`)
        setInput(''); setFbCaption(''); setIgCaption(''); setImageUrl('')
        loadCampaigns()
      } else {
        toast.error('Posting failed')
      }
    } finally {
      setPosting(false)
    }
  }

  return (
    <div>
      <h2 className="font-cormorant text-2xl font-light text-sea-white mb-6">Social Post</h2>

      <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-6 mb-6">
        <label className="block text-xs text-sea-blue mb-2 font-dm">What do you want to post about?</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder="E.g., New spring cocktail menu just dropped..."
          className="w-full px-4 py-3 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none mb-3 placeholder:text-sea-border"
        />
        <button onClick={handleGenerate} disabled={generating || !input.trim()} className="w-full sm:w-auto px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50 mb-4">
          {generating ? 'Writing...' : 'Write It For Me'}
        </button>

        {(fbCaption || igCaption) && (
          <div className="space-y-4 mt-4">
            {fbCaption && (
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Facebook Caption</label>
                <textarea value={fbCaption} onChange={(e) => setFbCaption(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none" />
              </div>
            )}
            {igCaption && (
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Instagram Caption</label>
                <textarea value={igCaption} onChange={(e) => setIgCaption(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none" />
              </div>
            )}

            <div>
              <label className="block text-xs text-sea-blue mb-2 font-dm">Image (required for Instagram)</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-sea-blue font-dm" />
              {uploading && <p className="text-xs text-sea-gold mt-1">Uploading...</p>}
              {imageUrl && <img src={imageUrl} alt="" className="w-20 h-20 object-cover rounded mt-2" />}
            </div>

            <button onClick={handlePostNow} disabled={posting} className="w-full sm:w-auto px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50">
              {posting ? 'Posting...' : 'Post Now'}
            </button>
          </div>
        )}
      </div>

      {/* Past Campaigns */}
      <h3 className="font-cormorant text-lg text-sea-white mb-3">Past Social Posts</h3>
      <div className="space-y-2">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sea-light font-dm truncate">{c.facebook_caption || c.instagram_caption || 'No caption'}</p>
              <p className="text-[0.65rem] text-sea-blue font-dm">{c.content_type} &middot; {new Date(c.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded flex-shrink-0 ${
              c.status === 'posted' ? 'bg-green-900/30 text-green-400' :
              c.status === 'failed' ? 'bg-red-900/30 text-red-400' :
              c.status === 'scheduled' ? 'bg-yellow-900/30 text-yellow-400' :
              'bg-sea-gold/10 text-sea-gold'
            }`}>{c.status}</span>
          </div>
        ))}
        {campaigns.length === 0 && <p className="text-center py-6 text-sea-blue text-sm font-dm">No social posts yet.</p>}
      </div>
    </div>
  )
}

// ============================================================
// EVENTS TAB
// ============================================================
interface EventItem {
  id: string; title: string; slug: string; short_description: string; description_html: string
  featured_image: string; starts_at: string; ends_at: string; status: string; is_public: boolean
  recurrence_preset: string; series_id: string | null; created_at: string
}

function EventsTab({ isAdminOrAbove }: { isAdminOrAbove: boolean }) {
  const [events, setEvents] = useState<EventItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', starts_at: '', ends_at: '', short_description: '', description_html: '',
    featured_image: '', is_public: true, recurrence_preset: 'One time', recurs_until: '',
  })
  const [generating, setGenerating] = useState(false)
  const [rawInput, setRawInput] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [publishId, setPublishId] = useState<string | null>(null)
  const [publishActions, setPublishActions] = useState({ site: 'now', social: 'skip', mailer: 'skip' })

  const loadEvents = async () => {
    const res = await fetch('/api/events')
    const data = await res.json()
    if (Array.isArray(data)) setEvents(data)
  }

  useEffect(() => { loadEvents() }, [])

  const handleGenerate = async () => {
    if (!rawInput.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/events/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_input: rawInput }),
      })
      const data = await res.json()
      if (data.title) {
        setForm(f => ({
          ...f,
          title: data.title,
          description_html: data.description_html || '',
          short_description: data.short_description || '',
        }))
        toast.success('Event description generated!')
      }
    } catch {
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/menu/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) setForm(f => ({ ...f, featured_image: data.url }))
  }

  const handleCreate = async () => {
    if (!form.title || !form.starts_at) return toast.error('Title and start date required')
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Event created!')
      setShowForm(false)
      setForm({ title: '', starts_at: '', ends_at: '', short_description: '', description_html: '', featured_image: '', is_public: true, recurrence_preset: 'One time', recurs_until: '' })
      setRawInput('')
      loadEvents()
    } else {
      toast.error('Failed to create event')
    }
  }

  const handlePublish = async (eventId: string) => {
    setPublishing(true)
    try {
      const res = await fetch('/api/events/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          site: { action: publishActions.site },
          social: { action: publishActions.social },
          mailer: { action: publishActions.mailer },
        }),
      })
      if (res.ok) {
        toast.success('Event published!')
        setPublishId(null)
        setPublishActions({ site: 'now', social: 'skip', mailer: 'skip' })
        loadEvents()
      }
    } finally {
      setPublishing(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast.success('Deleted')
    loadEvents()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-cormorant text-2xl font-light text-sea-white">Events</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer">
          + New Event
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-6 mb-6 space-y-4">
          {/* AI Generate */}
          <div>
            <label className="block text-xs text-sea-blue mb-1 font-dm">Describe the event (AI writes the rest)</label>
            <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} rows={2} placeholder="Live music Tuesday with DJ Rodriguez..." className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none placeholder:text-sea-border" />
            <button onClick={handleGenerate} disabled={generating || !rawInput.trim()} className="mt-2 px-4 py-2 bg-transparent text-sea-gold font-dm text-xs tracking-[0.15em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50">
              {generating ? 'Generating...' : 'Write It For Me'}
            </button>
          </div>

          <div>
            <label className="block text-xs text-sea-blue mb-1 font-dm">Event Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Start Date/Time</label>
              <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">End Date/Time</label>
              <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm(f => ({ ...f, ends_at: e.target.value }))} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-sea-blue mb-1 font-dm">Short Description (card text)</label>
            <input type="text" value={form.short_description} onChange={(e) => setForm(f => ({ ...f, short_description: e.target.value }))} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
          </div>

          <div>
            <label className="block text-xs text-sea-blue mb-1 font-dm">Full Description</label>
            <textarea value={form.description_html} onChange={(e) => setForm(f => ({ ...f, description_html: e.target.value }))} rows={4} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none" />
          </div>

          <div>
            <label className="block text-xs text-sea-blue mb-2 font-dm">Event Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-sea-blue font-dm" />
            {form.featured_image && <img src={form.featured_image} alt="" className="w-20 h-20 object-cover rounded mt-2" />}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Recurrence</label>
              <select value={form.recurrence_preset} onChange={(e) => setForm(f => ({ ...f, recurrence_preset: e.target.value }))} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold">
                <option value="One time">One time</option>
                <option value="Weekly">Weekly</option>
                <option value="Every 2 weeks">Every 2 weeks</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            {form.recurrence_preset !== 'One time' && (
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Recur Until</label>
                <input type="date" value={form.recurs_until} onChange={(e) => setForm(f => ({ ...f, recurs_until: e.target.value }))} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={(e) => setForm(f => ({ ...f, is_public: e.target.checked }))} className="w-4 h-4" />
            <span className="text-sm text-sea-blue font-dm">Public event (shown on website)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} className="px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer">
              Create Event
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-transparent text-sea-blue font-dm text-xs tracking-[0.2em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-2">
        {events.map((event) => {
          const isPast = new Date(event.starts_at) < new Date()
          return (
            <div key={event.id} className={`bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-3 ${isPast ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-sea-white font-dm truncate">{event.title}</p>
                  <p className="text-[0.65rem] text-sea-blue font-dm">
                    {new Date(event.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {event.recurrence_preset !== 'One time' && ` · ${event.recurrence_preset}`}
                  </p>
                </div>
                <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded flex-shrink-0 ${
                  event.status === 'published' ? 'bg-green-900/30 text-green-400' :
                  event.status === 'archived' ? 'bg-gray-800/50 text-gray-500' :
                  event.status === 'scheduled' ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-sea-gold/10 text-sea-gold'
                }`}>{event.status}</span>
                {event.status === 'draft' && isAdminOrAbove && (
                  <button onClick={() => { setPublishId(publishId === event.id ? null : event.id) }} className="text-xs text-sea-gold bg-transparent border-none cursor-pointer font-dm flex-shrink-0">
                    Publish
                  </button>
                )}
                {isAdminOrAbove && (
                  <button onClick={() => handleDelete(event.id)} className="text-xs text-sea-rose bg-transparent border-none cursor-pointer font-dm flex-shrink-0">Del</button>
                )}
              </div>

              {/* Publish panel */}
              {publishId === event.id && (
                <div className="mt-3 pt-3 border-t border-sea-gold/10 space-y-2">
                  <ChannelRow label="Website" value={publishActions.site} onChange={(v) => setPublishActions(a => ({ ...a, site: v }))} />
                  <ChannelRow label="Social Media" value={publishActions.social} onChange={(v) => setPublishActions(a => ({ ...a, social: v }))} />
                  <ChannelRow label="Email Newsletter" value={publishActions.mailer} onChange={(v) => setPublishActions(a => ({ ...a, mailer: v }))} />
                  <button onClick={() => handlePublish(event.id)} disabled={publishing} className="mt-2 px-4 py-2 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50">
                    {publishing ? 'Publishing...' : 'Confirm Publish'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {events.length === 0 && <p className="text-center py-6 text-sea-blue text-sm font-dm">No events yet.</p>}
      </div>
    </div>
  )
}

// ============================================================
// SHARED: Channel Row
// ============================================================
function ChannelRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-sea-blue font-dm w-28 flex-shrink-0">{label}</span>
      <div className="flex gap-1">
        {['skip', 'now', 'schedule'].map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 text-[0.65rem] font-dm tracking-[0.1em] uppercase rounded border cursor-pointer transition-all ${
              value === opt
                ? 'bg-sea-gold/15 border-sea-gold/40 text-sea-gold'
                : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
