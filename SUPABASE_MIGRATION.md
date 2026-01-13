# Supabase Migration Guide

This guide explains how to migrate your Content Requests App from localStorage to Supabase for persistent, cloud-based storage.

## Overview

The app now supports **dual storage modes**:
- **Supabase** (preferred): Cloud database with real-time sync, team collaboration, and unlimited storage
- **localStorage** (fallback): Browser-only storage, limited to ~5-10MB, single-user

## What's Been Migrated

All data now uses Supabase when configured:
- ✅ **Creators** (roster) - Main table with creator info
- ✅ **Posts** (tweets/content) - Individual posts with Twitter API metrics
- ✅ **Content Requests** (campaigns) - Campaign management
- ✅ **Flash Campaigns** - Kaito-based flash campaigns
- ✅ **Excluded Accounts** - Global exclusion list

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Environment Variables**: You need `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to provision (~2 minutes)
3. Go to Project Settings → API
4. Copy:
   - **Project URL** (`https://your-project.supabase.co`)
   - **Anon/Public Key** (`eyJhbG...`)

## Step 2: Set Environment Variables

### Local Development

Create `.env` file in project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vercel Production

```bash
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

## Step 3: Run Database Migration

### Supabase Dashboard

1. Go to your Supabase project
2. Click **SQL Editor** in sidebar
3. Click **New Query**
4. Copy contents of `supabase/migrations/001_create_creators_and_requests.sql`
5. Paste into SQL Editor
6. Click **Run**
7. Verify tables were created in **Table Editor**

## Step 4: Migrate Data from localStorage

Open browser console and run:

```javascript
import { migrateLocalStorageToSupabase, backupLocalStorage } from './src/utils/migrateToSupabase.js';

// Backup first!
backupLocalStorage();

// Then migrate
const result = await migrateLocalStorageToSupabase();
console.log('Migration results:', result);
```

## Step 5: Verify and Deploy

1. Verify data in Supabase Table Editor
2. Deploy to Vercel with environment variables set
3. Test all functionality

---

For detailed instructions, see inline comments in migration files.
