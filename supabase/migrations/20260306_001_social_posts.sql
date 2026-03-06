-- Social posts log + settings table for Meta API credentials
-- Run: supabase db push

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS social_posted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  caption TEXT,
  status TEXT DEFAULT 'posted',
  error_message TEXT,
  posted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default empty settings for Meta API
INSERT INTO site_settings (key, value) VALUES
  ('meta_page_access_token', ''),
  ('meta_page_id', ''),
  ('meta_ig_user_id', ''),
  ('site_url', 'https://theseastarsf.com')
ON CONFLICT (key) DO NOTHING;
