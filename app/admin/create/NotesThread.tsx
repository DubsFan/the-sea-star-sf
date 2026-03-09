'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface Note {
  id: string
  author: string
  body: string
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function NotesThread({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadNotes = useCallback(async () => {
    const res = await fetch(`/api/notes?entity_type=${entityType}&entity_id=${entityId}`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setNotes(data)
    }
  }, [entityType, entityId])

  useEffect(() => {
    loadNotes()
    const interval = setInterval(loadNotes, 30000)
    return () => clearInterval(interval)
  }, [loadNotes])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes.length])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, body: input.trim() }),
      })
      if (res.ok) {
        setInput('')
        await loadNotes()
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border border-sea-gold/10 rounded-lg overflow-hidden">
      {/* Notes list */}
      <div className="max-h-64 overflow-y-auto p-3 space-y-3">
        {notes.length === 0 && (
          <p className="text-xs text-sea-blue/50 font-dm text-center py-2">No notes yet. Start the conversation.</p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="group">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-dm font-medium text-sea-gold">{note.author}</span>
              <span className="text-[0.6rem] text-sea-blue/40 font-dm">{timeAgo(note.created_at)}</span>
            </div>
            <p className="text-sm text-sea-light font-dm mt-0.5 leading-relaxed whitespace-pre-wrap">{note.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-sea-gold/10 p-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Add a note..."
          className="flex-1 px-3 py-2.5 bg-transparent border border-sea-gold/10 text-sea-light font-dm text-sm outline-none focus:border-sea-gold/30 rounded min-h-[44px] placeholder:text-sea-border"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="px-4 min-h-[44px] bg-sea-gold/10 text-sea-gold font-dm text-xs tracking-[0.1em] uppercase border border-sea-gold/20 rounded cursor-pointer hover:bg-sea-gold/20 transition-all disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
