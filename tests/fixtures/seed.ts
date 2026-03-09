/**
 * Constants matching supabase/seed.sql IDs.
 * No row definitions here — seed.sql is the single source of truth.
 */

export const SEED = {
  admin: {
    alicia: {
      id: 'a0000000-0000-0000-0000-000000000001',
      username: 'alicia',
      role: 'super_admin',
      password: 'testpass123',
    },
    gg: {
      id: 'a0000000-0000-0000-0000-000000000002',
      username: 'gg',
      role: 'social_admin',
      password: 'testpass123',
    },
  },
  blogPosts: {
    published: { id: 'b0000000-0000-0000-0000-000000000001', slug: 'test-published' },
    draft: { id: 'b0000000-0000-0000-0000-000000000002', slug: 'test-draft' },
    scheduled: { id: 'b0000000-0000-0000-0000-000000000003', slug: 'test-scheduled' },
  },
  events: {
    trivia: { id: 'e0000000-0000-0000-0000-000000000001', slug: 'trivia-night' },
    private: { id: 'e0000000-0000-0000-0000-000000000002', slug: 'private-tasting' },
    past: { id: 'e0000000-0000-0000-0000-000000000003', slug: 'past-event' },
  },
  socialCampaigns: {
    scheduled: { id: 'c0000000-0000-0000-0000-000000000001' },
  },
  mailerCampaigns: {
    scheduled: { id: 'd0000000-0000-0000-0000-000000000001' },
  },
  subscribers: {
    count: 5,
    ids: [
      'f0000000-0000-0000-0000-000000000001',
      'f0000000-0000-0000-0000-000000000002',
      'f0000000-0000-0000-0000-000000000003',
      'f0000000-0000-0000-0000-000000000004',
      'f0000000-0000-0000-0000-000000000005',
    ],
  },
  contacts: {
    unread: 2,
    read: 1,
  },
  pageSeo: {
    home: { id: 'bb000000-0000-0000-0000-000000000001', path: '/' },
    blog: { id: 'bb000000-0000-0000-0000-000000000002', path: '/blog' },
  },
} as const
