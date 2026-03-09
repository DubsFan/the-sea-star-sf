import { supabase } from './supabase'
import { logActivity } from './activity'
import { sendMailer } from './mailer'
import type { AppDeps } from './deps'

interface SchedulerResult {
  blogsPublished: number
  eventsPublished: number
  eventsArchived: number
  socialPosted: number
  mailersSent: number
}

export async function runScheduledJobs(deps?: Pick<AppDeps, 'db' | 'clock'>): Promise<SchedulerResult> {
  const db = deps?.db || supabase
  const now = (deps?.clock?.now() || new Date()).toISOString()
  const result: SchedulerResult = {
    blogsPublished: 0,
    eventsPublished: 0,
    eventsArchived: 0,
    socialPosted: 0,
    mailersSent: 0,
  }

  // 1. Publish scheduled blog posts
  const { data: dueBlogPosts } = await db
    .from('blog_posts')
    .select('id, title')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)

  if (dueBlogPosts) {
    for (const post of dueBlogPosts) {
      await db.from('blog_posts').update({
        status: 'published',
        is_published: true,
        published_at: now,
      }).eq('id', post.id)
      await logActivity({
        action: 'blog_post_published',
        entityType: 'blog_post',
        entityId: post.id,
        summary: `Auto-published: ${post.title}`,
        actor: 'scheduler',
      }, { db })
      result.blogsPublished++
    }
  }

  // 2. Publish scheduled events
  const { data: dueEvents } = await db
    .from('events')
    .select('id, title')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)

  if (dueEvents) {
    for (const event of dueEvents) {
      await db.from('events').update({
        status: 'published',
        published_at: now,
      }).eq('id', event.id)
      await logActivity({
        action: 'event_published',
        entityType: 'event',
        entityId: event.id,
        summary: `Auto-published: ${event.title}`,
        actor: 'scheduler',
      }, { db })
      result.eventsPublished++
    }
  }

  // 3. Auto-archive past events
  const { data: pastEvents } = await db
    .from('events')
    .select('id, title')
    .eq('status', 'published')
    .lt('ends_at', now)

  if (pastEvents) {
    for (const event of pastEvents) {
      await db.from('events').update({
        status: 'archived',
        archived_at: now,
      }).eq('id', event.id)
      await logActivity({
        action: 'event_archived',
        entityType: 'event',
        entityId: event.id,
        summary: `Auto-archived: ${event.title}`,
        actor: 'scheduler',
      }, { db })
      result.eventsArchived++
    }
  }

  // 4. Post scheduled social campaigns
  const { data: dueSocial } = await db
    .from('social_campaigns')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)

  if (dueSocial) {
    for (const campaign of dueSocial) {
      try {
        // Import dynamically to avoid circular deps
        const { executeSocialPost } = await import('./social-post')
        await executeSocialPost(campaign.id, 'scheduler')
        result.socialPosted++
      } catch {
        await db.from('social_campaigns').update({ status: 'failed' }).eq('id', campaign.id)
      }
    }
  }

  // 5. Send scheduled mailer campaigns
  const { data: dueMailers } = await db
    .from('mailer_campaigns')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)

  if (dueMailers) {
    for (const mailer of dueMailers) {
      try {
        await sendMailer(mailer.id, 'scheduler')
        result.mailersSent++
      } catch {
        await db.from('mailer_campaigns').update({ status: 'failed' }).eq('id', mailer.id)
      }
    }
  }

  return result
}
