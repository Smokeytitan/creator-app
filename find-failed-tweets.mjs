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
console.log(`Campaign: ${campaign.name}`);
console.log(`Total tweets cached: ${campaign.results.totalTweetsCached}\n`);

// Get all cached tweets for this campaign
const { data: tweets } = await supabase
  .from('campaign_tweets')
  .select('*')
  .eq('campaign_id', campaign.id);

console.log(`Tweets in campaign_tweets table: ${tweets.length}`);

// Find tweets that failed to fetch content
const failedTweets = tweets.filter(tweet =>
  tweet.text === 'Content pending Twitter API fetch' ||
  tweet.text.includes('Manual verification required') ||
  tweet.text.includes('pending')
);

const tweetsWithContent = tweets.filter(tweet =>
  tweet.text !== 'Content pending Twitter API fetch' &&
  !tweet.text.includes('Manual verification required') &&
  !tweet.text.includes('pending')
);

console.log(`\nTweets successfully fetched: ${tweetsWithContent.length}`);
console.log(`Tweets that failed: ${failedTweets.length}`);

if (failedTweets.length > 0) {
  console.log(`\n=== Failed Tweets ===`);
  failedTweets.forEach((tweet, i) => {
    console.log(`\n${i + 1}. Tweet ID: ${tweet.id}`);
    console.log(`   URL: ${tweet.url}`);
    console.log(`   Author: ${tweet.author_name} (@${tweet.author_username})`);
    console.log(`   Status: ${tweet.text}`);
    console.log(`   Fetched at: ${tweet.fetched_at}`);
  });

  // Export failed tweet IDs for retry
  console.log(`\n=== Failed Tweet IDs (for retry) ===`);
  const failedIds = failedTweets.map(t => t.id);
  console.log(JSON.stringify(failedIds, null, 2));

  // Check if these tweets are deleted/private by testing one
  console.log(`\n💡 Tip: These tweets likely failed because they are:`);
  console.log(`   - Deleted by the author`);
  console.log(`   - Made private/protected`);
  console.log(`   - Suspended accounts`);
  console.log(`   - Rate limited (unlikely with our delays)`);

  console.log(`\n📝 You can manually check these URLs to verify:`);
  failedTweets.slice(0, 3).forEach((tweet, i) => {
    console.log(`   ${i + 1}. ${tweet.url}`);
  });
} else {
  console.log(`\n✅ All tweets successfully fetched!`);
}

// Calculate success rate
const successRate = ((tweetsWithContent.length / tweets.length) * 100).toFixed(2);
console.log(`\n=== Fetch Success Rate ===`);
console.log(`${successRate}% (${tweetsWithContent.length}/${tweets.length} tweets)`);
