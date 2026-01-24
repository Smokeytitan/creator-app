-- ============================================================================
-- PRICING PACKAGES MIGRATION
-- Migration 002: Add support for package pricing deals
-- ============================================================================

-- Add pricing_packages column to creators table
-- This stores flexible package deals (e.g., "8 videos for $14,000")
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS pricing_packages JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN creators.pricing_packages IS 'Stores package pricing deals as JSON array. Example: [{"name":"8 Video Package","videos":8,"totalCost":14000,"costPerVideo":3500,"platforms":["Instagram","Facebook"],"description":"Each video posted to both Instagram and Facebook"}]';

-- Create index for JSONB queries (useful for filtering creators with packages)
CREATE INDEX IF NOT EXISTS idx_creators_has_packages ON creators
  USING gin (pricing_packages)
  WHERE pricing_packages != '[]'::jsonb;

-- Example package structure:
-- {
--   "name": "8 Video Package",
--   "description": "Each video posted to both Instagram and Facebook",
--   "quantity": 8,
--   "unitType": "video",
--   "totalCost": 14000,
--   "costPerUnit": 3500,
--   "platforms": ["Instagram", "Facebook"],
--   "notes": "Must purchase both platforms together"
-- }

-- Keep cost_per_post for backwards compatibility and simple per-post pricing
-- pricing_packages provides flexibility for complex deals
