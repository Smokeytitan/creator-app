/**
 * Fetch Tweet Impressions from Twitter API
 * Updates existing posts in Supabase with impression data from Twitter
 *
 * Usage: node fetch-tweet-impressions.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env
function loadEnv() {
  try {
    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      });
    }
  } catch (error) {
    console.warn('Could not load .env file:', error.message);
  }
}

loadEnv();

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`Using Supabase URL: ${SUPABASE_URL}`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase credentials not found. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Extract tweet ID from Twitter URL
 */
function extractTweetId(url) {
  if (!url) return null;
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Fetch tweet data from Twitter API v2 via proxy endpoint
 */
async function fetchTweetsFromTwitter(tweetIds) {
  if (!tweetIds || tweetIds.length === 0) return {};

  try {
    // Use the Twitter API proxy endpoint
    // If running against production, use: node fetch-tweet-impressions.mjs production
    const isProduction = process.argv[2] === 'production';
    const apiUrl = isProduction
      ? 'https://content-requests-app.vercel.app/api/twitter'
      : 'http://localhost:5176/api/twitter';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tweetIds })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Twitter API error (${response.status}):`, errorText);
      return {};
    }

    const data = await response.json();

    // Build map of tweet ID -> metrics
    const tweetMap = {};
    if (data.data) {
      data.data.forEach(tweet => {
        tweetMap[tweet.id] = {
          impressions: tweet.public_metrics?.impression_count || 0,
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          quotes: tweet.public_metrics?.quote_count || 0
        };
      });
    }

    return tweetMap;
  } catch (error) {
    console.error('Error fetching from Twitter API:', error.message);
    return {};
  }
}

/**
 * Main function
 */
async function fetchAndUpdateImpressions() {
  console.log('='.repeat(60));
  console.log('Fetching Tweet Impressions from Twitter API');
  console.log('='.repeat(60));

  try {
    // Step 1: Get all posts from Supabase
    console.log('\n[1/3] Fetching posts from Supabase...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, link, impressions')
      .order('id');

    if (postsError) throw postsError;

    console.log(`✓ Found ${posts.length} posts`);

    // Step 2: Extract tweet IDs and fetch from Twitter
    console.log('\n[2/3] Fetching tweet data from Twitter API...');
    const tweetIdToPostId = {};
    const tweetIds = [];

    posts.forEach(post => {
      const tweetId = extractTweetId(post.link);
      if (tweetId) {
        tweetIds.push(tweetId);
        tweetIdToPostId[tweetId] = post.id;
      }
    });

    console.log(`  Found ${tweetIds.length} tweet IDs`);

    // Fetch in batches of 100 (Twitter API limit)
    let totalFetched = 0;
    const allTweetData = {};

    for (let i = 0; i < tweetIds.length; i += 100) {
      const batch = tweetIds.slice(i, i + 100);
      console.log(`  Fetching batch ${Math.floor(i/100) + 1}/${Math.ceil(tweetIds.length/100)} (${batch.length} tweets)...`);

      const batchData = await fetchTweetsFromTwitter(batch);
      Object.assign(allTweetData, batchData);
      totalFetched += Object.keys(batchData).length;

      // Rate limiting delay
      if (i + 100 < tweetIds.length) {
        console.log('  Waiting 1 second for rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✓ Successfully fetched data for ${totalFetched} tweets`);

    // Step 3: Update posts in Supabase
    console.log('\n[3/3] Updating posts with impression data...');
    let updated = 0;
    let skipped = 0;

    for (const [tweetId, postId] of Object.entries(tweetIdToPostId)) {
      const tweetData = allTweetData[tweetId];

      if (tweetData && tweetData.impressions > 0) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            impressions: tweetData.impressions.toString(),
            likes: tweetData.likes?.toString() || null,
            retweets: tweetData.retweets?.toString() || null,
            quotes: tweetData.quotes?.toString() || null
          })
          .eq('id', postId);

        if (updateError) {
          console.error(`  ✗ Error updating post ${postId}:`, updateError.message);
        } else {
          updated++;
        }
      } else {
        skipped++;
      }
    }

    console.log(`✓ Updated ${updated} posts with impression data`);
    if (skipped > 0) {
      console.log(`  Skipped ${skipped} posts (no data available)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ Completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ Failed:', error.message);
    process.exit(1);
  }
}

// Run the script
fetchAndUpdateImpressions();
