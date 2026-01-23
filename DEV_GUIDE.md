# Development Guide - POL Growth Platform

## Quick Start

```bash
# Interactive development helper menu
./dev-helper.sh

# Or manually:
npm run dev              # Start dev server
./monitor-dev.sh         # Start dev server monitor (auto-restart)
node monitor-errors.js   # Start error monitor (auto-fix)
```

## Development Tools

### 1. Dev Helper Menu (`./dev-helper.sh`)
Interactive menu for common development tasks:
- Start/restart dev server
- Database management (Prisma Studio, migrations)
- View logs
- Run tests and type checks
- Manage processes

### 2. Dev Server Monitor (`./monitor-dev.sh`)
- Automatically restarts dev server if it crashes
- Monitors port 3000 every 5 seconds
- Logs activity to `dev-server-monitor.log`

### 3. Error Monitor (`monitor-errors.js`)
- Watches `dev-server.log` for errors
- Automatically fixes common issues:
  - React Hook errors → Clear cache
  - Missing modules → Auto-install
  - Prisma errors → Regenerate client
  - Build errors → Clear and rebuild
- Logs fixes to `error-monitor.log`

## Project Structure

```
/app                    # Next.js 14 App Router pages
  /admin               # Admin dashboard pages
    /analytics         # Platform analytics
    /leaderboard       # Admin leaderboard view
    /requests          # Content request management
    /rules             # Reward rules editor
  /content-requests    # User-facing content requests
  /dashboard           # User dashboard
  /leaderboard         # User leaderboard with Twitter pfps
  /login               # Authentication
  /onboarding          # New user setup

/components            # React components
  /admin              # Admin-specific components
  /layouts            # Layout wrappers

/lib                   # Utility libraries
  /prisma.ts          # Prisma client

/prisma               # Database schema and migrations
  schema.prisma       # Database schema

/api                  # Vercel serverless functions
```

## Key Features

### User Features
- **Dashboard**: View rewards, activity, and earnings
- **Leaderboard**: Rankings with Twitter profile pictures
- **Content Requests**: View and participate in campaigns
- **Activity Tracking**: Twitter engagement monitoring

### Admin Features
- **Analytics**: Platform-wide statistics
- **Roster Management**: User administration
- **Content Requests**: Create and manage campaigns
- **Reward Rules**: Configure reward amounts
  - Polygon engagement rules (likes, replies, retweets, quotes)
  - Activity-based rewards
  - Tiered and threshold rewards

## Database Management

### Prisma Commands
```bash
# View database in browser
npx prisma studio

# Push schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# Reset database (DESTRUCTIVE!)
npx prisma migrate reset
```

### Seed Scripts
```bash
# Add Polygon engagement rules
npx tsx prisma/seed-polygon-rules.ts
```

## Environment Variables

Required in `.env` file:
```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Optional: Kaito API (for leaderboard data)
VITE_KAITO_API_KEY="your-api-key"
```

## Common Tasks

### Add a New Page
1. Create `app/your-page/page.tsx`
2. Add route to navigation in `components/layouts/DashboardLayout.tsx`
3. Implement server component with auth check

### Modify Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Run `npx prisma generate`
4. Restart dev server

### Fix Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Regenerate Prisma client
npx prisma generate
```

## Monitoring & Logs

### Log Files
- `dev-server.log` - Next.js dev server output
- `dev-server-monitor.log` - Monitor script activity
- `error-monitor.log` - Auto-fix activity

### View Logs
```bash
# Real-time dev server logs
tail -f dev-server.log

# Real-time error monitor
tail -f error-monitor.log

# All logs
tail -f dev-server.log dev-server-monitor.log error-monitor.log
```

## Troubleshooting

### React Hook Error (useContext)
This is a known Next.js 14 development mode issue. The page still works despite the error.
**Fix**: Clear cache with `rm -rf .next` and restart

### Port 3000 Already in Use
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Out of Sync
```bash
npx prisma generate
```

### Module Not Found
```bash
npm install <missing-module>
```

## Development Workflow

1. **Start monitoring** (recommended):
   ```bash
   ./dev-helper.sh
   # Choose option 2: Start with monitoring
   ```

2. **Make changes** to code

3. **Hot reload** happens automatically

4. **Errors are auto-fixed** by error monitor

5. **Check logs** if needed:
   ```bash
   tail -f dev-server.log
   ```

## Production Build

```bash
# Test production build
npm run build
npm run start

# Deploy to Vercel
vercel --prod
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Auth**: NextAuth v5
- **Styling**: Tailwind CSS 4 + Polygon brand system
- **Icons**: Lucide React
- **Deployment**: Vercel

## Brand Guidelines

- **Primary Color**: `#6A23E7` (Polygon purple)
- **Border Radius**: 12px for cards, 100px for buttons
- **Font**: Montserrat
- **Design**: Minimalist editorial style
- Use `.card-polygon`, `.btn-polygon-primary`, `.btn-polygon-secondary` classes

## Support

- Check logs first: `tail -f dev-server.log error-monitor.log`
- Use dev helper menu: `./dev-helper.sh`
- Clear cache: `rm -rf .next`
- Restart everything: Option 17 in dev helper menu
