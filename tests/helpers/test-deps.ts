import { createClient } from '@supabase/supabase-js'
import type { AppDeps } from '@/lib/deps'
import { createFakeAi } from '../fakes/fake-ai'
import { createFakeEmail } from '../fakes/fake-email'
import { createFakeSocial } from '../fakes/fake-social'
import { createFakeClock } from '../fakes/fake-clock'
import { createFakeIdFactory } from '../fakes/fake-id'

export function getTestDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export function createTestDeps(overrides?: Partial<AppDeps>): AppDeps {
  return {
    db: overrides?.db || getTestDb(),
    ai: overrides?.ai || createFakeAi(),
    email: overrides?.email || createFakeEmail(),
    social: overrides?.social || createFakeSocial(),
    clock: overrides?.clock || createFakeClock('2026-03-09T12:00:00Z'),
    idFactory: overrides?.idFactory || createFakeIdFactory([
      'dddddddd-0000-0000-0000-000000000001',
      'dddddddd-0000-0000-0000-000000000002',
      'dddddddd-0000-0000-0000-000000000003',
    ]),
  }
}
