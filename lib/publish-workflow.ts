/**
 * Extracted publish orchestration for blog posts and events.
 * Encapsulates the site/social/mailer channel logic from the publish routes.
 */
import { defaultDeps, type AppDeps } from './deps'
import { SEA_STAR_VOICE, cleanJsonResponse } from './ai'
import { publishToSite, scheduleForSite } from './publisher'
import { executeSocialPost } from './social-post'
import { sendMailer } from './mailer'

interface SiteChannelInput {
  action: 'skip' | 'now' | 'schedule'
  scheduledFor?: string
}

interface SocialChannelInput {
  action: 'skip' | 'now' | 'schedule'
  scheduledFor?: string
}

interface MailerChannelInput {
  action: 'skip' | 'now' | 'schedule' | 'draft'
  scheduledFor?: string
  hero_image?: string
}

interface PublishInput {
  id: string
  site: SiteChannelInput
  social: SocialChannelInput
  mailer: MailerChannelInput
  actor: string
}

export async function executeBlogPublishWorkflow(
  input: PublishInput,
  deps: AppDeps = defaultDeps,
) {
  const { id, site, social, mailer, actor } = input
  const results: Record<string, unknown> = {}

  // --- Website ---
  if (site.action === 'now') {
    await publishToSite('blog_post', id, actor)
    await deps.db.from('blog_posts').update({ is_published: true }).eq('id', id)
    results.site = { status: 'published' }
  } else if (site.action === 'schedule' && site.scheduledFor) {
    await scheduleForSite('blog_post', id, site.scheduledFor, actor)
    results.site = { status: 'scheduled', scheduledFor: site.scheduledFor }
  } else {
    results.site = { status: 'skipped' }
  }

  // --- Social ---
  if (social.action !== 'skip') {
    const { data: post } = await deps.db
      .from('blog_posts')
      .select('title, excerpt, slug, featured_image, images')
      .eq('id', id)
      .single()

    if (post) {
      const imageUrl = post.featured_image || (post.images && post.images.length > 0 ? post.images[0] : null)

      const captionPrompt = `You write social media captions for The Sea Star. ${SEA_STAR_VOICE}

Given a blog post title and excerpt, write TWO captions:
1. facebook_caption: 2-3 sentences that tease the story and include a call to action. Max 250 characters.
2. instagram_caption: 2-3 sentences. More casual, can use 1-2 relevant emojis. End with "Link in bio." Include 3-5 hashtags on a new line. Max 300 characters total.

Return ONLY valid JSON with fields: facebook_caption, instagram_caption`

      try {
        const captionContent = await deps.ai.generate(
          captionPrompt,
          `Title: ${post.title}\nExcerpt: ${post.excerpt}`,
          { temperature: 0.5, maxTokens: 500 }
        )
        const captions = cleanJsonResponse(captionContent) as { facebook_caption: string; instagram_caption: string }

        const { data: campaign } = await deps.db.from('social_campaigns').insert({
          content_type: 'blog',
          source_id: id,
          facebook_caption: captions.facebook_caption,
          instagram_caption: captions.instagram_caption,
          image_url: imageUrl,
          status: social.action === 'schedule' ? 'scheduled' : 'draft',
          scheduled_for: social.action === 'schedule' ? social.scheduledFor : null,
        }).select('id').single()

        if (campaign && social.action === 'now') {
          const socialResults = await executeSocialPost(campaign.id, actor)
          results.social = { status: 'posted', ...socialResults }

          const anySuccess = Object.values(socialResults).some((r: { success: boolean }) => r.success)
          if (anySuccess) {
            await deps.db.from('blog_posts').update({ social_posted_at: deps.clock.now().toISOString() }).eq('id', id)
          }
        } else if (campaign) {
          results.social = { status: 'scheduled', campaignId: campaign.id }
        }
      } catch {
        results.social = { status: 'failed', error: 'Caption generation failed' }
      }
    }
  } else {
    results.social = { status: 'skipped' }
  }

  // --- Mailer ---
  if (mailer.action !== 'skip') {
    const { data: post } = await deps.db
      .from('blog_posts')
      .select('title, excerpt')
      .eq('id', id)
      .single()

    if (post) {
      const { data: campaign } = await deps.db.from('mailer_campaigns').insert({
        content_type: 'blog',
        source_id: id,
        subject: post.title,
        preview_text: post.excerpt,
        status: mailer.action === 'schedule' ? 'scheduled' : 'draft',
        scheduled_for: mailer.action === 'schedule' ? mailer.scheduledFor : null,
      }).select('id').single()

      if (campaign && mailer.action === 'now') {
        try {
          const sendResult = await sendMailer(campaign.id, actor)
          results.mailer = { status: 'sent', recipientCount: sendResult.recipientCount }
          await deps.db.from('blog_posts').update({ emailed_at: deps.clock.now().toISOString() }).eq('id', id)
        } catch {
          results.mailer = { status: 'failed' }
        }
      } else if (campaign) {
        results.mailer = { status: 'scheduled', campaignId: campaign.id }
      }
    }
  } else {
    results.mailer = { status: 'skipped' }
  }

  return results
}

