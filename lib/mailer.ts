import { supabase } from './supabase'
import { resend } from './resend'
import { logActivity } from './activity'

interface MailerSource {
  type: 'blog' | 'event'
  title: string
  excerpt: string
  imageUrl?: string
  ctaUrl: string
  ctaText: string
}

function renderMailerHtml(source: MailerSource, subject: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#06080d;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;color:#c9a54e;margin:0;font-weight:400;letter-spacing:2px;">THE SEA STAR</h1>
      <p style="font-size:11px;color:#7a8a9e;letter-spacing:4px;margin:8px 0 0;text-transform:uppercase;">Dogpatch, San Francisco</p>
    </div>
    <div style="border:1px solid rgba(201,165,78,0.15);padding:24px;margin-bottom:24px;">
      ${source.imageUrl ? `<img src="${source.imageUrl}" alt="${source.title}" style="width:100%;max-height:280px;object-fit:cover;margin-bottom:16px;" />` : ''}
      <h2 style="font-size:20px;color:#e8e0d0;margin:0 0 12px;font-weight:400;">${source.title}</h2>
      <p style="font-size:14px;color:#7a8a9e;line-height:1.6;margin:0 0 16px;">${source.excerpt}</p>
      <a href="${source.ctaUrl}" style="display:inline-block;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a54e;text-decoration:none;border-bottom:1px solid rgba(201,165,78,0.4);padding-bottom:2px;">${source.ctaText} →</a>
    </div>
    <div style="text-align:center;padding-top:24px;border-top:1px solid rgba(201,165,78,0.1);">
      <p style="font-size:11px;color:#4a5a6e;margin:0;">The Sea Star · 2289 3rd Street · San Francisco, CA</p>
      <p style="font-size:11px;color:#4a5a6e;margin:8px 0 0;"><a href="%unsubscribe_url%" style="color:#4a5a6e;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
}

export async function renderMailerPreview(campaignId: string): Promise<string> {
  const { data: campaign } = await supabase
    .from('mailer_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) throw new Error('Campaign not found')

  if (campaign.content_type === 'standalone_email' || campaign.content_type === 'digest') {
    if (campaign.content_type === 'digest' && campaign.body_html) {
      return campaign.body_html
    }
    const source: MailerSource = {
      type: 'blog' as const,
      title: campaign.subject || 'Newsletter',
      excerpt: campaign.body_html || '',
      imageUrl: campaign.hero_image,
      ctaUrl: campaign.cta_url || 'https://theseastarsf.com',
      ctaText: campaign.cta_text || 'Visit Us',
    }
    return renderMailerHtml(source, campaign.subject || source.title)
  }

  const source = await getMailerSource(campaign.content_type, campaign.source_id)
  if (campaign.hero_image) source.imageUrl = campaign.hero_image
  return renderMailerHtml(source, campaign.subject || source.title)
}

async function getMailerSource(contentType: string, sourceId: string): Promise<MailerSource> {
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('key', 'site_url')
    .single()
  const siteUrl = settings?.value || 'https://theseastarsf.com'

  if (contentType === 'blog') {
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, excerpt, slug, featured_image')
      .eq('id', sourceId)
      .single()
    if (!post) throw new Error('Blog post not found')
    return {
      type: 'blog',
      title: post.title,
      excerpt: post.excerpt || '',
      imageUrl: post.featured_image,
      ctaUrl: `${siteUrl}/blog/${post.slug}`,
      ctaText: 'Read More',
    }
  }

  if (contentType === 'event') {
    const { data: event } = await supabase
      .from('events')
      .select('title, short_description, slug, featured_image, starts_at')
      .eq('id', sourceId)
      .single()
    if (!event) throw new Error('Event not found')
    const dateStr = new Date(event.starts_at).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
    return {
      type: 'event',
      title: event.title,
      excerpt: `${dateStr} — ${event.short_description || ''}`,
      imageUrl: event.featured_image,
      ctaUrl: `${siteUrl}/?event=${event.slug}#events`,
      ctaText: 'See Details',
    }
  }

  throw new Error(`Unknown content type: ${contentType}`)
}

export async function sendMailer(campaignId: string, actor?: string) {
  const { data: campaign } = await supabase
    .from('mailer_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) throw new Error('Campaign not found')

  let source: MailerSource
  let html: string | undefined
  if (campaign.content_type === 'digest' && campaign.body_html) {
    html = campaign.body_html
    source = { type: 'blog', title: campaign.subject || 'Newsletter', excerpt: '', ctaUrl: '', ctaText: '' }
  } else if (campaign.content_type === 'standalone_email') {
    source = {
      type: 'blog' as const,
      title: campaign.subject || 'Newsletter',
      excerpt: campaign.body_html || '',
      imageUrl: campaign.hero_image,
      ctaUrl: campaign.cta_url || 'https://theseastarsf.com',
      ctaText: campaign.cta_text || 'Visit Us',
    }
  } else {
    source = await getMailerSource(campaign.content_type, campaign.source_id)
    if (campaign.hero_image) source.imageUrl = campaign.hero_image
  }
  if (!html) html = renderMailerHtml(source, campaign.subject || source.title)

  // Tag-targeted sends: if campaign has target_tags, filter subscribers
  let subscriberQuery = supabase
    .from('email_subscribers')
    .select('email')
    .eq('is_active', true)

  if (campaign.target_tags && Array.isArray(campaign.target_tags) && campaign.target_tags.length > 0) {
    subscriberQuery = subscriberQuery.overlaps('tags', campaign.target_tags)
  }

  const { data: subscribers } = await subscriberQuery

  if (!subscribers || subscribers.length === 0) {
    await supabase.from('mailer_campaigns').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipient_count: 0,
    }).eq('id', campaignId)
    return { recipientCount: 0 }
  }

  // Send in batches of 100
  const batchSize = 100
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)
    await resend.batch.send(
      batch.map((sub) => ({
        from: 'The Sea Star <hello@theseastarsf.com>',
        to: sub.email,
        subject: campaign.subject || source.title,
        html,
      }))
    )
  }

  await supabase.from('mailer_campaigns').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    recipient_count: subscribers.length,
  }).eq('id', campaignId)

  await logActivity({
    action: 'mailer_sent',
    entityType: 'mailer',
    entityId: campaignId,
    summary: `Mailer sent: "${campaign.subject || source.title}" to ${subscribers.length} subscribers`,
    actor,
  })

  return { recipientCount: subscribers.length }
}
