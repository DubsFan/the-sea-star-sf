import { describe, it, expect } from 'vitest'
import { getPageSeo } from '@/lib/seo'
import { createClient } from '@supabase/supabase-js'

// Create a mock DB that returns null for page_seo queries
function createNullDb() {
  // Use a real client pointing nowhere — we'll rely on the function's fallback behavior
  // Instead, create a minimal mock
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof createClient>
}

describe('getPageSeo', () => {
  it('returns defaults for / when DB returns null', async () => {
    const seo = await getPageSeo('/', { db: createNullDb() })
    expect(seo.metaTitle).toContain('The Sea Star')
    expect(seo.metaTitle).toContain('Dogpatch')
    expect(seo.metaDescription).toBeTruthy()
  })

  it('returns defaults for /blog when DB returns null', async () => {
    const seo = await getPageSeo('/blog', { db: createNullDb() })
    expect(seo.metaTitle).toContain('Journal')
    expect(seo.metaDescription).toBeTruthy()
  })

  it('returns generic defaults for unknown path', async () => {
    const seo = await getPageSeo('/unknown', { db: createNullDb() })
    expect(seo.metaTitle).toBe('The Sea Star SF')
    expect(seo.metaDescription).toBe('')
  })
})
