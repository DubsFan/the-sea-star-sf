-- Admin Overhaul Migration
-- New tables: events, social_campaigns, mailer_campaigns, activity_logs, page_seo
-- Alter: blog_posts (status, scheduled_for, focus_keyword, featured_image)
-- Alter: social_posts (campaign_id)
-- Run: supabase db push (or paste into Supabase SQL editor)

-- ============================================================
-- 1. events
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_description TEXT,
  description_html TEXT,
  featured_image TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  recurrence_preset TEXT DEFAULT 'One time',
  recurs_until DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. social_campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS social_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT DEFAULT 'standalone',
  source_id UUID,
  facebook_caption TEXT,
  instagram_caption TEXT,
  image_url TEXT,
  platforms JSONB DEFAULT '["facebook","instagram"]',
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. mailer_campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS mailer_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  subject TEXT,
  preview_text TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. activity_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  summary TEXT,
  actor TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. page_seo
-- ============================================================
CREATE TABLE IF NOT EXISTS page_seo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT UNIQUE NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  focus_keyword TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. Alter blog_posts
-- ============================================================
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_image TEXT;

-- Backfill status from is_published
UPDATE blog_posts SET status = 'published' WHERE is_published = true AND (status IS NULL OR status = 'draft');
UPDATE blog_posts SET status = 'draft' WHERE is_published = false AND status IS NULL;

-- Backfill featured_image from images jsonb array (first element)
-- images column is jsonb (JS array stored via Supabase client)
UPDATE blog_posts
  SET featured_image = images->>0
  WHERE featured_image IS NULL
    AND images IS NOT NULL
    AND jsonb_array_length(images) > 0;

-- ============================================================
-- 7. Alter social_posts — link to campaigns
-- ============================================================
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- ============================================================
-- 8. Seed default page_seo rows
-- ============================================================
INSERT INTO page_seo (page_path, meta_title, meta_description) VALUES
  ('/', 'The Sea Star | Craft Cocktails in Dogpatch, San Francisco', 'The Sea Star is a craft cocktail bar in San Francisco''s Dogpatch neighborhood. Since 1899 at 2289 3rd Street. Award-winning cocktails, local beer, and a warm neighborhood vibe.'),
  ('/blog', 'The Journal | The Sea Star SF', 'Stories, cocktail culture, and neighborhood news from The Sea Star in Dogpatch, San Francisco.')
ON CONFLICT (page_path) DO NOTHING;
