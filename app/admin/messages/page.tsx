'use client'

import { useEffect, useState } from 'react'

interface Message {
  id: string
  name: string
  email: string
  message: string
  is_read: boolean
  created_at: string
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([])

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/contact', { credentials: 'include' })
      const data = await res.json()
      if (Array.isArray(data)) setMessages(data)
    } catch {}
  }

  useEffect(() => { loadMessages() }, [])

  const markRead = async (id: string) => {
    await fetch('/api/contact', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_read: true }),
    })
    loadMessages()
  }

  const unread = messages.filter((m) => !m.is_read).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cormorant text-3xl font-light text-sea-white">Messages</h1>
        {unread > 0 && <p className="text-sm text-sea-rose font-dm mt-1">{unread} unread</p>}
      </div>

      <div className="space-y-3 md:space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`border rounded-lg p-4 md:p-6 transition-all ${msg.is_read ? 'border-sea-gold/5 bg-[#0a0e18]' : 'border-sea-gold/20 bg-sea-gold/[0.02]'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 mb-3">
              <div>
                <span className="font-dm text-sm text-sea-white font-medium">{msg.name}</span>
                <span className="text-xs text-sea-blue font-dm block sm:inline sm:ml-3">{msg.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-sea-blue font-dm">{new Date(msg.created_at).toLocaleDateString()}</span>
                {!msg.is_read && (
                  <button onClick={() => markRead(msg.id)} className="text-xs text-sea-gold hover:text-sea-gold-light bg-transparent border-none cursor-pointer font-dm">
                    Mark Read
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-sea-blue leading-relaxed font-dm">{msg.message}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No messages yet.</p>}
      </div>
    </div>
  )
}
