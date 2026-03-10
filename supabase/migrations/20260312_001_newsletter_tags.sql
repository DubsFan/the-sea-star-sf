-- Newsletter tags: subscriber segmentation + targeted sends
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE mailer_campaigns ADD COLUMN IF NOT EXISTS target_tags TEXT[];
CREATE INDEX IF NOT EXISTS idx_subscribers_tags ON email_subscribers USING GIN (tags);
