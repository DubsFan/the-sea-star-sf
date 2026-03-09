import { supabase } from './supabase'
import type { AppDeps } from './deps'

interface ActivityInput {
  action: string
  entityType?: string
  entityId?: string
  summary?: string
  actor?: string
}

export async function logActivity({ action, entityType, entityId, summary, actor }: ActivityInput, deps?: Pick<AppDeps, 'db'>) {
  const db = deps?.db || supabase
  await db.from('activity_logs').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    actor: actor || 'system',
  })
}
