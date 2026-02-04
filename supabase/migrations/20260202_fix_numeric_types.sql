-- Migration: Fix numeric types for analytics
-- Date: 2026-02-02
-- Purpose: Convert text-based metrics to proper numeric types for reliable analytics

-- ============================================================================
-- 1. ALTER POSTS TABLE - Convert metrics to numeric types
-- ============================================================================

-- Add new numeric columns
ALTER TABLE posts
  ADD COLUMN impressions_new BIGINT,
  ADD COLUMN likes_new INTEGER,
  ADD COLUMN comments_new INTEGER,
  ADD COLUMN retweets_new INTEGER,
  ADD COLUMN quotes_new INTEGER,
  ADD COLUMN bookmarks_new INTEGER,
  ADD COLUMN cost_new NUMERIC(10,2);

-- Migrate data from text to numeric (handle commas, dollar signs, empty strings, whitespace, etc.)
UPDATE posts
SET
  impressions_new = CASE
    WHEN impressions IS NOT NULL AND TRIM(impressions) != '' THEN
      CAST(NULLIF(REGEXP_REPLACE(TRIM(impressions), '[^0-9]', '', 'g'), '') AS BIGINT)
    ELSE NULL
  END,
  likes_new = CASE
    WHEN likes IS NOT NULL AND TRIM(likes) != '' THEN
      CAST(NULLIF(REGEXP_REPLACE(TRIM(likes), '[^0-9]', '', 'g'), '') AS INTEGER)
    ELSE NULL
  END,
  comments_new = CASE
    WHEN comments IS NOT NULL AND TRIM(comments) != '' THEN
      CAST(NULLIF(REGEXP_REPLACE(TRIM(comments), '[^0-9]', '', 'g'), '') AS INTEGER)
    ELSE NULL
  END,
  retweets_new = CASE
    WHEN retweets IS NOT NULL AND TRIM(retweets) != '' THEN
      CAST(NULLIF(REGEXP_REPLACE(TRIM(retweets), '[^0-9]', '', 'g'), '') AS INTEGER)
    ELSE NULL
  END,
  quotes_new = CASE
    WHEN quotes IS NOT NULL AND TRIM(quotes) != '' THEN
      CAST(NULLIF(REGEXP_REPLACE(TRIM(quotes), '[^0-9]', '', 'g'), '') AS INTEGER)
    ELSE NULL
  END,
  bookmarks_new = CASE
    WHEN bookmarks IS NOT NULL AND TRIM(bookmarks) != '' THEN
      CAST(NULLIF(REGEXP_REPLACE(TRIM(bookmarks), '[^0-9]', '', 'g'), '') AS INTEGER)
    ELSE NULL
  END,
  cost_new = CASE
    WHEN cost IS NOT NULL AND TRIM(cost) != '' THEN
      CAST(NULLIF(REGEXP_REPLACE(TRIM(cost), '[^0-9.]', '', 'g'), '') AS NUMERIC(10,2))
    ELSE NULL
  END;

-- Drop old text columns and rename new ones
ALTER TABLE posts
  DROP COLUMN impressions,
  DROP COLUMN likes,
  DROP COLUMN comments,
  DROP COLUMN retweets,
  DROP COLUMN quotes,
  DROP COLUMN bookmarks,
  DROP COLUMN cost;

ALTER TABLE posts
  RENAME COLUMN impressions_new TO impressions;
ALTER TABLE posts
  RENAME COLUMN likes_new TO likes;
ALTER TABLE posts
  RENAME COLUMN comments_new TO comments;
ALTER TABLE posts
  RENAME COLUMN retweets_new TO retweets;
ALTER TABLE posts
  RENAME COLUMN quotes_new TO quotes;
ALTER TABLE posts
  RENAME COLUMN bookmarks_new TO bookmarks;
ALTER TABLE posts
  RENAME COLUMN cost_new TO cost;

-- Add metadata columns for data confidence
ALTER TABLE posts
  ADD COLUMN metrics_source VARCHAR(20) DEFAULT 'manual',
  ADD COLUMN metrics_updated_at TIMESTAMP,
  ADD COLUMN metrics_confidence VARCHAR(20) DEFAULT 'partial';

