'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface SocialCampaign {
  id: string; content_type: string; facebook_caption: string; instagram_caption: string
  image_url: string; status: string; posted_at: string | null; created_at: string
}

export default function SocialTab() {
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([])
  const [input, setInput] = useState('')
  const [fbCaption, setFbCaption] = useState('')
  const [igCaption, setIgCaption] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [posting, setPosting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const loadCampaigns = async () => {
    const res = await fetch('/api/social', { credentials: 'include' })
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
    const res = await fetch('/api/menu/upload', { credentials: 'include', method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) setImageUrl(data.url)
    setUploading(false)
  }

  const handleSaveSocialDraft = async (markReady = false) => {
    if (!fbCaption && !igCaption) return toast.error('Generate captions first')
    setPosting(true)
    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content_type: 'standalone',
          facebook_caption: fbCaption,
          instagram_caption: igCaption,
          image_url: imageUrl || null,
          status: markReady ? 'ready' : 'draft',
        }),
      })
      if (res.ok) {
        toast.success(markReady ? 'Saved & marked ready' : 'Draft saved')
        setInput(''); setFbCaption(''); setIgCaption(''); setImageUrl('')
        loadCampaigns()
      }
    } finally {
      setPosting(false)
    }
  }

  const handlePostNow = async () => {
    if (!fbCaption && !igCaption) return toast.error('Generate captions first')
    setPosting(true)
    try {
      const createRes = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content_type: 'standalone',
          facebook_caption: fbCaption,
          instagram_caption: igCaption,
          image_url: imageUrl || null,
        }),
      })
      const campaign = await createRes.json()

      const postRes = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => handleSaveSocialDraft(false)} disabled={posting} className="px-6 py-2.5 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all disabled:opacity-50">
                Save Draft
              </button>
              <button onClick={() => handleSaveSocialDraft(true)} disabled={posting} className="px-6 py-2.5 bg-cyan-900/20 text-cyan-400 font-dm text-xs tracking-[0.2em] uppercase border border-cyan-500/30 cursor-pointer hover:bg-cyan-900/30 transition-all disabled:opacity-50">
                Mark Ready
              </button>
              <button onClick={handlePostNow} disabled={posting} className="px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50">
                {posting ? 'Posting...' : 'Post Now'}
              </button>
            </div>
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
              c.status === 'ready' ? 'bg-cyan-900/30 text-cyan-400' :
              'bg-sea-gold/10 text-sea-gold'
            }`}>{c.status}</span>
          </div>
        ))}
        {campaigns.length === 0 && <p className="text-center py-6 text-sea-blue text-sm font-dm">No social posts yet.</p>}
      </div>
    </div>
  )
}
