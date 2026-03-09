-- Content Packs table
CREATE TABLE IF NOT EXISTS content_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  checksum text NOT NULL UNIQUE,
  version_label text,
  brief_markdown text,
  brief_text text,
  file_manifest jsonb NOT NULL DEFAULT '{}',
  imported_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Content Library Items table
CREATE TABLE IF NOT EXISTS content_library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES content_packs(id) ON DELETE CASCADE,
  asset_type text NOT NULL, -- 'blog_seed', 'faq'
  source_file text,
  source_row_id text,
  source_order int DEFAULT 0,
  status text NOT NULL DEFAULT 'imported', -- 'imported', 'drafted', 'published', 'archived'
  primary_keyword text,
  category text,
  title text,
  subject_line text,
  question text,
  answer text,
  starter text,
  is_public boolean DEFAULT false,
  show_on_homepage boolean DEFAULT false,
  sort_order int DEFAULT 0,
  linked_blog_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  linked_mailer_campaign_id uuid REFERENCES mailer_campaigns(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cli_pack_type ON content_library_items(pack_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_cli_type_status ON content_library_items(asset_type, status);
CREATE INDEX IF NOT EXISTS idx_cli_keyword ON content_library_items(primary_keyword);
CREATE INDEX IF NOT EXISTS idx_cli_public ON content_library_items(is_public, show_on_homepage, sort_order);

-- Add source_library_item_id to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS source_library_item_id uuid REFERENCES content_library_items(id) ON DELETE SET NULL;

-- Standalone mailer support
ALTER TABLE mailer_campaigns ALTER COLUMN source_id DROP NOT NULL;
ALTER TABLE mailer_campaigns ADD COLUMN IF NOT EXISTS source_library_item_id uuid REFERENCES content_library_items(id) ON DELETE SET NULL;
ALTER TABLE mailer_campaigns ADD COLUMN IF NOT EXISTS body_html text;
ALTER TABLE mailer_campaigns ADD COLUMN IF NOT EXISTS hero_image text;
ALTER TABLE mailer_campaigns ADD COLUMN IF NOT EXISTS cta_url text;
ALTER TABLE mailer_campaigns ADD COLUMN IF NOT EXISTS cta_text text;
ALTER TABLE mailer_campaigns ADD COLUMN IF NOT EXISTS primary_keyword text;
