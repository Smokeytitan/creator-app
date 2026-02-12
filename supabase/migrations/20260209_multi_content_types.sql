-- ============================================================================
-- Update content_type to support multiple types (array instead of single value)
-- Migration: 20260209_multi_content_types
-- ============================================================================

-- Drop the old check constraint
ALTER TABLE creators
DROP CONSTRAINT IF EXISTS creators_content_type_check;

-- Change content_type from TEXT to TEXT[] (array)
-- First, convert existing values to arrays
ALTER TABLE creators
ALTER COLUMN content_type TYPE TEXT[] USING ARRAY[content_type];

-- Set default to array with 'social'
ALTER TABLE creators
ALTER COLUMN content_type SET DEFAULT ARRAY['social']::TEXT[];

-- Add check constraint for valid values in the array
ALTER TABLE creators
ADD CONSTRAINT creators_content_types_check
CHECK (
  content_type <@ ARRAY['social', 'podcast', 'newsletter']::TEXT[]
);

-- Update any NULL values to default
UPDATE creators
SET content_type = ARRAY['social']::TEXT[]
WHERE content_type IS NULL OR content_type = ARRAY[]::TEXT[];

-- Add specific fields for each content type
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS podcast_url TEXT,
ADD COLUMN IF NOT EXISTS podcast_listeners TEXT,
ADD COLUMN IF NOT EXISTS newsletter_url TEXT,
ADD COLUMN IF NOT EXISTS newsletter_subscribers TEXT,
ADD COLUMN IF NOT EXISTS total_reach TEXT;

-- Add comments
COMMENT ON COLUMN creators.content_type IS 'Array of content types: can include social, podcast, and/or newsletter';
COMMENT ON COLUMN creators.podcast_url IS 'RSS feed URL for podcast';
COMMENT ON COLUMN creators.podcast_listeners IS 'Average listeners per episode';
COMMENT ON COLUMN creators.newsletter_url IS 'Subscription page URL for newsletter';
COMMENT ON COLUMN creators.newsletter_subscribers IS 'Total newsletter subscribers';
COMMENT ON COLUMN creators.total_reach IS 'Total audience/reach across all platforms';
