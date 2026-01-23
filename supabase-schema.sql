-- Flash Campaigns Database Schema
-- Run this in Supabase SQL Editor to create the necessary tables

-- Create flash_campaigns table
CREATE TABLE IF NOT EXISTS flash_campaigns (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date_time TIMESTAMPTZ NOT NULL,
  end_date_time TIMESTAMPTZ NOT NULL,
  key_phrases TEXT[] NOT NULL,
  reward_pool TEXT,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  results JSONB,
  CONSTRAINT valid_date_range CHECK (end_date_time > start_date_time)
);

-- Create excluded_accounts table
CREATE TABLE IF NOT EXISTS excluded_accounts (
  id BIGINT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  reason TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON flash_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON flash_campaigns(end_date_time);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON flash_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_excluded_accounts_handle ON excluded_accounts(handle);

-- Enable Row Level Security
ALTER TABLE flash_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE excluded_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
-- For now, allow all operations since there's no user auth in the app

-- Campaigns policies
CREATE POLICY "Allow all operations on campaigns" ON flash_campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- Excluded accounts policies
CREATE POLICY "Allow all operations on excluded accounts" ON excluded_accounts
  FOR ALL USING (true) WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_flash_campaigns_updated_at
  BEFORE UPDATE ON flash_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a comment for documentation
COMMENT ON TABLE flash_campaigns IS 'Stores flash campaign data including results';
COMMENT ON TABLE excluded_accounts IS 'Global exclusion list for Twitter accounts (Polygon employees/affiliates)';
