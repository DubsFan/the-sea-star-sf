'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSession } from '../session-context'

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

interface WineItem {
  id: string
  name: string
  price: string
  description: string
  tag: string
  sort_order: number
  is_active: boolean
}

const DRINK_CATEGORIES = ['Batched', 'Made To Order', 'Draft', 'NA Mocktails']
const ALL_CATEGORIES = [...DRINK_CATEGORIES, 'Wine']

const CATEGORY_LABELS: Record<string, string> = {
  'Batched': 'Portside Classics',
  'Made To Order': 'Starboard Select',
  'Draft': 'The Swell',
  'NA Mocktails': 'Safe Harbor',
  'Wine': 'The Hold',
}

export default function AdminMenu() {
  const session = useSession()
  const [items, setItems] = useState<MenuItem[]>([])
  const [wines, setWines] = useState<WineItem[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MenuItem | WineItem | null>(null)
  const [formType, setFormType] = useState<'drink' | 'wine'>('drink')
  const [drinkForm, setDrinkForm] = useState({ name: '', price: '', blurb: '', image_url: '', category: 'Batched', sort_order: '0' })
  const [wineForm, setWineForm] = useState({ name: '', price: '', description: '', tag: 'Glass / Bottle', sort_order: '0' })
  const [uploading, setUploading] = useState(false)

  const canDelete = session?.role === 'super_admin' || session?.role === 'admin'

  const loadItems = async () => {
    const [menuRes, wineRes] = await Promise.all([fetch('/api/menu', { credentials: 'include' }), fetch('/api/wine', { credentials: 'include' })])
    const [menuData, wineData] = await Promise.all([menuRes.json(), wineRes.json()])
    if (Array.isArray(menuData)) setItems(menuData)
    if (Array.isArray(wineData)) setWines(wineData)
  }

  useEffect(() => { loadItems() }, [])

  const filteredDrinks = filter === 'all' ? items : filter === 'Wine' ? [] : items.filter((i) => i.category === filter)
  const filteredWines = filter === 'all' || filter === 'Wine' ? wines : []
  const isWineTab = filter === 'Wine'

  const openDrinkForm = (item?: MenuItem) => {
    setFormType('drink')
    if (item) {
      setEditing(item)
      setDrinkForm({ name: item.name, price: String(item.price), blurb: item.blurb, image_url: item.image_url || '', category: item.category, sort_order: String(item.sort_order) })
    } else {
      setEditing(null)
      setDrinkForm({ name: '', price: '', blurb: '', image_url: '', category: filter !== 'all' && filter !== 'Wine' ? filter : 'Batched', sort_order: '0' })
    }
    setShowForm(true)
  }

  const openWineForm = (item?: WineItem) => {
    setFormType('wine')
    if (item) {
      setEditing(item)
      setWineForm({ name: item.name, price: item.price, description: item.description || '', tag: item.tag || 'Glass / Bottle', sort_order: String(item.sort_order) })
    } else {
      setEditing(null)
      setWineForm({ name: '', price: '', description: '', tag: 'Glass / Bottle', sort_order: '0' })
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
      const res = await fetch('/api/menu/upload', { credentials: 'include', method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        setDrinkForm((f) => ({ ...f, image_url: data.url }))
        toast.success('Image uploaded')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      ...drinkForm,
      price: parseFloat(drinkForm.price),
      sort_order: parseInt(drinkForm.sort_order),
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

  const handleWineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = { ...wineForm, sort_order: parseInt(wineForm.sort_order), ...(editing ? { id: editing.id } : {}) }
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

  const handleDeleteDrink = async (id: string) => {
    if (!confirm('Delete this item?')) return
    const res = await fetch('/api/menu', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Deleted'); loadItems() }
  }

  const handleDeleteWine = async (id: string) => {
    if (!confirm('Delete this wine?')) return
    const res = await fetch('/api/wine', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Deleted'); loadItems() }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="font-cormorant text-3xl font-light text-sea-white">Menu</h1>
        <button
          onClick={() => isWineTab ? openWineForm() : openDrinkForm()}
          className="w-full sm:w-auto px-5 py-3 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer"
        >
          + Add {isWineTab ? 'Wine' : 'Drink'}
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-2 min-h-[44px] text-xs font-dm border cursor-pointer transition-all ${filter === 'all' ? 'border-sea-gold text-sea-gold bg-sea-gold/5' : 'border-sea-gold/10 text-sea-blue hover:border-sea-gold'}`}>All</button>
        {ALL_CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-2 min-h-[44px] text-xs font-dm border cursor-pointer transition-all ${filter === cat ? 'border-sea-gold text-sea-gold bg-sea-gold/5' : 'border-sea-gold/10 text-sea-blue hover:border-sea-gold'}`}>{CATEGORY_LABELS[cat] || cat}</button>
        ))}
      </div>

      {/* Drink items */}
      {filteredDrinks.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border border-sea-gold/10 rounded overflow-hidden mb-6">
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
                {filteredDrinks.map((item) => (
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
                    <td className="p-3 text-xs text-sea-blue font-dm">{CATEGORY_LABELS[item.category] || item.category}</td>
                    <td className="p-3 text-sm text-sea-gold font-cormorant">${item.price}</td>
                    <td className="p-3">
                      <button onClick={() => toggleActive(item)} className={`px-2 py-1 text-xs font-dm border-none cursor-pointer rounded ${item.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => openDrinkForm(item)} className="text-xs text-sea-gold hover:text-sea-gold-light mr-3 bg-transparent border-none cursor-pointer font-dm">Edit</button>
                      {canDelete && <button onClick={() => handleDeleteDrink(item.id)} className="text-xs text-sea-rose hover:text-red-400 bg-transparent border-none cursor-pointer font-dm">Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards - Drinks */}
          <div className="md:hidden space-y-2 mb-6">
            {filteredDrinks.map((item) => (
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
                      <span className="text-[0.6rem] text-sea-blue font-dm px-1.5 py-0.5 border border-sea-gold/10 rounded">{CATEGORY_LABELS[item.category] || item.category}</span>
                      <span className={`text-[0.6rem] font-dm px-1.5 py-0.5 rounded ${item.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {item.is_active ? 'Active' : 'Off'}
                      </span>
                    </div>
                  </div>
                </div>
                {item.blurb && <p className="text-xs text-sea-blue font-dm mt-2 line-clamp-2">{item.blurb}</p>}
                <div className="flex gap-4 mt-3 pt-3 border-t border-sea-gold/5">
                  <button onClick={() => openDrinkForm(item)} className="text-xs text-sea-gold bg-transparent border-none cursor-pointer font-dm min-h-[44px]">Edit</button>
                  <button onClick={() => toggleActive(item)} className="text-xs text-sea-blue bg-transparent border-none cursor-pointer font-dm min-h-[44px]">
                    {item.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  {canDelete && <button onClick={() => handleDeleteDrink(item.id)} className="text-xs text-sea-rose bg-transparent border-none cursor-pointer font-dm min-h-[44px]">Delete</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Wine items */}
      {filteredWines.length > 0 && (
        <>
          {filter === 'all' && <h2 className="font-cormorant text-xl text-sea-white mb-4 mt-2">The Hold</h2>}

          {/* Desktop Table - Wine */}
          <div className="hidden md:block border border-sea-gold/10 rounded overflow-hidden mb-6">
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
                {filteredWines.map((item) => (
                  <tr key={item.id} className="border-b border-sea-gold/5 hover:bg-sea-gold/[0.02] transition-all">
                    <td className="p-3 text-sm text-sea-white font-dm">{item.name}</td>
                    <td className="p-3 text-sm text-sea-gold font-cormorant">{item.price}</td>
                    <td className="p-3 text-xs text-sea-blue font-dm">{item.tag}</td>
                    <td className="p-3 text-xs text-sea-blue font-dm truncate max-w-[250px]">{item.description}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => openWineForm(item)} className="text-xs text-sea-gold hover:text-sea-gold-light mr-3 bg-transparent border-none cursor-pointer font-dm">Edit</button>
                      {canDelete && <button onClick={() => handleDeleteWine(item.id)} className="text-xs text-sea-rose hover:text-red-400 bg-transparent border-none cursor-pointer font-dm">Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards - Wine */}
          <div className="md:hidden space-y-2 mb-6">
            {filteredWines.map((item) => (
              <div key={item.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-sm text-sea-white font-dm font-medium">{item.name}</h3>
                    <span className="text-xs text-sea-blue font-dm">{item.tag}</span>
                  </div>
                  <span className="text-sm text-sea-gold font-cormorant ml-2">{item.price}</span>
                </div>
                {item.description && <p className="text-xs text-sea-blue font-dm mt-1 line-clamp-2">{item.description}</p>}
                <div className="flex gap-4 mt-3 pt-3 border-t border-sea-gold/5">
                  <button onClick={() => openWineForm(item)} className="text-xs text-sea-gold bg-transparent border-none cursor-pointer font-dm min-h-[44px]">Edit</button>
                  {canDelete && <button onClick={() => handleDeleteWine(item.id)} className="text-xs text-sea-rose bg-transparent border-none cursor-pointer font-dm min-h-[44px]">Delete</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {filteredDrinks.length === 0 && filteredWines.length === 0 && (
        <p className="text-center py-8 text-sea-blue text-sm font-dm">No items found.</p>
      )}

      {/* Drink Form Modal */}
      {showForm && formType === 'drink' && (
        <div className="fixed inset-0 bg-[#06080d]/90 backdrop-blur z-50 flex items-end md:items-center justify-center">
          <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-t-2xl md:rounded-lg w-full md:max-w-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-cormorant text-2xl text-sea-white mb-6">{editing ? 'Edit Drink' : 'Add New Drink'}</h2>
            <form onSubmit={handleDrinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Name</label>
                <input type="text" value={drinkForm.name} onChange={(e) => setDrinkForm({ ...drinkForm, name: e.target.value })} required className="w-full px-4 py-3 min-h-[44px] bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Price</label>
                <input type="number" step="0.01" value={drinkForm.price} onChange={(e) => setDrinkForm({ ...drinkForm, price: e.target.value })} required className="w-full px-4 py-3 min-h-[44px] bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Blurb <span className="text-sea-blue/50">({drinkForm.blurb.length}/200)</span></label>
                <textarea value={drinkForm.blurb} onChange={(e) => setDrinkForm({ ...drinkForm, blurb: e.target.value.slice(0, 200) })} rows={3} className="w-full px-4 py-3 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none rounded" placeholder="2 sentences max, fun customer-facing description" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Image</label>
                <input type="file" accept="image/*" onChange={handleUpload} className="text-sm text-sea-blue font-dm" />
                {uploading && <p className="text-xs text-sea-gold mt-1">Uploading...</p>}
                {drinkForm.image_url && <img src={drinkForm.image_url} alt="preview" className="mt-2 w-24 h-24 object-cover rounded" />}
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Category</label>
                <select value={drinkForm.category} onChange={(e) => setDrinkForm({ ...drinkForm, category: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded">
                  {DRINK_CATEGORIES.map((cat) => <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Sort Order</label>
                <input type="number" value={drinkForm.sort_order} onChange={(e) => setDrinkForm({ ...drinkForm, sort_order: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-3 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all rounded">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 min-h-[44px] bg-transparent text-sea-blue font-dm text-xs tracking-[0.2em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold hover:text-sea-gold transition-all rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wine Form Modal */}
      {showForm && formType === 'wine' && (
        <div className="fixed inset-0 bg-[#06080d]/90 backdrop-blur z-50 flex items-end md:items-center justify-center">
          <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-t-2xl md:rounded-lg w-full md:max-w-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-cormorant text-2xl text-sea-white mb-6">{editing ? 'Edit Wine' : 'Add Wine'}</h2>
            <form onSubmit={handleWineSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Name</label>
                <input type="text" value={wineForm.name} onChange={(e) => setWineForm({ ...wineForm, name: e.target.value })} required className="w-full px-4 py-3 min-h-[44px] bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Price (e.g. $14 / $48)</label>
                <input type="text" value={wineForm.price} onChange={(e) => setWineForm({ ...wineForm, price: e.target.value })} required className="w-full px-4 py-3 min-h-[44px] bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Description</label>
                <textarea value={wineForm.description} onChange={(e) => setWineForm({ ...wineForm, description: e.target.value })} rows={3} className="w-full px-4 py-3 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold resize-none rounded" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Tag</label>
                <input type="text" value={wineForm.tag} onChange={(e) => setWineForm({ ...wineForm, tag: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded" placeholder="Glass / Bottle" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Sort Order</label>
                <input type="number" value={wineForm.sort_order} onChange={(e) => setWineForm({ ...wineForm, sort_order: e.target.value })} className="w-full px-4 py-3 min-h-[44px] bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-3 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all rounded">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 min-h-[44px] bg-transparent text-sea-blue font-dm text-xs tracking-[0.2em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold hover:text-sea-gold transition-all rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