export async function executeEventPublishWorkflow(
  input: PublishInput,
  deps: AppDeps = defaultDeps,
) {
  const { id, site, social, mailer, actor } = input
  const results: Record<string, unknown> = {}

  // --- Website ---
  if (site.action === 'now') {
    await publishToSite('event', id, actor)
    results.site = { status: 'published' }
  } else if (site.action === 'schedule' && site.scheduledFor) {
    await scheduleForSite('event', id, site.scheduledFor, actor)
    results.site = { status: 'scheduled', scheduledFor: site.scheduledFor }
  } else {
    results.site = { status: 'skipped' }
  }

  // --- Social ---
  if (social.action !== 'skip') {
    const { data: event } = await deps.db
      .from('events')
      .select('title, short_description, featured_image')
      .eq('id', id)
      .single()

    if (event) {
      const captionPrompt = `You write social media captions for The Sea Star. ${SEA_STAR_VOICE}

Given an event title and description, write TWO captions:
1. facebook_caption: 2-3 sentences announcing the event. Max 250 characters.
2. instagram_caption: 2-3 sentences, casual, 1-2 emojis. Include 3-5 hashtags. Max 300 characters.

Return ONLY valid JSON with fields: facebook_caption, instagram_caption`

      try {
        const content = await deps.ai.generate(
          captionPrompt,
          `Event: ${event.title}\nDescription: ${event.short_description || ''}`,
          { temperature: 0.5, maxTokens: 500 }
        )
        const captions = cleanJsonResponse(content) as { facebook_caption: string; instagram_caption: string }

        const { data: campaign } = await deps.db.from('social_campaigns').insert({
          content_type: 'event',
          source_id: id,
          facebook_caption: captions.facebook_caption,
          instagram_caption: captions.instagram_caption,
          image_url: event.featured_image,
          status: social.action === 'schedule' ? 'scheduled' : 'draft',
          scheduled_for: social.action === 'schedule' ? social.scheduledFor : null,
        }).select('id').single()

        if (campaign && social.action === 'now') {
          const socialResults = await executeSocialPost(campaign.id, actor)
          results.social = { status: 'posted', ...socialResults }
        } else if (campaign) {
          results.social = { status: 'scheduled', campaignId: campaign.id }
        }
      } catch {
        results.social = { status: 'failed', error: 'Caption generation failed' }
      }
    }
  } else {
    results.social = { status: 'skipped' }
  }

  // --- Mailer ---
  if (mailer.action !== 'skip') {
    const { data: event } = await deps.db
      .from('events')
      .select('title, short_description')
      .eq('id', id)
      .single()

    if (event) {
      const { data: campaign } = await deps.db.from('mailer_campaigns').insert({
        content_type: 'event',
        source_id: id,
        subject: event.title,
        preview_text: event.short_description,
        status: mailer.action === 'schedule' ? 'scheduled' : 'draft',
        scheduled_for: mailer.action === 'schedule' ? mailer.scheduledFor : null,
      }).select('id').single()

      if (campaign && mailer.action === 'now') {
        try {
          const sendResult = await sendMailer(campaign.id, actor)
          results.mailer = { status: 'sent', recipientCount: sendResult.recipientCount }
        } catch {
          results.mailer = { status: 'failed' }
        }
      } else if (campaign) {
        results.mailer = { status: 'scheduled', campaignId: campaign.id }
      }
    }
  } else {
    results.mailer = { status: 'skipped' }
  }

  return results
}
