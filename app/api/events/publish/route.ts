import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { publishToSite, scheduleForSite } from '@/lib/publisher'
import { sendMailer } from '@/lib/mailer'
import { executeSocialPost } from '@/lib/social-post'
import { SEA_STAR_VOICE, generateWithGroq, cleanJsonResponse } from '@/lib/ai'

interface ChannelAction {
  action: 'skip' | 'now' | 'schedule'
  scheduledFor?: string
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id } = body

  // Validate required fields
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 })
  }

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
    await publishToSite('event', id, admin.username)
    results.site = { status: 'published' }
  } else if (site.action === 'schedule' && site.scheduledFor) {
    await scheduleForSite('event', id, site.scheduledFor, admin.username)
    results.site = { status: 'scheduled', scheduledFor: site.scheduledFor }
  } else {
    results.site = { status: 'skipped' }
  }

  // --- Social ---
  if (social.action !== 'skip') {
    const { data: event } = await supabase
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
        const content = await generateWithGroq(
          captionPrompt,
          `Event: ${event.title}\nDescription: ${event.short_description || ''}`,
          { temperature: 0.5, maxTokens: 500 }
        )
        const captions = cleanJsonResponse(content) as { facebook_caption: string; instagram_caption: string }

        const { data: campaign } = await supabase.from('social_campaigns').insert({
          content_type: 'event',
          source_id: id,
          facebook_caption: captions.facebook_caption,
          instagram_caption: captions.instagram_caption,
          image_url: event.featured_image,
          status: social.action === 'schedule' ? 'scheduled' : 'draft',
          scheduled_for: social.action === 'schedule' ? social.scheduledFor : null,
        }).select('id').single()

        if (campaign && social.action === 'now') {
          const socialResults = await executeSocialPost(campaign.id, admin.username)
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
    const { data: event } = await supabase
      .from('events')
      .select('title, short_description')
      .eq('id', id)
      .single()

    if (event) {
      const { data: campaign } = await supabase.from('mailer_campaigns').insert({
        content_type: 'event',
        source_id: id,
        subject: event.title,
        preview_text: event.short_description,
        status: mailer.action === 'schedule' ? 'scheduled' : 'draft',
        scheduled_for: mailer.action === 'schedule' ? mailer.scheduledFor : null,
      }).select('id').single()

      if (campaign && mailer.action === 'now') {
        try {
          const sendResult = await sendMailer(campaign.id, admin.username)
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

  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
  return NextResponse.json({ success: true, event, channels: results })
}
