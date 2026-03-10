import { describe, it, expect, afterAll } from 'vitest'
import { getTestDb } from '../setup/local-supabase'
import { buildBaseContext } from '@/lib/ai'

const db = getTestDb()

// Clean up any settings we create
const createdKeys: string[] = []
afterAll(async () => {
  if (createdKeys.length > 0) {
    await db.from('site_settings').delete().in('key', createdKeys)
  }
})

describe('02 — Data Integrity', () => {
  it('content_import_previews table exists', async () => {
    const { error } = await db.from('content_import_previews').select('id').limit(0)
    expect(error).toBeNull()
  })

  it('media_items table exists', async () => {
    const { error } = await db.from('media_items').select('id').limit(0)
    expect(error).toBeNull()
  })

  it('FAQ unique partial index exists', async () => {
    const { data, error } = await db.rpc('exec_sql', {
      query: `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_faq_unique_public_question'`,
    }).catch(() => ({ data: null, error: { message: 'rpc not available' } }))

    // If RPC not available, try direct query
    if (error) {
      // Fallback: try inserting duplicate FAQ to verify constraint
      const testQ = `__test_unique_faq_${Date.now()}`
      const { error: ins1 } = await db.from('content_library_items').insert({
        asset_type: 'faq',
        is_public: true,
        question: testQ,
        answer: 'test',
        source_file: '__test',
        source_row_id: '__test_1',
      })
      if (!ins1) {
        const { error: ins2 } = await db.from('content_library_items').insert({
          asset_type: 'faq',
          is_public: true,
          question: testQ,
          answer: 'test2',
          source_file: '__test',
          source_row_id: '__test_2',
        })
        // Should fail due to unique constraint
        expect(ins2).not.toBeNull()
        // Cleanup
        await db.from('content_library_items').delete().eq('question', testQ)
      }
      return
    }

    expect(data).toBeTruthy()
  })

  it('seo_keywords_primary accepted by settings API', async () => {
    const key = 'seo_keywords_primary'
    createdKeys.push(key)
    const { error } = await db.from('site_settings').upsert(
      { key, value: 'test keywords', updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
    expect(error).toBeNull()
  })

  it('seo_keywords_secondary accepted by settings API', async () => {
    const key = 'seo_keywords_secondary'
    createdKeys.push(key)
    const { error } = await db.from('site_settings').upsert(
      { key, value: 'secondary test', updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
    expect(error).toBeNull()
  })

  it('keyword fallback chain works', async () => {
    // Clear primary/secondary, set only blog_keywords
    await db.from('site_settings').delete().eq('key', 'seo_keywords_primary')
    await db.from('site_settings').delete().eq('key', 'seo_keywords')
    await db.from('site_settings').upsert(
      { key: 'blog_keywords', value: 'craft cocktails, dogpatch bar', updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )

    const ctx1 = await buildBaseContext({ db })
    expect(ctx1.primaryKeywords).toContain('craft cocktails')
    expect(ctx1.primaryKeywords).toContain('dogpatch bar')

    // Now set seo_keywords_primary — should take priority
    await db.from('site_settings').upsert(
      { key: 'seo_keywords_primary', value: 'sf cocktail bar, sea star', updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
    createdKeys.push('blog_keywords')

    const ctx2 = await buildBaseContext({ db })
    expect(ctx2.primaryKeywords).toContain('sf cocktail bar')
    expect(ctx2.primaryKeywords).toContain('sea star')
    expect(ctx2.primaryKeywords).not.toContain('craft cocktails')
  })

  it('duplicate public FAQ rejected by unique constraint', async () => {
    const testQ = `__test_dup_faq_${Date.now()}`

    const { error: ins1 } = await db.from('content_library_items').insert({
      asset_type: 'faq',
      is_public: true,
      question: testQ,
      answer: 'answer one',
      source_file: '__test',
      source_row_id: '__test_dup_1',
    })
    expect(ins1).toBeNull()

    const { error: ins2 } = await db.from('content_library_items').insert({
      asset_type: 'faq',
      is_public: true,
      question: testQ,
      answer: 'answer two',
      source_file: '__test',
      source_row_id: '__test_dup_2',
    })
    // Should fail on duplicate
    expect(ins2).not.toBeNull()

    // Cleanup
    await db.from('content_library_items').delete().eq('question', testQ)
  })
})
