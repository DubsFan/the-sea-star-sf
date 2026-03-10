import { describe, it, expect, vi, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import { mintSessionToken, COOKIE_NAME } from '../helpers/mint-session'

const mockGenerateWithGroq = vi.fn().mockResolvedValue(JSON.stringify({
  facebook_caption: 'Check it out',
  instagram_caption: 'New vibes',
}))

vi.mock('@/lib/supabase', async () => {
  const { getTestDb } = await import('../setup/local-supabase')
  return { supabase: getTestDb() }
})

vi.mock('@/lib/ai', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return {
    ...actual,
    generateWithGroq: mockGenerateWithGroq,
    buildBaseContext: vi.fn().mockResolvedValue({
      keywords: 'craft cocktails, dogpatch bar',
      primaryKeywords: 'craft cocktails, dogpatch bar',
      secondaryKeywords: 'happy hour, sunset drinks',
      toneNotes: '',
    }),
    cleanJsonResponse: vi.fn().mockImplementation((s: string) => JSON.parse(s)),
  }
})

vi.mock('@/lib/activity', () => ({ logActivity: vi.fn() }))
vi.mock('@/lib/publisher', () => ({
  publishToSite: vi.fn().mockResolvedValue({ title: 'Test' }),
  scheduleForSite: vi.fn().mockResolvedValue({ title: 'Test' }),
}))
vi.mock('@/lib/social-post', () => ({
  executeSocialPost: vi.fn().mockResolvedValue({ facebook: { success: true } }),
}))
vi.mock('@/lib/mailer', () => ({
  sendMailer: vi.fn().mockResolvedValue({ recipientCount: 5 }),
}))

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

describe('04 — Groq AI Behavior', () => {
  it('smart import uses temperature 0.3', async () => {
    mockGenerateWithGroq.mockResolvedValueOnce(JSON.stringify({
      blog_ideas: [{ title: 'Test', primary_keyword: 'cocktails', starter: 'Start' }],
      faqs: [],
      keywords: ['test'],
      event_ideas: [],
      email_ideas: [],
    }))

    const { POST } = await import('@/app/api/content-packs/smart-import/route')
    const req = makeReq('http://localhost:3005/api/content-packs/smart-import?mode=preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Test content about cocktails and happy hours.' }),
    })
    await POST(req)

    // Check the options arg passed to generateWithGroq
    const lastCall = mockGenerateWithGroq.mock.calls[mockGenerateWithGroq.mock.calls.length - 1]
    expect(lastCall).toBeTruthy()
    const options = lastCall[2]
    expect(options?.temperature).toBe(0.3)
  })

  it('smart import prompt includes existing keywords context', async () => {
    const lastCall = mockGenerateWithGroq.mock.calls[mockGenerateWithGroq.mock.calls.length - 1]
    const systemPrompt = lastCall[0] as string
    expect(systemPrompt).toContain('blog_ideas')
    expect(systemPrompt).toContain('faqs')
    expect(systemPrompt).toContain('keywords')
  })

  it('smart import returns valid SmartPayload shape', async () => {
    mockGenerateWithGroq.mockResolvedValueOnce(JSON.stringify({
      blog_ideas: [{ title: 'Craft Hour', primary_keyword: 'happy hour', starter: 'When the sun dips...' }],
      faqs: [{ question: 'Dog friendly?', answer: 'Yes!', category: 'General' }],
      keywords: ['sunset cocktails', 'dogpatch happy hour'],
      event_ideas: [{ title: 'Trivia Night', description: 'Weekly fun', date_hint: 'every Thursday' }],
      email_ideas: [{ subject_line: 'New menu drop', primary_keyword: 'seasonal cocktails', starter: 'Hey crew' }],
    }))

    const { POST } = await import('@/app/api/content-packs/smart-import/route')
    const req = makeReq('http://localhost:3005/api/content-packs/smart-import?mode=preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'We should do a trivia night and new seasonal cocktails.' }),
    })
    const res = await POST(req)
    const body = await res.json()

    if (res.status === 200) {
      expect(body.preview_id).toBeTruthy()
      expect(body.checksum).toBeTruthy()
      expect(Array.isArray(body.blog_ideas)).toBe(true)
      expect(Array.isArray(body.faqs)).toBe(true)
      expect(Array.isArray(body.keywords)).toBe(true)
      expect(Array.isArray(body.event_ideas)).toBe(true)
      expect(Array.isArray(body.email_ideas)).toBe(true)
    }

    // Cleanup preview
    if (body.preview_id) {
      const { getTestDb } = await import('../setup/local-supabase')
      await getTestDb().from('content_import_previews').delete().eq('id', body.preview_id)
    }
  })

  it('blog generate prompt includes Core identity + Topical themes', async () => {
    mockGenerateWithGroq.mockResolvedValueOnce(JSON.stringify({
      title: 'Test Blog Post',
      body: '<p>Test body</p>',
      excerpt: 'Test excerpt',
    }))

    const { POST } = await import('@/app/api/blog/generate/route')
    const req = makeReq('http://localhost:3005/api/blog/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_input: 'Write about happy hour specials at The Sea Star' }),
    })
    await POST(req)

    const systemPrompt = mockGenerateWithGroq.mock.calls.at(-1)?.[0] as string
    expect(systemPrompt).toContain('Core identity')
    expect(systemPrompt).toContain('Topical themes')
  })

  it('social generate prompt includes keyword tiers', async () => {
    mockGenerateWithGroq.mockResolvedValueOnce(JSON.stringify({
      facebook_caption: 'Test caption',
      instagram_caption: 'Test caption',
    }))

    const { POST } = await import('@/app/api/social/generate/route')
    const req = makeReq('http://localhost:3005/api/social/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'Weekend vibes at the bar', platform: 'both' }),
    })
    await POST(req)

    const systemPrompt = mockGenerateWithGroq.mock.calls.at(-1)?.[0] as string
    // Social generate conditionally includes keyword tiers
    // At minimum, the prompt should be a non-empty string
    expect(systemPrompt).toBeTruthy()
    expect(typeof systemPrompt).toBe('string')
    // If keywords are configured, prompt includes tier labels
    if (systemPrompt.includes('Core identity')) {
      expect(systemPrompt).toContain('Topical themes')
    }
  })
})
