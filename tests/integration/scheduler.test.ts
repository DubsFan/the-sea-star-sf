import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { vi } from 'vitest'
import { runScheduledJobs } from '@/lib/scheduler'
import { getTestDb } from '../setup/local-supabase'
import { SCENARIO_IDS } from '../fixtures/scenarios'
import { createFakeClock } from '../fakes/fake-clock'

const db = getTestDb()
const S = SCENARIO_IDS.scheduler

// Mock social-post to avoid hitting Meta API, but update DB status like the real one
vi.mock('@/lib/social-post', () => ({
  executeSocialPost: vi.fn().mockImplementation(async (campaignId: string) => {
    const { createClient } = await import('@supabase/supabase-js')
    const mockDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await mockDb.from('social_campaigns').update({ status: 'posted', posted_at: new Date().toISOString() }).eq('id', campaignId)
    return { facebook: { success: true } }
  }),
}))

// Mock mailer to avoid hitting Resend, but update DB status
vi.mock('@/lib/mailer', () => ({
  sendMailer: vi.fn().mockImplementation(async (campaignId: string) => {
    const { createClient } = await import('@supabase/supabase-js')
    const mockDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await mockDb.from('mailer_campaigns').update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: 5 }).eq('id', campaignId)
    return { recipientCount: 5 }
  }),
}))

describe('runScheduledJobs', () => {
  beforeAll(async () => {
    // Mark seed scheduled rows as draft so they don't interfere
    await db.from('social_campaigns').update({ status: 'draft' }).eq('id', 'c0000000-0000-0000-0000-000000000001')
    await db.from('mailer_campaigns').update({ status: 'draft' }).eq('id', 'd0000000-0000-0000-0000-000000000001')
    // Mark seed past event as archived so it doesn't interfere
    await db.from('events').update({ status: 'archived' }).eq('id', 'e0000000-0000-0000-0000-000000000003')

    // Insert scenario rows for scheduler
    await db.from('blog_posts').insert({
      id: S.dueBlog,
      title: 'Scheduler Blog',
      slug: 'scheduler-blog',
      status: 'scheduled',
      scheduled_for: '2026-03-08T12:00:00Z',
    })

    await db.from('events').insert([
      {
        id: S.dueEvent,
        title: 'Scheduler Event',
        slug: 'scheduler-event',
        starts_at: '2026-04-01T19:00:00Z',
        status: 'scheduled',
        scheduled_for: '2026-03-08T12:00:00Z',
      },
      {
        id: S.pastEvent,
        title: 'Past Scheduler Event',
        slug: 'past-scheduler-event',
        starts_at: '2026-02-01T19:00:00Z',
        ends_at: '2026-02-01T21:00:00Z',
        status: 'published',
      },
    ])

    await db.from('social_campaigns').insert({
      id: S.dueSocial,
      content_type: 'standalone',
      status: 'scheduled',
      scheduled_for: '2026-03-08T12:00:00Z',
      facebook_caption: 'Test social',
    })

    await db.from('mailer_campaigns').insert({
      id: S.dueMailer,
      content_type: 'blog',
      source_id: S.dueBlog,
      subject: 'Test mailer',
      status: 'scheduled',
      scheduled_for: '2026-03-08T12:00:00Z',
    })
  })

  afterAll(async () => {
    await db.from('activity_logs').delete().eq('actor', 'scheduler')
    await db.from('mailer_campaigns').delete().eq('id', S.dueMailer)
    await db.from('social_campaigns').delete().eq('id', S.dueSocial)
    await db.from('events').delete().in('id', [S.dueEvent, S.pastEvent])
    await db.from('blog_posts').delete().eq('id', S.dueBlog)

    // Restore seed rows
    await db.from('social_campaigns').update({ status: 'scheduled' }).eq('id', 'c0000000-0000-0000-0000-000000000001')
    await db.from('mailer_campaigns').update({ status: 'scheduled' }).eq('id', 'd0000000-0000-0000-0000-000000000001')
    await db.from('events').update({ status: 'published' }).eq('id', 'e0000000-0000-0000-0000-000000000003')
  })

  it('processes all due items', async () => {
    const clock = createFakeClock('2026-03-09T12:00:00Z')
    const result = await runScheduledJobs({ db, clock })

    expect(result.blogsPublished).toBe(1)
    expect(result.eventsPublished).toBe(1)
    expect(result.eventsArchived).toBe(1)
    expect(result.socialPosted).toBe(1)
    expect(result.mailersSent).toBe(1)
  })

  it('returns zeros on idempotent second run', async () => {
    const clock = createFakeClock('2026-03-09T12:00:00Z')
    const result = await runScheduledJobs({ db, clock })

    expect(result.blogsPublished).toBe(0)
    expect(result.eventsPublished).toBe(0)
    expect(result.eventsArchived).toBe(0)
    expect(result.socialPosted).toBe(0)
    expect(result.mailersSent).toBe(0)
  })
})
