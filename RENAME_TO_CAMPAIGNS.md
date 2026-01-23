# Rename: content_requests → campaigns

## Summary

Renamed all "content_requests" terminology to "campaigns" for better clarity and consistency across the codebase.

## Database Changes

Run this SQL migration in Supabase SQL Editor:

**File**: [supabase/migrations/002_rename_to_campaigns.sql](supabase/migrations/002_rename_to_campaigns.sql)

This renames:
- `content_requests` table → `campaigns`
- `content_request_creators` table → `campaign_creators`
- `request_id` column → `campaign_id` (in both `campaign_creators` and `posts` tables)
- All associated indexes and triggers

## Code Changes

### Files Renamed
- `src/services/contentRequestsServiceSupabase.js` → `src/services/campaignsServiceSupabase.js`

### Files Modified
1. **src/services/campaignsServiceSupabase.js**
   - All function names changed: `getRequests` → `getCampaigns`, etc.
   - Legacy alias added: `export const getRequests = getCampaigns` for backwards compatibility
   - All table references updated to use `campaigns` and `campaign_creators`

2. **src/services/creatorsServiceSupabase.js**
   - `request_id` → `campaign_id` in all post operations

3. **src/utils/migrateToSupabase.js**
   - Migration script updated to use `campaigns` and `campaign_creators` tables

4. **src/App.jsx**
   - Import changed: `getRequests` → `getCampaigns`
   - Function calls updated

## API Changes

### New Function Names

**Before** → **After**:
- `getRequests()` → `getCampaigns()` (with legacy alias)
- `getRequestById()` → `getCampaignById()`
- `createRequest()` → `createCampaign()`
- `updateRequest()` → `updateCampaign()`
- `updateRequestStatus()` → `updateCampaignStatus()`
- `deleteRequest()` → `deleteCampaign()`
- `getRequestsByStatus()` → `getCampaignsByStatus()`
- `getRequestsByCreator()` → `getCampaignsByCreator()`
- `getRequestMetrics()` → `getCampaignMetrics()`
- `getRequestPosts()` → `getCampaignPosts()`
- `bulkImportRequests()` → `bulkImportCampaigns()`

### Parameter Names

- `requestId` → `campaignId`
- `requestData` → `campaignData`

## Migration Steps

1. **Run SQL migration** in Supabase SQL Editor:
   ```bash
   # Copy and paste contents of:
   supabase/migrations/002_rename_to_campaigns.sql
   ```

2. **Verify tables renamed** in Supabase Table Editor:
   - ✓ `campaigns` table exists
   - ✓ `campaign_creators` table exists
   - ✓ `posts.campaign_id` column exists

3. **No code changes needed** - the app code has already been updated

## Backwards Compatibility

The service includes legacy aliases so existing code using `getRequests()` will still work:
```javascript
// Both work:
import { getCampaigns } from './services/campaignsServiceSupabase';
import { getRequests } from './services/campaignsServiceSupabase'; // Legacy alias
```

## localStorage Key

Note: localStorage still uses the key `"requests"` for backwards compatibility. The migration script reads from `localStorage.getItem('requests')` and writes to the `campaigns` table.

This allows existing browser data to migrate smoothly without manual intervention.

---

## Verification

After running the SQL migration, verify:

1. **In Supabase Table Editor**:
   - Table `campaigns` exists with all columns
   - Table `campaign_creators` exists
   - Table `posts` has `campaign_id` column

2. **In App Console** (after refresh):
   - `[App] ✓ Loaded X creators and Y campaigns from Supabase`
   - No errors about missing tables

3. **Test CRUD operations**:
   - Create new campaign
   - Edit campaign
   - Delete campaign
   - All should work without errors
