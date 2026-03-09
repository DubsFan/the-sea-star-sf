import { describe, it, expect, afterAll } from 'vitest'
import { logActivity } from '@/lib/activity'
import { getTestDb } from '../setup/local-supabase'

const db = getTestDb()
const createdIds: string[] = []

describe('logActivity', () => {
  afterAll(async () => {
    if (createdIds.length > 0) {
      await db.from('activity_logs').delete().in('id', createdIds)
    }
  })

  it('inserts a row with all fields', async () => {
    await logActivity({
      action: 'test_action',
      entityType: 'test',
      entityId: 'cc000000-0000-0000-0000-000000000099',
      summary: 'Test activity',
      actor: 'test-user',
    }, { db })

    const { data } = await db
      .from('activity_logs')
      .select('*')
      .eq('action', 'test_action')
      .eq('actor', 'test-user')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    expect(data).toBeTruthy()
    expect(data!.action).toBe('test_action')
    expect(data!.entity_type).toBe('test')
    expect(data!.summary).toBe('Test activity')
    expect(data!.actor).toBe('test-user')

    createdIds.push(data!.id)
  })

  it('defaults actor to system', async () => {
    await logActivity({ action: 'system_test' }, { db })

    const { data } = await db
      .from('activity_logs')
      .select('*')
      .eq('action', 'system_test')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    expect(data).toBeTruthy()
    expect(data!.actor).toBe('system')

    createdIds.push(data!.id)
  })
})
