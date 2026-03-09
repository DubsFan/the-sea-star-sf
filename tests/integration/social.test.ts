import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const S = {
  campaign: 'cc000000-0000-0000-0000-000000000020',
  blogPost: 'cc000000-0000-0000-0000-000000000021',
}

// Mock supabase singleton to use local test DB
vi.mock('@/lib/supabase', () => ({
  supabase: createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ),
}))

// Mock meta to avoid real API calls
vi.mock('@/lib/meta', () => ({
  postToFacebook: vi.fn().mockResolvedValue({ id: 'fb-test-123' }),
  postToInstagram: vi.fn().mockResolvedValue({ id: 'ig-test-123' }),
}))

describe('executeSocialPost', () => {
  beforeAll(async () => {
    await db.from('blog_posts').insert({
      id: S.blogPost,
      title: 'Social Test Blog',
      slug: 'social-test-blog',
      status: 'published',
    })
    await db.from('social_campaigns').insert({
      id: S.campaign,
      content_type: 'blog',
      source_id: S.blogPost,
      status: 'scheduled',
      facebook_caption: 'Check out our latest blog!',
      instagram_caption: 'New blog post! Link in bio.',
      image_url: 'https://example.com/image.jpg',
      platforms: ['facebook', 'instagram'],
    })
  })

  afterAll(async () => {
    await db.from('social_posts').delete().eq('campaign_id', S.campaign)
    await db.from('activity_logs').delete().eq('entity_id', S.campaign)
    await db.from('social_campaigns').delete().eq('id', S.campaign)
    await db.from('blog_posts').delete().eq('id', S.blogPost)
  })

  it('posts to both platforms and updates status', async () => {
    const { executeSocialPost } = await import('@/lib/social-post')
    const results = await executeSocialPost(S.campaign, 'test')

    expect(results.facebook).toEqual({ success: true, id: 'fb-test-123' })
    expect(results.instagram).toEqual({ success: true, id: 'ig-test-123' })

    const { data: campaign } = await db.from('social_campaigns').select('status').eq('id', S.campaign).single()
    expect(campaign?.status).toBe('posted')
  })

  it('handles partial failure', async () => {
    // Reset campaign for another run
    await db.from('social_posts').delete().eq('campaign_id', S.campaign)
    await db.from('social_campaigns').update({ status: 'scheduled' }).eq('id', S.campaign)

    const meta = await import('@/lib/meta')
    const mockFb = vi.mocked(meta.postToFacebook)
    mockFb.mockRejectedValueOnce(new Error('FB API down'))

    const { executeSocialPost } = await import('@/lib/social-post')
    const results = await executeSocialPost(S.campaign, 'test')

    expect(results.facebook?.success).toBe(false)
    expect(results.facebook?.error).toBe('FB API down')
    expect(results.instagram?.success).toBe(true)

    // Campaign should still be 'posted' because IG succeeded
    const { data: campaign } = await db.from('social_campaigns').select('status').eq('id', S.campaign).single()
    expect(campaign?.status).toBe('posted')
  })
})
