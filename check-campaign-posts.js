import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibqqffnwawkualsynlrt.supabase.co';
const supabaseKey = 'sb_secret_qHI59hCuPxlRly4NIpKdqg_0naFprUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCampaignPosts() {
  // First find the Polygon Open Money Stack campaign
  console.log('Finding Polygon Open Money Stack campaign...\n');

  const { data: campaigns, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .ilike('title', '%polygon%money%');

  if (campaignError) {
    console.error('Campaign Error:', campaignError);
    return;
  }

  if (campaigns && campaigns.length > 0) {
    campaigns.forEach(campaign => {
      console.log(`Campaign: ${campaign.title}`);
      console.log(`  ID: ${campaign.id}`);
      console.log(`  Status: ${campaign.status}`);
      console.log(`  Creators: ${JSON.stringify(campaign.creators, null, 2)}`);
      console.log('---\n');
    });

    // Now check for posts in any of these campaigns
    const campaignIds = campaigns.map(c => c.id);
    console.log('Checking for posts in these campaigns...\n');

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('campaign_id', campaignIds);

    if (postsError) {
      console.error('Posts Error:', postsError);
      return;
    }

    console.log(`Total posts in these campaigns: ${posts?.length || 0}\n`);

    if (posts && posts.length > 0) {
      posts.forEach((post, idx) => {
        console.log(`Post ${idx + 1}:`);
        console.log(`  ID: ${post.id}`);
        console.log(`  Creator ID: ${post.creator_id}`);
        console.log(`  Campaign ID: ${post.campaign_id}`);
        console.log(`  Description: ${post.description}`);
        console.log(`  Impressions: ${post.impressions}`);
        console.log('---');
      });
    }
  } else {
    console.log('No matching campaign found');
  }
}

checkCampaignPosts().catch(console.error);
