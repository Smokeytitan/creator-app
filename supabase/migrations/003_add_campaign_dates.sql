-- ============================================================================
-- Migration 003: Add date range support to campaigns table
-- ============================================================================
-- Adds start_date and end_date columns to campaigns table
-- Includes validation constraint to ensure end_date >= start_date

-- Add date columns
ALTER TABLE campaigns
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- Add constraint to ensure end date is after or equal to start date
ALTER TABLE campaigns
ADD CONSTRAINT campaigns_date_range_check
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
