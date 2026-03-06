'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSession } from '../layout'

interface AdminUser {
  id: string
  username: string
  role: string
  display_name: string
  created_at: string
}

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'El Jefe' },
  { value: 'crew', label: 'Crew' },
]

export default function AdminUsers() {
  const session = useSession()
  const isSuperAdmin = session?.role === 'super_admin'
  const [users, setUsers] = useState<AdminUser[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', display_name: '', role: 'crew' })

  const loadUsers = async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setUsers(data)
    } else if (res.status === 403) {
      toast.error('Super Admin access required')
    }
  }

  useEffect(() => { loadUsers() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('User created')
      setShowForm(false)
      setForm({ username: '', password: '', display_name: '', role: 'crew' })
      loadUsers()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Failed')
    }
  }

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Deleted'); loadUsers() }
    else {
      const data = await res.json()
      toast.error(data.error || 'Failed')
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'super_admin') return 'bg-purple-900/30 text-purple-400'
    if (role === 'admin') return 'bg-sea-gold/10 text-sea-gold'
    return 'bg-blue-900/30 text-blue-400'
  }

  const getRoleLabel = (role: string) => {
    return ROLES.find(r => r.value === role)?.label || role
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-cormorant text-3xl font-light text-sea-white">User Management</h1>
        <button onClick={() => setShowForm(true)} className="px-4 md:px-6 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer">
          + Add User
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-sea-gold/10 rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sea-gold/10">
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Username</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Display Name</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Role</th>
              <th className="text-left p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Created</th>
              <th className="text-right p-3 text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue font-dm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-sea-gold/5 hover:bg-sea-gold/[0.02] transition-all">
                <td className="p-3 text-sm text-sea-white font-dm">{u.username}</td>
                <td className="p-3 text-sm text-sea-blue font-dm">{u.display_name}</td>
                <td className="p-3">
                  <span className={`text-xs font-dm px-2 py-1 rounded ${getRoleBadge(u.role)}`}>{getRoleLabel(u.role)}</span>
                </td>
                <td className="p-3 text-xs text-sea-blue font-dm">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  {(isSuperAdmin || u.role === 'crew') && (
                    <button onClick={() => handleDelete(u.id, u.username)} className="text-xs text-sea-rose hover:text-red-400 bg-transparent border-none cursor-pointer font-dm">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <div key={u.id} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm text-sea-white font-dm font-medium">{u.display_name}</h3>
                <span className="text-xs text-sea-blue font-dm">@{u.username}</span>
              </div>
              <span className={`text-xs font-dm px-2 py-1 rounded ${getRoleBadge(u.role)}`}>{getRoleLabel(u.role)}</span>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-sea-blue font-dm">{new Date(u.created_at).toLocaleDateString()}</span>
              {(isSuperAdmin || u.role === 'crew') && (
                <button onClick={() => handleDelete(u.id, u.username)} className="text-xs text-sea-rose bg-transparent border-none cursor-pointer font-dm">Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#06080d]/90 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg max-w-lg w-full p-6 md:p-8">
            <h2 className="font-cormorant text-2xl text-sea-white mb-6">Add New User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Username</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" autoComplete="off" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" autoComplete="new-password" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Display Name</label>
                <input type="text" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold" placeholder="How their name shows up" />
              </div>
              <div>
                <label className="block text-xs text-sea-blue mb-1 font-dm">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold">
                  {isSuperAdmin
                    ? ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)
                    : <option value="crew">Crew</option>
                  }
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all">Create User</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-transparent text-sea-blue font-dm text-xs tracking-[0.2em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold hover:text-sea-gold transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
