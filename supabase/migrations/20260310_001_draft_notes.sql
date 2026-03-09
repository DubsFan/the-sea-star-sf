-- Draft notes: per-entity discussion threads for collaborative review
CREATE TABLE draft_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,        -- 'blog_post', 'event', 'social_campaign'
  entity_id UUID NOT NULL,
  author TEXT NOT NULL,             -- admin_users.username
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_draft_notes_entity ON draft_notes(entity_type, entity_id);
