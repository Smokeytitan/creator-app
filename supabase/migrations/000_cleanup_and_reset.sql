-- ============================================================================
-- CLEANUP SCRIPT: Remove all tables to start fresh
-- WARNING: This will delete ALL data in these tables
-- Only run this if you want to start the migration from scratch
-- ============================================================================

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS campaign_creators CASCADE;
DROP TABLE IF EXISTS campaign_tweets CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS content_requests CASCADE;
DROP TABLE IF EXISTS content_request_creators CASCADE;
DROP TABLE IF EXISTS creators CASCADE;
DROP TABLE IF EXISTS excluded_accounts CASCADE;
DROP TABLE IF EXISTS flash_campaigns CASCADE;

-- Drop any remaining triggers
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
DROP TRIGGER IF EXISTS update_content_requests_updated_at ON content_requests;
DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
DROP TRIGGER IF EXISTS set_needs_rescan_on_insert ON posts;
DROP TRIGGER IF EXISTS set_needs_rescan_on_48h ON posts;

-- Note: This does NOT drop the update_updated_at_column() function
-- since it's a shared utility function

-- ============================================================================
-- NEXT STEPS:
-- 1. Run this cleanup script
-- 2. Run 001_create_creators_and_requests.sql
-- 3. Run 002_rename_to_campaigns.sql
-- 4. Run data migration from localStorage
-- ============================================================================
