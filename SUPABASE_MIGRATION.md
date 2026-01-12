# Supabase Migration Guide

This guide will help you complete the migration from localStorage to Supabase for background campaign processing.

## ✅ What's Been Set Up

1. **Supabase Client** - Configured at `src/lib/supabaseClient.js`
2. **Environment Variables** - Added to `.env` and `.env.example`
3. **Database Schema** - SQL file ready at `supabase-schema.sql`
4. **New Service Layer** - `src/services/flashCampaignServiceSupabase.js` (Supabase version)
5. **Vercel Cron Job** - Updated `api/cron-check-campaigns.js` and `vercel.json`
6. **Migration Utility** - `src/utils/migrateToSupabase.js` for data migration

## 📋 Steps to Complete Migration

### Step 1: Create Database Tables

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/ibqqffnwawkualsynlrt
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the entire contents of `supabase-schema.sql` file
5. Paste into the SQL editor
6. Click **"Run"** to execute the schema

This will create:
- `flash_campaigns` table
- `excluded_accounts` table
- Indexes for performance
- Row Level Security policies
- Auto-update triggers

### Step 2: Migrate Existing Data (Optional)

If you have existing campaigns or exclusions in localStorage that you want to keep:

1. Open your browser console in the app (F12 → Console tab)
2. Run this command:
   ```javascript
   import { migrateLocalStorageToSupabase } from './src/utils/migrateToSupabase.js';
   await migrateLocalStorageToSupabase();
   ```
3. Check the console for migration progress
4. Once successful, you can clear localStorage with:
   ```javascript
   import { clearLocalStorageAfterMigration } from './src/utils/migrateToSupabase.js';
   clearLocalStorageAfterMigration();
   ```

**Note:** If you don't have any existing campaigns, you can skip this step and start fresh.

### Step 3: Update Flash Campaign Components

We need to update the components to use the new Supabase service. The main changes:

1. Import the Supabase version of the service
2. Make all data operations async (add `await`)
3. Update component lifecycle hooks to handle async

**Files to update:**
- `src/components/FlashCampaignDashboard.jsx`
- `src/components/CampaignCreationModal.jsx`
- `src/components/CampaignResultsView.jsx`
- `src/components/ExclusionListManager.jsx`

Replace imports:
```javascript
// OLD
import { getCampaigns, ... } from '../services/flashCampaignService';

// NEW
import { getCampaigns, ... } from '../services/flashCampaignServiceSupabase';
```

Add `await` to all service calls:
```javascript
// OLD
const campaigns = getCampaigns();

// NEW
const campaigns = await getCampaigns();
```

### Step 4: Deploy to Vercel

1. **Set Environment Variables in Vercel:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   # Paste: https://ibqqffnwawkualsynlrt.supabase.co

   vercel env add VITE_SUPABASE_ANON_KEY
   # Paste: sb_publishable_nyXVq3lwJvKzX5h0QV6n4g_TeyGf1gt

   vercel env add CRON_SECRET
   # Generate a random secret: openssl rand -base64 32
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Verify Cron Job:**
   - Go to Vercel project dashboard
   - Navigate to **Settings → Cron Jobs**
   - You should see: `/api/cron-check-campaigns` running every minute

### Step 5: Test Background Processing

1. Create a test campaign with an end time 2-3 minutes in the future
2. Close your browser completely
3. Wait for the end time to pass
4. Open browser and check the campaign - it should show results were fetched!

## 🔍 Troubleshooting

### Cron Job Not Running

Check Vercel logs:
```bash
vercel logs --follow
```

Look for `[CRON]` prefixed messages.

### Database Connection Issues

Test Supabase connection in browser console:
```javascript
import { supabase } from './src/lib/supabaseClient.js';
const { data, error } = await supabase.from('flash_campaigns').select('*');
console.log(data, error);
```

### Migration Errors

If migration fails, you can manually insert data via Supabase dashboard:
1. Go to **Table Editor**
2. Select `flash_campaigns` or `excluded_accounts`
3. Click **"Insert row"** to add data manually

## 📊 Database Schema Reference

### flash_campaigns table

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Campaign ID (timestamp) |
| name | text | Campaign name |
| description | text | Optional description |
| start_date_time | timestamptz | Start date/time (EST) |
| end_date_time | timestamptz | End date/time (EST) |
| key_phrases | text[] | Array of phrases to match |
| reward_pool | text | Optional reward info |
| status | text | scheduled/active/completed/cancelled |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |
| results | jsonb | Results object (JSON) |

### excluded_accounts table

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Exclusion ID |
| handle | text | Twitter handle (unique) |
| reason | text | Optional reason |
| added_at | timestamptz | Added timestamp |

## 🎯 Next Steps

Once migration is complete:

1. **Delete old service** (optional cleanup):
   ```bash
   rm src/services/flashCampaignService.js
   ```

2. **Test thoroughly:**
   - Create campaign
   - Add exclusions
   - Test automatic processing
   - Verify CSV export

3. **Monitor cron job:**
   - Check Vercel logs regularly
   - Ensure campaigns are processing automatically

## 📞 Need Help?

If you run into issues:
1. Check Supabase logs in dashboard (Logs section)
2. Check Vercel logs: `vercel logs`
3. Check browser console for errors
4. Verify all environment variables are set correctly
