'use client'

import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import ChannelRow from './ChannelRow'
import MediaPicker from './MediaPicker'

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
  const [publishActions, setPublishActions] = useState({ site: 'now', social: 'skip', mailer: 'skip' })
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)

  // Blog Seeds
  const [seeds, setSeeds] = useState<BlogSeed[]>([])
  const [seedFilter, setSeedFilter] = useState<'imported' | 'drafted' | 'all'>('imported')
  const [generatingSeed, setGeneratingSeed] = useState<string | null>(null)

  // AI Writing Style
  const [showStyle, setShowStyle] = useState(false)
  const [styleSettings, setStyleSettings] = useState<Record<string, string>>({})
  const [styleEditing, setStyleEditing] = useState<Record<string, string>>({})
  const [savingStyle, setSavingStyle] = useState<string | null>(null)

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
          if (s.key === 'blog_keywords' || s.key === 'blog_tone_notes') map[s.key] = s.value
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
    setPublishing(true)
    try {
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          site: { action: publishActions.site },
          social: { action: publishActions.social },
          mailer: { action: publishActions.mailer, hero_image: !useSourceImage && mailerHeroImage ? mailerHeroImage : undefined },
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

            {/* Publish Channel Actions */}
            {isAdminOrAbove && editingPostId && (
              <div className="border-t border-sea-gold/10 pt-4">
                <label className="block text-xs text-sea-blue mb-3 font-dm tracking-[0.1em] uppercase">Publish Channels</label>
                <div className="space-y-2">
                  <ChannelRow label="Website" value={publishActions.site} onChange={(v) => setPublishActions(a => ({ ...a, site: v }))} />
                  <ChannelRow label="Social Media" value={publishActions.social} onChange={(v) => setPublishActions(a => ({ ...a, social: v }))} />
                  <ChannelRow label="Email Newsletter" value={publishActions.mailer} onChange={(v) => setPublishActions(a => ({ ...a, mailer: v }))} />
                  {publishActions.mailer !== 'skip' && (
                    <div className="ml-0 sm:ml-28 mt-2 space-y-2">
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
                </div>
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
              { key: 'blog_keywords', label: 'Preferred Keywords & Topics', placeholder: 'Dogpatch, craft cocktails, dog-friendly, jukebox...' },
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
    </div>
  )
}