-- Add check constraints
ALTER TABLE posts
  ADD CONSTRAINT impressions_positive CHECK (impressions >= 0),
  ADD CONSTRAINT likes_positive CHECK (likes >= 0),
  ADD CONSTRAINT comments_positive CHECK (comments >= 0),
  ADD CONSTRAINT cost_positive CHECK (cost >= 0);

-- ============================================================================
-- 2. ALTER CAMPAIGNS TABLE - Convert estimated metrics to numeric
-- ============================================================================

-- Add new numeric columns
ALTER TABLE campaigns
  ADD COLUMN estimated_cost_new NUMERIC(10,2),
  ADD COLUMN estimated_impressions_new BIGINT;

-- Migrate data (handle TEXT to numeric conversion, empty strings, and NULL)
UPDATE campaigns
SET
  estimated_cost_new = CASE
    WHEN estimated_cost IS NOT NULL AND TRIM(estimated_cost) != '' THEN
      CAST(NULLIF(REGEXP_REPLACE(TRIM(estimated_cost), '[^0-9.]', '', 'g'), '') AS NUMERIC(10,2))
    ELSE 0
  END,
  estimated_impressions_new = CASE
    WHEN estimated_impressions IS NOT NULL AND TRIM(estimated_impressions) != '' THEN
      CAST(NULLIF(REGEXP_REPLACE(TRIM(estimated_impressions), '[^0-9]', '', 'g'), '') AS BIGINT)
    ELSE 0
  END;

-- Drop old columns and rename
ALTER TABLE campaigns
  DROP COLUMN estimated_cost,
  DROP COLUMN estimated_impressions;

ALTER TABLE campaigns
  RENAME COLUMN estimated_cost_new TO estimated_cost;
ALTER TABLE campaigns
  RENAME COLUMN estimated_impressions_new TO estimated_impressions;

-- Add default values
ALTER TABLE campaigns
  ALTER COLUMN estimated_cost SET DEFAULT 0,
  ALTER COLUMN estimated_impressions SET DEFAULT 0;

-- ============================================================================
-- 3. CREATE MATERIALIZED VIEW - Campaign Analytics
-- ============================================================================

CREATE MATERIALIZED VIEW campaign_analytics AS
SELECT
  c.id AS campaign_id,
  c.title,
  c.status,
  c.estimated_cost,
  c.estimated_impressions,
  c.created_at,

  -- Actual metrics from posts
  COUNT(DISTINCT p.id) AS posts_delivered,
  COUNT(DISTINCT p.creator_id) AS creators_with_posts,
  COALESCE(SUM(p.impressions), 0) AS actual_impressions,
  COALESCE(SUM(p.cost), 0) AS actual_cost,
  COALESCE(SUM(p.likes), 0) AS total_likes,
  COALESCE(SUM(p.comments), 0) AS total_comments,

  -- Calculated metrics
  CASE
    WHEN SUM(p.impressions) > 0 THEN
      (SUM(p.cost) / SUM(p.impressions) * 1000)::NUMERIC(10,2)
    ELSE 0
  END AS actual_cpm,

  CASE
    WHEN c.estimated_impressions > 0 THEN
      (c.estimated_cost / c.estimated_impressions * 1000)::NUMERIC(10,2)
    ELSE 0
  END AS estimated_cpm,

  CASE
    WHEN SUM(p.impressions) > 0 THEN
      ((SUM(p.likes) + SUM(p.comments))::NUMERIC / SUM(p.impressions) * 100)::NUMERIC(5,2)
    ELSE 0
  END AS engagement_rate,

  -- Data confidence
  CASE
    WHEN COUNT(p.id) = 0 THEN 'estimated'
    WHEN COUNT(p.id) > 0 AND COUNT(p.id) FILTER (WHERE p.impressions IS NOT NULL) = COUNT(p.id) THEN 'measured'
    ELSE 'partial'
  END AS data_confidence,

  -- Performance vs estimate
  CASE
    WHEN c.estimated_impressions > 0 AND SUM(p.impressions) > 0 THEN
      ((SUM(p.impressions)::NUMERIC / c.estimated_impressions - 1) * 100)::NUMERIC(5,2)
    ELSE NULL
  END AS impressions_vs_estimate_pct,

  CASE
    WHEN c.estimated_cost > 0 AND SUM(p.cost) > 0 THEN
      ((SUM(p.cost) / c.estimated_cost - 1) * 100)::NUMERIC(5,2)
    ELSE NULL
  END AS cost_vs_estimate_pct

