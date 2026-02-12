# Content Types Feature - Podcasts & Newsletters

## Overview
Added support for **podcasts** and **newsletters** alongside social media creators in the Creator Roster and Prospects tabs.

## Features Implemented

### 1. Content Type System
Three content types are now supported:
- **Social Media** (default) - X, TikTok, Instagram, YouTube creators
- **Podcasts** - Podcast hosts and shows
- **Newsletters** - Newsletter writers and publishers

### 2. UI Updates

#### Creator Roster Page
- ✅ Content type filter tabs (All, Social Media, Podcasts, Newsletters)
- ✅ Counts displayed for each content type
- ✅ Color-coded tabs (Blue for Social, Purple for Podcasts, Green for Newsletters)

#### Creator Prospects Page
- ✅ Same content type filtering as Roster
- ✅ Independent filtering from search and sort

#### Creator Forms
- ✅ Content type selector with 3 options
- ✅ **Conditional fields based on content type:**
  - **Social Media**: Shows platform badges (X, TikTok, Instagram, YouTube)
  - **Podcasts**: Shows "Podcast RSS URL" and "Subscriber/Listener Count" fields
  - **Newsletters**: Shows "Newsletter Subscription URL" and "Subscriber Count" fields

### 3. Database Schema
New columns added to `creators` table:
- `content_type` (TEXT) - 'social', 'podcast', or 'newsletter'
- `content_url` (TEXT) - RSS feed URL or subscription page
- `subscriber_count` (TEXT) - Number of subscribers/listeners

## How to Run the Database Migration

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project: https://supabase.com/dashboard/project/ibqqffnwawkualsynlrt

2. Go to **SQL Editor** in the left sidebar

3. Click "New Query"

4. Copy and paste the following SQL:

```sql
-- Add content_type field to creators table
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'social'
CHECK (content_type IN ('social', 'podcast', 'newsletter'));

-- Create index for filtering by content type
CREATE INDEX IF NOT EXISTS idx_creators_content_type ON creators(content_type);

-- Add optional URL field for podcasts and newsletters
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS content_url TEXT;

-- Add optional subscriber/follower count
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS subscriber_count TEXT;

-- Update existing creators to have 'social' as default content type
UPDATE creators
SET content_type = 'social'
WHERE content_type IS NULL;

-- Add comments to document the fields
COMMENT ON COLUMN creators.content_type IS 'Type of content creator: social (X/TikTok/etc), podcast, or newsletter';
COMMENT ON COLUMN creators.content_url IS 'URL for podcast feed or newsletter subscription page';
COMMENT ON COLUMN creators.subscriber_count IS 'Number of subscribers/followers (for newsletters and podcasts)';
```

5. Click **Run** to execute the migration

6. Verify it worked by running:
```sql
SELECT id, name, content_type, content_url, subscriber_count
FROM creators
LIMIT 5;
```

### Option 2: Using the Migration File

The migration is saved at:
[supabase/migrations/20260209_add_content_type.sql](supabase/migrations/20260209_add_content_type.sql)

You can run it using the Supabase CLI (if you have it set up locally):
```bash
supabase db push
```

## Testing the Feature

### 1. Test Content Type Filtering (Roster)

1. Navigate to **Admin → Creator Roster**
2. You should see 4 tabs: **All**, **Social Media**, **Podcasts**, **Newsletters**
3. The counts should be displayed for each tab
4. Click each tab to filter creators by content type

### 2. Test Content Type Filtering (Prospects)

1. Navigate to **Admin → Creator Prospects**
2. Same filtering tabs should appear
3. Click each tab to filter prospects

### 3. Test Creating a Podcast Creator

1. Go to **Creator Roster** or **Prospects**
2. Click **"New Creator"** or **"New Prospect"**
3. Fill in the form:
   - **Name**: "Tech Weekly Podcast"
   - **Handle**: "@techweekly"
   - **Content Type**: Select **"Podcasts"** (purple button)
4. Notice that:
   - Platform badges disappear
   - "Podcast RSS URL" field appears
   - "Subscriber/Listener Count" field appears
5. Fill in:
   - **Podcast RSS URL**: "https://techweekly.com/feed"
   - **Subscriber Count**: "50,000"
6. Click **"Create"**
7. The podcast should now appear in the **Podcasts** tab

### 4. Test Creating a Newsletter

1. Click **"New Creator"**
2. Fill in the form:
   - **Name**: "Crypto Daily Newsletter"
   - **Handle**: "@cryptodaily"
   - **Content Type**: Select **"Newsletters"** (green button)
3. Notice the conditional fields change again
4. Fill in:
   - **Newsletter Subscription URL**: "https://cryptodaily.com/subscribe"
   - **Subscriber Count**: "100,000"
5. Click **"Create"**
6. The newsletter should appear in the **Newsletters** tab

### 5. Test Editing Content Type

1. Find an existing social media creator
2. Click the edit icon
3. Change **Content Type** from "Social Media" to "Podcasts"
4. Notice the form fields change
5. Add podcast-specific info and save
6. The creator should now appear in the **Podcasts** tab

## File Changes

### New Files
- `src/constants/contentTypes.js` - Content type constants and labels
- `supabase/migrations/20260209_add_content_type.sql` - Database migration
- `CONTENT_TYPES_FEATURE.md` - This documentation

### Modified Files
- `src/components/roster/CreatorRosterPage.jsx` - Added content type tabs and filtering
- `src/components/roster/CreatorProspectsPage.jsx` - Added content type tabs and filtering
- `src/components/roster/CreatorCardEdit.jsx` - Added content type selector and conditional fields

## Default Behavior

- **Existing creators** will default to "social" content type
- **New creators** without a content type specified will be "social"
- **Platforms field** only shows for social media creators
- **Content URL and Subscriber Count** only show for podcasts/newsletters

## Next Steps (Optional Enhancements)

1. **Add content type badges** to creator cards for quick visual identification
2. **Add icons** to creator names in the table (microphone for podcasts, envelope for newsletters)
3. **Custom metrics** for each content type (e.g., downloads for podcasts, open rates for newsletters)
4. **Separate analytics** for different content types in the Analytics tab
5. **Import/Export** support for content type fields in CSV/Excel

## Support

If you encounter any issues:
1. Check that the database migration ran successfully
2. Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+R)
3. Check browser console for errors
4. Verify environment variables are loaded correctly

---

**Implementation Status**: ✅ Ready for Testing

The UI is fully functional and will work correctly once the database migration is run.
