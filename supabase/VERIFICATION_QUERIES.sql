-- ============================================================================
-- Verification Queries for Invoice Templates Setup
-- Run these to verify your deployment was successful
-- ============================================================================

-- 1. Check if invoice_templates table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'invoice_templates'
) as table_exists;
-- Expected: true

-- 2. Check table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'invoice_templates'
ORDER BY ordinal_position;
-- Expected: 13 columns (id, name, description, file_path, etc.)

-- 3. Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'invoice_templates';
-- Expected: rowsecurity = true

-- 4. Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'invoice_templates'
ORDER BY policyname;
-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- 5. Check indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'invoice_templates'
ORDER BY indexname;
-- Expected: 4 indexes (primary key + 3 custom indexes)

-- 6. Check triggers
SELECT
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'invoice_templates'
ORDER BY trigger_name;
-- Expected: 2 triggers (updated_at, ensure_single_default)

-- 7. Check storage bucket exists
SELECT
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE name = 'invoice-templates';
-- Expected: 1 row, public = false

-- 8. Check storage policies
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%invoice template%'
ORDER BY policyname;
-- Expected: 4 policies for storage.objects

-- 9. Test insert (will create a test record)
INSERT INTO invoice_templates (
  name,
  description,
  file_path,
  file_name,
  file_size,
  sheet_name,
  mapping,
  is_active,
  is_default
) VALUES (
  'Verification Test Template',
  'This is a test template created during verification',
  'test/verification-template.xlsx',
  'verification-template.xlsx',
  1024,
  'Sheet1',
  '{"test": "mapping"}'::jsonb,
  false,
  false
)
RETURNING id, name, created_at;
-- Expected: Returns the inserted row with UUID id

-- 10. Test query
SELECT
  id,
  name,
  file_name,
  is_active,
  is_default,
  created_at
FROM invoice_templates
WHERE name = 'Verification Test Template';
-- Expected: Returns the test record

-- 11. Test update
UPDATE invoice_templates
SET description = 'Updated test description'
WHERE name = 'Verification Test Template'
RETURNING id, description, updated_at;
-- Expected: Returns updated row with new updated_at timestamp

-- 12. Clean up test data
DELETE FROM invoice_templates
WHERE name = 'Verification Test Template'
RETURNING id, name;
-- Expected: Returns the deleted row

-- 13. Verify cleanup
SELECT COUNT(*) as remaining_test_records
FROM invoice_templates
WHERE name = 'Verification Test Template';
-- Expected: 0

-- ============================================================================
-- Summary Check: Run this to get a complete status report
-- ============================================================================

SELECT
  'Table Exists' as check_name,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'invoice_templates'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
UNION ALL
SELECT
  'RLS Enabled',
  CASE
    WHEN EXISTS (
      SELECT FROM pg_tables
      WHERE tablename = 'invoice_templates'
      AND rowsecurity = true
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END
UNION ALL
SELECT
  'RLS Policies Count',
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM pg_policies
      WHERE tablename = 'invoice_templates'
    ) >= 4 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END
UNION ALL
SELECT
  'Storage Bucket Exists',
  CASE
    WHEN EXISTS (
      SELECT FROM storage.buckets
      WHERE name = 'invoice-templates'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END
UNION ALL
SELECT
  'Storage Policies Count',
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM pg_policies
      WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%invoice template%'
    ) >= 4 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END;

-- ============================================================================
-- Expected Output:
-- ✅ PASS for all checks
-- If any show ❌ FAIL, re-run the corresponding migration file
-- ============================================================================
