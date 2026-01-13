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
console.log(`Key Phrases: ${campaign.key_phrases.join(', ')}\n`);

// Get all cached tweets for this campaign
const { data: tweets } = await supabase
  .from('campaign_tweets')
  .select('*')
  .eq('campaign_id', campaign.id);

console.log(`Total cached tweets: ${tweets.length}`);

// Manually check which tweets contain the key phrases
const keyPhrases = campaign.key_phrases;
let manualMatches = 0;
const missedTweets = [];

tweets.forEach(tweet => {
  const lowerText = tweet.text.toLowerCase();
  let matched = false;

  for (const phrase of keyPhrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      matched = true;
      manualMatches++;
      break;
    }
  }

  if (matched) {
    // Check if this tweet is in the results
    const eligibleTweets = campaign.results?.eligibleTweets || [];
    const inResults = eligibleTweets.some(t => t.tweetId === tweet.id);
    if (!inResults) {
      missedTweets.push({
        id: tweet.id,
        url: tweet.url,
        text: tweet.text.substring(0, 100)
      });
    }
  }
});

console.log(`Tweets matching key phrases (manual scan): ${manualMatches}`);
console.log(`Tweets in campaign results: ${campaign.results?.eligibleTweets?.length || 0}`);

if (missedTweets.length > 0) {
  console.log(`\n⚠️  ${missedTweets.length} matching tweets were missed:`);
  missedTweets.forEach((tweet, i) => {
    console.log(`${i + 1}. ${tweet.url}`);
    console.log(`   Text: ${tweet.text}...`);
  });
} else {
  console.log('\n✅ All matching tweets were found!');
}

// Check for tweets without content
const tweetsWithoutContent = tweets.filter(t =>
  t.text === 'Content pending Twitter API fetch' ||
  t.text.includes('Manual verification required')
);

if (tweetsWithoutContent.length > 0) {
  console.log(`\n⚠️  ${tweetsWithoutContent.length} tweets without real content:`);
  tweetsWithoutContent.slice(0, 5).forEach((tweet, i) => {
    console.log(`${i + 1}. ${tweet.url}`);
  });
} else {
  console.log('\n✅ All tweets have real content from Twitter API');
}
