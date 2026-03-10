'use client'

import { useState } from 'react'
import NewsletterComposeTab from './NewsletterComposeTab'
import SubscribersTab from './SubscribersTab'

const SUB_TABS = [
  { key: 'compose', label: 'Compose' },
  { key: 'subscribers', label: 'Subscribers' },
] as const

type SubTabKey = typeof SUB_TABS[number]['key']

export default function NewsletterTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('compose')

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="flex gap-0 mb-6 border-b border-sea-gold/10 overflow-x-auto scrollbar-hide">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`px-4 py-2.5 min-h-[44px] font-dm text-xs tracking-[0.15em] uppercase border-none cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${
              activeSubTab === tab.key
                ? 'text-sea-gold border-b-2 border-sea-gold bg-sea-gold/5'
                : 'text-sea-blue hover:text-sea-gold bg-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'compose' && <NewsletterComposeTab />}
      {activeSubTab === 'subscribers' && <SubscribersTab />}
    </div>
  )
}
