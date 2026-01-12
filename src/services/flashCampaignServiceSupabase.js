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

  // Find campaigns that have ended but not yet processed
  const endedCampaigns = campaigns.filter(c =>
    c.status === 'active' && new Date(c.endDateTime) <= now
  );

  for (const campaign of endedCampaigns) {
    try {
      await fetchCampaignResults(campaign.id);
      processedCampaigns.push(campaign.name);
    } catch (error) {
      console.error(`Failed to process campaign ${campaign.id}:`, error);
    }
  }

  // Also check for scheduled campaigns that should now be active
  const scheduledCampaigns = campaigns.filter(c =>
    c.status === 'scheduled' && new Date(c.startDateTime) <= now
  );

  for (const campaign of scheduledCampaigns) {
    await updateCampaignStatus(campaign.id, 'active');
  }

  return processedCampaigns;
};

/**
 * Fetch campaign results from Kaito API and Twitter API
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<void>}
 */
export const fetchCampaignResults = async (campaignId) => {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  console.log(`Fetching results for campaign: ${campaign.name}`);

  // Get excluded accounts
  const excludedAccounts = await getExcludedAccounts();
  const excludedHandles = excludedAccounts.map(a => normalizeHandle(a.handle));

  // Format dates for Kaito API (YYYY-MM-DD)
  const startDate = new Date(campaign.startDateTime).toISOString().split('T')[0];
  const endDate = new Date(campaign.endDateTime).toISOString().split('T')[0];

  // Fetch Kaito leaderboard data
  const kaitoService = new KaitoService();
  const leaderboardData = await kaitoService.getLeaderboard(startDate, endDate);

  // Filter for top 115 creators only and exclude blocked accounts
  const eligibleCreators = leaderboardData
    .filter(creator => creator.rank <= 115)
    .filter(creator => !excludedHandles.includes(normalizeHandle(creator.handle)));

  console.log(`Found ${eligibleCreators.length} eligible creators (top 115, excluding blocked accounts)`);

  // Collect all tweet URLs and metadata
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

  console.log(`Collected ${tweetIds.length} tweet URLs from eligible creators`);

  // Attempt to fetch tweet content from Twitter API and match phrases
  let tweetsWithContent = [];
  let twitterApiUsed = false;

  if (tweetIds.length > 0) {
    try {
      console.log('Fetching tweet content from Twitter API...');
      const twitterTweets = await batchFetchTweets(tweetIds);
      twitterApiUsed = true;

      // Create a map of tweet ID → tweet text
      const tweetTextMap = {};
      twitterTweets.forEach(tweet => {
        tweetTextMap[tweet.id] = tweet.text;
      });

      // Match tweets against key phrases
      allTweetData.forEach(tweetData => {
        const tweetText = tweetTextMap[tweetData.tweetId];
        if (tweetText) {
          const matchedPhrase = findMatchingPhrase(tweetText, campaign.keyPhrases);
          if (matchedPhrase) {
            tweetsWithContent.push({
              ...tweetData,
              matchedPhrase,
              tweetText: tweetText.substring(0, 200) // Store first 200 chars as preview
            });
          }
        }
      });

      console.log(`Found ${tweetsWithContent.length} tweets matching key phrases`);
    } catch (twitterError) {
      console.error('Twitter API error:', twitterError);
      console.log('Falling back to manual verification mode');
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

  await updateCampaignResults(campaignId, results);
  await updateCampaignStatus(campaignId, 'completed');

  console.log(`✓ Campaign results saved: ${tweetsWithContent.length} eligible tweets`);
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
