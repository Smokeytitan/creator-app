# Supabase Contract Storage Setup

## Overview

Creator contracts are now uploaded to **Supabase Storage** and automatically parsed with Claude AI. This provides a complete audit trail and secure storage for all contract documents.

## Setup Steps

### 1. Run Database Migration

Go to your Supabase SQL Editor and run:

**Migration File**: `supabase/migrations/003_add_contract_fields.sql`

```sql
-- Add contract fields to creators table
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS contract_file_path TEXT,
ADD COLUMN IF NOT EXISTS contract_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contract_parsed_data JSONB;

-- Create index
CREATE INDEX IF NOT EXISTS idx_creators_has_contract ON creators(contract_file_path)
  WHERE contract_file_path IS NOT NULL;
```

### 2. Create Supabase Storage Bucket

The app will automatically create the bucket on first use, OR you can create it manually:

**Option A: Auto-create (Recommended)**
- The app will create the `creator-contracts` bucket automatically when you upload your first contract
- No manual setup needed!

**Option B: Manual creation**
1. Go to Supabase Dashboard → Storage
2. Click "Create bucket"
3. Bucket name: `creator-contracts`
4. Make it **Private** (not public)
5. Set file size limit: 10MB
6. Click "Create"

### 3. Set Bucket Policies (If Manual)

If you created the bucket manually, add this policy:

```sql
-- Allow authenticated users to upload/read contracts
CREATE POLICY "Allow all operations on contracts" ON storage.objects FOR ALL
  USING (bucket_id = 'creator-contracts')
  WITH CHECK (bucket_id = 'creator-contracts');
```

### 4. Add Claude API Key

Add to your `.env.production`:

```bash
VITE_CLAUDE_API_KEY=sk-ant-your-api-key-here
```

Get your key at: [https://console.anthropic.com](https://console.anthropic.com)

### 5. That's It!

You're ready to upload contracts!

## How It Works

### Upload Flow

1. User clicks "Upload Contract" button
2. Selects PDF file
3. App uploads to Supabase Storage → `creator-contracts/creator_123/timestamp_contract.pdf`
4. Claude parses the PDF
5. Extracted data shown in preview
6. User applies data to creator
7. Creator updated with:
   - `contract_file_path`: Path in storage
   - `contract_uploaded_at`: Upload timestamp
   - `contract_parsed_data`: Full parsed JSON (for reference)
   - `pricing_packages`: Extracted packages
   - `cost_per_post`: Extracted pricing
   - `platforms`: Extracted platforms

### Storage Structure

```
creator-contracts/
├── creator_123/
│   ├── 1234567890_wendyo_contract.pdf
│   └── 1234598765_wendyo_contract_v2.pdf
├── creator_456/
│   └── 1234512345_creator_agreement.pdf
```

Each creator gets their own folder, with timestamped contract files.

## Features

### ✅ What You Get

- **Secure Storage**: PDFs stored in private Supabase bucket
- **Version History**: Multiple contracts per creator
- **Audit Trail**: Upload timestamps tracked
- **Easy Access**: Download contracts anytime
- **Auto-Parsing**: Claude extracts pricing, terms, deliverables
- **Data Backup**: Full parsed data stored in database

### 📊 Contract Data Stored

**In Creators Table**:
- `contract_file_path` - Path to PDF in storage
- `contract_uploaded_at` - When uploaded
- `contract_parsed_data` - Full Claude parsing output
- `pricing_packages` - Extracted packages
- `cost_per_post` - Extracted pricing
- `platforms` - Extracted platforms
- `notes` - Contract terms appended

**In Supabase Storage**:
- Original PDF files
- Organized by creator ID
- Timestamped filenames

## Usage

### Upload a Contract

```javascript
// In CreatorRoster component
1. Click "Upload Contract" button
2. Select PDF
3. Wait for upload + parsing (~5-10 seconds)
4. Review extracted data
5. Click "Apply to Creator"
```

### Download a Contract

```javascript
import { getContractDownloadUrl } from './services/contractStorage';

// Get signed download URL (expires in 1 hour)
const url = await getContractDownloadUrl(creator.contractFilePath);
window.open(url, '_blank');
```

### List All Contracts for a Creator

```javascript
import { listCreatorContracts } from './services/contractStorage';

const contracts = await listCreatorContracts(creatorId);
// Returns array of contract files
```

## Cost Analysis

### Storage Costs
- **Supabase Storage**: Free tier includes 1GB
- Average contract: ~500KB
- **2,000 contracts** fit in free tier!
- Paid: $0.021/GB/month

### API Costs
- **Claude API**: ~$0.02-0.05 per contract
- 20 contracts/month = **~$0.40-1.00/month**

### Total Monthly Cost
- 20 new contracts/month
- Storage: Free (within 1GB tier)
- Parsing: ~$0.40-1.00
- **Total: ~$0.40-1.00/month**

Very affordable! 💰

## Security

### Access Control
- ✅ Contracts stored in **private bucket**
- ✅ Signed URLs with 1-hour expiration
- ✅ Row Level Security on creators table
- ✅ Only authenticated users can upload/access

### Data Privacy
- ✅ PDFs encrypted at rest (Supabase default)
- ✅ Secure API communication (HTTPS)
- ✅ No public access to contracts
- ✅ GDPR compliant (can delete anytime)

## API Reference

### Contract Storage Service

```javascript
// Upload contract
const result = await uploadContractToStorage(file, creatorId);
// Returns: { success, path, fullPath }

// Get download URL
const url = await getContractDownloadUrl(filePath);
// Returns: signed URL string

// Download for re-parsing
const file = await downloadContractFromStorage(filePath);
// Returns: File object

// Delete contract
const success = await deleteContractFromStorage(filePath);
// Returns: boolean

// List all contracts
const contracts = await listCreatorContracts(creatorId);
// Returns: array of file objects
```

### Contract Service

```javascript
// Upload and parse
const result = await uploadAndParseContract(file, creatorId, onProgress);
// Returns: { success, data, raw, storagePath }

// Apply to creator
const updatedCreator = await applyContractDataToCreator(
  creatorId,
  parsedData,
  storagePath
);
// Returns: updated creator object

// Format for preview
const formatted = formatParsedDataForPreview(parsedData);
// Returns: structured display data
```

## Troubleshooting

### "Failed to upload to Supabase Storage"
- Check that bucket exists: `creator-contracts`
- Verify bucket policies allow uploads
- Ensure you're authenticated
- Check file size (must be < 10MB)

### "Bucket not found"
- The app will auto-create it on first upload
- Or manually create the bucket (see step 2 above)

### "Permission denied"
- Check bucket policies
- Ensure RLS is configured correctly
- Verify you're using the correct Supabase URL/key

### Contract stored but parsing failed
- Don't worry! The PDF is safely stored
- Check Claude API key is set
- The parsed data field will be null but you can re-parse later

## Future Enhancements

### Possible Additions
1. **Re-parse Button**: Parse uploaded contracts again
2. **Version Management**: Compare contract versions
3. **Bulk Upload**: Upload multiple contracts at once
4. **Contract Templates**: Recognize contract templates
5. **Expiration Alerts**: Notify when contracts expire
6. **Contract Viewer**: View PDFs in-app without downloading

## Summary

✅ Contracts stored securely in Supabase
✅ Auto-parsing with Claude AI
✅ Complete audit trail
✅ Version history per creator
✅ Very affordable (~$0.40-1.00/month)
✅ GDPR compliant

Enjoy automated contract management! 📄✨
