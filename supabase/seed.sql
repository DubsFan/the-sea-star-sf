-- Deterministic seed for test environment
-- Applied by: npx supabase db reset

-- ============================================================
-- admin_users
-- ============================================================
-- Password hash for 'testpass123': $2b$10$Wddcn.dDVcjeI6L97bc5I.QW77jz1Dz3qB6WLwDPGtX0kNiEbuopG
INSERT INTO admin_users (id, username, password_hash, role, display_name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'alicia', '$2b$10$Wddcn.dDVcjeI6L97bc5I.QW77jz1Dz3qB6WLwDPGtX0kNiEbuopG', 'super_admin', 'Alicia'),
  ('a0000000-0000-0000-0000-000000000002', 'gg', '$2b$10$Wddcn.dDVcjeI6L97bc5I.QW77jz1Dz3qB6WLwDPGtX0kNiEbuopG', 'social_admin', 'GG')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- blog_posts (baseline for stats + route reads)
-- ============================================================
INSERT INTO blog_posts (id, title, slug, body, excerpt, status, is_published, published_at, featured_image) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Test Published Post', 'test-published', '<p>Published content</p>', 'A test published post.', 'published', true, '2026-02-01T12:00:00Z', '/bright-drinks.png'),
  ('b0000000-0000-0000-0000-000000000002', 'Test Draft Post', 'test-draft', '<p>Draft content</p>', 'A test draft post.', 'draft', false, NULL, NULL),
  ('b0000000-0000-0000-0000-000000000003', 'Scheduled Post', 'test-scheduled', '<p>Scheduled</p>', 'A scheduled post.', 'scheduled', false, NULL, '/bright-drinks.png')
ON CONFLICT DO NOTHING;

-- ============================================================
-- events (baseline upcoming + public)
-- ============================================================
INSERT INTO events (id, title, slug, short_description, starts_at, ends_at, is_public, status, recurrence_preset) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Trivia Night', 'trivia-night', 'Weekly pub trivia at The Sea Star', '2026-04-01T19:00:00Z', '2026-04-01T21:00:00Z', true, 'published', 'Weekly'),
  ('e0000000-0000-0000-0000-000000000002', 'Private Tasting', 'private-tasting', 'Members-only cocktail tasting', '2026-04-05T18:00:00Z', '2026-04-05T20:00:00Z', false, 'draft', 'One time'),
  ('e0000000-0000-0000-0000-000000000003', 'Past Event', 'past-event', 'This already happened', '2026-01-01T19:00:00Z', '2026-01-01T21:00:00Z', true, 'published', 'One time')
ON CONFLICT DO NOTHING;

-- ============================================================
-- social_campaigns (one scheduled for scheduler smoke)
-- ============================================================
INSERT INTO social_campaigns (id, content_type, source_id, facebook_caption, instagram_caption, image_url, status, scheduled_for) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'blog', 'b0000000-0000-0000-0000-000000000001', 'Check out our latest post!', 'New on the journal ✨', '/bright-drinks.png', 'scheduled', '2026-03-01T12:00:00Z')
ON CONFLICT DO NOTHING;

-- ============================================================
-- mailer_campaigns (one scheduled for scheduler smoke)
-- ============================================================
INSERT INTO mailer_campaigns (id, content_type, source_id, subject, preview_text, status, scheduled_for) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'blog', 'b0000000-0000-0000-0000-000000000001', 'New from The Sea Star', 'Check out our latest blog post', 'scheduled', '2026-03-01T12:00:00Z')
ON CONFLICT DO NOTHING;

-- ============================================================
-- email_subscribers (5 active)
-- ============================================================
INSERT INTO email_subscribers (id, email, name, is_active) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'sub1@test.com', 'Sub One', true),
  ('f0000000-0000-0000-0000-000000000002', 'sub2@test.com', 'Sub Two', true),
  ('f0000000-0000-0000-0000-000000000003', 'sub3@test.com', 'Sub Three', true),
  ('f0000000-0000-0000-0000-000000000004', 'sub4@test.com', 'Sub Four', true),
  ('f0000000-0000-0000-0000-000000000005', 'sub5@test.com', 'Sub Five', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- contact_submissions (2 unread, 1 read)
-- ============================================================
INSERT INTO contact_submissions (id, name, email, message, is_read) VALUES
  ('aa000000-0000-0000-0000-000000000001', 'Jane Doe', 'jane@test.com', 'Love the bar!', false),
  ('aa000000-0000-0000-0000-000000000002', 'John Smith', 'john@test.com', 'Can I book for a party?', false),
  ('aa000000-0000-0000-0000-000000000003', 'Already Read', 'read@test.com', 'Old message', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- page_seo
-- ============================================================
INSERT INTO page_seo (id, page_path, meta_title, meta_description) VALUES
  ('bb000000-0000-0000-0000-000000000001', '/', 'The Sea Star | Craft Cocktails in Dogpatch, San Francisco', 'The Sea Star is a craft cocktail bar in San Francisco''s Dogpatch neighborhood.'),
  ('bb000000-0000-0000-0000-000000000002', '/blog', 'The Journal | The Sea Star SF', 'Stories, cocktail culture, and neighborhood news from The Sea Star.')
ON CONFLICT (page_path) DO NOTHING;

-- ============================================================
-- site_settings
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
  ('blog_keywords', 'craft cocktails, dogpatch bar, sf nightlife'),
  ('blog_tone_notes', 'Warm, fun, neighborhood bar vibes'),
  ('meta_page_access_token', 'fake-token-for-tests'),
  ('meta_page_id', 'fake-page-id'),
  ('meta_ig_user_id', 'fake-ig-user-id'),
  ('site_url', 'https://theseastarsf.com')
ON CONFLICT (key) DO NOTHING;
