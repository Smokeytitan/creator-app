-- ============================================================================
-- RENAME content_requests → campaigns
-- Migration 002: Rename tables for better clarity
-- This migration is idempotent - safe to run multiple times
-- ============================================================================

-- Rename main table (only if old name exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_requests') THEN
    ALTER TABLE content_requests RENAME TO campaigns;
  END IF;
END $$;

-- Rename join table (only if old name exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_request_creators') THEN
    ALTER TABLE content_request_creators RENAME TO campaign_creators;
  END IF;
END $$;

-- Rename foreign key column in join table (only if old column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaign_creators' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE campaign_creators RENAME COLUMN request_id TO campaign_id;
  END IF;
END $$;

-- Rename foreign key column in posts table (only if old column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE posts RENAME COLUMN request_id TO campaign_id;
  END IF;
END $$;

-- Rename indexes (use IF EXISTS to handle partial migrations)
DO $$
BEGIN
  -- Only rename if old index exists AND new index doesn't exist
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_requests_status')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campaigns_status') THEN
    ALTER INDEX idx_content_requests_status RENAME TO idx_campaigns_status;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_requests_created_at')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campaigns_created_at') THEN
    ALTER INDEX idx_content_requests_created_at RENAME TO idx_campaigns_created_at;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_request_creators_request')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campaign_creators_campaign') THEN
    ALTER INDEX idx_request_creators_request RENAME TO idx_campaign_creators_campaign;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_request_creators_creator')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campaign_creators_creator') THEN
    ALTER INDEX idx_request_creators_creator RENAME TO idx_campaign_creators_creator;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_request')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_campaign') THEN
    ALTER INDEX idx_posts_request RENAME TO idx_posts_campaign;
  END IF;
END $$;

-- Update trigger names
-- Only drop and recreate trigger if the campaigns table exists after rename
DO $$
BEGIN
  -- Drop old trigger if content_requests table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_requests') THEN
    DROP TRIGGER IF EXISTS update_content_requests_updated_at ON content_requests;
  END IF;

  -- Drop and recreate trigger on campaigns table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
    CREATE TRIGGER update_campaigns_updated_at
      BEFORE UPDATE ON campaigns
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running, verify:
-- 1. Table "campaigns" exists
-- 2. Table "campaign_creators" exists
-- 3. Foreign keys work correctly
-- 4. Indexes exist and work
