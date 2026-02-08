/**
 * Dashboard Summary API - Read-only aggregate metrics endpoint
 *
 * Called by the Polygon Super Dashboard to pull metrics about
 * contracted content creators (campaigns, tweets, engagement).
 *
 * Protected by API key via x-api-key header.
 */

import { createClient } from '@supabase/supabase-js';
import { handleCors } from './_cors.js';

export default async function handler(req, res) {
  // Handle CORS and preflight
  if (!handleCors(req, res, { methods: 'GET, OPTIONS' })) {
    return; // CORS handled or request rejected
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify API key
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.DASHBOARD_API_KEY;

  if (!expectedKey) {
    console.error('[dashboard-summary] DASHBOARD_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized - invalid or missing API key' });
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[dashboard-summary] Supabase credentials not configured');
    return res.status(500).json({ error: 'Database not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Run all queries in parallel for performance
    const [
      campaignsResult,
      tweetsResult,
      excludedResult,
      recentCampaignsResult,
    ] = await Promise.all([
      // 1. Campaign counts by status
      supabase
        .from('flash_campaigns')
        .select('status'),

      // 2. Tweet engagement aggregates
      supabase
        .from('campaign_tweets')
        .select('impressions, retweets, likes, replies, quotes, bookmarks'),

      // 3. Excluded accounts count
      supabase
        .from('excluded_accounts')
        .select('id', { count: 'exact', head: true }),

      // 4. Top 5 recent campaigns
      supabase
        .from('flash_campaigns')
        .select('id, name, status, reward_pool, start_date_time, end_date_time')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Check for query errors
    if (campaignsResult.error) {
      throw new Error(`Campaigns query failed: ${campaignsResult.error.message}`);
    }
    if (tweetsResult.error) {
      throw new Error(`Tweets query failed: ${tweetsResult.error.message}`);
    }
    if (excludedResult.error) {
      throw new Error(`Excluded accounts query failed: ${excludedResult.error.message}`);
    }
    if (recentCampaignsResult.error) {
      throw new Error(`Recent campaigns query failed: ${recentCampaignsResult.error.message}`);
    }

    // Aggregate campaign counts by status
    const campaigns = campaignsResult.data || [];
    const statusCounts = campaigns.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    // Aggregate tweet engagement metrics
    const tweets = tweetsResult.data || [];
    let totalImpressions = 0;
    let totalEngagements = 0;

    for (const tweet of tweets) {
      totalImpressions += Number(tweet.impressions) || 0;
      totalEngagements +=
        (Number(tweet.retweets) || 0) +
        (Number(tweet.likes) || 0) +
        (Number(tweet.replies) || 0) +
        (Number(tweet.quotes) || 0) +
        (Number(tweet.bookmarks) || 0);
    }

    // Format recent campaigns for response
    const recentCampaigns = (recentCampaignsResult.data || []).map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      rewardPool: c.reward_pool,
      startDateTime: c.start_date_time,
      endDateTime: c.end_date_time,
    }));

    return res.status(200).json({
      source: 'content-creators',
      fetchedAt: new Date().toISOString(),
      metrics: {
        totalCampaigns: campaigns.length,
        activeCampaigns: statusCounts['active'] || 0,
        completedCampaigns: statusCounts['completed'] || 0,
        scheduledCampaigns: statusCounts['scheduled'] || 0,
        totalTweetsCached: tweets.length,
        totalImpressions,
        totalEngagements,
        excludedAccountsCount: excludedResult.count || 0,
      },
      recentCampaigns,
    });
  } catch (error) {
    console.error('[dashboard-summary] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
