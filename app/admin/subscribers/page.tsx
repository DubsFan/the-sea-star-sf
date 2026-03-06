'use client'

import { useEffect, useState } from 'react'

interface Subscriber {
  id: string
  email: string
  name: string | null
  is_active: boolean
  created_at: string
}

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])

  useEffect(() => {
    fetch('/api/subscribe')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSubscribers(data) })
      .catch(() => {})
  }, [])

  const exportCSV = () => {
    const header = 'Email,Name,Date,Active\n'
    const rows = subscribers.map((s) =>
      `${s.email},${s.name || ''},${new Date(s.created_at).toLocaleDateString()},${s.is_active}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sea-star-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-cormorant text-3xl font-light text-sea-white">Subscribers</h1>
          <p className="text-sm text-sea-blue font-dm mt-1">{subscribers.length} total</p>
        </div>
        <button onClick={exportCSV} className="px-6 py-2.5 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all">
          Export CSV
        </button>
      </div>

      <div className="border border-sea-gold/10 rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sea-gold/10">
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Email</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Name</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Date</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Active</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.id} className="border-b border-sea-gold/5">
                <td className="p-3 text-sm text-sea-white font-dm">{sub.email}</td>
                <td className="p-3 text-sm text-sea-blue font-dm">{sub.name || '-'}</td>
                <td className="p-3 text-xs text-sea-blue font-dm">{new Date(sub.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`text-xs font-dm px-2 py-1 rounded ${sub.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {sub.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscribers.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No subscribers yet.</p>}
      </div>
    </div>
  )
}
