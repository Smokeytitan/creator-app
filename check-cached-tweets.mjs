import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ibqqffnwawkualsynlrt.supabase.co',
  'sb_publishable_nyXVq3lwJvKzX5h0QV6n4g_TeyGf1gt'
);

// Get the latest campaign
const { data: campaigns } = await supabase
  .from('flash_campaigns')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1);

const campaign = campaigns[0];
console.log(`Campaign ID: ${campaign.id}`);
console.log(`Campaign Name: ${campaign.name}\n`);

// Check campaign_tweets table
const { data: tweets, error } = await supabase
  .from('campaign_tweets')
  .select('*')
  .eq('campaign_id', campaign.id);

if (error) {
  console.error('Error fetching tweets:', error);
} else {
  console.log(`Total tweets in campaign_tweets table: ${tweets?.length || 0}`);

  if (tweets && tweets.length > 0) {
    console.log('\nFirst 3 cached tweets:');
    tweets.slice(0, 3).forEach((tweet, i) => {
      console.log(`${i + 1}. ${tweet.url}`);
      console.log(`   Author: ${tweet.author_name} (@${tweet.author_username})`);
      console.log(`   Text: ${tweet.text.substring(0, 80)}...`);
    });
  }
}

// Check ALL tweets in table (regardless of campaign)
const { data: allTweets } = await supabase
  .from('campaign_tweets')
  .select('*');

console.log(`\nTotal tweets in entire table: ${allTweets?.length || 0}`);
