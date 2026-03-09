import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createTestDeps } from '../helpers/test-deps'
import { SCENARIO_IDS } from '../fixtures/scenarios'

const S = SCENARIO_IDS.publishWorkflow

// Mock executeSocialPost and sendMailer since they use singleton supabase/meta/resend
vi.mock('@/lib/social-post', () => ({
  executeSocialPost: vi.fn().mockResolvedValue({
    facebook: { success: true, id: 'fb-wf-123' },
    instagram: { success: true, id: 'ig-wf-123' },
  }),
}))

vi.mock('@/lib/mailer', () => ({
  sendMailer: vi.fn().mockResolvedValue({ recipientCount: 5 }),
}))

describe('publish-workflow', () => {
  const deps = createTestDeps()
  const db = deps.db

  beforeAll(async () => {
    await db.from('blog_posts').insert({
      id: S.blogPost,
      title: 'Workflow Test Blog',
      slug: 'workflow-test-blog',
      excerpt: 'A test blog for workflow',
      status: 'draft',
    })
    await db.from('events').insert({
      id: S.event,
      title: 'Workflow Test Event',
      slug: 'workflow-test-event',
      starts_at: '2026-05-01T19:00:00Z',
      short_description: 'A test event',
      status: 'draft',
    })
  })

  afterAll(async () => {
    await db.from('activity_logs').delete().in('entity_id', [S.blogPost, S.event])
    await db.from('social_campaigns').delete().in('source_id', [S.blogPost, S.event])
    await db.from('mailer_campaigns').delete().in('source_id', [S.blogPost, S.event])
    await db.from('events').delete().eq('id', S.event)
    await db.from('blog_posts').delete().eq('id', S.blogPost)
  })

  it('blog: publishes site + social + mailer', async () => {
    const { executeBlogPublishWorkflow } = await import('@/lib/publish-workflow')
    const results = await executeBlogPublishWorkflow({
      id: S.blogPost,
      site: { action: 'now' },
      social: { action: 'now' },
      mailer: { action: 'now' },
      actor: 'test',
    }, deps)

    expect(results.site).toEqual({ status: 'published' })
    expect((results.social as { status: string }).status).toBe('posted')
    expect((results.mailer as { status: string }).status).toBe('sent')

    // Verify blog was actually published in DB
    const { data: blog } = await db.from('blog_posts').select('status, is_published').eq('id', S.blogPost).single()
    expect(blog?.status).toBe('published')
    expect(blog?.is_published).toBe(true)
  })

  it('blog: skips all channels', async () => {
    const { executeBlogPublishWorkflow } = await import('@/lib/publish-workflow')
    const results = await executeBlogPublishWorkflow({
      id: S.blogPost,
      site: { action: 'skip' },
      social: { action: 'skip' },
      mailer: { action: 'skip' },
      actor: 'test',
    }, deps)

    expect(results.site).toEqual({ status: 'skipped' })
    expect(results.social).toEqual({ status: 'skipped' })
    expect(results.mailer).toEqual({ status: 'skipped' })
  })

  it('blog: schedules site channel', async () => {
    // Reset blog status
    await db.from('blog_posts').update({ status: 'draft', is_published: false }).eq('id', S.blogPost)

    const { executeBlogPublishWorkflow } = await import('@/lib/publish-workflow')
    const results = await executeBlogPublishWorkflow({
      id: S.blogPost,
      site: { action: 'schedule', scheduledFor: '2026-04-15T12:00:00Z' },
      social: { action: 'skip' },
      mailer: { action: 'skip' },
      actor: 'test',
    }, deps)

    expect(results.site).toEqual({ status: 'scheduled', scheduledFor: '2026-04-15T12:00:00Z' })
    const { data: blog } = await db.from('blog_posts').select('status, scheduled_for').eq('id', S.blogPost).single()
    expect(blog?.status).toBe('scheduled')
  })

  it('event: publishes site + skips social + mailer', async () => {
    const { executeEventPublishWorkflow } = await import('@/lib/publish-workflow')
    const results = await executeEventPublishWorkflow({
      id: S.event,
      site: { action: 'now' },
      social: { action: 'skip' },
      mailer: { action: 'skip' },
      actor: 'test',
    }, deps)

    expect(results.site).toEqual({ status: 'published' })
    expect(results.social).toEqual({ status: 'skipped' })
    expect(results.mailer).toEqual({ status: 'skipped' })

    const { data: event } = await db.from('events').select('status').eq('id', S.event).single()
    expect(event?.status).toBe('published')
  })

  it('event: publishes with social and mailer', async () => {
    await db.from('events').update({ status: 'draft' }).eq('id', S.event)

    const { executeEventPublishWorkflow } = await import('@/lib/publish-workflow')
    const results = await executeEventPublishWorkflow({
      id: S.event,
      site: { action: 'now' },
      social: { action: 'now' },
      mailer: { action: 'now' },
      actor: 'test',
    }, deps)

    expect(results.site).toEqual({ status: 'published' })
    expect((results.social as { status: string }).status).toBe('posted')
    expect((results.mailer as { status: string }).status).toBe('sent')
  })
})
