/**
 * Vercel Cron Job - Checks for ended campaigns and processes them
 *
 * This function runs every minute via Vercel Cron to automatically
 * fetch results for campaigns that have ended, even when the browser is closed.
 *
 * Configuration: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron-check-campaigns",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */

import { createClient } from '@supabase/supabase-js';
import { KaitoService } from '../src/services/kaitoService.js';
import { extractTweetId, batchFetchTweets, findMatchingPhrase } from '../src/services/twitterService.js';

export default async function handler(req, res) {
  // Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  try {
    console.log('[CRON] Checking for ended campaigns...');

    // Get all active campaigns
    const { data: campaigns, error: fetchError } = await supabase
      .from('flash_campaigns')
      .select('*')
      .eq('status', 'active');

    if (fetchError) throw fetchError;

    if (!campaigns || campaigns.length === 0) {
      console.log('[CRON] No active campaigns found');
      return res.status(200).json({ message: 'No active campaigns to process' });
    }

    console.log(`[CRON] Found ${campaigns.length} active campaigns`);

    // Check which campaigns have ended
    const now = new Date();
    const endedCampaigns = campaigns.filter(c => new Date(c.end_date_time) <= now);

    if (endedCampaigns.length === 0) {
      console.log('[CRON] No campaigns have ended yet');
      return res.status(200).json({ message: 'No ended campaigns to process' });
    }

    console.log(`[CRON] Processing ${endedCampaigns.length} ended campaigns`);

    const processedCampaigns = [];
    const failedCampaigns = [];

    // Process each ended campaign
    for (const campaign of endedCampaigns) {
      try {
        await processCampaign(campaign, supabase);
        processedCampaigns.push(campaign.name);
        console.log(`[CRON] ✓ Processed: ${campaign.name}`);
      } catch (error) {
        console.error(`[CRON] ✗ Failed to process ${campaign.name}:`, error);
        failedCampaigns.push({ name: campaign.name, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      processed: processedCampaigns,
      failed: failedCampaigns,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CRON] Error in cron job:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Process a single campaign - fetch results and update status
 */
async function processCampaign(campaign, supabase) {
  console.log(`Processing campaign: ${campaign.name}`);

  // Get excluded accounts
  const { data: excludedAccounts } = await supabase
    .from('excluded_accounts')
    .select('*');

  const excludedHandles = (excludedAccounts || []).map(a =>
    a.handle.toLowerCase().replace(/^@/, '')
  );

  // Format dates for Kaito API
  const startDate = new Date(campaign.start_date_time).toISOString().split('T')[0];
  const endDate = new Date(campaign.end_date_time).toISOString().split('T')[0];

  // Fetch Kaito leaderboard data
  const kaitoService = new KaitoService();
  const leaderboardData = await kaitoService.getLeaderboard(startDate, endDate);

  // Filter for top 115 creators and exclude blocked accounts
  const eligibleCreators = leaderboardData
    .filter(creator => creator.rank <= 115)
    .filter(creator => {
      const handle = creator.handle.toLowerCase().replace(/^@/, '');
      return !excludedHandles.includes(handle);
    });

  console.log(`Found ${eligibleCreators.length} eligible creators`);

  // Collect tweet URLs and metadata
  const allTweetData = [];
  const tweetIds = [];

  eligibleCreators.forEach(creator => {
    (creator.tweetUrls || []).forEach(tweetUrl => {
      const tweetId = extractTweetId(tweetUrl);
      if (tweetId) {
        tweetIds.push(tweetId);
        allTweetData.push({
          tweetId,
          tweetUrl,
          creatorName: creator.name,
          creatorHandle: creator.handle,
          creatorRank: creator.rank,
          creatorUserId: creator.userId,
          totalImpressions: creator.impressions || 0,
          totalLikes: creator.totalLikes || 0,
          totalRetweets: creator.totalRetweets || 0,
          totalQuotes: creator.totalQuotes || 0,
          totalBookmarks: creator.totalBookmarks || 0,
          engagementRate: creator.engagementRate || '0%'
        });
      }
    });
  });

  console.log(`Collected ${tweetIds.length} tweet URLs`);

  // Fetch tweet content from Twitter API and match phrases
  let tweetsWithContent = [];
  let twitterApiUsed = false;

  if (tweetIds.length > 0) {
    try {
      console.log('Fetching tweet content from Twitter API...');
      const twitterTweets = await batchFetchTweets(tweetIds);
      twitterApiUsed = true;

      const tweetTextMap = {};
      twitterTweets.forEach(tweet => {
        tweetTextMap[tweet.id] = tweet.text;
      });

      // Match tweets against key phrases
      const keyPhrases = campaign.key_phrases;
      allTweetData.forEach(tweetData => {
        const tweetText = tweetTextMap[tweetData.tweetId];
        if (tweetText) {
          const matchedPhrase = findMatchingPhrase(tweetText, keyPhrases);
          if (matchedPhrase) {
            tweetsWithContent.push({
              ...tweetData,
              matchedPhrase,
              tweetText: tweetText.substring(0, 200)
            });
          }
        }
      });

      console.log(`Found ${tweetsWithContent.length} tweets matching key phrases`);
    } catch (twitterError) {
      console.error('Twitter API error:', twitterError);
      twitterApiUsed = false;

      // Fallback: Return all tweets without phrase matching
      tweetsWithContent = allTweetData.map(t => ({
        ...t,
        matchedPhrase: 'N/A - Twitter API Error',
        tweetText: null
      }));
    }
  }

  // Save results
  const results = {
    fetchedAt: new Date().toISOString(),
    eligibleTweets: tweetsWithContent,
    twitterApiUsed
  };

  const { error: updateError } = await supabase
    .from('flash_campaigns')
    .update({
      status: 'completed',
      results: JSON.stringify(results)
    })
    .eq('id', campaign.id);

  if (updateError) throw updateError;

  console.log(`✓ Saved results for campaign: ${campaign.name}`);
}
