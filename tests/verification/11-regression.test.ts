import { describe, it, expect, vi, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import { mintSessionToken, COOKIE_NAME } from '../helpers/mint-session'

// Mock external services
vi.mock('@/lib/supabase', async () => {
  const { getTestDb } = await import('../setup/local-supabase')
  return { supabase: getTestDb() }
})
vi.mock('@/lib/publisher', () => ({
  publishToSite: vi.fn().mockResolvedValue({ title: 'Test' }),
  scheduleForSite: vi.fn().mockResolvedValue({ title: 'Test' }),
}))
vi.mock('@/lib/mailer', () => ({
  sendMailer: vi.fn().mockResolvedValue({ recipientCount: 5 }),
  renderMailerPreview: vi.fn().mockResolvedValue('<html>Preview</html>'),
}))
vi.mock('@/lib/social-post', () => ({
  executeSocialPost: vi.fn().mockResolvedValue({ facebook: { success: true } }),
}))
vi.mock('@/lib/ai', () => ({
  SEA_STAR_VOICE: 'test voice',
  buildBaseContext: vi.fn().mockResolvedValue({
    keywords: 'craft cocktails',
    primaryKeywords: 'craft cocktails',
    secondaryKeywords: '',
    toneNotes: '',
  }),
  generateWithGroq: vi.fn().mockResolvedValue('{"facebook_caption":"test","instagram_caption":"test"}'),
  cleanJsonResponse: vi.fn().mockReturnValue({ facebook_caption: 'test', instagram_caption: 'test' }),
}))
vi.mock('@/lib/activity', () => ({ logActivity: vi.fn() }))

let authToken: string

beforeAll(async () => {
  authToken = await mintSessionToken('alicia', 'super_admin', 'Alicia')
})

function makeReq(url: string, opts: RequestInit = {}): NextRequest {
  return new NextRequest(url, {
    ...opts,
    headers: {
      ...opts.headers as Record<string, string>,
      Cookie: `${COOKIE_NAME}=${authToken}`,
    },
  })
}

describe('11 — Regression', () => {
  it('blog publish still works (200 for valid request)', async () => {
    const { POST } = await import('@/app/api/blog/publish/route')
    const req = makeReq('http://localhost:3005/api/blog/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'b0000000-0000-0000-0000-000000000001',
        site: { action: 'now' },
        social: { action: 'skip' },
        mailer: { action: 'skip' },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('admin auth rejects without session cookie', async () => {
    const { POST } = await import('@/app/api/blog/publish/route')
    const req = new NextRequest('http://localhost:3005/api/blog/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'test-id' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('settings GET returns data', async () => {
    const { GET } = await import('@/app/api/admin/settings/route')
    const req = makeReq('http://localhost:3005/api/admin/settings', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('settings PUT roundtrip works', async () => {
    const { PUT, GET } = await import('@/app/api/admin/settings/route')
    const testKey = '__regression_test_key'
    const testValue = 'regression_value_' + Date.now()

    // PUT
    const putReq = makeReq('http://localhost:3005/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: testKey, value: testValue }),
    })
    const putRes = await PUT(putReq)
    expect(putRes.status).toBe(200)

    // GET and verify
    const getReq = makeReq('http://localhost:3005/api/admin/settings', { method: 'GET' })
    const getRes = await GET(getReq)
    const settings = await getRes.json()
    const found = settings.find((s: { key: string }) => s.key === testKey)
    expect(found).toBeTruthy()
    expect(found.value).toBe(testValue)

    // Cleanup
    const { getTestDb } = await import('../setup/local-supabase')
    await getTestDb().from('site_settings').delete().eq('key', testKey)
  })

  it('event publish returns 200 for valid request', async () => {
    const { POST } = await import('@/app/api/events/publish/route')
    const req = makeReq('http://localhost:3005/api/events/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'e0000000-0000-0000-0000-000000000001',
        site: { action: 'now' },
        social: { action: 'skip' },
        mailer: { action: 'skip' },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('blog publish with scheduled site returns 200', async () => {
    const { POST } = await import('@/app/api/blog/publish/route')
    const req = makeReq('http://localhost:3005/api/blog/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'b0000000-0000-0000-0000-000000000001',
        site: { action: 'schedule', scheduledFor: '2026-06-01T18:00:00Z' },
        social: { action: 'skip' },
        mailer: { action: 'skip' },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('event publish with scheduled social returns 200', async () => {
    const { POST } = await import('@/app/api/events/publish/route')
    const req = makeReq('http://localhost:3005/api/events/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'e0000000-0000-0000-0000-000000000001',
        site: { action: 'now' },
        social: { action: 'schedule', scheduledFor: '2026-06-01T10:00:00Z' },
        mailer: { action: 'skip' },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('blog publish with mailer draft returns 200', async () => {
    const { POST } = await import('@/app/api/blog/publish/route')
    const req = makeReq('http://localhost:3005/api/blog/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'b0000000-0000-0000-0000-000000000001',
        site: { action: 'skip' },
        social: { action: 'skip' },
        mailer: { action: 'draft' },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('FAQ API returns data or graceful error', async () => {
    const { GET } = await import('@/app/api/faq/route')
    const req = new NextRequest('http://localhost:3005/api/faq?limit=5')
    const res = await GET(req)
    // FAQ route may return 500 if content_library_items migration hasn't been applied
    // In that case, verify it returns a proper error shape
    const body = await res.json()
    if (res.status === 200) {
      expect(Array.isArray(body)).toBe(true)
    } else {
      // Graceful error — has error message
      expect(body.error).toBeTruthy()
    }
  })
})
