'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SeoRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/marketing?tab=seo') }, [router])
  return null
}
