'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSession } from '../session-context'

interface BlogPost {
  id: string
  title: string
  slug: string
  body: string
  excerpt: string
  meta_description: string
  images: string[]
  is_published: boolean
  published_at: string | null
  emailed_at: string | null
  social_posted_at: string | null
  created_at: string
}

export default function AdminBlog() {
  const session = useSession()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [rawInput, setRawInput] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<{ title: string; body: string; excerpt: string; meta_description: string } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editingPostId, setEditingPostId] = useState<string | null>(null)

  const isAdminOrAbove = session?.role === 'super_admin' || session?.role === 'admin' || session?.role === 'social_admin'

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
        body: JSON.stringify({ raw_input: rawInput }),
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
      toast.success(isUpdate ? 'Draft updated' : 'Draft saved')
      setPreview(null)
      setEditingPostId(null)
      setRawInput('')
      setPhotos([])
      loadPosts()
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
    else toast.error('Delete failed')
  }

  const handlePublish = async (id: string) => {
    const res = await fetch('/api/blog/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      toast.success('Published & posted to social!')
      loadPosts()
    } else {
      toast.error('Publish failed')
    }
  }

  const getStatus = (post: BlogPost) => {
    if (post.emailed_at) return 'Emailed'
    if (post.is_published) return 'Published'
    return 'Draft'
  }

  const SocialBadge = ({ post }: { post: BlogPost }) => (
    post.social_posted_at ? (
      <span className="text-[0.55rem] font-dm px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400 ml-1" title="Posted to social">Social</span>
    ) : null
  )

  return (
    <div>
      <h1 className="font-cormorant text-3xl font-light text-sea-white mb-8">Blog Creator</h1>

      <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-6 mb-8">
        <label className="block text-xs text-sea-blue mb-2 font-dm">What happened this week?</label>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          rows={4}
          placeholder="Type 5 sentences about what's been happening at The Sea Star..."
          className="w-full px-4 py-3 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none mb-4 placeholder:text-sea-border"
        />

        <div className="mb-4">
          <label className="block text-xs text-sea-blue mb-2 font-dm">Photos (up to 5)</label>
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="text-sm text-sea-blue font-dm" />
          {uploading && <p className="text-xs text-sea-gold mt-1">Uploading...</p>}
          {photos.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {photos.map((url, i) => <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded" />)}
            </div>
          )}
        </div>

        <button onClick={handleGenerate} disabled={generating || !rawInput.trim()} className="w-full sm:w-auto px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50">
          {generating ? 'Generating...' : 'Generate Post'}
        </button>
      </div>

      {preview && (
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-6 mb-8">
          <h2 className="font-cormorant text-2xl text-sea-white mb-4">
            {editingPostId ? 'Editing Draft' : 'Preview'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Title</label>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Body</label>
              <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={10} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none" />
            </div>
            <div>
              <label className="block text-xs text-sea-blue mb-1 font-dm">Rendered Preview</label>
              <div className="bg-[#06080d] border border-sea-gold/5 rounded p-4 md:p-6">
                <h3 className="font-cormorant text-2xl text-sea-white mb-4">{editTitle}</h3>
                <div className="text-sm text-sea-blue font-dm leading-relaxed space-y-3" dangerouslySetInnerHTML={{ __html: editBody }} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleSaveDraft} className="px-6 py-2.5 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all">
                {editingPostId ? 'Update Draft' : 'Save Draft'}
              </button>
              {editingPostId && (
                <button onClick={() => { setPreview(null); setEditingPostId(null); setPhotos([]) }} className="px-6 py-2.5 bg-transparent text-sea-blue font-dm text-xs tracking-[0.2em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold transition-all">
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <h2 className="font-cormorant text-2xl text-sea-white mb-4">Past Posts</h2>

      {/* Desktop Table */}
      <div className="hidden md:block border border-sea-gold/10 rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sea-gold/10">
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Title</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Status</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Date</th>
              <th className="text-right p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-sea-gold/5">
                <td className="p-3 text-sm text-sea-white font-dm">{post.title}</td>
                <td className="p-3">
                  <span className={`text-xs font-dm px-2 py-1 rounded ${getStatus(post) === 'Draft' ? 'bg-yellow-900/30 text-yellow-400' : getStatus(post) === 'Published' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                    {getStatus(post)}
                  </span>
                  <SocialBadge post={post} />
                </td>
                <td className="p-3 text-xs text-sea-blue font-dm">{new Date(post.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right space-x-3">
                  {!post.is_published && (
                    <>
                      <button onClick={() => handleEditPost(post)} className="text-xs text-sea-blue hover:text-sea-gold bg-transparent border-none cursor-pointer font-dm">Edit</button>
                      {isAdminOrAbove && (
                        <button onClick={() => handlePublish(post.id)} className="text-xs text-sea-gold hover:text-sea-gold-light bg-transparent border-none cursor-pointer font-dm">
                          Publish + Email
                        </button>
                      )}
                    </>
                  )}
                  {isAdminOrAbove && (
                    <button onClick={() => handleDeletePost(post.id)} className="text-xs text-sea-rose hover:text-red-400 bg-transparent border-none cursor-pointer font-dm">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No posts yet.</p>}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm text-sea-white font-dm font-medium flex-1 mr-2">{post.title}</h3>
              <div className="flex gap-1 flex-shrink-0">
                <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded ${getStatus(post) === 'Draft' ? 'bg-yellow-900/30 text-yellow-400' : getStatus(post) === 'Published' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                  {getStatus(post)}
                </span>
                <SocialBadge post={post} />
              </div>
            </div>
            <p className="text-xs text-sea-blue font-dm mb-3">{new Date(post.created_at).toLocaleDateString()}</p>
            <div className="flex flex-wrap gap-3">
              {!post.is_published && (
                <>
                  <button onClick={() => handleEditPost(post)} className="text-xs text-sea-blue hover:text-sea-gold bg-transparent border-none cursor-pointer font-dm">Edit</button>
                  {isAdminOrAbove && (
                    <button onClick={() => handlePublish(post.id)} className="text-xs text-sea-gold bg-transparent border-none cursor-pointer font-dm">Publish + Email</button>
                  )}
                </>
              )}
              {isAdminOrAbove && (
                <button onClick={() => handleDeletePost(post.id)} className="text-xs text-sea-rose bg-transparent border-none cursor-pointer font-dm">Delete</button>
              )}
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No posts yet.</p>}
      </div>
    </div>
  )
}
