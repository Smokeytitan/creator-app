-- ============================================================================
-- CONTENT REQUESTS APP - DATABASE SCHEMA
-- Migration 001: Create creators, content_requests, and posts tables
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATORS TABLE
-- Stores creator roster data (replacing localStorage 'creators')
-- ============================================================================
CREATE TABLE IF NOT EXISTS creators (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  notes TEXT,
  cost_per_post TEXT,
  platforms TEXT[], -- Array of 'X', 'TikTok', 'Instagram', 'YouTube'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by name/handle
CREATE INDEX IF NOT EXISTS idx_creators_name ON creators(name);
CREATE INDEX IF NOT EXISTS idx_creators_handle ON creators(handle);
CREATE INDEX IF NOT EXISTS idx_creators_active ON creators(active);

-- ============================================================================
-- CONTENT REQUESTS TABLE
-- Stores content campaigns/requests (replacing localStorage 'requests')
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_requests (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  estimated_cost NUMERIC(10, 2),
  estimated_impressions BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON content_requests(status);
CREATE INDEX IF NOT EXISTS idx_content_requests_created_at ON content_requests(created_at DESC);

-- ============================================================================
-- CONTENT REQUEST CREATORS (JOIN TABLE)
-- Maps which creators are assigned to which campaigns
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_request_creators (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES content_requests(id) ON DELETE CASCADE,
  creator_id BIGINT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_request_creators_request ON content_request_creators(request_id);
CREATE INDEX IF NOT EXISTS idx_request_creators_creator ON content_request_creators(creator_id);

-- ============================================================================
-- POSTS TABLE
-- Stores individual posts/tweets for creators (replacing creator.posts array)
-- Enhanced with Twitter API scanning fields
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
  id BIGINT PRIMARY KEY,
  creator_id BIGINT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  request_id BIGINT REFERENCES content_requests(id) ON DELETE SET NULL, -- Link to campaign
  description TEXT,
  platform TEXT DEFAULT 'X' CHECK (platform IN ('X', 'TikTok', 'Instagram', 'YouTube')),
  date DATE,
  cost TEXT,
  link TEXT,

  -- Twitter/engagement metrics
  impressions TEXT,
  likes TEXT,
  comments TEXT,
  retweets TEXT,
  quotes TEXT,
  bookmarks TEXT,

  -- Tweet scanning metadata
  tweet_id TEXT, -- Extracted from link
  last_scanned TIMESTAMP WITH TIME ZONE, -- Last time metrics were fetched
  needs_rescan BOOLEAN DEFAULT false, -- Flag for 24-hour rescan check
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_posts_creator ON posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_request ON posts(request_id);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tweet_id ON posts(tweet_id);
CREATE INDEX IF NOT EXISTS idx_posts_needs_rescan ON posts(needs_rescan) WHERE needs_rescan = true;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- Automatically update updated_at timestamp on row changes
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_requests_updated_at ON content_requests;
CREATE TRIGGER update_content_requests_updated_at
  BEFORE UPDATE ON content_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RESCAN TRIGGER
-- Automatically set needs_rescan=true when 24 hours have passed since last_scanned
-- ============================================================================

CREATE OR REPLACE FUNCTION check_post_rescan_needed()
RETURNS TRIGGER AS $$
BEGIN
  -- If post is for Twitter (X) and has a tweet_id
  IF NEW.platform = 'X' AND NEW.tweet_id IS NOT NULL THEN
    -- Check if 24 hours have passed since last scan
    IF NEW.last_scanned IS NULL OR
       (NOW() - NEW.last_scanned) > INTERVAL '24 hours' THEN
      -- Check if tweet is at least 48 hours old
      IF NEW.date IS NOT NULL AND (NOW() - NEW.date::TIMESTAMP) > INTERVAL '48 hours' THEN
        NEW.needs_rescan = true;
      END IF;
    ELSE
      NEW.needs_rescan = false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_posts_rescan ON posts;
CREATE TRIGGER check_posts_rescan
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION check_post_rescan_needed();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- For future multi-user support - currently disabled for single-tenant use
-- ============================================================================

-- Enable RLS (uncomment when ready to implement user authentication)
-- ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE content_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE content_request_creators ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Example policy for future use:
-- CREATE POLICY "Users can view all creators" ON creators FOR SELECT USING (true);
-- CREATE POLICY "Users can insert creators" ON creators FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Users can update creators" ON creators FOR UPDATE USING (true);
-- CREATE POLICY "Users can delete creators" ON creators FOR DELETE USING (true);
