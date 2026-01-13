import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

// Find all tweets matching key phrases
const keyPhrases = campaign.key_phrases;
const matchingTweets = [];

tweets.forEach(tweet => {
  const lowerText = tweet.text.toLowerCase();

  for (const phrase of keyPhrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      matchingTweets.push({
        tweetId: tweet.id,
        tweetUrl: tweet.url,
        tweetText: tweet.text,
        matchedPhrase: phrase,
        creatorName: tweet.author_name,
        creatorHandle: `@${tweet.author_username}`,
        creatorRank: 0, // Would need to get from Kaito data
        totalImpressions: tweet.impressions,
        totalRetweets: tweet.retweets,
        totalLikes: tweet.likes,
        totalReplies: tweet.replies,
        totalQuotes: tweet.quotes,
        totalBookmarks: tweet.bookmarks,
        engagementRate: tweet.impressions > 0
          ? `${(((tweet.retweets + tweet.likes + tweet.replies + tweet.quotes + tweet.bookmarks) / tweet.impressions) * 100).toFixed(2)}%`
          : '0%',
        createdAt: tweet.created_at
      });
      break; // Only match once per tweet
    }
  }
});

console.log(`\nFound ${matchingTweets.length} matching tweets!\n`);

// Display summary
matchingTweets.forEach((tweet, i) => {
  console.log(`${i + 1}. ${tweet.creatorName} (${tweet.creatorHandle})`);
  console.log(`   ${tweet.tweetUrl}`);
  console.log(`   Matched: "${tweet.matchedPhrase}"`);
  console.log(`   Impressions: ${tweet.totalImpressions.toLocaleString()} | Engagement: ${tweet.engagementRate}`);
  console.log(`   Text: ${tweet.tweetText.substring(0, 100)}...`);
  console.log('');
});

// Export to CSV
const csvHeader = 'Creator Name,Creator Handle,Tweet URL,Matched Phrase,Impressions,Retweets,Likes,Replies,Quotes,Bookmarks,Engagement Rate,Created At,Tweet Text\n';
const csvRows = matchingTweets.map(tweet => {
  const escapeCsv = (str) => `"${String(str).replace(/"/g, '""')}"`;
  return [
    escapeCsv(tweet.creatorName),
    escapeCsv(tweet.creatorHandle),
    escapeCsv(tweet.tweetUrl),
    escapeCsv(tweet.matchedPhrase),
    tweet.totalImpressions,
    tweet.totalRetweets,
    tweet.totalLikes,
    tweet.totalReplies,
    tweet.totalQuotes,
    tweet.totalBookmarks,
    tweet.engagementRate,
    escapeCsv(new Date(tweet.createdAt).toISOString()),
    escapeCsv(tweet.tweetText)
  ].join(',');
}).join('\n');

const csv = csvHeader + csvRows;
const filename = `matching-tweets-${campaign.name.replace(/\s+/g, '-')}-${Date.now()}.csv`;

fs.writeFileSync(filename, csv);
console.log(`\n✅ Exported to ${filename}`);

// Calculate total metrics
const totalImpressions = matchingTweets.reduce((sum, t) => sum + t.totalImpressions, 0);
const totalEngagement = matchingTweets.reduce((sum, t) =>
  sum + t.totalRetweets + t.totalLikes + t.totalReplies + t.totalQuotes + t.totalBookmarks, 0
);

console.log(`\n=== Campaign Summary ===`);
console.log(`Total matching tweets: ${matchingTweets.length}`);
console.log(`Total impressions: ${totalImpressions.toLocaleString()}`);
console.log(`Total engagement: ${totalEngagement.toLocaleString()}`);
console.log(`Average engagement rate: ${totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(2) : 0}%`);
