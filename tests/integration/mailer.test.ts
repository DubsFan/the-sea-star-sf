import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const S = {
  campaign: 'cc000000-0000-0000-0000-000000000030',
  blogPost: 'cc000000-0000-0000-0000-000000000031',
}

// Mock supabase singleton to use local test DB
vi.mock('@/lib/supabase', () => ({
  supabase: createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ),
}))

// Mock resend to avoid real API calls
vi.mock('@/lib/resend', () => ({
  resend: {
    batch: {
      send: vi.fn().mockResolvedValue({ data: [] }),
    },
  },
}))

describe('mailer', () => {
  beforeAll(async () => {
    await db.from('blog_posts').insert({
      id: S.blogPost,
      title: 'Mailer Test Blog',
      slug: 'mailer-test-blog',
      excerpt: 'A test excerpt for the mailer',
      status: 'published',
    })
    await db.from('mailer_campaigns').insert({
      id: S.campaign,
      content_type: 'blog',
      source_id: S.blogPost,
      subject: 'New from The Sea Star',
      status: 'draft',
    })
  })

  afterAll(async () => {
    await db.from('activity_logs').delete().eq('entity_id', S.campaign)
    await db.from('mailer_campaigns').delete().eq('id', S.campaign)
    await db.from('blog_posts').delete().eq('id', S.blogPost)
  })

  it('renderMailerPreview returns HTML for a blog campaign', async () => {
    const { renderMailerPreview } = await import('@/lib/mailer')
    const html = await renderMailerPreview(S.campaign)

    expect(html).toContain('THE SEA STAR')
    expect(html).toContain('Mailer Test Blog')
    expect(html).toContain('A test excerpt for the mailer')
    expect(html).toContain('/blog/mailer-test-blog')
  })

  it('sendMailer sends to active subscribers and updates campaign', async () => {
    const { sendMailer } = await import('@/lib/mailer')
    const result = await sendMailer(S.campaign, 'test')

    // 5 active subscribers from seed
    expect(result.recipientCount).toBe(5)

    const { data: campaign } = await db.from('mailer_campaigns').select('status, recipient_count').eq('id', S.campaign).single()
    expect(campaign?.status).toBe('sent')
    expect(campaign?.recipient_count).toBe(5)
  })

  it('sendMailer handles empty subscribers', async () => {
    // Deactivate all subscribers temporarily
    await db.from('email_subscribers').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')

    // Create a new campaign for this test
    const emptyCampaignId = 'cc000000-0000-0000-0000-000000000032'
    await db.from('mailer_campaigns').insert({
      id: emptyCampaignId,
      content_type: 'blog',
      source_id: S.blogPost,
      subject: 'Empty test',
      status: 'draft',
    })

    const { sendMailer } = await import('@/lib/mailer')
    const result = await sendMailer(emptyCampaignId, 'test')
    expect(result.recipientCount).toBe(0)

    // Cleanup
    await db.from('mailer_campaigns').delete().eq('id', emptyCampaignId)
    // Restore subscribers
    await db.from('email_subscribers').update({ is_active: true }).neq('id', '00000000-0000-0000-0000-000000000000')
  })
})
