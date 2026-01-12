import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ibqqffnwawkualsynlrt.supabase.co',
  'sb_publishable_nyXVq3lwJvKzX5h0QV6n4g_TeyGf1gt'
);

console.log('Manually processing ended campaign...\n');

// Get the campaign
const { data: campaigns } = await supabase
  .from('flash_campaigns')
  .select('*')
  .eq('status', 'active');

if (!campaigns || campaigns.length === 0) {
  console.log('No active campaigns found');
  process.exit(0);
}

const now = new Date();
const endedCampaigns = campaigns.filter(c => new Date(c.end_date_time) <= now);

if (endedCampaigns.length === 0) {
  console.log('No ended campaigns to process');
  process.exit(0);
}

console.log(`Found ${endedCampaigns.length} ended campaigns to process\n`);

for (const campaign of endedCampaigns) {
  console.log(`Campaign: ${campaign.name}`);
  console.log(`End time: ${campaign.end_date_time}`);
  console.log(`Status: ${campaign.status}`);
  console.log('\nProcessing...');

  // Call the cron endpoint directly (we'll import the function)
  try {
    const response = await fetch('https://content-requests-app.vercel.app/api/cron-check-campaigns', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer 0KK0UttTzPtBX+IvzMX0RWO9JLBbiorSBjIib49Zi9c='
      }
    });

    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}
