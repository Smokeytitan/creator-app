# Invoice Templates - Supabase Deployment Instructions

This guide will help you set up the invoice templates feature in your Supabase database.

## Prerequisites

- Access to your Supabase project dashboard
- Admin/owner permissions on the project

---

## Step 1: Create Storage Bucket for Invoice Templates

1. **Go to Supabase Dashboard** → Your Project → **Storage**

2. **Create New Bucket**:
   - Click "New bucket"
   - Bucket name: `invoice-templates`
   - Public bucket: **No** (keep private)
   - Click "Create bucket"

3. **Set Storage Policies**:
   - Click on the `invoice-templates` bucket
   - Go to "Policies" tab
   - Click "New Policy"

   **Policy 1: Allow authenticated users to read templates**
   ```sql
   CREATE POLICY "Allow authenticated users to read invoice templates"
   ON storage.objects
   FOR SELECT
   TO authenticated
   USING (bucket_id = 'invoice-templates');
   ```

   **Policy 2: Allow authenticated users to upload templates**
   ```sql
   CREATE POLICY "Allow authenticated users to upload invoice templates"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'invoice-templates');
   ```

   **Policy 3: Allow users to delete their templates**
   ```sql
   CREATE POLICY "Allow authenticated users to delete invoice templates"
   ON storage.objects
   FOR DELETE
   TO authenticated
   USING (bucket_id = 'invoice-templates');
   ```

---

## Step 2: Run Database Migration

1. **Go to Supabase Dashboard** → Your Project → **SQL Editor**

2. **Create New Query**:
   - Click "New query"
   - Copy the entire contents of `supabase/migrations/001_create_invoice_templates.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)

3. **Verify Migration Success**:
   - Go to **Table Editor**
   - You should see a new table: `invoice_templates`
   - Verify columns: id, name, description, file_path, mapping, created_at, etc.

---

## Step 3: Verify Setup

### Check Table Structure
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'invoice_templates';
```

Expected columns:
- `id` (uuid)
- `name` (varchar)
- `description` (text)
- `file_path` (text)
- `file_name` (varchar)
- `file_size` (integer)
- `sheet_name` (varchar)
- `mapping` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `created_by` (text)
- `is_active` (boolean)
- `is_default` (boolean)

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'invoice_templates';
```

Expected policies:
- Allow authenticated users to read invoice templates
- Allow authenticated users to create invoice templates
- Allow users to update their invoice templates
- Allow users to delete their invoice templates

### Check Storage Bucket
```sql
SELECT * FROM storage.buckets WHERE name = 'invoice-templates';
```

Expected result: One row with bucket name `invoice-templates`

---

## Step 4: Test the Setup (Optional)

### Test Insert
```sql
INSERT INTO invoice_templates (
  name,
  description,
  file_path,
  file_name,
  sheet_name,
  mapping
) VALUES (
  'Test Template',
  'Test invoice template',
  'test/template.xlsx',
  'template.xlsx',
  'Sheet1',
  '{}'::jsonb
);
```

### Test Query
```sql
SELECT * FROM invoice_templates WHERE is_active = true;
```

### Clean Up Test Data
```sql
DELETE FROM invoice_templates WHERE name = 'Test Template';
```

---

## Step 5: Update Application Code

After deploying the database changes, you'll need to update the frontend code to use Supabase instead of localStorage. The migration will be done in the next step.

---

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Drop table and related objects
DROP TRIGGER IF EXISTS trigger_invoice_templates_updated_at ON invoice_templates;
DROP TRIGGER IF EXISTS trigger_ensure_single_default_template ON invoice_templates;
DROP FUNCTION IF EXISTS update_invoice_templates_updated_at();
DROP FUNCTION IF EXISTS ensure_single_default_template();
DROP TABLE IF EXISTS invoice_templates;

-- Delete storage bucket (do this manually in Supabase dashboard)
-- Storage → invoice-templates → Delete bucket
```

---

## Security Notes

✅ **Row Level Security (RLS)** is enabled on `invoice_templates` table
✅ **Storage bucket** is private (not public)
✅ Only **authenticated users** can access templates
✅ Users can only **update/delete** templates they created
✅ All users can **read** all templates (for shared use)

---

## Troubleshooting

### Problem: "permission denied for table invoice_templates"
**Solution**: Make sure you ran the migration as a Supabase admin. Go to SQL Editor and run the migration again.

### Problem: "storage bucket not found"
**Solution**: Create the `invoice-templates` bucket manually in Storage section.

### Problem: "relation 'invoice_templates' already exists"
**Solution**: The table already exists. Skip the CREATE TABLE part or drop the table first.

### Problem: RLS policies blocking access
**Solution**: Check that your application is passing the correct authentication token. Users must be logged in via Clerk.

---

## Next Steps

After completing this deployment:

1. ✅ Database table created
2. ✅ Storage bucket configured
3. ✅ RLS policies set up
4. ⏭️ Update frontend code to use Supabase (see next migration)

---

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Verify RLS policies are correct
3. Test with SQL queries in SQL Editor
4. Check that authentication is working properly
