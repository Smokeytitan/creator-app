/**
 * Flash Campaign Service - Supabase Version
 * Manages flash campaigns and exclusions using Supabase database
 * Replaces localStorage with persistent cloud storage for background processing
 */

import { supabase } from '../lib/supabaseClient';
import { KaitoService } from './kaitoService';
import { extractTweetId, batchFetchTweets, findMatchingPhrase } from './twitterService';

// ============================================================================
// CAMPAIGN CRUD OPERATIONS
// ============================================================================

/**
 * Get all campaigns from Supabase
 * @returns {Promise<Array>} Array of campaign objects
 */
export const getCampaigns = async () => {
  if (!supabase) {
    console.error('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('flash_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform database format to app format
    return (data || []).map(transformFromDB);
  } catch (error) {
    console.error('Error loading campaigns:', error);
    return [];
  }
};

/**
 * Get campaign by ID
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<object|null>} Campaign object or null if not found
 */
export const getCampaignById = async (campaignId) => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('flash_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) throw error;
    return data ? transformFromDB(data) : null;
  } catch (error) {
    console.error('Error loading campaign:', error);
    return null;
  }
};

/**
 * Transform database row to app format
 * @param {object} row - Database row
 * @returns {object} App-formatted campaign
 */
const transformFromDB = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  startDateTime: row.start_date_time,
  endDateTime: row.end_date_time,
  keyPhrases: row.key_phrases,
  rewardPool: row.reward_pool,
  status: row.status,
  createdAt: row.created_at,
  results: typeof row.results === 'string' ? JSON.parse(row.results) : row.results
});

/**
 * Transform app format to database format
 * @param {object} campaign - App-formatted campaign
 * @returns {object} Database row format
 */
const transformToDB = (campaign) => ({
  id: campaign.id,
  name: campaign.name,
  description: campaign.description || '',
  start_date_time: campaign.startDateTime,
  end_date_time: campaign.endDateTime,
  key_phrases: campaign.keyPhrases,
  reward_pool: campaign.rewardPool || '',
  status: campaign.status,
  created_at: campaign.createdAt,
  results: campaign.results ? JSON.stringify(campaign.results) : null
});

/**
 * Create a new campaign
 * @param {object} campaignData - Campaign data
 * @returns {Promise<object>} Created campaign object
 */
export const createCampaign = async (campaignData) => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Determine initial status based on start time
  const now = new Date();
  const startTime = new Date(campaignData.startDateTime);
  const status = startTime <= now ? 'active' : 'scheduled';

  const newCampaign = {
    id: Date.now(), // Timestamp-based ID
    name: campaignData.name,
    description: campaignData.description || '',
    startDateTime: campaignData.startDateTime,
    endDateTime: campaignData.endDateTime,
    keyPhrases: campaignData.keyPhrases || [],
    rewardPool: campaignData.rewardPool || '',
    status,
    createdAt: new Date().toISOString(),
    results: null
  };

  try {
    const { data, error } = await supabase
      .from('flash_campaigns')
      .insert([transformToDB(newCampaign)])
      .select()
      .single();

    if (error) throw error;
    return transformFromDB(data);
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw new Error('Failed to create campaign');
  }
};

/**
 * Update campaign
 * @param {number} campaignId - Campaign ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated campaign or null if not found
 */
export const updateCampaign = async (campaignId, updates) => {
  if (!supabase) return null;

  try {
    // Get current campaign
    const current = await getCampaignById(campaignId);
    if (!current) return null;

    // Merge updates
    const updated = { ...current, ...updates };

    // Save to database
    const { data, error } = await supabase
      .from('flash_campaigns')
      .update(transformToDB(updated))
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return transformFromDB(data);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return null;
  }
};

/**
 * Update campaign status
 * @param {number} campaignId - Campaign ID
 * @param {string} status - New status
 * @returns {Promise<object|null>}
 */
export const updateCampaignStatus = async (campaignId, status) => {
  return updateCampaign(campaignId, { status });
};

/**
 * Update campaign results
 * @param {number} campaignId - Campaign ID
 * @param {object} results - Results data
 * @returns {Promise<object|null>}
 */
export const updateCampaignResults = async (campaignId, results) => {
  return updateCampaign(campaignId, { results });
};

/**
 * Delete campaign
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteCampaign = async (campaignId) => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('flash_campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return false;
  }
};

/**
 * Cancel campaign
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<object|null>}
 */
export const cancelCampaign = async (campaignId) => {
  return updateCampaignStatus(campaignId, 'cancelled');
};

// ============================================================================
// EXCLUSION LIST MANAGEMENT
// ============================================================================

/**
 * Get all excluded accounts
 * @returns {Promise<Array>} Array of excluded account objects
 */
