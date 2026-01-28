-- Migration: Add status field to creators table for prospect management
-- Date: 2026-01-27
-- Description: Adds a status field to track creator lifecycle (prospect, active, inactive, archived)

-- Add status column with enum constraint
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('prospect', 'active', 'inactive', 'archived'));

-- Add comment to document the status field
COMMENT ON COLUMN creators.status IS 'Creator lifecycle status: prospect (potential creator), active (on roster), inactive (paused), archived (historical)';

-- Create index for efficient filtering by status
CREATE INDEX IF NOT EXISTS idx_creators_status ON creators(status);

-- Update existing rows to have 'active' status (they are already on the roster)
UPDATE creators
SET status = 'active'
WHERE status IS NULL;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 004: Creator status field added successfully';
END $$;
