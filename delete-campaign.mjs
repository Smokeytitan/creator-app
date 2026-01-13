import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ibqqffnwawkualsynlrt.supabase.co',
  'sb_publishable_nyXVq3lwJvKzX5h0QV6n4g_TeyGf1gt'
);

// Get the latest campaign
const { data: campaigns, error: campaignError } = await supabase
  .from('flash_campaigns')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1);

if (campaignError) {
  console.error('Error fetching campaigns:', campaignError);
  process.exit(1);
}

if (!campaigns || campaigns.length === 0) {
  console.log('No campaigns found');
  process.exit(0);
}

const campaign = campaigns[0];
console.log(`Found campaign: ${campaign.name} (ID: ${campaign.id})`);
console.log(`Status: ${campaign.status}`);

// Delete associated tweets first (cascade should handle this, but just in case)
const { error: deleteTweetsError } = await supabase
  .from('campaign_tweets')
  .delete()
  .eq('campaign_id', campaign.id);

if (deleteTweetsError) {
  console.error('Error deleting tweets:', deleteTweetsError);
} else {
  console.log('✓ Deleted associated tweets');
}

// Delete campaign
const { error: deleteCampaignError } = await supabase
  .from('flash_campaigns')
  .delete()
  .eq('id', campaign.id);

if (deleteCampaignError) {
  console.error('Error deleting campaign:', deleteCampaignError);
  process.exit(1);
}

console.log('✓ Deleted campaign successfully');
console.log('\nYou can now create a new campaign and test the caching.');
