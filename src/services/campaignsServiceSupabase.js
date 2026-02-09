/**
 * Campaigns Service - Supabase Version
 * Manages campaigns using Supabase database
 * Replaces localStorage 'requests' array
 */

import { supabase } from '../lib/supabaseClient';

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
      .from('campaigns')
      .select(`
        *,
        campaign_creators (
          creator:creators (
            id,
            name,
            handle,
            cost_per_post,
            platforms
          )
        ),
        posts (
          id,
          description,
          link,
          impressions,
          cost,
          date,
          platform,
          creator_id,
          creator:creators (
            id,
            name,
            handle
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform database format to app format
    return (data || []).map(transformFromDB);
  } catch (error) {
    console.error('Error loading campaigns:', error);
    return [];
  }
};

// Legacy alias for backwards compatibility
export const getRequests = getCampaigns;

/**
 * Get campaign by ID
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<object|null>} Campaign object or null if not found
 */
export const getCampaignById = async (campaignId) => {
  if (!supabase) return null;

  try {
    const { data, error} = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_creators (
          creator:creators (
            id,
            name,
            handle,
            cost_per_post,
            platforms
          )
        ),
        posts (
          id,
          description,
          link,
          impressions,
          cost,
          date,
          platform,
          creator_id,
          creator:creators (
            id,
            name,
            handle
          )
        )
      `)
      .eq('id', campaignId)
      .single();

    if (error) throw error;
    return data ? transformFromDB(data) : null;
  } catch (error) {
    console.error('Error loading content campaign:', error);
    return null;
  }
};

/**
 * Transform database row to app format
 * @param {object} row - Database row
 * @returns {object} App-formatted campaign
 */
const transformFromDB = (row) => {
  // Calculate actual metrics from posts
  const posts = row.posts || [];
  const actualImpressions = posts.reduce((sum, post) => {
    const impressions = Number(post.impressions) || 0;
    return sum + impressions;
  }, 0);
  const actualCost = posts.reduce((sum, post) => {
    const cost = Number(post.cost) || 0;
    return sum + cost;
  }, 0);

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    brief: row.brief || '',
    mediaUrls: row.media_urls || [],
    briefSentAt: row.brief_sent_at || null,
    status: row.status,
    estimatedCost: Number(row.estimated_cost) || 0,
    estimatedImpressions: Number(row.estimated_impressions) || 0,
    actualCost: actualCost,
    actualImpressions: actualImpressions,
    startDate: row.start_date || null,
    createdAt: row.created_at,
    posts: posts.map(post => ({
      id: post.id,
      description: post.description || '',
      link: post.link || '',
      impressions: Number(post.impressions) || 0,
      cost: Number(post.cost) || 0,
      platform: post.platform || '',
      date: post.date,
      creatorId: post.creator_id,
      creatorName: post.creator?.name || null,
      creatorHandle: post.creator?.handle || null
    })),
    creators: (row.campaign_creators || [])
      .filter(crc => crc.creator) // Filter out any null/undefined creators
      .map(crc => ({
        id: crc.creator.id,
        name: crc.creator.name,
        handle: crc.creator.handle,
        costPerPost: crc.creator.cost_per_post || '',
        platforms: crc.creator.platforms || []
      }))
  };
};

/**
 * Transform app format to database format
 * @param {object} campaign - App-formatted campaign
 * @returns {object} Database row format
 */
const transformToDB = (campaign) => {
  const row = {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description || '',
    status: campaign.status,
    estimated_cost: Number(campaign.estimatedCost) || 0,
    estimated_impressions: Number(campaign.estimatedImpressions) || 0,
  };

  // Only include optional fields if they are explicitly provided
  if (campaign.startDate !== undefined) row.start_date = campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : null;
  if (campaign.brief !== undefined) row.brief = campaign.brief;
  if (campaign.mediaUrls !== undefined) row.media_urls = campaign.mediaUrls;
  if (campaign.briefSentAt !== undefined) row.brief_sent_at = campaign.briefSentAt;

  return row;
};

/**
 * Create a new content campaign
 * @param {object} campaignData - Campaign data
 * @returns {Promise<object>} Created campaign object
 */
