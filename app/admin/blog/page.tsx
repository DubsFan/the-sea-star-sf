'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BlogRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/create?tab=blog')
  }, [router])
  return null
}
