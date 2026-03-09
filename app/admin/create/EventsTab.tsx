'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ChannelRow from './ChannelRow'

interface EventItem {
  id: string; title: string; slug: string; short_description: string; description_html: string
  featured_image: string; starts_at: string; ends_at: string; status: string; is_public: boolean
  recurrence_preset: string; series_id: string | null; created_at: string
}

export default function EventsTab({ isAdminOrAbove }: { isAdminOrAbove: boolean }) {
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
    const res = await fetch('/api/events', { credentials: 'include' })
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
    const res = await fetch('/api/menu/upload', { credentials: 'include', method: 'POST', body: formData })
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
                  event.status === 'ready' ? 'bg-cyan-900/30 text-cyan-400' :
                  'bg-sea-gold/10 text-sea-gold'
                }`}>{event.status}</span>
                {event.status === 'draft' && (
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/events', {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                        body: JSON.stringify({ id: event.id, status: 'ready' }),
                      })
                      if (res.ok) { toast.success('Marked as ready'); loadEvents() }
                    }}
                    className="text-xs text-cyan-400 bg-transparent border-none cursor-pointer font-dm flex-shrink-0"
                  >
                    Ready
                  </button>
                )}
                {(event.status === 'draft' || event.status === 'ready') && isAdminOrAbove && (
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
