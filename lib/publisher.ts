import { supabase } from './supabase'
import { logActivity } from './activity'
import type { AppDeps } from './deps'
import { BUSINESS } from './business'

type EntityType = 'blog_post' | 'event'

function getTable(type: EntityType): string {
  return type === 'blog_post' ? 'blog_posts' : 'events'
}

export async function publishToSite(type: EntityType, id: string, actor?: string, deps?: Pick<AppDeps, 'db'>) {
  const db = deps?.db || supabase
  const table = getTable(type)
  const { data, error } = await db
    .from(table)
    .update({
      status: 'published',
      is_published: type === 'blog_post' ? true : undefined,
      published_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('title')
    .single()

  if (error) throw new Error(`Failed to publish ${type}: ${error.message}`)

  await logActivity({
    action: `${type}_published`,
    entityType: type,
    entityId: id,
    summary: `Published: ${data?.title}`,
    actor,
  }, deps ? { db: deps.db } : undefined)

  // Fire IndexNow ping (non-blocking)
  const slug = type === 'blog_post'
    ? await db.from('blog_posts').select('slug').eq('id', id).single().then(r => r.data?.slug)
    : await db.from('events').select('id').eq('id', id).single().then(r => r.data?.id)

  if (slug) {
    const path = type === 'blog_post' ? `/blog/${slug}` : `/events/${slug}`
    pingIndexNow(`${BUSINESS.url}${path}`).catch(() => {})
  }

  return data
}

export async function scheduleForSite(type: EntityType, id: string, scheduledFor: string, actor?: string, deps?: Pick<AppDeps, 'db'>) {
  const db = deps?.db || supabase
  const table = getTable(type)
  const { data, error } = await db
    .from(table)
    .update({
      status: 'scheduled',
      scheduled_for: scheduledFor,
    })
    .eq('id', id)
    .select('title')
    .single()

  if (error) throw new Error(`Failed to schedule ${type}: ${error.message}`)

  await logActivity({
    action: `${type}_scheduled`,
    entityType: type,
    entityId: id,
    summary: `Scheduled: ${data?.title} for ${new Date(scheduledFor).toLocaleString()}`,
    actor,
  }, deps ? { db: deps.db } : undefined)

  return data
}

/**
 * Ping IndexNow to notify search engines of new/updated content.
 * Non-blocking — failures are silently ignored.
 */
async function pingIndexNow(pageUrl: string): Promise<void> {
  const host = new URL(BUSINESS.url).host
  const indexNowUrl = `https://api.indexnow.org/indexnow?url=${encodeURIComponent(pageUrl)}&key=${host}`

  await fetch(indexNowUrl, { method: 'GET' })
}
