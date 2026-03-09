'use client'

import { useEffect, useState } from 'react'
import { useSession } from '../session-context'

interface Subscriber {
  id: string
  email: string
  name: string | null
  is_active: boolean
}

export default function SubscribersTab() {
  const session = useSession()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ email: '', name: '', is_active: true })
  const [savingEdit, setSavingEdit] = useState(false)

  const isAdminOrAbove = session?.role === 'super_admin' || session?.role === 'admin' || session?.role === 'social_admin'

  const loadSubscribers = () => {
    fetch('/api/subscribe', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSubscribers(data)
        setSelected(new Set())
      })
      .catch(() => {})
  }

  useEffect(() => { loadSubscribers() }, [])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === subscribers.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(subscribers.map((s) => s.id)))
    }
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    const count = selected.size
    if (!confirm(`Delete ${count} subscriber${count > 1 ? 's' : ''}?`)) return
    setDeleting(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      if (res.ok) loadSubscribers()
    } catch {} finally {
      setDeleting(false)
    }
  }

  const startEdit = (sub: Subscriber) => {
    setEditingId(sub.id)
    setEditForm({ email: sub.email, name: sub.name || '', is_active: sub.is_active })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async () => {
    if (!editingId) return
    setSavingEdit(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      })
      if (res.ok) {
        setEditingId(null)
        loadSubscribers()
      }
    } catch {} finally {
      setSavingEdit(false)
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/subscribe/import', { credentials: 'include', method: 'POST', body: formData })
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

  const activeCount = subscribers.filter((s) => s.is_active).length
  const inactiveCount = subscribers.length - activeCount

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex gap-3 mt-1">
            <span className="text-sm text-sea-blue font-dm">{subscribers.length} total</span>
            <span className="text-sm text-green-400 font-dm">{activeCount} active</span>
            {inactiveCount > 0 && <span className="text-sm text-red-400 font-dm">{inactiveCount} inactive</span>}
          </div>
        </div>
        {isAdminOrAbove && (
          <div className="flex gap-2 w-full sm:w-auto">
            <label className="flex-1 sm:flex-none px-5 py-3 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all text-center min-h-[44px] flex items-center justify-center">
              {importing ? 'Importing...' : 'Import CSV'}
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" disabled={importing} />
            </label>
            <button onClick={exportCSV} className="flex-1 sm:flex-none px-5 py-3 bg-transparent text-sea-gold font-dm text-xs tracking-[0.2em] uppercase border border-sea-gold cursor-pointer hover:bg-sea-gold/10 transition-all min-h-[44px]">
              Export CSV
            </button>
          </div>
        )}
      </div>

      {importResult && (
        <p className={`text-xs font-dm mb-4 ${importResult.startsWith('Error') || importResult === 'Import failed' ? 'text-red-400' : 'text-green-400'}`}>
          {importResult}
        </p>
      )}

      {selected.size > 0 && isAdminOrAbove && (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 mb-4 px-4 py-3 bg-[#0d1220] border border-sea-gold/20 rounded">
          <span className="text-sm text-sea-gold font-dm">{selected.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="px-4 py-2.5 min-h-[44px] text-xs text-sea-blue font-dm hover:text-sea-white transition-colors cursor-pointer border border-sea-gold/10 rounded"
            >
              Clear
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2.5 min-h-[44px] bg-red-900/40 text-red-400 font-dm text-xs tracking-[0.15em] uppercase border border-red-400/30 rounded cursor-pointer hover:bg-red-900/60 transition-all disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block border border-sea-gold/10 rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sea-gold/10">
              {isAdminOrAbove && (
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    checked={subscribers.length > 0 && selected.size === subscribers.length}
                    onChange={toggleAll}
                    className="accent-sea-gold cursor-pointer"
                  />
                </th>
              )}
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Email</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Name</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Active</th>
              {isAdminOrAbove && (
                <th className="w-16 p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Edit</th>
              )}
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.id} className={`border-b border-sea-gold/5 ${selected.has(sub.id) ? 'bg-sea-gold/5' : ''}`}>
                {isAdminOrAbove && (
                  <td className="w-10 p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(sub.id)}
                      onChange={() => toggleSelect(sub.id)}
                      className="accent-sea-gold cursor-pointer"
                    />
                  </td>
                )}
                {editingId === sub.id ? (
                  <>
                    <td className="p-3">
                      <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-2 py-1.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded" />
                    </td>
                    <td className="p-3">
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-2 py-1.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded" />
                    </td>
                    <td className="p-3">
                      <button onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })} className={`text-xs font-dm px-2 py-1 rounded cursor-pointer border-none ${editForm.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {editForm.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={saveEdit} disabled={savingEdit} className="text-xs text-sea-gold font-dm cursor-pointer bg-transparent border-none hover:text-sea-gold-light">{savingEdit ? '...' : 'Save'}</button>
                        <button onClick={cancelEdit} className="text-xs text-sea-blue font-dm cursor-pointer bg-transparent border-none hover:text-sea-white">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 text-sm text-sea-white font-dm">{sub.email}</td>
                    <td className="p-3 text-sm text-sea-blue font-dm">{sub.name || '-'}</td>
                    <td className="p-3">
                      <span className={`text-xs font-dm px-2 py-1 rounded ${sub.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdminOrAbove && (
                      <td className="p-3">
                        <button onClick={() => startEdit(sub)} className="text-xs text-sea-blue font-dm cursor-pointer bg-transparent border-none hover:text-sea-gold transition-colors">Edit</button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {subscribers.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No subscribers yet.</p>}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {isAdminOrAbove && subscribers.length > 0 && (
          <button
            onClick={toggleAll}
            className="w-full py-3 mb-3 text-xs text-sea-blue font-dm tracking-[0.15em] uppercase border border-sea-gold/10 rounded min-h-[44px]"
          >
            {selected.size === subscribers.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
        <div className="space-y-2">
          {subscribers.map((sub) => (
            <div
              key={sub.id}
              className={`bg-[#0a0e18] border rounded-lg overflow-hidden ${selected.has(sub.id) ? 'border-sea-gold/40 bg-sea-gold/5' : 'border-sea-gold/10'}`}
            >
              <div
                onClick={() => editingId !== sub.id && isAdminOrAbove && toggleSelect(sub.id)}
                className={`p-4 min-h-[56px] active:bg-sea-gold/10 ${isAdminOrAbove && editingId !== sub.id ? 'cursor-pointer' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {isAdminOrAbove && (
                      <input
                        type="checkbox"
                        checked={selected.has(sub.id)}
                        onChange={() => toggleSelect(sub.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-sea-gold cursor-pointer w-5 h-5 flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-sea-white font-dm truncate">{sub.email}</p>
                      {sub.name && <p className="text-xs text-sea-blue font-dm mt-0.5">{sub.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className={`text-[0.6rem] font-dm px-2 py-1 rounded ${sub.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {sub.is_active ? 'Active' : 'Off'}
                    </span>
                    {isAdminOrAbove && (
                      <button
                        onClick={(e) => { e.stopPropagation(); editingId === sub.id ? cancelEdit() : startEdit(sub) }}
                        className="w-[44px] h-[44px] flex items-center justify-center text-sea-blue bg-transparent border border-sea-gold/10 rounded cursor-pointer hover:text-sea-gold hover:border-sea-gold/30 transition-colors"
                      >
                        {editingId === sub.id ? 'X' : 'Edit'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {editingId === sub.id && (
                <div className="px-4 pb-4 pt-2 border-t border-sea-gold/10 space-y-3">
                  <div>
                    <label className="text-[0.6rem] tracking-[0.15em] uppercase text-sea-blue font-dm mb-1 block">Email</label>
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[0.6rem] tracking-[0.15em] uppercase text-sea-blue font-dm mb-1 block">Name</label>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[0.6rem] tracking-[0.15em] uppercase text-sea-blue font-dm">Status</label>
                    <button
                      onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                      className={`text-xs font-dm px-3 py-2 rounded cursor-pointer border-none min-h-[44px] ${editForm.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}
                    >
                      {editForm.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveEdit}
                      disabled={savingEdit}
                      className="flex-1 py-2.5 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer rounded disabled:opacity-50"
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 py-2.5 min-h-[44px] bg-transparent text-sea-blue font-dm text-xs tracking-[0.15em] uppercase border border-sea-border cursor-pointer rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {subscribers.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No subscribers yet.</p>}
      </div>
    </div>
  )
}
