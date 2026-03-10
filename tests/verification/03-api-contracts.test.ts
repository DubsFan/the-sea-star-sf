import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { mintSessionToken, COOKIE_NAME } from '../helpers/mint-session'
import { getTestDb } from '../setup/local-supabase'

// ── Mock external dependencies ──
vi.mock('@/lib/supabase', async () => {
  const { getTestDb } = await import('../setup/local-supabase')
  return { supabase: getTestDb() }
})

vi.mock('@/lib/ai', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return {
    ...actual,
    generateWithGroq: vi.fn().mockResolvedValue(JSON.stringify({
      blog_ideas: [{ title: 'Test Blog', primary_keyword: 'cocktails', starter: 'Start here' }],
      faqs: [{ question: 'When open?', answer: 'Mon-Sun', category: 'Hours' }],
      keywords: ['test keyword'],
      event_ideas: [{ title: 'Test Event', description: 'Fun', date_hint: 'next week' }],
      email_ideas: [{ subject_line: 'Test Email', primary_keyword: 'happy hour', starter: 'Hey crew' }],
    })),
  }
})

vi.mock('@/lib/activity', () => ({ logActivity: vi.fn() }))

import { POST as mediaPOST, GET as mediaGET } from '@/app/api/media/route'
import { PUT as settingsPUT } from '@/app/api/admin/settings/route'

const db = getTestDb()
let authToken: string
let hasPreviewsTable = false

beforeAll(async () => {
  authToken = await mintSessionToken('alicia', 'super_admin', 'Alicia')

  // Check if smart-import tables exist
  const { error } = await db.from('content_import_previews').select('id').limit(0)
  hasPreviewsTable = !error
})

afterAll(async () => {
  if (hasPreviewsTable) {
    await db.from('content_import_previews').delete().eq('created_by', 'alicia')
    await db.from('content_packs').delete().eq('imported_by', 'alicia')
  }
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

describe('03 — API Contract Verification', () => {
  let previewId: string
  let checksum: string

  it('smart import preview returns preview_id + checksum', async () => {
    if (!hasPreviewsTable) {
      console.log('SKIP: content_import_previews table not found — migration needed')
      return
    }
    const { POST } = await import('@/app/api/content-packs/smart-import/route')
    const req = makeReq('http://localhost:3005/api/content-packs/smart-import?mode=preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'This is a test content pack about cocktails and happy hours at The Sea Star bar in Dogpatch.' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.preview_id).toBeTruthy()
    expect(body.checksum).toBeTruthy()
    expect(body.blog_ideas).toBeInstanceOf(Array)
    previewId = body.preview_id
    checksum = body.checksum
  })

  it('smart import commit succeeds with matching checksum', async () => {
    if (!hasPreviewsTable || !previewId) {
      console.log('SKIP: depends on preview step')
      return
    }
    const { POST } = await import('@/app/api/content-packs/smart-import/route')
    const req = makeReq('http://localhost:3005/api/content-packs/smart-import?mode=commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview_id: previewId, checksum }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.pack_id).toBeTruthy()
    expect(body.blog_count).toBeGreaterThanOrEqual(1)
  })

  it('expired preview returns 410', async () => {
    if (!hasPreviewsTable) {
      console.log('SKIP: content_import_previews table not found — migration needed')
      return
    }
    const { POST } = await import('@/app/api/content-packs/smart-import/route')
    const { data } = await db.from('content_import_previews').insert({
      checksum: 'expired-checksum',
      parsed_payload: { blog_ideas: [], faqs: [], keywords: [], event_ideas: [], email_ideas: [] },
      created_by: 'alicia',
      expires_at: new Date(Date.now() - 3600_000).toISOString(),
    }).select('id').single()

    const req = makeReq('http://localhost:3005/api/content-packs/smart-import?mode=commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview_id: data!.id, checksum: 'expired-checksum' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(410)
  })

  it('checksum mismatch returns 409', async () => {
    if (!hasPreviewsTable) {
      console.log('SKIP: content_import_previews table not found — migration needed')
      return
    }
    const { POST } = await import('@/app/api/content-packs/smart-import/route')
    const { data } = await db.from('content_import_previews').insert({
      checksum: 'real-checksum',
      parsed_payload: { blog_ideas: [], faqs: [], keywords: [], event_ideas: [], email_ideas: [] },
      created_by: 'alicia',
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    }).select('id').single()

    const req = makeReq('http://localhost:3005/api/content-packs/smart-import?mode=commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview_id: data!.id, checksum: 'wrong-checksum' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)

    await db.from('content_import_previews').delete().eq('id', data!.id)
  })

  it('video upload rejected at API', async () => {
    const formData = new FormData()
    const videoBlob = new Blob(['fake video content'], { type: 'video/mp4' })
    formData.append('file', new File([videoBlob], 'test.mp4', { type: 'video/mp4' }))
    formData.append('bucket', 'Drink Images')

    const req = makeReq('http://localhost:3005/api/media', {
      method: 'POST',
      body: formData,
    })
    const res = await mediaPOST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('not supported')
  })

  it('image upload accepted (not 400)', async () => {
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
      0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82,
    ])
    const formData = new FormData()
    formData.append('file', new File([pngBytes], 'test.png', { type: 'image/png' }))
    formData.append('bucket', 'Drink Images')

    const req = makeReq('http://localhost:3005/api/media', { method: 'POST', body: formData })
    const res = await mediaPOST(req)
    // Should not be 400 (not a validation error)
    expect(res.status).not.toBe(400)
  })

  it('media tag filtering returns filtered results', async () => {
    const req = makeReq('http://localhost:3005/api/media?tags=drinks', { method: 'GET' })
    const res = await mediaGET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    for (const item of body) {
      expect(item.bucket).toBe('Drink Images')
    }
  })

  it('blog publish accepts mailer draft action', async () => {
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
    // draft is a valid mailer action — should not be 400
    expect(res.status).not.toBe(400)
  })

  it('schedule without scheduledFor returns 400', async () => {
    const { POST } = await import('@/app/api/blog/publish/route')
    const req = makeReq('http://localhost:3005/api/blog/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'b0000000-0000-0000-0000-000000000001',
        site: { action: 'schedule' },
        social: { action: 'skip' },
        mailer: { action: 'skip' },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('scheduledFor')
  })

  it('new settings keys accepted', async () => {
    const newKeys = [
      'seo_keywords_primary',
      'seo_keywords_secondary',
      'social_default_mode',
      'social_default_delay_days',
      'social_default_time_local',
      'newsletter_default_mode',
      'blog_default_mode',
      'blog_default_day_of_week',
      'blog_default_time_local',
      'newsletter_default_day_of_week',
      'newsletter_default_time_local',
    ]
    for (const key of newKeys) {
      const req = makeReq('http://localhost:3005/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: 'test-value' }),
      })
      const res = await settingsPUT(req)
      expect(res.status).toBe(200)
    }

    // Cleanup
    await db.from('site_settings').delete().in('key', newKeys)
  })
})
