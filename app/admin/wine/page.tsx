'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSession } from '../layout'

interface WineItem {
  id: string
  name: string
  price: string
  description: string
  tag: string
  sort_order: number
  is_active: boolean
}

export default function AdminWine() {
  const session = useSession()
  const [items, setItems] = useState<WineItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<WineItem | null>(null)
  const [form, setForm] = useState({ name: '', price: '', description: '', tag: 'Glass / Bottle', sort_order: '0' })

  const canDelete = session?.role === 'super_admin' || session?.role === 'admin'

  const loadItems = async () => {
    const res = await fetch('/api/wine')
    const data = await res.json()
    if (Array.isArray(data)) setItems(data)
  }

  useEffect(() => { loadItems() }, [])

  const openForm = (item?: WineItem) => {
    if (item) {
      setEditing(item)
      setForm({ name: item.name, price: item.price, description: item.description || '', tag: item.tag || 'Glass / Bottle', sort_order: String(item.sort_order) })
    } else {
      setEditing(null)
      setForm({ name: '', price: '', description: '', tag: 'Glass / Bottle', sort_order: '0' })
    }
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = { ...form, sort_order: parseInt(form.sort_order), ...(editing ? { id: editing.id } : {}) }
    const res = await fetch('/api/wine', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success(editing ? 'Updated' : 'Added')
      setShowForm(false)
      loadItems()
    } else {
      toast.error('Failed to save')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this wine?')) return
    const res = await fetch('/api/wine', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Deleted'); loadItems() }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-cormorant text-3xl font-light text-sea-white">Wine List</h1>
        <button onClick={() => openForm()} className="px-4 md:px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer">
          + Add Wine
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-sea-gold/10 rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sea-gold/10">
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Name</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Price</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Tag</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Description</th>
              <th className="text-right p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-sea-gold/5 hover:bg-sea-gold/[0.02] transition-all">
                <td className="p-3 text-sm text-sea-white font-dm">{item.name}</td>
                <td className="p-3 text-sm text-sea-gold font-cormorant">{item.price}</td>
                <td className="p-3 text-xs text-sea-blue font-dm">{item.tag}</td>
                <td className="p-3 text-xs text-sea-blue font-dm truncate max-w-[250px]">{item.description}</td>
                <td className="p-3 text-right">
                  <button onClick={() => openForm(item)} className="text-xs text-sea-gold hover:text-sea-gold-light mr-3 bg-transparent border-none cursor-pointer font-dm">Edit</button>
                  {canDelete && <button onClick={() => handleDelete(item.id)} className="text-xs text-sea-rose hover:text-red-400 bg-transparent border-none cursor-pointer font-dm">Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No wines yet.</p>}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm text-sea-white font-dm font-medium">{item.name}</h3>
                <span className="text-xs text-sea-blue font-dm">{item.tag}</span>
              </div>
              <span className="text-sm text-sea-gold font-cormorant">{item.price}</span>
            </div>
            {item.description && <p className="text-xs text-sea-blue font-dm mb-3 line-clamp-2">{item.description}</p>}
            <div className="flex gap-3">
              <button onClick={() => openForm(item)} className="text-xs text-sea-gold bg-transparent border-none cursor-pointer font-dm">Edit</button>
              {canDelete && <button onClick={() => handleDelete(item.id)} className="text-xs text-sea-rose bg-transparent border-none cursor-pointer font-dm">Delete</button>}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No wines yet.</p>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#06080d]/90 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-cormorant text-2xl text-sea-white mb-6">{editing ? 'Edit Wine' : 'Add Wine'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Price (e.g. $14 / $48)</label>
                <input type="text" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Tag</label>
                <input type="text" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" placeholder="Glass / Bottle" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-transparent text-sea-blue font-dm text-xs tracking-[0.2em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold hover:text-sea-gold transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
