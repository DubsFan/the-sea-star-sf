import { describe, it, expect, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

vi.mock('@/lib/supabase', () => ({
  supabase: createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ),
}))

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ username: 'alicia', role: 'super_admin', displayName: 'Alicia' }),
}))

import { NextRequest } from 'next/server'

describe('GET /api/admin/stats', () => {
  it('returns counts from baseline seed', async () => {
    const { GET } = await import('@/app/api/admin/stats/route')
    const req = new NextRequest('http://localhost:3005/api/admin/stats')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('subscribers')
  })
})
