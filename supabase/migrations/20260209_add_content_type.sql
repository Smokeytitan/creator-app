-- ============================================================================
-- Add content_type field to creators table
-- Migration: 20260209_add_content_type
-- ============================================================================

-- Add content_type column to creators table
-- Values: 'social' (default), 'podcast', 'newsletter'
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'social'
CHECK (content_type IN ('social', 'podcast', 'newsletter'));

-- Create index for filtering by content type
CREATE INDEX IF NOT EXISTS idx_creators_content_type ON creators(content_type);

-- Add optional URL field for podcasts and newsletters
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS content_url TEXT;

-- Add optional subscriber/follower count
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS subscriber_count TEXT;

-- Update existing creators to have 'social' as default content type
UPDATE creators
SET content_type = 'social'
WHERE content_type IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN creators.content_type IS 'Type of content creator: social (X/TikTok/etc), podcast, or newsletter';
COMMENT ON COLUMN creators.content_url IS 'URL for podcast feed or newsletter subscription page';
COMMENT ON COLUMN creators.subscriber_count IS 'Number of subscribers/followers (for newsletters and podcasts)';
