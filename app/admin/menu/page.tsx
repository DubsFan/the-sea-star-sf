'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSession } from '../layout'

interface MenuItem {
  id: string
  name: string
  price: number
  blurb: string
  image_url: string
  category: string
  sort_order: number
  is_active: boolean
}

const CATEGORIES = ['Batched', 'Made To Order', 'Draft', 'NA Mocktails']

export default function AdminMenu() {
  const session = useSession()
  const [items, setItems] = useState<MenuItem[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({ name: '', price: '', blurb: '', image_url: '', category: 'Batched', sort_order: '0' })
  const [uploading, setUploading] = useState(false)

  const canDelete = session?.role === 'super_admin' || session?.role === 'admin'

  const loadItems = async () => {
    const res = await fetch('/api/menu')
    const data = await res.json()
    if (Array.isArray(data)) setItems(data)
  }

  useEffect(() => { loadItems() }, [])

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter)

  const openForm = (item?: MenuItem) => {
    if (item) {
      setEditing(item)
      setForm({ name: item.name, price: String(item.price), blurb: item.blurb, image_url: item.image_url || '', category: item.category, sort_order: String(item.sort_order) })
    } else {
      setEditing(null)
      setForm({ name: '', price: '', blurb: '', image_url: '', category: 'Batched', sort_order: '0' })
    }
    setShowForm(true)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/menu/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        setForm((f) => ({ ...f, image_url: data.url }))
        toast.success('Image uploaded')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      ...form,
      price: parseFloat(form.price),
      sort_order: parseInt(form.sort_order),
      ...(editing ? { id: editing.id } : {}),
    }

    const res = await fetch('/api/menu', {
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
    if (!confirm('Delete this item?')) return
    const res = await fetch('/api/menu', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      toast.success('Deleted')
      loadItems()
    }
  }

  const toggleActive = async (item: MenuItem) => {
    await fetch('/api/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active, name: item.name, price: item.price, blurb: item.blurb, image_url: item.image_url, category: item.category, sort_order: item.sort_order }),
    })
    loadItems()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="font-cormorant text-3xl font-light text-sea-white">Menu Items</h1>
        <button onClick={() => openForm()} className="px-4 md:px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer">
          + Add Drink
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs font-dm border cursor-pointer transition-all ${filter === 'all' ? 'border-sea-gold text-sea-gold bg-sea-gold/5' : 'border-sea-gold/10 text-sea-blue hover:border-sea-gold'}`}>All</button>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1.5 text-xs font-dm border cursor-pointer transition-all ${filter === cat ? 'border-sea-gold text-sea-gold bg-sea-gold/5' : 'border-sea-gold/10 text-sea-blue hover:border-sea-gold'}`}>{cat}</button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-sea-gold/10 rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sea-gold/10">
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Image</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Name</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Category</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Price</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Active</th>
              <th className="text-right p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-sea-gold/5 hover:bg-sea-gold/[0.02] transition-all">
                <td className="p-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-sea-gold/10 rounded" />
                  )}
                </td>
                <td className="p-3">
                  <div className="font-dm text-sm text-sea-white">{item.name}</div>
                  <div className="font-dm text-xs text-sea-blue truncate max-w-[200px]">{item.blurb}</div>
                </td>
                <td className="p-3 text-xs text-sea-blue font-dm">{item.category}</td>
                <td className="p-3 text-sm text-sea-gold font-cormorant">${item.price}</td>
                <td className="p-3">
                  <button onClick={() => toggleActive(item)} className={`px-2 py-1 text-xs font-dm border-none cursor-pointer rounded ${item.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => openForm(item)} className="text-xs text-sea-gold hover:text-sea-gold-light mr-3 bg-transparent border-none cursor-pointer font-dm">Edit</button>
                  {canDelete && <button onClick={() => handleDelete(item.id)} className="text-xs text-sea-rose hover:text-red-400 bg-transparent border-none cursor-pointer font-dm">Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No items found.</p>}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
            <div className="flex gap-3">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-sea-gold/10 rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm text-sea-white font-dm font-medium">{item.name}</h3>
                  <span className="text-sm text-sea-gold font-cormorant ml-2">${item.price}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[0.6rem] text-sea-blue font-dm px-1.5 py-0.5 border border-sea-gold/10 rounded">{item.category}</span>
                  <span className={`text-[0.6rem] font-dm px-1.5 py-0.5 rounded ${item.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {item.is_active ? 'Active' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
            {item.blurb && <p className="text-xs text-sea-blue font-dm mt-2 line-clamp-2">{item.blurb}</p>}
            <div className="flex gap-3 mt-3 pt-3 border-t border-sea-gold/5">
              <button onClick={() => openForm(item)} className="text-xs text-sea-gold bg-transparent border-none cursor-pointer font-dm">Edit</button>
              <button onClick={() => toggleActive(item)} className="text-xs text-sea-blue bg-transparent border-none cursor-pointer font-dm">
                {item.is_active ? 'Deactivate' : 'Activate'}
              </button>
              {canDelete && <button onClick={() => handleDelete(item.id)} className="text-xs text-sea-rose bg-transparent border-none cursor-pointer font-dm">Delete</button>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-sea-blue text-sm font-dm">No items found.</p>}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#06080d]/90 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-cormorant text-2xl text-sea-white mb-6">{editing ? 'Edit Drink' : 'Add New Drink'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Price</label>
                <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Blurb <span className="text-sea-blue/50">({form.blurb.length}/200)</span></label>
                <textarea value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value.slice(0, 200) })} rows={3} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none" placeholder="2 sentences max, fun customer-facing description" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Image</label>
                <input type="file" accept="image/*" onChange={handleUpload} className="text-sm text-sea-blue font-dm" />
                {uploading && <p className="text-xs text-sea-gold mt-1">Uploading...</p>}
                {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 w-24 h-24 object-cover rounded" />}
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold">
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
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
