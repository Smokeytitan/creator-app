# Deployment Guide - Creator App

Complete guide for deploying your creator-app to Vercel with Supabase

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### 1. Install Dependencies
```bash
cd ~/creator-app
npm install
```

### 2. Create Local Environment File
```bash
cp .env.example .env.local
```

### 3. Fill in `.env.local` with Your Actual Credentials
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Twitter API
VITE_TWITTER_BEARER_TOKEN=your_bearer_token_here

# Kaito API
VITE_KAITO_API_KEY=your_kaito_api_key_here

# Optional: Claude API
VITE_CLAUDE_API_KEY=your_claude_api_key_here

# Server-side (Vercel Functions only)
TWITTER_CONSUMER_KEY=your_consumer_key
TWITTER_CONSUMER_SECRET=your_consumer_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
SUPABASE_SERVICE_KEY=your_service_role_key
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret
DEEPL_API_KEY=your_deepl_key (optional)
GOOGLE_TRANSLATE_API_KEY=your_google_key (optional)
```

---

## 🚀 **VERCEL DEPLOYMENT**

### Option 1: Vercel CLI (Recommended)

#### Step 1: Install Vercel CLI Globally
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Link to Existing Project (or create new)
```bash
cd ~/creator-app
vercel link
```

Select your team and project when prompted.

#### Step 4: Set Environment Variables via CLI
```bash
# Frontend variables (prefixed with VITE_)
vercel env add VITE_CLERK_PUBLISHABLE_KEY production
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_TWITTER_BEARER_TOKEN production
vercel env add VITE_KAITO_API_KEY production

# Server-side variables (NO VITE_ prefix)
vercel env add TWITTER_CONSUMER_KEY production
vercel env add TWITTER_CONSUMER_SECRET production
vercel env add TWITTER_ACCESS_TOKEN production
vercel env add TWITTER_ACCESS_TOKEN_SECRET production
vercel env add SUPABASE_SERVICE_KEY production
vercel env add CLERK_WEBHOOK_SECRET production
```

Paste the actual values when prompted.

#### Step 5: Deploy to Production
```bash
vercel --prod
```

### Option 2: Vercel Dashboard (Manual)

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "$(cat <<'EOF'
Complete codebase improvements

- Security fixes (removed hardcoded credentials, restricted CORS)
- Infrastructure (error boundaries, toast notifications)
- Component refactoring (extracted 7+ reusable components)
- Testing (Playwright test suite)
- Utilities (date handling, storage abstraction, pagination)
- Routing (React Router with 9 routes)
- TypeScript setup for future migration

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
git push origin main
```

#### Step 2: Import to Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Step 3: Set Environment Variables in Dashboard
1. In your Vercel project settings, go to "Environment Variables"
2. Add all variables from `.env.local`:
   - Select "Production" environment
   - Add each variable with its actual value
   - **Important**: Frontend variables MUST have `VITE_` prefix

---

## 🗄️ **SUPABASE SETUP**

### Option 1: Supabase CLI

#### Step 1: Install Supabase CLI
```bash
brew install supabase/tap/supabase
# OR
npm install -g supabase
```

#### Step 2: Login
```bash
supabase login
```

#### Step 3: Link to Project
```bash
cd ~/creator-app
supabase link --project-ref your-project-ref
```

#### Step 4: Push Database Schema
```bash
supabase db push
```

### Option 2: Supabase Dashboard (Manual)

#### Step 1: Create Tables
Go to your Supabase dashboard → SQL Editor and run:

```sql
-- Creators table
CREATE TABLE IF NOT EXISTS creators (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  notes TEXT,
  cost_per_post NUMERIC,
  platforms TEXT[],
  pricing_packages JSONB,
  contract_file_path TEXT,
  contract_uploaded_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  creator_id BIGINT REFERENCES creators(id) ON DELETE CASCADE,
  campaign_id BIGINT,
  description TEXT,
  platform TEXT,
  date DATE,
  cost NUMERIC,
  link TEXT,
  impressions BIGINT,
  likes BIGINT,
  comments BIGINT,
  retweets BIGINT,
  quotes BIGINT,
  bookmarks BIGINT,
  tweet_id TEXT,
  last_scanned TIMESTAMPTZ,
  needs_rescan BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  estimated_cost NUMERIC,
  estimated_impressions BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign creators junction table
CREATE TABLE IF NOT EXISTS campaign_creators (
  campaign_id BIGINT REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id BIGINT REFERENCES creators(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, creator_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_campaign_id ON posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
```

