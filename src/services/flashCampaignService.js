import { KaitoService } from './kaitoService';

// localStorage keys
const CAMPAIGNS_KEY = 'flashCampaigns';
const EXCLUSIONS_KEY = 'excludedAccounts';

// ============================================================================
// CAMPAIGN CRUD OPERATIONS
// ============================================================================

/**
 * Get all campaigns from localStorage
 * @returns {Array} Array of campaign objects
 */
export const getCampaigns = () => {
  try {
    const campaigns = localStorage.getItem(CAMPAIGNS_KEY);
    return campaigns ? JSON.parse(campaigns) : [];
  } catch (error) {
    console.error('Error loading campaigns:', error);
    return [];
  }
};

/**
 * Get campaign by ID
 * @param {number} campaignId - Campaign ID
 * @returns {object|null} Campaign object or null if not found
 */
export const getCampaignById = (campaignId) => {
  const campaigns = getCampaigns();
  return campaigns.find(c => c.id === campaignId) || null;
};

/**
 * Save campaigns to localStorage
 * @param {Array} campaigns - Array of campaign objects
 */
const saveCampaigns = (campaigns) => {
  try {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  } catch (error) {
    console.error('Error saving campaigns:', error);
    throw new Error('Failed to save campaigns');
  }
};

/**
 * Create a new campaign
 * @param {object} campaignData - Campaign data
 * @returns {object} Created campaign object
 */
export const createCampaign = (campaignData) => {
  const campaigns = getCampaigns();

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

  campaigns.push(newCampaign);
  saveCampaigns(campaigns);

  return newCampaign;
};

/**
 * Update campaign
 * @param {number} campaignId - Campaign ID
 * @param {object} updates - Fields to update
 * @returns {object|null} Updated campaign or null if not found
 */
export const updateCampaign = (campaignId, updates) => {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === campaignId);

  if (index === -1) {
    return null;
  }

  campaigns[index] = { ...campaigns[index], ...updates };
  saveCampaigns(campaigns);

  return campaigns[index];
};

/**
 * Update campaign status
 * @param {number} campaignId - Campaign ID
 * @param {string} status - New status
 */
export const updateCampaignStatus = (campaignId, status) => {
  return updateCampaign(campaignId, { status });
};

/**
 * Update campaign results
 * @param {number} campaignId - Campaign ID
 * @param {object} results - Results data
 */
export const updateCampaignResults = (campaignId, results) => {
  return updateCampaign(campaignId, { results });
};

/**
 * Delete campaign
 * @param {number} campaignId - Campaign ID
 * @returns {boolean} True if deleted, false if not found
 */
export const deleteCampaign = (campaignId) => {
  const campaigns = getCampaigns();
  const filtered = campaigns.filter(c => c.id !== campaignId);

  if (filtered.length === campaigns.length) {
    return false; // Campaign not found
  }

  saveCampaigns(filtered);
  return true;
};

/**
 * Cancel campaign
 * @param {number} campaignId - Campaign ID
 */
export const cancelCampaign = (campaignId) => {
  return updateCampaignStatus(campaignId, 'cancelled');
};

// ============================================================================
// EXCLUSION LIST MANAGEMENT
// ============================================================================

/**
 * Get all excluded accounts
 * @returns {Array} Array of excluded account objects
 */
export const getExcludedAccounts = () => {
  try {
    const exclusions = localStorage.getItem(EXCLUSIONS_KEY);
    return exclusions ? JSON.parse(exclusions) : [];
  } catch (error) {
    console.error('Error loading excluded accounts:', error);
    return [];
  }
};

/**
 * Save excluded accounts to localStorage
 * @param {Array} exclusions - Array of exclusion objects
 */