export const createCampaign = async (campaignData) => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const newCampaign = {
    id: Date.now(), // Timestamp-based ID
    title: campaignData.title,
    description: campaignData.description || '',
    brief: campaignData.brief,
    status: campaignData.status || 'pending',
    startDate: campaignData.startDate || null,
    estimatedCost: campaignData.estimatedCost || 0,
    estimatedImpressions: campaignData.estimatedImpressions || 0,
    creators: campaignData.creators || []
  };

  try {
    // Insert campaign
    const { data, error } = await supabase
      .from('campaigns')
      .insert([transformToDB(newCampaign)])
      .select()
      .single();

    if (error) throw error;

    // Insert creator associations
    if (newCampaign.creators.length > 0) {
      const associations = newCampaign.creators.map(creator => ({
        campaign_id: data.id,
        creator_id: typeof creator === 'object' ? creator.id : creator
      }));

      const { error: assocError } = await supabase
        .from('campaign_creators')
        .insert(associations);

      if (assocError) throw assocError;
    }

    // Fetch complete campaign with creators
    return getCampaignById(data.id);
  } catch (error) {
    console.error('Error creating content campaign:', error);
    throw new Error('Failed to create content campaign');
  }
};

/**
 * Update content campaign
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

    // Update campaign
    const { creators, ...campaignData } = updated;
    const { error } = await supabase
      .from('campaigns')
      .update(transformToDB(campaignData))
      .eq('id', campaignId);

    if (error) throw error;

    // Update creator associations if provided
    if (updates.creators !== undefined) {
      // Delete existing associations
      await supabase
        .from('campaign_creators')
        .delete()
        .eq('campaign_id', campaignId);

      // Insert new associations
      if (updates.creators.length > 0) {
        const associations = updates.creators.map(creator => ({
          campaign_id: campaignId,
          creator_id: typeof creator === 'object' ? creator.id : creator
        }));

        const { error: assocError } = await supabase
          .from('campaign_creators')
          .insert(associations);

        if (assocError) throw assocError;
      }
    }

    // Fetch complete campaign with creators
    return getCampaignById(campaignId);
  } catch (error) {
    console.error('Error updating content campaign:', error);
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
 * Delete content campaign
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteCampaign = async (campaignId) => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting content campaign:', error);
    return false;
  }
};

// ============================================================================
// REQUEST FILTERING
// ============================================================================

/**
 * Get campaigns filtered by status
 * @param {string} status - Status to filter by
 * @returns {Promise<Array>} Filtered campaigns
 */
export const getCampaignsByStatus = async (status) => {
  const campaigns = await getRequests();
  return campaigns.filter(r => r.status === status);
};

/**
 * Get campaigns by creator
 * @param {number} creatorId - Creator ID
 * @returns {Promise<Array>} Requests assigned to creator
 */
export const getCampaignsByCreator = async (creatorId) => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_creators!inner (
          creator:creators (
            id,
            name,
            handle
          )
        )
      `)
      .eq('campaign_creators.creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformFromDB);
  } catch (error) {
    console.error('Error loading campaigns by creator:', error);
    return [];
  }
};

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Calculate total metrics across all campaigns
 * @param {string|null} status - Optional status filter
 * @returns {Promise<object>} Aggregated metrics
 */
export const getCampaignMetrics = async (status = null) => {
  const campaigns = status
    ? await getCampaignsByStatus(status)
    : await getRequests();

  return {
    totalRequests: campaigns.length,
    totalCost: campaigns.reduce((sum, r) => sum + Number(r.estimatedCost || 0), 0),
    totalImpressions: campaigns.reduce((sum, r) => sum + Number(r.estimatedImpressions || 0), 0),
    byStatus: {
      pending: campaigns.filter(r => r.status === 'pending').length,
      'in-progress': campaigns.filter(r => r.status === 'in-progress').length,
      completed: campaigns.filter(r => r.status === 'completed').length,
      cancelled: campaigns.filter(r => r.status === 'cancelled').length
    }
  };
};

/**
 * Get posts linked to a content campaign
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<Array>} Posts for this campaign
 */
export const getCampaignPosts = async (campaignId) => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:creators (
          id,
          name,
          handle
        )
      `)
      .eq('campaign_id', campaignId);

    if (error) throw error;

    return (data || []).map(post => ({
      id: post.id,
      creatorId: post.creator_id,
      creatorName: post.creator?.name,
      creatorHandle: post.creator?.handle,
      description: post.description,
      platform: post.platform,
      date: post.date,
      cost: Number(post.cost) || 0,
      link: post.link,
      impressions: Number(post.impressions) || 0,
      likes: Number(post.likes) || 0,
      comments: Number(post.comments) || 0,
      retweets: Number(post.retweets) || 0,
      quotes: Number(post.quotes) || 0,
      bookmarks: Number(post.bookmarks) || 0
    }));
  } catch (error) {
    console.error('Error loading campaign posts:', error);
    return [];
  }
};