FROM campaigns c
LEFT JOIN posts p ON p.campaign_id = c.id
GROUP BY c.id, c.title, c.status, c.estimated_cost, c.estimated_impressions, c.created_at;

-- Create index for performance
CREATE INDEX idx_campaign_analytics_status ON campaign_analytics(status);
CREATE UNIQUE INDEX idx_campaign_analytics_id ON campaign_analytics(campaign_id);

-- ============================================================================
-- 4. CREATE FUNCTION - Refresh campaign analytics
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_campaign_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_analytics;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE VIEW - Platform Performance
-- ============================================================================

CREATE VIEW platform_performance AS
SELECT
  p.platform,
  COUNT(DISTINCT p.campaign_id) AS campaigns_count,
  COUNT(p.id) AS posts_count,
  SUM(p.impressions) AS total_impressions,
  SUM(p.cost) AS total_cost,
  CASE
    WHEN SUM(p.impressions) > 0 THEN
      (SUM(p.cost) / SUM(p.impressions) * 1000)::NUMERIC(10,2)
    ELSE 0
  END AS cpm,
  CASE
    WHEN SUM(p.impressions) > 0 THEN
      ((SUM(p.likes) + SUM(p.comments))::NUMERIC / SUM(p.impressions) * 100)::NUMERIC(5,2)
    ELSE 0
  END AS engagement_rate
FROM posts p
WHERE p.impressions IS NOT NULL
GROUP BY p.platform
ORDER BY total_impressions DESC;

-- ============================================================================
-- 6. CREATE VIEW - Creator Performance
-- ============================================================================

CREATE VIEW creator_performance AS
SELECT
  cr.id AS creator_id,
  cr.name,
  cr.handle,
  COUNT(DISTINCT p.campaign_id) AS campaigns_count,
  COUNT(p.id) AS posts_count,
  SUM(p.impressions) AS total_impressions,
  SUM(p.cost) AS total_cost,
  CASE
    WHEN SUM(p.impressions) > 0 THEN
      (SUM(p.cost) / SUM(p.impressions) * 1000)::NUMERIC(10,2)
    ELSE 0
  END AS cpm,
  CASE
    WHEN SUM(p.impressions) > 0 THEN
      ((SUM(p.likes) + SUM(p.comments))::NUMERIC / SUM(p.impressions) * 100)::NUMERIC(5,2)
    ELSE 0
  END AS engagement_rate,
  AVG(p.cost) AS avg_cost_per_post
FROM creators cr
LEFT JOIN posts p ON p.creator_id = cr.id
WHERE p.impressions IS NOT NULL
GROUP BY cr.id, cr.name, cr.handle
ORDER BY cpm ASC;

-- ============================================================================
-- 7. CREATE TRIGGER - Auto-refresh analytics on post changes
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_refresh_analytics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_campaign_analytics();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_changed
AFTER INSERT OR UPDATE OR DELETE ON posts
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_analytics();

-- ============================================================================
-- ROLLBACK SCRIPT (save this separately if needed)
-- ============================================================================

-- To rollback this migration:
-- DROP TRIGGER posts_changed ON posts;
-- DROP FUNCTION trigger_refresh_analytics();
-- DROP VIEW creator_performance;
-- DROP VIEW platform_performance;
-- DROP FUNCTION refresh_campaign_analytics();
-- DROP MATERIALIZED VIEW campaign_analytics;
-- ALTER TABLE posts ... (reverse changes)
-- ALTER TABLE campaigns ... (reverse changes)

COMMENT ON MATERIALIZED VIEW campaign_analytics IS 'Pre-computed campaign analytics with actual vs estimated metrics';
COMMENT ON VIEW platform_performance IS 'Performance metrics aggregated by platform';
COMMENT ON VIEW creator_performance IS 'Performance metrics aggregated by creator';
