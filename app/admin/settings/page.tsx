'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSession } from '../session-context'

interface Setting {
  key: string
  value: string
  updated_at: string
}

const SETTING_LABELS: Record<string, { label: string; description: string; sensitive: boolean }> = {
  meta_page_access_token: {
    label: 'Meta Page Access Token',
    description: 'Permanent token from developers.facebook.com. Needed for Facebook + Instagram posting.',
    sensitive: true,
  },
  meta_page_id: {
    label: 'Facebook Page ID',
    description: 'Your Facebook Page numeric ID. Find it in Page Settings → About.',
    sensitive: false,
  },
  meta_ig_user_id: {
    label: 'Instagram Business Account ID',
    description: 'The IG account linked to your Facebook Page. Found via Graph API Explorer.',
    sensitive: false,
  },
  site_url: {
    label: 'Site URL',
    description: 'Your public website URL (used in social post links).',
    sensitive: false,
  },
}

const ALL_KEYS = Object.keys(SETTING_LABELS)

export default function SettingsPage() {
  const session = useSession()
  const [settings, setSettings] = useState<Setting[]>([])
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const loadSettings = async () => {
    const res = await fetch('/api/admin/settings', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        const existing = new Map(data.map((s: Setting) => [s.key, s]))
        const merged = ALL_KEYS.map((key) =>
          existing.get(key) || { key, value: '', updated_at: '' }
        )
        setSettings(merged)
      }
    } else if (res.status === 403) {
      toast.error('Super Admin access required')
    }
  }

  useEffect(() => { loadSettings() }, [])

  const handleSave = async (key: string) => {
    setSaving(key)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: editing[key] }),
    })
    if (res.ok) {
      toast.success('Saved')
      setEditing(prev => { const n = { ...prev }; delete n[key]; return n })
      loadSettings()
    } else {
      toast.error('Failed to save')
    }
    setSaving(null)
  }

  if (session?.role !== 'super_admin') {
    return (
      <div className="text-center py-20">
        <p className="text-sea-blue font-dm">Super Admin access required.</p>
      </div>
    )
  }

  const isConfigured = settings.some(s => s.key === 'meta_page_access_token' && s.value)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cormorant text-3xl font-light text-sea-white">Settings</h1>
        <p className="text-sm text-sea-blue font-dm mt-2">Social media API credentials. Blog and newsletter settings are in Marketing.</p>
      </div>

      {/* Status Banner */}
      <div className={`mb-4 p-4 rounded-lg border ${isConfigured ? 'bg-green-900/10 border-green-500/20' : 'bg-amber-900/10 border-amber-500/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
          <div>
            <p className={`text-sm font-dm font-medium ${isConfigured ? 'text-green-400' : 'text-amber-400'}`}>
              {isConfigured ? 'Social Posting Active' : 'Social Posting Not Configured'}
            </p>
            <p className="text-xs text-sea-blue font-dm mt-0.5">
              {isConfigured
                ? 'Blog posts will auto-post to Facebook + Instagram on publish.'
                : 'Add your Meta API credentials below to enable auto-posting.'}
            </p>
          </div>
        </div>
      </div>

      {/* Setup Guide */}
      {!isConfigured && (
        <div className="mb-4 p-5 bg-[#0a0e18] border border-sea-gold/10 rounded-lg">
          <h3 className="font-cormorant text-lg text-sea-white mb-3">Quick Setup Guide</h3>
          <ol className="space-y-2 text-sm text-sea-blue font-dm list-decimal list-inside">
            <li>Go to <span className="text-sea-gold">developers.facebook.com</span> and create a new App (Business type)</li>
            <li>Add &ldquo;Facebook Login for Business&rdquo; product</li>
            <li>Generate a Page Access Token with <span className="text-sea-light">pages_manage_posts</span> permission</li>
            <li>Exchange for a long-lived token, then get the permanent token via <span className="text-sea-light">GET /me/accounts</span></li>
            <li>Find your Instagram Business Account ID in Graph API Explorer</li>
            <li>Paste the values below</li>
          </ol>
        </div>
      )}

      <div className="space-y-4">
        {settings.map((setting) => {
          const meta = SETTING_LABELS[setting.key]
          if (!meta) return null
          const isEditing = setting.key in editing
          return (
            <div key={setting.key} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm text-sea-white font-dm font-medium">{meta.label}</h3>
                  <p className="text-xs text-sea-blue font-dm mt-1">{meta.description}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  type={meta.sensitive && !isEditing ? 'password' : 'text'}
                  value={isEditing ? editing[setting.key] : setting.value}
                  onChange={(e) => setEditing({ ...editing, [setting.key]: e.target.value })}
                  onFocus={() => {
                    if (!(setting.key in editing)) {
                      setEditing({ ...editing, [setting.key]: setting.value })
                    }
                  }}
                  placeholder="Not set"
                  className="flex-1 px-4 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold rounded"
                />
                {isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(setting.key)}
                      disabled={saving === setting.key}
                      className="px-4 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all rounded disabled:opacity-50 min-h-[44px]"
                    >
                      {saving === setting.key ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditing(prev => { const n = { ...prev }; delete n[setting.key]; return n })}
                      className="px-4 py-2.5 bg-transparent text-sea-blue font-dm text-xs tracking-[0.15em] uppercase border border-sea-border cursor-pointer hover:border-sea-gold hover:text-sea-gold transition-all rounded min-h-[44px]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {setting.value && !isEditing && (
                <p className="text-[0.6rem] text-sea-blue/50 font-dm mt-2">
                  Last updated: {new Date(setting.updated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
