import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { publishToSite, scheduleForSite } from '@/lib/publisher'
import { sendMailer } from '@/lib/mailer'
import { executeSocialPost } from '@/lib/social-post'
import { logActivity } from '@/lib/activity'
import { SEA_STAR_VOICE, generateWithGroq, cleanJsonResponse } from '@/lib/ai'

interface ChannelAction {
  action: 'skip' | 'now' | 'schedule'
  scheduledFor?: string
  hero_image?: string
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id } = body

  // Validate required fields
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 })
  }

  // Support legacy payload (just { id }) — treat as site=now, social=skip, mailer=skip
  const site: ChannelAction = body.site || { action: 'now' }
  const social: ChannelAction = body.social || { action: 'skip' }
  const mailer: ChannelAction = body.mailer || { action: 'skip' }

  const validActions = ['skip', 'now', 'schedule']
  if (!validActions.includes(site.action) || !validActions.includes(social.action) || !validActions.includes(mailer.action)) {
    return NextResponse.json({ error: 'Invalid channel action' }, { status: 400 })
  }
  if (site.action === 'schedule' && !site.scheduledFor) {
    return NextResponse.json({ error: 'scheduledFor required for schedule action' }, { status: 400 })
  }
  if (social.action === 'schedule' && !social.scheduledFor) {
    return NextResponse.json({ error: 'scheduledFor required for schedule action' }, { status: 400 })
  }
  if (mailer.action === 'schedule' && !mailer.scheduledFor) {
    return NextResponse.json({ error: 'scheduledFor required for schedule action' }, { status: 400 })
  }

  const results: Record<string, unknown> = {}

  // --- Website ---
  if (site.action === 'now') {
    await publishToSite('blog_post', id, admin.username)
    // Also set is_published + emailed_at for backward compat
    await supabase.from('blog_posts').update({ is_published: true }).eq('id', id)
    results.site = { status: 'published' }
  } else if (site.action === 'schedule' && site.scheduledFor) {
    await scheduleForSite('blog_post', id, site.scheduledFor, admin.username)
    results.site = { status: 'scheduled', scheduledFor: site.scheduledFor }
  } else {
    results.site = { status: 'skipped' }
  }

  // --- Social ---
  if (social.action !== 'skip') {
    // Get blog post data for caption generation
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, excerpt, slug, featured_image, images')
      .eq('id', id)
      .single()

    if (post) {
      const imageUrl = post.featured_image || (post.images && post.images.length > 0 ? post.images[0] : null)

      // Generate captions
      const captionPrompt = `You write social media captions for The Sea Star. ${SEA_STAR_VOICE}

Given a blog post title and excerpt, write TWO captions:
1. facebook_caption: 2-3 sentences that tease the story and include a call to action. Max 250 characters.
2. instagram_caption: 2-3 sentences. More casual, can use 1-2 relevant emojis. End with "Link in bio." Include 3-5 hashtags on a new line. Max 300 characters total.

Return ONLY valid JSON with fields: facebook_caption, instagram_caption`

      try {
        const captionContent = await generateWithGroq(
          captionPrompt,
          `Title: ${post.title}\nExcerpt: ${post.excerpt}`,
          { temperature: 0.5, maxTokens: 500 }
        )
        const captions = cleanJsonResponse(captionContent) as { facebook_caption: string; instagram_caption: string }

        // Create social campaign
        const { data: campaign } = await supabase.from('social_campaigns').insert({
          content_type: 'blog',
          source_id: id,
          facebook_caption: captions.facebook_caption,
          instagram_caption: captions.instagram_caption,
          image_url: imageUrl,
          status: social.action === 'schedule' ? 'scheduled' : 'draft',
          scheduled_for: social.action === 'schedule' ? social.scheduledFor : null,
        }).select('id').single()

        if (campaign && social.action === 'now') {
          const socialResults = await executeSocialPost(campaign.id, admin.username)
          results.social = { status: 'posted', ...socialResults }

          // Update blog post social_posted_at
          const anySuccess = Object.values(socialResults).some((r: { success: boolean }) => r.success)
          if (anySuccess) {
            await supabase.from('blog_posts').update({ social_posted_at: new Date().toISOString() }).eq('id', id)
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
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, excerpt')
      .eq('id', id)
      .single()

    if (post) {
      const { data: campaign } = await supabase.from('mailer_campaigns').insert({
        content_type: 'blog',
        source_id: id,
        subject: post.title,
        preview_text: post.excerpt,
        hero_image: mailer.hero_image || null,
        status: mailer.action === 'schedule' ? 'scheduled' : 'draft',
        scheduled_for: mailer.action === 'schedule' ? mailer.scheduledFor : null,
      }).select('id').single()

      if (campaign && mailer.action === 'now') {
        try {
          const sendResult = await sendMailer(campaign.id, admin.username)
          results.mailer = { status: 'sent', recipientCount: sendResult.recipientCount }

          await supabase.from('blog_posts').update({ emailed_at: new Date().toISOString() }).eq('id', id)
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

  // Get the published post to return
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  return NextResponse.json({ success: true, post, channels: results })
}
