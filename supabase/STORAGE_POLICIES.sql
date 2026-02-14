-- ============================================================================
-- Storage Policies for Invoice Templates Bucket
-- Run these after creating the 'invoice-templates' storage bucket
-- ============================================================================

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Allow authenticated users to read invoice templates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload invoice templates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete invoice templates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update invoice templates" ON storage.objects;

-- Policy 1: Allow authenticated users to read (download) invoice template files
CREATE POLICY "Allow authenticated users to read invoice templates"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'invoice-templates');

-- Policy 2: Allow authenticated users to upload invoice template files
CREATE POLICY "Allow authenticated users to upload invoice templates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoice-templates');

-- Policy 3: Allow authenticated users to delete invoice template files
CREATE POLICY "Allow authenticated users to delete invoice templates"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'invoice-templates');

-- Policy 4: Allow authenticated users to update invoice template files
CREATE POLICY "Allow authenticated users to update invoice templates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'invoice-templates')
WITH CHECK (bucket_id = 'invoice-templates');

-- Verify policies were created
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%invoice templates%';
