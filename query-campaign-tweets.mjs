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
console.log('\n=== Latest Campaign ===');
console.log(`ID: ${campaign.id}`);
console.log(`Name: ${campaign.name}`);
console.log(`Status: ${campaign.status}`);
console.log(`Date Range: ${campaign.start_date_time} to ${campaign.end_date_time}`);
console.log(`Key Phrases: ${campaign.key_phrases ? campaign.key_phrases.join(', ') : 'None'}`);

// Check if campaign has results
if (campaign.results) {
  console.log('\n=== Campaign Results ===');
  console.log('Results structure:', JSON.stringify(campaign.results, null, 2));

  const results = campaign.results;

  if (results.eligibleTweets && results.eligibleTweets.length > 0) {
    console.log(`\nTotal eligible tweets: ${results.eligibleTweets.length}`);
    console.log('\nFirst 5 tweet URLs for testing:');
    results.eligibleTweets.slice(0, 5).forEach((tweet, i) => {
      console.log(`${i + 1}. ${tweet.tweetUrl}`);
    });

    // Extract tweet IDs
    console.log('\nTweet IDs for API testing:');
    const tweetIds = results.eligibleTweets.slice(0, 5).map(tweet => {
      const match = tweet.tweetUrl.match(/\/status\/(\d+)/);
      return match ? match[1] : null;
    }).filter(Boolean);
    console.log(JSON.stringify(tweetIds));
  } else {
    console.log('\nNo eligible tweets in eligibleTweets array');

    // Check for tweet URLs anywhere in results
    const resultsStr = JSON.stringify(results);
    const tweetUrlMatches = resultsStr.match(/https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+/g);
    if (tweetUrlMatches && tweetUrlMatches.length > 0) {
      console.log(`\nFound ${tweetUrlMatches.length} tweet URLs in results`);
      console.log('First 5 URLs:');
      tweetUrlMatches.slice(0, 5).forEach((url, i) => {
        console.log(`${i + 1}. ${url}`);
      });

      // Extract tweet IDs
      const tweetIds = tweetUrlMatches.slice(0, 5).map(url => {
        const match = url.match(/\/status\/(\d+)/);
        return match ? match[1] : null;
      }).filter(Boolean);
      console.log('\nTweet IDs for API testing:');
      console.log(JSON.stringify(tweetIds));
    }
  }
} else {
  console.log('\nNo results yet for this campaign');
}
