-- Bot Analytics Exclusions Table
-- Run this in Supabase SQL Editor to create the bot exclusions table

-- Create bot_excluded_accounts table
CREATE TABLE IF NOT EXISTS bot_excluded_accounts (
  id BIGINT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  reason TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bot_excluded_accounts_handle ON bot_excluded_accounts(handle);

-- Enable Row Level Security
ALTER TABLE bot_excluded_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow all operations on bot excluded accounts" ON bot_excluded_accounts
  FOR ALL USING (true) WITH CHECK (true);

-- Insert a comment for documentation
COMMENT ON TABLE bot_excluded_accounts IS 'Exclusion list for Twitter accounts in bot analytics (test accounts, spam, etc.)';