const saveExcludedAccounts = (exclusions) => {
  try {
    localStorage.setItem(EXCLUSIONS_KEY, JSON.stringify(exclusions));
  } catch (error) {
    console.error('Error saving excluded accounts:', error);
    throw new Error('Failed to save excluded accounts');
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
 * @returns {object} Created exclusion object
 */
export const addExcludedAccount = (handle, reason = '') => {
  const exclusions = getExcludedAccounts();

  // Check if already exists
  const normalized = normalizeHandle(handle);
  if (exclusions.some(e => normalizeHandle(e.handle) === normalized)) {
    throw new Error('This account is already excluded');
  }

  const newExclusion = {
    id: Date.now(),
    handle: normalized,
    reason,
    addedAt: new Date().toISOString()
  };

  exclusions.push(newExclusion);
  saveExcludedAccounts(exclusions);

  return newExclusion;
};

/**
 * Remove excluded account
 * @param {number} exclusionId - Exclusion ID
 * @returns {boolean} True if removed, false if not found
 */
export const removeExcludedAccount = (exclusionId) => {
  const exclusions = getExcludedAccounts();
  const filtered = exclusions.filter(e => e.id !== exclusionId);

  if (filtered.length === exclusions.length) {
    return false; // Not found
  }

  saveExcludedAccounts(filtered);
  return true;
};

/**
 * Check if a creator handle is excluded
 * @param {string} creatorHandle - Creator's Twitter handle
 * @returns {boolean} True if excluded
 */
export const isCreatorExcluded = (creatorHandle) => {
  const exclusions = getExcludedAccounts();
  const normalized = normalizeHandle(creatorHandle);
  return exclusions.some(e => normalizeHandle(e.handle) === normalized);
};

// ============================================================================
// CAMPAIGN RESULTS FETCHING
// ============================================================================

/**
 * Format date for Kaito API (YYYY-MM-DD)
 * @param {string|Date} dateTime - DateTime string or Date object
 * @returns {string} Formatted date
 */
const formatDateForAPI = (dateTime) => {
  const date = new Date(dateTime);
  return date.toISOString().split('T')[0];
};

/**
 * Fetch campaign results from Kaito API
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<object>} Updated campaign with results
 */
export const fetchCampaignResults = async (campaignId) => {
  const campaign = getCampaignById(campaignId);

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  try {
    // Format dates for Kaito API
    const startDate = formatDateForAPI(campaign.startDateTime);
    const endDate = formatDateForAPI(campaign.endDateTime);

    // Fetch leaderboard data from Kaito
    const kaitoService = new KaitoService();
    const leaderboardData = await kaitoService.getLeaderboard(startDate, endDate);

    // Get excluded handles
    const excludedHandles = getExcludedAccounts().map(a => normalizeHandle(a.handle));

    // Filter for top 100 creators only and exclude blocked accounts
    const eligibleCreators = leaderboardData
      .filter(creator => creator.rank <= 100)
      .filter(creator => !excludedHandles.includes(normalizeHandle(creator.handle)));

    // Collect all tweet URLs with creator info and metrics
    const eligibleTweets = [];

    eligibleCreators.forEach(creator => {
      const tweetUrls = creator.tweetUrls || [];

      tweetUrls.forEach(tweetUrl => {
        eligibleTweets.push({
          tweetUrl,
          creatorName: creator.name,
          creatorHandle: creator.handle,
          creatorRank: creator.rank,
          creatorUserId: creator.userId,
          // Aggregate metrics (per creator, not per tweet)
          totalImpressions: creator.impressions || 0,
          totalLikes: creator.totalLikes || 0,
          totalRetweets: creator.totalRetweets || 0,
          totalQuotes: creator.totalQuotes || 0,
          totalBookmarks: creator.totalBookmarks || 0,
          engagementRate: creator.engagement || '0%',
          matchedPhrase: 'N/A' // Manual verification required (no tweet content available)
        });
      });
    });

    // Save results to campaign
    const results = {
      fetchedAt: new Date().toISOString(),
      eligibleTweets
    };

    updateCampaignResults(campaignId, results);
    updateCampaignStatus(campaignId, 'completed');

    return getCampaignById(campaignId);
  } catch (error) {
    console.error('Error fetching campaign results:', error);
    throw error;
  }
};

/**
 * Check for ended campaigns and fetch results
 * @returns {Promise<Array>} Array of campaigns that were processed
 */
export const checkAndProcessEndedCampaigns = async () => {
  const campaigns = getCampaigns();
  const now = new Date();

  // Find campaigns that have ended but haven't been processed
  const endedCampaigns = campaigns.filter(c => {
    const endTime = new Date(c.endDateTime);
    return c.status === 'active' && endTime <= now;
  });

  // Also check for scheduled campaigns that should now be active
  const scheduledCampaigns = campaigns.filter(c => {
    const startTime = new Date(c.startDateTime);
    return c.status === 'scheduled' && startTime <= now;
  });

  // Update scheduled campaigns to active
  for (const campaign of scheduledCampaigns) {
    updateCampaignStatus(campaign.id, 'active');
  }

  // Process ended campaigns
  const processed = [];
  for (const campaign of endedCampaigns) {
    try {
      await fetchCampaignResults(campaign.id);
      processed.push(campaign);
    } catch (error) {
      console.error(`Failed to fetch results for campaign ${campaign.id}:`, error);
    }
  }

  return processed;
};

// ============================================================================
// STATUS HELPERS
// ============================================================================

/**
 * Get campaigns grouped by status
 * @returns {object} Object with campaigns grouped by status
 */
export const getCampaignsByStatus = () => {
  const campaigns = getCampaigns();

  return {
    active: campaigns.filter(c => c.status === 'active'),
    scheduled: campaigns.filter(c => c.status === 'scheduled'),
    completed: campaigns.filter(c => c.status === 'completed'),
    cancelled: campaigns.filter(c => c.status === 'cancelled')
  };
};

/**
 * Get campaign status label with color
 * @param {string} status - Campaign status
 * @returns {object} Object with label and color class
 */
export const getStatusDisplay = (status) => {
  const displays = {
    scheduled: { label: 'Scheduled', colorClass: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
    active: { label: 'Active', colorClass: 'text-green-400 bg-green-400/10 border-green-400/30' },
    completed: { label: 'Completed', colorClass: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
    cancelled: { label: 'Cancelled', colorClass: 'text-gray-400 bg-gray-400/10 border-gray-400/30' }
  };

  return displays[status] || { label: status, colorClass: 'text-gray-400' };
};
