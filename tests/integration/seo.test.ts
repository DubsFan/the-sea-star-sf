import { describe, it, expect } from 'vitest'
import { getPageSeo } from '@/lib/seo'
import { buildBaseContext } from '@/lib/ai'
import { getTestDb } from '../setup/local-supabase'
import { SEED } from '../fixtures/seed'

const db = getTestDb()

describe('getPageSeo with real DB', () => {
  it('returns seeded / row', async () => {
    const seo = await getPageSeo('/', { db })
    expect(seo.metaTitle).toContain('The Sea Star')
    expect(seo.metaDescription).toBeTruthy()
  })

  it('returns seeded /blog row', async () => {
    const seo = await getPageSeo('/blog', { db })
    expect(seo.metaTitle).toContain('Journal')
  })
})

describe('buildBaseContext with real DB', () => {
  it('reads seeded site_settings', async () => {
    const ctx = await buildBaseContext({ db })
    expect(ctx.keywords).toContain('craft cocktails')
    expect(ctx.toneNotes).toContain('Warm')
  })
})