/**
 * Get campaign analytics from materialized view
 * Fetches pre-calculated metrics including CPM, engagement rate, confidence, etc.
 * @returns {Promise<Array>} Array of campaign analytics objects
 */
export const getCampaignAnalytics = async () => {
  if (!supabase) {
    console.error('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('campaign_analytics')
      .select('*')
      .order('campaign_id', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      campaignId: row.campaign_id,
      campaignTitle: row.campaign_title,
      status: row.status,
      estimatedCost: Number(row.estimated_cost) || 0,
      estimatedImpressions: Number(row.estimated_impressions) || 0,
      actualCost: Number(row.actual_cost) || 0,
      actualImpressions: Number(row.actual_impressions) || 0,
      postCount: Number(row.post_count) || 0,
      totalLikes: Number(row.total_likes) || 0,
      totalComments: Number(row.total_comments) || 0,
      totalRetweets: Number(row.total_retweets) || 0,
      totalQuotes: Number(row.total_quotes) || 0,
      totalBookmarks: Number(row.total_bookmarks) || 0,
      totalEngagements: Number(row.total_engagements) || 0,
      avgCpm: Number(row.avg_cpm) || 0,
      engagementRate: Number(row.engagement_rate) || 0,
      costPerEngagement: Number(row.cost_per_engagement) || 0,
      confidence: Number(row.confidence) || 0,
      costVariance: Number(row.cost_variance) || 0,
      impressionsVariance: Number(row.impressions_variance) || 0,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Error loading campaign analytics:', error);
    return [];
  }
};

/**
 * Refresh the campaign_analytics materialized view
 * Triggers a refresh to update all calculated metrics
 * @returns {Promise<boolean>} True if refresh succeeded
 */
export const refreshCampaignAnalytics = async () => {
  if (!supabase) {
    console.error('Supabase not configured');
    return false;
  }

  try {
    // Execute refresh via RPC call
    const { error } = await supabase.rpc('refresh_campaign_analytics');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error refreshing campaign analytics:', error);
    return false;
  }
};

// ============================================================================
// CAMPAIGN MEDIA (Supabase Storage)
// ============================================================================

/**
 * Upload a file to Supabase Storage for a campaign
 * @param {number} campaignId - Campaign ID
 * @param {File} file - File to upload
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export const uploadCampaignMedia = async (campaignId, file) => {
  if (!supabase) throw new Error('Supabase not configured');

  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `${campaignId}/${fileName}`;

  const { error } = await supabase.storage
    .from('campaign-media')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('campaign-media')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

/**
 * Delete a media file from Supabase Storage
 * @param {string} publicUrl - The public URL to delete
 * @returns {Promise<boolean>}
 */
export const deleteCampaignMedia = async (publicUrl) => {
  if (!supabase) return false;

  // Extract the file path from the public URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/campaign-media/<path>
  const match = publicUrl.match(/campaign-media\/(.+)$/);
  if (!match) return false;

  const filePath = match[1];
  const { error } = await supabase.storage
    .from('campaign-media')
    .remove([filePath]);

  return !error;
};

// ============================================================================
// BULK IMPORT/EXPORT
// ============================================================================

/**
 * Bulk import campaigns (for localStorage migration)
 * @param {Array} campaigns - Array of campaign objects
 * @returns {Promise<number>} Number of campaigns imported
 */
export const bulkImportCampaigns = async (campaigns) => {
  if (!supabase) return 0;

  let count = 0;

  for (const campaign of campaigns) {
    try {
      // Check if campaign already exists
      const existing = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaign.id)
        .single();

      if (existing.data) {
        // Update existing
        await updateCampaign(campaign.id, campaign);
      } else {
        // Create new
        await createCampaign(campaign);
      }
      count++;
    } catch (error) {
      console.error(`Error importing campaign ${campaign.title}:`, error);
    }
  }

  return count;
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  getRequests,
  getCampaignById,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  deleteCampaign,
  getCampaignsByStatus,
  getCampaignsByCreator,
  getCampaignMetrics,
  getCampaignPosts,
  getCampaignAnalytics,
  refreshCampaignAnalytics,
  bulkImportCampaigns,
  uploadCampaignMedia,
  deleteCampaignMedia
};
