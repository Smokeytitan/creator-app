-- ============================================================================
-- Invoice Templates Migration
-- This creates the tables and storage for invoice template management
-- ============================================================================

-- Create invoice_templates table
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL, -- Path to Excel file in Supabase Storage
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  sheet_name VARCHAR(255) DEFAULT 'Sheet1',
  mapping JSONB NOT NULL, -- Cell mapping configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT, -- Clerk user ID
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false -- Only one template can be default
);

-- Create index for faster queries
CREATE INDEX idx_invoice_templates_active ON invoice_templates(is_active);
CREATE INDEX idx_invoice_templates_default ON invoice_templates(is_default);
CREATE INDEX idx_invoice_templates_created_at ON invoice_templates(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_invoice_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoice_templates_updated_at
  BEFORE UPDATE ON invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_templates_updated_at();

-- Ensure only one template is default at a time
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE invoice_templates
    SET is_default = false
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_template
  BEFORE INSERT OR UPDATE ON invoice_templates
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_template();

-- Enable Row Level Security
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read all templates
CREATE POLICY "Allow authenticated users to read invoice templates"
  ON invoice_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies: Allow authenticated users to create templates
CREATE POLICY "Allow authenticated users to create invoice templates"
  ON invoice_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies: Allow users to update templates they created
CREATE POLICY "Allow users to update their invoice templates"
  ON invoice_templates
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid()::text OR created_by IS NULL);

-- RLS Policies: Allow users to delete templates they created
CREATE POLICY "Allow users to delete their invoice templates"
  ON invoice_templates
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid()::text OR created_by IS NULL);

-- Add comments for documentation
COMMENT ON TABLE invoice_templates IS 'Stores invoice template configurations with Excel file references';
COMMENT ON COLUMN invoice_templates.name IS 'User-friendly template name';
COMMENT ON COLUMN invoice_templates.file_path IS 'Path to Excel template file in Supabase Storage';
COMMENT ON COLUMN invoice_templates.mapping IS 'JSON configuration mapping data fields to Excel cells';
COMMENT ON COLUMN invoice_templates.is_default IS 'Whether this is the default template (only one can be default)';
