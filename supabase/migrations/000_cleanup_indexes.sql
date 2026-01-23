-- ============================================================================
-- CLEANUP: Drop orphaned indexes from partial migration
-- Run this before running 001 and 002 migrations
-- ============================================================================

-- Drop campaign-related indexes (if they exist from partial migration)
DROP INDEX IF EXISTS idx_campaigns_status;
DROP INDEX IF EXISTS idx_campaigns_created_at;
DROP INDEX IF EXISTS idx_campaign_creators_campaign;
DROP INDEX IF EXISTS idx_campaign_creators_creator;
DROP INDEX IF EXISTS idx_posts_campaign;

-- Drop old request-related indexes (if they still exist somehow)
DROP INDEX IF EXISTS idx_content_requests_status;
DROP INDEX IF EXISTS idx_content_requests_created_at;
DROP INDEX IF EXISTS idx_request_creators_request;
DROP INDEX IF EXISTS idx_request_creators_creator;
DROP INDEX IF EXISTS idx_posts_request;

-- Now you can run 001 and 002 migrations cleanly
