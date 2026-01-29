-- Authentication and User Management Schema
-- This migration adds support for user authentication, social connections, and content submissions

-- Users table (synced from Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'creator' CHECK (role IN ('admin', 'creator')),
  creator_id BIGINT REFERENCES creators(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social media connections for OAuth
CREATE TABLE social_connections (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_refreshed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, platform)
);

-- Content submissions from creators
CREATE TABLE content_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  post_id BIGINT REFERENCES posts(id),
  platform TEXT NOT NULL,
  platform_post_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT REFERENCES users(id),
  UNIQUE(campaign_id, platform_post_url)
);

-- Add user_id to posts table to track who submitted
ALTER TABLE posts ADD COLUMN user_id TEXT REFERENCES users(id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = current_setting('request.jwt.claims', true)::json->>'sub') = 'admin'
  );

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = current_setting('request.jwt.claims', true)::json->>'sub') = 'admin'
  );

-- RLS Policies for social_connections table
CREATE POLICY "Users can view their own connections"
  ON social_connections FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can manage their own connections"
  ON social_connections FOR ALL
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Admins can view all connections"
  ON social_connections FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = current_setting('request.jwt.claims', true)::json->>'sub') = 'admin'
  );

-- RLS Policies for content_submissions table
CREATE POLICY "Users can view their own submissions"
  ON content_submissions FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create their own submissions"
  ON content_submissions FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Admins can view all submissions"
  ON content_submissions FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = current_setting('request.jwt.claims', true)::json->>'sub') = 'admin'
  );

CREATE POLICY "Admins can update submissions"
  ON content_submissions FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = current_setting('request.jwt.claims', true)::json->>'sub') = 'admin'
  );

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX idx_social_connections_platform ON social_connections(platform);
CREATE INDEX idx_content_submissions_user_id ON content_submissions(user_id);
CREATE INDEX idx_content_submissions_campaign_id ON content_submissions(campaign_id);
CREATE INDEX idx_content_submissions_status ON content_submissions(status);
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- Create updated_at trigger for users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