export const getExcludedAccounts = async () => {
  if (!supabase) {
    console.error('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('excluded_accounts')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      handle: row.handle,
      reason: row.reason,
      addedAt: row.added_at
    }));
  } catch (error) {
    console.error('Error loading excluded accounts:', error);
    return [];
  }
};

/**
 * Normalize Twitter handle (remove @ prefix, lowercase)
 * @param {string} handle - Twitter handle
 * @returns {string} Normalized handle
 */
export const normalizeHandle = (handle) => {
  if (!handle) return '';
  return handle.toLowerCase().replace(/^@/, '');
};

/**
 * Add excluded account
 * @param {string} handle - Twitter handle
 * @param {string} reason - Optional reason for exclusion
 * @returns {Promise<object>} Created exclusion object
 */
export const addExcludedAccount = async (handle, reason = '') => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Check if already exists
  const existing = await getExcludedAccounts();
  const normalized = normalizeHandle(handle);
  if (existing.some(e => normalizeHandle(e.handle) === normalized)) {
    throw new Error('This account is already excluded');
  }

  const newExclusion = {
    id: Date.now(),
    handle: normalizeHandle(handle),
    reason,
    added_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('excluded_accounts')
      .insert([newExclusion])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      handle: data.handle,
      reason: data.reason,
      addedAt: data.added_at
    };
  } catch (error) {
    console.error('Error adding excluded account:', error);
    throw new Error('Failed to add excluded account');
  }
};

/**
 * Remove excluded account
 * @param {number} exclusionId - Exclusion ID
 * @returns {Promise<boolean>} True if removed, false if not found
 */
export const removeExcludedAccount = async (exclusionId) => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('excluded_accounts')
      .delete()
      .eq('id', exclusionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing excluded account:', error);
    return false;
  }
};

// ============================================================================
// CAMPAIGN STATUS & FILTERING
// ============================================================================

/**
 * Get campaigns filtered by status
 * @param {string} status - Status to filter by
 * @returns {Promise<Array>} Filtered campaigns
 */
export const getCampaignsByStatus = async (status) => {
  const campaigns = await getCampaigns();
  return campaigns.filter(c => c.status === status);
};

/**
 * Get status display info
 * @param {string} status - Campaign status
 * @returns {object} Display information (label, color, icon)
 */
export const getStatusDisplay = (status) => {
  const displays = {
    scheduled: { label: 'Scheduled', color: 'blue', icon: 'Clock' },
    active: { label: 'Active', color: 'green', icon: 'Zap' },
    completed: { label: 'Completed', color: 'purple', icon: 'CheckCircle' },
    cancelled: { label: 'Cancelled', color: 'gray', icon: 'XCircle' }
  };
  return displays[status] || displays.scheduled;
};

// ============================================================================
// AUTOMATIC CAMPAIGN PROCESSING
// ============================================================================

/**
 * Check for ended campaigns and fetch results automatically
 * @returns {Promise<Array>} Array of processed campaign names
 */
export const checkAndProcessEndedCampaigns = async () => {
  const campaigns = await getCampaigns();
  const now = new Date();
  const processedCampaigns = [];

  console.log('[checkAndProcessEndedCampaigns] Total campaigns:', campaigns.length);
  console.log('[checkAndProcessEndedCampaigns] Current time:', now.toISOString());

  // Find campaigns that have ended but not yet processed
  const endedCampaigns = campaigns.filter(c =>
    c.status === 'active' && new Date(c.endDateTime) <= now
  );

  console.log('[checkAndProcessEndedCampaigns] Found ended campaigns:', endedCampaigns.length);
  endedCampaigns.forEach(c => {
    console.log('  -', c.name, 'ended at', c.endDateTime);
  });

  for (const campaign of endedCampaigns) {
    try {
      console.log(`[checkAndProcessEndedCampaigns] Processing campaign: ${campaign.name}`);
      await fetchCampaignResults(campaign.id);
      processedCampaigns.push(campaign);
      console.log(`[checkAndProcessEndedCampaigns] Successfully processed: ${campaign.name}`);
    } catch (error) {
      console.error(`[checkAndProcessEndedCampaigns] Failed to process campaign ${campaign.id}:`, error);
      // Still add to processed list but mark as failed
      processedCampaigns.push({ ...campaign, error: error.message });
    }
  }

  // Also check for scheduled campaigns that should now be active
  const scheduledCampaigns = campaigns.filter(c =>
    c.status === 'scheduled' && new Date(c.startDateTime) <= now
  );

  console.log('[checkAndProcessEndedCampaigns] Found scheduled campaigns to activate:', scheduledCampaigns.length);

  for (const campaign of scheduledCampaigns) {
    await updateCampaignStatus(campaign.id, 'active');
  }

  return processedCampaigns;
};