#### Step 2: Enable Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read" ON creators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON campaigns FOR SELECT TO authenticated USING (true);

-- Allow service role to do everything
CREATE POLICY "Service role full access" ON creators FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON posts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON campaigns FOR ALL TO service_role USING (true);
```

#### Step 3: Get API Keys
1. Go to Project Settings → API
2. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - Anon/Public Key → `VITE_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_KEY` (keep secret!)

---

## 🔐 **SECURITY REMINDERS**

### What Was Fixed:
- ✅ Removed hardcoded Kaito API key from `vite.config.js`
- ✅ Cleaned `.env.production` and `.env.check` files
- ✅ Added `.env.*` to `.gitignore` (except `.env.example`)
- ✅ Restricted CORS to authorized origins only

### What You Need To Do:
1. **Never commit `.env.local`** - Contains your actual secrets
2. **Rotate exposed credentials** - Generate new Twitter API keys if old ones were committed
3. **Use Vercel secrets** - All production credentials in Vercel dashboard, not in code
4. **Review `.gitignore`** - Ensure all sensitive files are excluded

### Checking for Leaked Secrets:
```bash
# Check git history for secrets (if concerned)
git log --all --full-history -- .env.production
git log --all --full-history -- .env.check

# If secrets were committed, rotate them immediately:
# - Twitter API: Generate new keys at developer.twitter.com
# - Supabase: Rotate keys in dashboard (will break existing deployments temporarily)
# - Kaito: Contact Kaito support for new API key
```

---

## ✅ **POST-DEPLOYMENT VERIFICATION**

### 1. Test Production URL
Visit your deployed URL: `https://your-app.vercel.app`

### 2. Check Environment Variables
```bash
# View environment variables in Vercel
vercel env ls

# Pull production env for testing (don't commit!)
vercel env pull .env.production.local
```

### 3. Verify Features
- [ ] Authentication works (Clerk sign-in)
- [ ] Creators load from Supabase
- [ ] Campaign creation works
- [ ] Kaito leaderboard loads
- [ ] Tweet metrics fetch correctly
- [ ] Error boundary catches errors
- [ ] Toast notifications appear
- [ ] Pagination works
- [ ] React Router navigation works

### 4. Monitor Logs
```bash
# View real-time logs
vercel logs --follow

# View function logs
vercel logs --function api/kaito
```

---

## 🐛 **TROUBLESHOOTING**

### Build Fails
```bash
# Test build locally
npm run build

# Check for missing dependencies
npm install

# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working
- **Frontend**: Must be prefixed with `VITE_`
- **Server**: No prefix, only available in API routes
- Redeploy after changing env vars: `vercel --prod`

### CORS Errors
- Check `api/_cors.js` - Add your domain to `ALLOWED_ORIGINS`
- Redeploy after changing

### Supabase Connection Fails
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check RLS policies allow your operations
- Use service role key (`SUPABASE_SERVICE_KEY`) for admin operations

### TypeScript Errors (Future)
- Run `npx tsc --noEmit` to check types
- Fix errors before deploying

---

## 📊 **MONITORING & MAINTENANCE**

### Vercel Analytics
Enable in your Vercel dashboard:
- Performance monitoring
- Web Vitals tracking
- Error tracking

### Supabase Monitoring
Check your Supabase dashboard:
- Database usage
- API requests
- Query performance

### Regular Tasks
- **Weekly**: Check error logs in Vercel
- **Monthly**: Review Supabase database size
- **Quarterly**: Rotate API keys for security

---

## 🚨 **ROLLBACK PROCEDURE**

If deployment breaks:

### Option 1: Redeploy Previous Version
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

### Option 2: Revert Git Commit
```bash
git revert HEAD
git push origin main
# Vercel auto-redeploys
```

---

## 📞 **SUPPORT RESOURCES**

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev/guide/
- **React Router Docs**: https://reactrouter.com/

---

## ✨ **WHAT'S NEW IN THIS DEPLOYMENT**

- ✅ Security fixes (no hardcoded secrets)
- ✅ Error boundaries for graceful failures
- ✅ Toast notifications for better UX
- ✅ Extracted components for maintainability
- ✅ Pagination for large datasets
- ✅ React Router for proper navigation
- ✅ Comprehensive test suite
- ✅ TypeScript configuration ready
- ✅ Date utilities centralized
- ✅ Storage abstraction layer

See [FINAL_IMPROVEMENTS_REPORT.md](FINAL_IMPROVEMENTS_REPORT.md) for complete details.

---

**Last Updated**: 2026-02-02
**Deployment Status**: Ready for Production ✅
