-- ============================================================================
-- Migration 002: Update platform constraint to include Facebook
-- ============================================================================
-- The original schema only included: X, TikTok, Instagram, YouTube
-- This migration adds Facebook to the allowed platforms

-- Drop the existing constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_platform_check;

-- Add new constraint with all platforms including Facebook
ALTER TABLE posts ADD CONSTRAINT posts_platform_check
  CHECK (platform IN ('X', 'Facebook', 'Instagram', 'YouTube', 'TikTok'));
