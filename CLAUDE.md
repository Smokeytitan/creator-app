# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Content Requests App is a creator management platform built for Polygon Labs to track content creators, manage sponsored content requests, analyze performance metrics, and access Kaito leaderboard data for top Polygon community creators.

**Tech Stack:**
- React 19 + Vite 7
- Tailwind CSS 4 (with Polygon brand system)
- Recharts for analytics visualization
- React DatePicker for date selection
- Lucide React for icons

**Deployment:** Vercel (serverless functions in `/api`)

## Development Commands

```bash
# Start development server (runs on http://localhost:5176 by default)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint

# Deploy to Vercel
vercel --prod
```

## Architecture

### Data Flow & State Management

**Three-tier data system:**

1. **Google Sheets (Source of Truth)** - Creator roster loaded via CSV export on app mount
   - URL configured in `App.jsx` as `GOOGLE_SHEET_URL`
   - Parsed by `GoogleSheetsService` (horizontal format: row 1 = names, row 2 = cost/post, row 4 = post count, row 6 = total cost)
   - Merged with localStorage on load, preserving local additions (platforms, custom posts)

2. **localStorage (Persistent State)** - All user modifications persist locally
   - `creators` - Full creator roster with edits/additions
   - `requests` - Content requests and campaigns
   - `activeTab` - Last active tab state
   - Data persists across sessions, can be reset to Google Sheets data via "Reset Data" button

3. **Kaito API (Live Data)** - Real-time leaderboard for Polygon (POL) creators
   - Accessed via `/api/kaito` proxy (serverless function on Vercel, Vite proxy in dev)
   - Returns top 115 Polygon creators by mindshare
   - Date-range filterable (default: Dec 2025)

**Critical merge behavior:** When Google Sheets data loads, it merges with localStorage by ID/name, preserving:
- Custom `platforms` array (X, TikTok, Instagram, YouTube)
- User-added `posts` array with engagement metrics
- Custom `notes` and `costPerPost` edits

### Component Architecture

**4 main views (tab-based navigation):**

1. **CreatorRoster** (`/src/components/CreatorRoster.jsx`)
   - CRUD operations for creators
   - CSV import/export functionality
   - Post history tracking per creator (description, date, cost, impressions, link)
   - Platform badges (X, TikTok, Instagram, YouTube)
   - Search, filter (active/inactive), and sort capabilities

2. **ContentRequests** (`/src/components/ContentRequests.jsx`)
   - Campaign creation and management
   - Status tracking (pending, in-progress, completed, cancelled)
   - Cost/impression estimation with CPM calculation
   - Load campaigns from localStorage (`initialRequests.js` provides defaults)
   - Export campaigns to CSV

3. **Analytics** (`/src/components/Analytics.jsx`)
   - Recharts visualizations: bar charts, pie charts, progress bars
   - Aggregates data from both creators and requests
   - Metrics: total spend, impressions, CPM, ROI, engagement rates
   - Top performers leaderboard

4. **Kaito** (`/src/components/Kaito.jsx`)
   - Live leaderboard from Kaito API
   - Displays top 115 Polygon (POL) creators by mindshare
   - Search, category filter, expandable tweet URLs
   - Date range picker (filters API results)

### API Layer

**Vercel Serverless Function** (`/api/kaito.js`):
- Proxies requests to Kaito API to avoid CORS issues
- Adds `X-API-KEY` header from `VITE_KAITO_API_KEY` env var
- Maps `/api/kaito?params` → `https://api.kaito.ai/api/v1/community_mindshare?params`

**Vite Dev Proxy** (`vite.config.js`):
- Mirrors Vercel function behavior in development
- Rewrites `/api/kaito` → Kaito API with API key header
- Enables local testing without deploying

**KaitoService** (`/src/services/kaitoService.js`):
- Default params: `ticker=POL`, `user_type=creator`, top 115 results
- Response parsing handles multiple API response formats
- Calculates engagement rate from (retweets + quotes + likes + bookmarks) / impressions

### Polygon Brand System

**Design tokens in `tailwind.config.js`:**
- Primary: `#6A23E7` (Polygon purple)
- Primary light: `#9A60FF`
- Primary hover: `#5E31EB`
- Backgrounds: `#0A090D` (primary), `#141217` (secondary)
- Text: `#F3F5FF` (primary), `#9AA3B2` (secondary)

**Key patterns:**
- Pill-shaped buttons (`rounded-polygon-button` = 100px border-radius)
- 12px border-radius for cards (`rounded-polygon`)
- Radial gradient on primary buttons: `#9A60FF → #6A23E7`
- Glassmorphism borders: `rgba(255, 255, 255, 0.08)`
- Montserrat font family (weights 100-900)
- Custom CSS classes in `index.css`: `.btn-polygon-primary`, `.btn-polygon-secondary`, `.card-polygon`, `.input-polygon`

**Do not:**
- Use generic blue/indigo colors (use Polygon purple)
- Use neon cyberpunk aesthetics or skeuomorphism
- Mix other font families

## Key Implementation Notes

### CSV Export Format
CreatorRoster exports include: Name, Handle, Notes, Cost/Post, Platforms, Total Posts, Total Cost, Total Impressions, Avg CPM

### Google Sheets Integration
- Horizontal data format (creators as columns, not rows)
- Sequential IDs assigned on import (1, 2, 3...)
- `platforms` field is NOT in Google Sheets - only exists in localStorage

### Content Request Estimations
- Formula: Estimated Cost = (creator.costPerPost × post count) OR custom amount
- Estimated Impressions: Sum of selected creators' avg impressions × post count
- CPM calculated as: (cost / impressions) × 1000

### Kaito API Date Handling
- Dates formatted as `YYYY-MM-DD` for API
- Component defaults: Dec 1-31, 2025
- Mindshare score normalized to 0-100 scale: `Math.min(Math.round(mindshare * 10000), 100)`

### localStorage Schema
```javascript
creators: Array<{
  id: number,
  name: string,
  handle: string,
  notes?: string,
  costPerPost?: string,
  platforms?: Array<'X' | 'TikTok' | 'Instagram' | 'YouTube'>,
  posts?: Array<{
    description: string,
    date: string,
    cost: string,
    impressions: string,
    link?: string
  }>
}>

requests: Array<{
  id: number,
  title: string,
  description: string,
  creators: Array<number>, // creator IDs
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled',
  estimatedCost: number,
  estimatedImpressions: number,
  createdAt: string
}>
```

## Environment Variables

Required for Kaito integration:
```
VITE_KAITO_API_KEY=<your-api-key>
```

Local dev: Create `.env` file (see `.env.example`)
Vercel: Set in project settings or via `vercel env`

## Common Gotchas

- **Vite dev server may use port 5176** (not 5173) if other ports are occupied
- **Kaito proxy must match endpoint**: Vite and Vercel configs must both map to `/api/v1/community_mindshare`
- **localStorage data persists**: "Reset Data" button is the only way to reload from Google Sheets
- **Platform badges**: Only editable in app, not sourced from Google Sheets
- **Dark mode**: Currently forced (theme toggle exists but app is dark-themed by default per Polygon brand)
