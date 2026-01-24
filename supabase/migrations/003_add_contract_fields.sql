-- ============================================================================
-- CONTRACT FIELDS MIGRATION
-- Migration 003: Add contract storage fields to creators table
-- ============================================================================

-- Add contract-related fields to creators table
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS contract_file_path TEXT,
ADD COLUMN IF NOT EXISTS contract_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contract_parsed_data JSONB;

-- Add comments for documentation
COMMENT ON COLUMN creators.contract_file_path IS 'Path to contract PDF in Supabase Storage (creator-contracts bucket)';
COMMENT ON COLUMN creators.contract_uploaded_at IS 'Timestamp when contract was last uploaded';
COMMENT ON COLUMN creators.contract_parsed_data IS 'Full parsed contract data from Claude API (for reference)';

-- Create index for finding creators with contracts
CREATE INDEX IF NOT EXISTS idx_creators_has_contract ON creators(contract_file_path)
  WHERE contract_file_path IS NOT NULL;

-- Example contract_file_path: "creator_123/1234567890_contract.pdf"
-- Example contract_parsed_data: Full JSON output from Claude parsing
