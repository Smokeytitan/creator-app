# Setup Package Pricing for Wendy O

## Step 1: Run the Database Migration

Go to your Supabase SQL Editor:
**https://supabase.com/dashboard/project/ibqqffnwawkualsynlrt/sql/new**

Copy and paste this SQL, then click "Run":

```sql
-- Add pricing_packages column to creators table
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS pricing_packages JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN creators.pricing_packages IS 'Stores package pricing deals as JSON array';

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_creators_has_packages ON creators
  USING gin (pricing_packages)
  WHERE pricing_packages != '[]'::jsonb;
```

## Step 2: Update Wendy O with Package Pricing

After the migration succeeds, run this command in your terminal:

```bash
cd /Users/ntruslow/projects/content-requests-app
node update-wendy-pricing-simple.mjs
```

This will:
- Find Wendy O in the database
- Add her package pricing: **8 videos for $14,000** ($3,500 per video)
- Set platforms to Instagram + Facebook
- Add notes explaining the package deal

## What This Does

Wendy O will be updated with:

**Package**: 8 Video Package
**Total Cost**: $14,000
**Cost Per Video**: $3,500
**Platforms**: Instagram + Facebook
**Description**: Each video posted to both Instagram and Facebook
**Notes**: Must purchase both platforms together

## Verification

After running the script, verify in Supabase:

1. Go to Table Editor → creators
2. Find Wendy O
3. Check the `pricing_packages` column
4. Should see: `[{"id":..., "name":"8 Video Package", ...}]`

## Need Help?

- Migration file: `supabase/migrations/002_add_pricing_packages.sql`
- Update script: `update-wendy-pricing-simple.mjs`
- Full documentation: `PACKAGE-PRICING-README.md`
