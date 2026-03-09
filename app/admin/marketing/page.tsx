'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SubscribersTab from './SubscribersTab'
import MediaTab from './MediaTab'
import SeoTab from './SeoTab'

const TABS = [
  { key: 'subscribers', label: 'Subscribers' },
  { key: 'media', label: 'Media' },
  { key: 'seo', label: 'SEO' },
] as const

type TabKey = typeof TABS[number]['key']

export default function MarketingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = (searchParams.get('tab') as TabKey) || 'subscribers'
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab)
    router.replace(`/admin/marketing?tab=${tab}`, { scroll: false })
  }

  return (
    <div>
      <h1 className="font-cormorant text-3xl font-light text-sea-white mb-6">Marketing</h1>

      {/* Tab bar */}
      <div className="flex gap-0 mb-8 border-b border-sea-gold/10 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`px-5 py-3 min-h-[44px] font-dm text-sm tracking-[0.1em] uppercase border-none cursor-pointer transition-all whitespace-nowrap ${
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
      {activeTab === 'subscribers' && <SubscribersTab />}
      {activeTab === 'media' && <MediaTab />}
      {activeTab === 'seo' && <SeoTab />}
    </div>
  )
}
