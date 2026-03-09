import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { title: 'Test', slug: 'test' } }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: { title: 'Test' } }) }) }) }),
    }),
  },
}))
vi.mock('@/lib/publisher', () => ({
  publishToSite: vi.fn().mockResolvedValue({ title: 'Test' }),
  scheduleForSite: vi.fn().mockResolvedValue({ title: 'Test' }),
}))
vi.mock('@/lib/mailer', () => ({
  sendMailer: vi.fn().mockResolvedValue({ recipientCount: 5 }),
}))
vi.mock('@/lib/social-post', () => ({
  executeSocialPost: vi.fn().mockResolvedValue({ facebook: { success: true } }),
}))
vi.mock('@/lib/ai', () => ({
  SEA_STAR_VOICE: 'test voice',
  generateWithGroq: vi.fn().mockResolvedValue('{"facebook_caption":"test","instagram_caption":"test"}'),
  cleanJsonResponse: vi.fn().mockReturnValue({ facebook_caption: 'test', instagram_caption: 'test' }),
}))
vi.mock('@/lib/activity', () => ({
  logActivity: vi.fn(),
}))

import { POST } from '@/app/api/blog/publish/route'
import { NextRequest } from 'next/server'
import { mintSessionToken, COOKIE_NAME } from '../helpers/mint-session'

async function makeAuthRequest(body: Record<string, unknown>) {
  const token = await mintSessionToken()
  return new NextRequest('http://localhost:3005/api/blog/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `${COOKIE_NAME}=${token}` },
    body: JSON.stringify(body),
  })
}

describe('POST /api/blog/publish', () => {
  it('returns 401 without session', async () => {
    const req = new NextRequest('http://localhost:3005/api/blog/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'test-id' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing id', async () => {
    const req = await makeAuthRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('id')
  })

  it('returns 400 for invalid channel action', async () => {
    const req = await makeAuthRequest({
      id: 'test-id',
      site: { action: 'invalid' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for schedule without scheduledFor', async () => {
    const req = await makeAuthRequest({
      id: 'test-id',
      site: { action: 'schedule' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('scheduledFor')
  })

  it('returns 200 for valid request', async () => {
    const req = await makeAuthRequest({
      id: 'b0000000-0000-0000-0000-000000000001',
      site: { action: 'now' },
      social: { action: 'skip' },
      mailer: { action: 'skip' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
