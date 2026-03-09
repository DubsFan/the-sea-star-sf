import { describe, it, expect, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const testDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ username: 'alicia', role: 'super_admin', displayName: 'Alicia' }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ),
}))

import { NextRequest } from 'next/server'

describe('GET /api/seo', () => {
  it('returns page_seo rows', async () => {
    const { GET } = await import('@/app/api/seo/route')
    const req = new NextRequest('http://localhost:3005/api/seo')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(2)
  })
})
