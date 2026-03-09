import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { publishToSite, scheduleForSite } from '@/lib/publisher'
import { getTestDb } from '../setup/local-supabase'

const db = getTestDb()
const testBlogId = 'cc000000-0000-0000-0000-000000000040'
const testEventId = 'cc000000-0000-0000-0000-000000000041'

describe('publisher', () => {
  beforeAll(async () => {
    await db.from('blog_posts').insert({
      id: testBlogId,
      title: 'Publisher Test Blog',
      slug: 'publisher-test-blog',
      status: 'draft',
    })
    await db.from('events').insert({
      id: testEventId,
      title: 'Publisher Test Event',
      slug: 'publisher-test-event',
      starts_at: '2026-05-01T19:00:00Z',
      status: 'draft',
    })
  })

  afterAll(async () => {
    await db.from('activity_logs').delete().in('entity_id', [testBlogId, testEventId])
    await db.from('events').delete().eq('id', testEventId)
    await db.from('blog_posts').delete().eq('id', testBlogId)
  })

  it('publishToSite publishes a blog post', async () => {
    const data = await publishToSite('blog_post', testBlogId, 'test', { db })
    expect(data.title).toBe('Publisher Test Blog')

    const { data: row } = await db.from('blog_posts').select('status, is_published').eq('id', testBlogId).single()
    expect(row?.status).toBe('published')
    expect(row?.is_published).toBe(true)
  })

  it('publishToSite publishes an event', async () => {
    const data = await publishToSite('event', testEventId, 'test', { db })
    expect(data.title).toBe('Publisher Test Event')

    const { data: row } = await db.from('events').select('status').eq('id', testEventId).single()
    expect(row?.status).toBe('published')
  })

  it('scheduleForSite schedules a blog post', async () => {
    // Reset status first
    await db.from('blog_posts').update({ status: 'draft' }).eq('id', testBlogId)
    const scheduledFor = '2026-04-01T12:00:00Z'
    const data = await scheduleForSite('blog_post', testBlogId, scheduledFor, 'test', { db })
    expect(data.title).toBe('Publisher Test Blog')

    const { data: row } = await db.from('blog_posts').select('status, scheduled_for').eq('id', testBlogId).single()
    expect(row?.status).toBe('scheduled')
    expect(new Date(row?.scheduled_for).getTime()).toBe(new Date(scheduledFor).getTime())
  })

  it('scheduleForSite schedules an event', async () => {
    await db.from('events').update({ status: 'draft' }).eq('id', testEventId)
    const scheduledFor = '2026-04-01T12:00:00Z'
    const data = await scheduleForSite('event', testEventId, scheduledFor, 'test', { db })
    expect(data.title).toBe('Publisher Test Event')

    const { data: row } = await db.from('events').select('status, scheduled_for').eq('id', testEventId).single()
    expect(row?.status).toBe('scheduled')
  })
})
