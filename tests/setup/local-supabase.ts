import { createClient } from '@supabase/supabase-js'

export function getTestDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * Delete transient rows created during tests.
 * Only deletes rows with IDs matching test patterns.
 */
export async function cleanupTransientRows(db: ReturnType<typeof getTestDb>, tableAndIds: { table: string; ids: string[] }[]) {
  for (const { table, ids } of tableAndIds) {
    if (ids.length > 0) {
      await db.from(table).delete().in('id', ids)
    }
  }
}
