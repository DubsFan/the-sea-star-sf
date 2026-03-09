'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const TAB_MAP: Record<string, string> = {
  blog: 'blog',
  social: 'social',
  events: 'events',
  drafts: 'drafts',
}

export default function CreateRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab') || 'blog'
    const status = searchParams.get('status')
    const mapped = TAB_MAP[tab] || 'blog'
    let url = `/admin/marketing?tab=${mapped}`
    if (status) url += `&status=${status}`
    router.replace(url)
  }, [router, searchParams])

  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-sea-blue font-dm">Redirecting...</p>
    </div>
  )
}
