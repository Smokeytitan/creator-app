import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibqqffnwawkualsynlrt.supabase.co';
const supabaseKey = 'sb_secret_qHI59hCuPxlRly4NIpKdqg_0naFprUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCampaigns() {
  console.log('Checking campaigns in Supabase...\n');

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total campaigns: ${campaigns.length}\n`);

  if (campaigns.length > 0) {
    campaigns.forEach(campaign => {
      console.log(`ID: ${campaign.id}`);
      console.log(`Title: ${campaign.title}`);
      console.log(`Status: ${campaign.status}`);
      console.log(`Created: ${campaign.created_at}`);
      console.log('---');
    });
  } else {
    console.log('No campaigns found in database');
  }
}

checkCampaigns().catch(console.error);
