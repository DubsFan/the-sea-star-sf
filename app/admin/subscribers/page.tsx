'use client'

import { useEffect, useState } from 'react'
import { useSession } from '../layout'

interface Subscriber {
  id: string
  email: string
  name: string | null
  is_active: boolean
}

export default function AdminSubscribers() {
  const session = useSession()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  const isAdminOrAbove = session?.role === 'super_admin' || session?.role === 'admin' || session?.role === 'social_admin'

  const loadSubscribers = () => {
    fetch('/api/subscribe')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSubscribers(data) })
      .catch(() => {})
  }

  useEffect(() => { loadSubscribers() }, [])

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/subscribe/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setImportResult(`Imported ${data.imported}, skipped ${data.skipped}`)
        loadSubscribers()
      } else {
        setImportResult(`Error: ${data.error}`)
      }
    } catch {
      setImportResult('Import failed')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const exportCSV = () => {
    const header = 'Email,Name,Active\n'
    const rows = subscribers.map((s) =>
      `${s.email},${s.name || ''},${s.is_active}`
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-cormorant text-3xl font-light text-sea-white">Subscribers</h1>
          <p className="text-sm text-sea-blue font-dm mt-1">{subscribers.length} total</p>
        </div>
        {isAdminOrAbove && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <label className="w-full sm:w-auto px-6 py-2.5 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all text-center">
              {importing ? 'Importing...' : 'Import CSV'}
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" disabled={importing} />
            </label>
            <button onClick={exportCSV} className="w-full sm:w-auto px-6 py-2.5 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all">
              Export CSV
            </button>
          </div>
        )}
        {importResult && (
          <p className={`text-xs font-dm mt-1 ${importResult.startsWith('Error') || importResult === 'Import failed' ? 'text-red-400' : 'text-green-400'}`}>
            {importResult}
          </p>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-sea-gold/10 rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sea-gold/10">
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Email</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Name</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Active</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.id} className="border-b border-sea-gold/5">
                <td className="p-3 text-sm text-sea-white font-dm">{sub.email}</td>
                <td className="p-3 text-sm text-sea-blue font-dm">{sub.name || '-'}</td>
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {subscribers.map((sub) => (
          <div key={sub.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-sea-white font-dm truncate">{sub.email}</p>
                {sub.name && <p className="text-xs text-sea-blue font-dm mt-0.5">{sub.name}</p>}
              </div>
              <span className={`text-[0.6rem] font-dm px-2 py-0.5 rounded ml-2 flex-shrink-0 ${sub.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {sub.is_active ? 'Active' : 'Off'}
              </span>
            </div>
          </div>
        ))}
        {subscribers.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No subscribers yet.</p>}
      </div>
    </div>
  )
}
