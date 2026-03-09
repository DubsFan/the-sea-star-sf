import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the scheduler module
vi.mock('@/lib/scheduler', () => ({
  runScheduledJobs: vi.fn().mockResolvedValue({
    blogsPublished: 1,
    eventsPublished: 0,
    eventsArchived: 0,
    socialPosted: 0,
    mailersSent: 0,
  }),
}))

import { GET } from '@/app/api/cron/scheduler/route'
import { NextRequest } from 'next/server'

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3005/api/cron/scheduler', {
    method: 'GET',
    headers,
  })
}

describe('GET /api/cron/scheduler', () => {
  const originalEnv = process.env.CRON_SECRET

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  it('returns 401 with no auth header', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 401 with wrong auth', async () => {
    const res = await GET(makeRequest({ authorization: 'Bearer wrong-secret' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET
    const res = await GET(makeRequest({ authorization: 'Bearer anything' }))
    expect(res.status).toBe(401)
    process.env.CRON_SECRET = originalEnv
  })

  it('returns 200 with valid auth', async () => {
    const res = await GET(makeRequest({ authorization: 'Bearer test-cron-secret' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.blogsPublished).toBe(1)
  })
})