/**
 * Fetch campaign results from Kaito API and Twitter API
 * Uses two-step process: 1) Cache tweets in Supabase, 2) Scan for matches
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<void>}
 */
export const fetchCampaignResults = async (campaignId) => {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  console.log(`[Campaign ${campaign.name}] Starting processing...`);

  // Get excluded accounts
  const excludedAccounts = await getExcludedAccounts();
  const excludedHandles = excludedAccounts.map(a => normalizeHandle(a.handle));

  // Format dates for Kaito API (YYYY-MM-DD)
  const startDate = new Date(campaign.startDateTime).toISOString().split('T')[0];
  const endDate = new Date(campaign.endDateTime).toISOString().split('T')[0];

  // STEP 1: Fetch Kaito leaderboard data
  console.log(`[Campaign ${campaign.name}] Fetching Kaito leaderboard...`);
  const kaitoService = new KaitoService();
  const rawLeaderboardData = await kaitoService.getLeaderboardByDateRange(startDate, endDate);

  // Transform raw Kaito data to add handle field (Kaito uses 'username' field)
  const leaderboardData = rawLeaderboardData.map(creator => ({
    ...creator,
    handle: creator.username ? `@${creator.username}` : null,
    name: creator.displayname || creator.username || 'Unknown',
    tweetUrls: creator.tweet_urls || [] // Transform snake_case to camelCase
  }));

  console.log(`[Campaign ${campaign.name}] Transformed ${leaderboardData.length} creators from Kaito`);

  // Filter for top 115 creators only and exclude blocked accounts
  const eligibleCreators = leaderboardData
    .filter(creator => creator.rank <= 115)
    .filter(creator => creator.handle)
    .filter(creator => !excludedHandles.includes(normalizeHandle(creator.handle)));

  console.log(`[Campaign ${campaign.name}] Found ${eligibleCreators.length} eligible creators (after exclusions)`);

  // STEP 2: Collect all tweet IDs from Kaito
  const tweetIds = [];
  const tweetMetadata = {}; // Map tweet ID to creator info

  eligibleCreators.forEach(creator => {
    (creator.tweetUrls || []).forEach(tweetUrl => {
      const tweetId = extractTweetId(tweetUrl);
      if (tweetId) {
        tweetIds.push(tweetId);
        tweetMetadata[tweetId] = {
          creatorName: creator.name,
          creatorHandle: creator.handle,
          creatorUsername: creator.username,
          creatorRank: creator.rank,
          creatorUserId: creator.user_id,
          tweetUrl
        };
      }
    });
  });

  console.log(`[Campaign ${campaign.name}] Collected ${tweetIds.length} tweet IDs from Kaito`);

  if (tweetIds.length === 0) {
    console.log(`[Campaign ${campaign.name}] No tweets found, completing with 0 results`);
    await updateCampaignResults(campaignId, {
      fetchedAt: new Date().toISOString(),
      eligibleTweets: [],
      totalTweetsCached: 0
    });
    await updateCampaignStatus(campaignId, 'completed');
    return;
  }

  // STEP 3: Cache tweet URLs from Kaito FIRST (with placeholder data)
  console.log(`[Campaign ${campaign.name}] Caching tweet URLs from Kaito...`);
  const tweetsFromKaito = tweetIds.map(tweetId => {
    const metadata = tweetMetadata[tweetId];
    return {
      id: tweetId,
      campaign_id: campaignId,
      author_id: metadata?.creatorUserId || 'unknown',
      author_username: metadata?.creatorUsername || 'unknown',
      author_name: metadata?.creatorName || 'Unknown',
      text: 'Content pending Twitter API fetch', // Placeholder
      created_at: new Date().toISOString(),
      impressions: 0,
      retweets: 0,
      likes: 0,
      replies: 0,
      quotes: 0,
      bookmarks: 0,
      url: metadata?.tweetUrl || `https://twitter.com/i/status/${tweetId}`,
      fetched_at: new Date().toISOString()
    };
  });

  const { error: cacheError } = await supabase
    .from('campaign_tweets')
    .insert(tweetsFromKaito);

  if (cacheError) {
    console.error(`[Campaign ${campaign.name}] Error caching tweets:`, cacheError);
  } else {
    console.log(`[Campaign ${campaign.name}] ✓ Cached ${tweetsFromKaito.length} tweet URLs in Supabase`);
  }

  // STEP 4: Try to fetch tweet content from Twitter API (optional enhancement)
  let twitterTweets = [];
  let tweetContentFetched = false;

  try {
    console.log(`[Campaign ${campaign.name}] Attempting to fetch tweet content from Twitter API...`);
    twitterTweets = await batchFetchTweets(tweetIds);
    console.log(`[Campaign ${campaign.name}] ✓ Fetched ${twitterTweets.length} tweets from Twitter`);
    tweetContentFetched = true;

    // Update cached tweets with real content
    if (twitterTweets.length > 0) {
      console.log(`[Campaign ${campaign.name}] Updating cached tweets with real content...`);

      for (const tweet of twitterTweets) {
        const { error: updateError } = await supabase
          .from('campaign_tweets')
          .update({
            text: tweet.text,
            created_at: tweet.created_at,
            impressions: tweet.public_metrics?.impression_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            quotes: tweet.public_metrics?.quote_count || 0,
            bookmarks: tweet.public_metrics?.bookmark_count || 0,
            author_id: tweet.author_id
          })
          .eq('id', tweet.id)
          .eq('campaign_id', campaignId);

        if (updateError) {
          console.error(`[Campaign ${campaign.name}] Error updating tweet ${tweet.id}:`, updateError);
        }
      }

      console.log(`[Campaign ${campaign.name}] ✓ Updated ${twitterTweets.length} tweets with real content`);
    }
  } catch (error) {
    console.warn(`[Campaign ${campaign.name}] ⚠️ Twitter API failed (${error.message}). Continuing with cached URLs for manual verification.`);
    tweetContentFetched = false;
  }

  // STEP 5: Prepare results based on what we have
  const allCachedTweets = tweetIds.map(tweetId => {
    const metadata = tweetMetadata[tweetId];
    const twitterTweet = twitterTweets.find(t => t.id === tweetId);

    const impressions = twitterTweet?.public_metrics?.impression_count || 0;
    const retweets = twitterTweet?.public_metrics?.retweet_count || 0;
    const likes = twitterTweet?.public_metrics?.like_count || 0;
    const replies = twitterTweet?.public_metrics?.reply_count || 0;
    const quotes = twitterTweet?.public_metrics?.quote_count || 0;
    const bookmarks = twitterTweet?.public_metrics?.bookmark_count || 0;

    // Calculate engagement rate
    const totalEngagement = retweets + likes + replies + quotes + bookmarks;
    const engagementRate = impressions > 0 ? ((totalEngagement / impressions) * 100).toFixed(2) + '%' : '0%';

    return {
      tweetId,
      tweetUrl: metadata?.tweetUrl || `https://twitter.com/i/status/${tweetId}`,
      tweetText: twitterTweet?.text || 'Manual verification required',
      matchedPhrase: twitterTweet ? findMatchingPhrase(twitterTweet.text, campaign.keyPhrases) : null,
      creatorName: metadata?.creatorName || 'Unknown',
      creatorHandle: metadata?.creatorHandle || '@unknown',
      creatorRank: metadata?.creatorRank || 0,
      creatorUserId: metadata?.creatorUserId || '',
      totalImpressions: impressions,
      totalRetweets: retweets,
      totalLikes: likes,
      totalReplies: replies,
      totalQuotes: quotes,
      totalBookmarks: bookmarks,
      engagementRate,
      createdAt: twitterTweet?.created_at || new Date().toISOString(),
      requiresManualVerification: !tweetContentFetched
    };
  });

  // Filter for matches only if we have tweet content
  const eligibleTweets = tweetContentFetched
    ? allCachedTweets.filter(tweet => tweet.matchedPhrase)
    : allCachedTweets; // Return all for manual verification if no content

  console.log(`[Campaign ${campaign.name}] ${eligibleTweets.length} tweets ready for review`);

  // STEP 6: Save results
  const results = {
    fetchedAt: new Date().toISOString(),
    eligibleTweets,
    totalTweetsCached: tweetIds.length,
    twitterApiSuccess: tweetContentFetched,
    twitterApiUsed: tweetContentFetched, // For UI compatibility
    note: tweetContentFetched
      ? `Found ${eligibleTweets.length} matching tweets`
      : 'Twitter API unavailable. All tweets require manual verification for key phrases.'
  };

  await updateCampaignResults(campaignId, results);
  await updateCampaignStatus(campaignId, 'completed');

  console.log(`[Campaign ${campaign.name}] ✓ Processing complete: ${eligibleTweets.length} tweets saved (${tweetIds.length} cached in Supabase)`);
};

export default {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  updateCampaignResults,
  deleteCampaign,
  cancelCampaign,
  getExcludedAccounts,
  addExcludedAccount,
  removeExcludedAccount,
  getCampaignsByStatus,
  getStatusDisplay,
  checkAndProcessEndedCampaigns,
  fetchCampaignResults,
  normalizeHandle
};
