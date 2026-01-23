# Influencer Campaign Manager - Isolated Version

This is a standalone version of the Influencer Campaign Manager that uses **browser localStorage** instead of Supabase. All data is stored locally in your browser.

## Key Features

- **Creator/Influencer Roster Management** - Track influencers, their platforms, costs, and contact info
- **Campaign Management** - Create and track campaigns with multiple creators
- **Performance Analytics** - View ROI metrics, impressions, costs, and platform distribution
- **Post Tracking** - Link social media posts to campaigns and track metrics
- **Completely Local** - No backend required, all data stored in browser

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone this repository or download the code
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

**Note:** If you previously used a different version of this app, you may see old data. To start fresh:
- Open browser DevTools (F12)
- Go to Application → Local Storage
- Clear all data for this domain
- Refresh the page

## Usage

### Managing Creators

1. Go to the "Roster" tab
2. Click "Add Creator" to add new influencers
3. Fill in their name, handle, cost per post, and platforms
4. Add notes for internal reference

### Creating Campaigns

1. Go to the "Campaigns" tab
2. Click "New Campaign"
3. Select creators to include
4. The estimated cost and impressions are calculated automatically based on creator data
5. Track campaign status (Pending, In Progress, Completed)

### Tracking Posts

1. In the Roster tab, click on a creator
2. Click "Add Post" to link a social media post
3. Enter the post URL, impressions, and other metrics
4. Link the post to a campaign to track performance

### Viewing Analytics

1. Go to the "Analytics" tab
2. View overall metrics: total spend, impressions, posts
3. See top performers by ROI (CPM - Cost Per Thousand Impressions)
4. View budget breakdown by platform
5. Export data to CSV for external analysis

## Data Storage

All data is stored in your browser's localStorage with the following keys:
- `influencer_tool_creators` - Creator/influencer data
- `influencer_tool_campaigns` - Campaign data
- `influencer_tool_posts` - Post performance data

**Important:**
- Data persists in your browser only
- Clearing browser data will delete all information
- Not shared across devices or browsers
- Export important data regularly using the CSV export feature

## Customization

### Changing Colors/Branding

The app uses the PolyCharts design system with these key colors:
- Primary Background: `#0F0F0F`
- Card Background: `#1F1F1F`
- Brand Purple: `#8247E5`
- Accent Warm: `#F59E0B`

To customize, search for these hex codes in the `/src/components/` files.

### Adding Platforms

Platform colors are defined in `Analytics.jsx`:
```javascript
const PLATFORM_COLORS = {
  'X': '#1DA1F2',
  'Instagram': '#E4405F',
  'TikTok': '#00F2EA',
  // Add more platforms here
};
```

## Technical Details

- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Storage:** Browser localStorage
- **No Backend Required**

## Limitations

Since this version uses localStorage:
- Storage limit: ~5-10MB per domain (browser dependent)
- Data not synced across devices
- No multi-user support
- No real-time collaboration
- Data lost if browser cache is cleared

For production use with larger teams, consider migrating to the Supabase version.

## Troubleshooting

### Data not saving
- Check if localStorage is enabled in your browser
- Try a different browser
- Check browser console for errors

### App not loading
- Clear browser cache and reload
- Check that Node.js and dependencies are installed
- Run `npm install` again

### Performance issues
- Too much data in localStorage can slow things down
- Export old data and clear it periodically
- Consider archiving completed campaigns

## Support

This is a standalone tool. For questions or issues:
1. Check the browser console for error messages
2. Export your data before making changes
3. Refresh the page to reload

## License

This isolated version is provided as-is for personal use.
