'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MediaRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/marketing?tab=media') }, [router])
  return null
}
