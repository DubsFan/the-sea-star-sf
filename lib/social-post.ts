import { supabase } from './supabase'
import { postToFacebook, postToInstagram } from './meta'
import { logActivity } from './activity'

export async function executeSocialPost(campaignId: string, actor?: string) {
  const { data: campaign } = await supabase
    .from('social_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) throw new Error('Campaign not found')

  await supabase.from('social_campaigns').update({ status: 'posting' }).eq('id', campaignId)

  const platforms: string[] = Array.isArray(campaign.platforms) ? campaign.platforms : ['facebook', 'instagram']
  const results: Record<string, { success: boolean; id?: string; error?: string }> = {}

  // Get site URL for blog link
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('key', 'site_url')
    .single()
  const siteUrl = settings?.value || 'https://theseastarsf.com'

  // Build link based on content type
  let link = siteUrl
  if (campaign.content_type === 'blog' && campaign.source_id) {
    const { data: post } = await supabase.from('blog_posts').select('slug').eq('id', campaign.source_id).single()
    if (post) link = `${siteUrl}/blog/${post.slug}`
  } else if (campaign.content_type === 'event' && campaign.source_id) {
    const { data: event } = await supabase.from('events').select('slug').eq('id', campaign.source_id).single()
    if (event) link = `${siteUrl}/?event=${event.slug}#events`
  }

  // Post to Facebook
  if (platforms.includes('facebook') && campaign.facebook_caption) {
    try {
      const fb = await postToFacebook(campaign.facebook_caption, link)
      results.facebook = { success: true, id: fb.id }
      await supabase.from('social_posts').insert({
        campaign_id: campaignId,
        blog_post_id: campaign.content_type === 'blog' ? campaign.source_id : null,
        platform: 'facebook',
        platform_post_id: fb.id,
        caption: campaign.facebook_caption,
        status: 'posted',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      results.facebook = { success: false, error: message }
      await supabase.from('social_posts').insert({
        campaign_id: campaignId,
        blog_post_id: campaign.content_type === 'blog' ? campaign.source_id : null,
        platform: 'facebook',
        caption: campaign.facebook_caption,
        status: 'failed',
        error_message: message,
      })
    }
  }

  // Post to Instagram
  if (platforms.includes('instagram') && campaign.instagram_caption && campaign.image_url) {
    try {
      const ig = await postToInstagram(campaign.image_url, campaign.instagram_caption)
      results.instagram = { success: true, id: ig.id }
      await supabase.from('social_posts').insert({
        campaign_id: campaignId,
        blog_post_id: campaign.content_type === 'blog' ? campaign.source_id : null,
        platform: 'instagram',
        platform_post_id: ig.id,
        caption: campaign.instagram_caption,
        status: 'posted',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      results.instagram = { success: false, error: message }
      await supabase.from('social_posts').insert({
        campaign_id: campaignId,
        blog_post_id: campaign.content_type === 'blog' ? campaign.source_id : null,
        platform: 'instagram',
        caption: campaign.instagram_caption,
        status: 'failed',
        error_message: message,
      })
    }
  }

  const anySuccess = Object.values(results).some(r => r.success)
  await supabase.from('social_campaigns').update({
    status: anySuccess ? 'posted' : 'failed',
    posted_at: anySuccess ? new Date().toISOString() : null,
  }).eq('id', campaignId)

  await logActivity({
    action: 'social_posted',
    entityType: 'social_campaign',
    entityId: campaignId,
    summary: `Social posted: FB ${results.facebook?.success ? '✓' : '✗'}, IG ${results.instagram?.success ? '✓' : '✗'}`,
    actor,
  })

  return results
}
