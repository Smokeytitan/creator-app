-- Campaign Tweets Cache Table
-- Stores tweets fetched from Twitter API for flash campaign date ranges

CREATE TABLE IF NOT EXISTS campaign_tweets (
  id TEXT PRIMARY KEY, -- Tweet ID from Twitter
  campaign_id BIGINT NOT NULL, -- Foreign key to flash_campaigns
  author_id TEXT NOT NULL, -- Twitter user ID
  author_username TEXT NOT NULL, -- Twitter handle (without @)
  author_name TEXT, -- Display name
  text TEXT NOT NULL, -- Tweet content
  created_at TIMESTAMPTZ NOT NULL, -- Tweet creation timestamp
  impressions BIGINT DEFAULT 0,
  retweets BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  replies BIGINT DEFAULT 0,
  quotes BIGINT DEFAULT 0,
  bookmarks BIGINT DEFAULT 0,
  url TEXT, -- Tweet URL
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_campaign
    FOREIGN KEY(campaign_id)
    REFERENCES flash_campaigns(id)
    ON DELETE CASCADE
);

-- Index for fast lookups by campaign
CREATE INDEX IF NOT EXISTS idx_campaign_tweets_campaign_id ON campaign_tweets(campaign_id);

-- Index for searching by author
CREATE INDEX IF NOT EXISTS idx_campaign_tweets_author ON campaign_tweets(author_username);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_campaign_tweets_created_at ON campaign_tweets(created_at);

-- Enable RLS
ALTER TABLE campaign_tweets ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (public access for demo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_tweets'
    AND policyname = 'Allow all operations on campaign tweets'
  ) THEN
    CREATE POLICY "Allow all operations on campaign tweets" ON campaign_tweets
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
