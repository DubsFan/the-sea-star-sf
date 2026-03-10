-- Smart import preview storage (deterministic commit pattern)
CREATE TABLE IF NOT EXISTS content_import_previews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checksum text NOT NULL,
  parsed_payload jsonb NOT NULL,
  created_by text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '1 hour',
  created_at timestamptz DEFAULT now()
);

-- FAQ unique partial index for duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_faq_unique_public_question
  ON content_library_items (lower(btrim(question)))
  WHERE asset_type = 'faq' AND is_public = true;

-- media_items table for Release B2 full support
CREATE TABLE IF NOT EXISTS media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  url text NOT NULL UNIQUE,
  bucket text NOT NULL,
  tags text[] DEFAULT '{}',
  derivatives jsonb DEFAULT '{}',
  alt_text text DEFAULT '',
  media_kind text NOT NULL DEFAULT 'image',
  processing_status text NOT NULL DEFAULT 'ready',
  processing_error text,
  uploaded_by text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_items_tags ON media_items USING GIN (tags);
