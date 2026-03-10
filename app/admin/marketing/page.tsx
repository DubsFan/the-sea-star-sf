'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from '../session-context'
import BlogTab from '../create/BlogTab'
import SocialTab from '../create/SocialTab'
import EventsTab from '../create/EventsTab'
import DraftsTab from '../create/DraftsTab'
import NewsletterTab from './NewsletterTab'
import MediaTab from './MediaTab'
import SeoTab from './SeoTab'
import ContentPackImportModal from './ContentPackImportModal'

const TABS = [
  { key: 'blog', label: 'Blog' },
  { key: 'social', label: 'Social' },
  { key: 'events', label: 'Events' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'seo', label: 'SEO' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'media', label: 'Media' },
] as const

type TabKey = typeof TABS[number]['key']

// Normalize legacy tab params
const TAB_ALIASES: Record<string, TabKey> = {
  subscribers: 'newsletter',
  email: 'newsletter',
}

export default function MarketingPage() {
  const session = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabBarRef = useRef<HTMLDivElement>(null)

  const rawTab = searchParams.get('tab') || 'blog'
  const normalizedTab = (TAB_ALIASES[rawTab] || rawTab) as TabKey
  const initialTab = TABS.some(t => t.key === normalizedTab) ? normalizedTab : 'blog'
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)

  const isAdminOrAbove = session?.role === 'super_admin' || session?.role === 'admin'
  const canImport = session?.role === 'super_admin' || session?.role === 'admin' || session?.role === 'social_admin'
  const [showImportModal, setShowImportModal] = useState(false)
  const [importKey, setImportKey] = useState(0)

  // If URL had an alias, fix it
  useEffect(() => {
    if (TAB_ALIASES[rawTab]) {
      router.replace(`/admin/marketing?tab=${TAB_ALIASES[rawTab]}`, { scroll: false })
    }
  }, [rawTab, router])

  const switchTab = (tab: TabKey | string) => {
    const t = (TABS.some(x => x.key === tab) ? tab : 'blog') as TabKey
    setActiveTab(t)
    router.replace(`/admin/marketing?tab=${t}`, { scroll: false })
  }

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (!tabBarRef.current) return
    const activeBtn = tabBarRef.current.querySelector('[data-active="true"]') as HTMLElement | null
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeTab])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cormorant text-3xl font-light text-sea-white">Marketing</h1>
        {canImport && (
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-transparent text-sea-gold font-dm text-xs tracking-[0.15em] uppercase border border-sea-gold/30 rounded cursor-pointer hover:bg-sea-gold/10 transition-all min-h-[44px]"
          >
            Import Pack
          </button>
        )}
      </div>

      {/* Tab bar — horizontal scroll on mobile */}
      <div ref={tabBarRef} className="flex gap-0 mb-8 border-b border-sea-gold/10 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            data-active={activeTab === tab.key}
            onClick={() => switchTab(tab.key)}
            className={`px-4 py-3 min-h-[44px] font-dm text-sm tracking-[0.1em] uppercase border-none cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.key
                ? 'text-sea-gold border-b-2 border-sea-gold bg-sea-gold/5'
                : 'text-sea-blue hover:text-sea-gold bg-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'blog' && <BlogTab isAdminOrAbove={isAdminOrAbove} />}
      {activeTab === 'social' && <SocialTab />}
      {activeTab === 'events' && <EventsTab isAdminOrAbove={isAdminOrAbove} />}
      {activeTab === 'newsletter' && <NewsletterTab />}
      {activeTab === 'seo' && <SeoTab />}
      {activeTab === 'drafts' && <DraftsTab isAdminOrAbove={isAdminOrAbove} onSwitchTab={switchTab} />}
      {activeTab === 'media' && <MediaTab />}

      {showImportModal && (
        <ContentPackImportModal
          key={importKey}
          onClose={() => setShowImportModal(false)}
          onImported={() => setImportKey(k => k + 1)}
        />
      )}
    </div>
  )
}
