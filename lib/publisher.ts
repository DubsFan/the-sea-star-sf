import { supabase } from './supabase'
import { logActivity } from './activity'
import type { AppDeps } from './deps'

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
