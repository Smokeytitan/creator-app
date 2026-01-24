/**
 * Creators Service - Supabase Version
 * Manages creators (roster) using Supabase database
 * Replaces localStorage 'creators' array
 */

import { supabase } from '../lib/supabaseClient';

// ============================================================================
// CREATOR CRUD OPERATIONS
// ============================================================================

/**
 * Get all creators from Supabase
 * @returns {Promise<Array>} Array of creator objects
 */
export const getCreators = async () => {
  if (!supabase) {
    console.error('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('creators')
      .select(`
        *,
        posts (*)
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    // Transform database format to app format
    return (data || []).map(transformFromDB);
  } catch (error) {
    console.error('Error loading creators:', error);
    return [];
  }
};

/**
 * Get creator by ID
 * @param {number} creatorId - Creator ID
 * @returns {Promise<object|null>} Creator object or null if not found
 */
export const getCreatorById = async (creatorId) => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('creators')
      .select(`
        *,
        posts (*)
      `)
      .eq('id', creatorId)
      .single();

    if (error) throw error;
    return data ? transformFromDB(data) : null;
  } catch (error) {
    console.error('Error loading creator:', error);
    return null;
  }
};

/**
 * Transform database row to app format
 * @param {object} row - Database row
 * @returns {object} App-formatted creator
 */
const transformFromDB = (row) => ({
  id: row.id,
  name: row.name,
  handle: row.handle,
  notes: row.notes || '',
  costPerPost: row.cost_per_post || '',
  pricingPackages: row.pricing_packages || [],
  platforms: row.platforms || [],
  active: row.active !== false,
  contractFilePath: row.contract_file_path || null,
  contractUploadedAt: row.contract_uploaded_at || null,
  contractParsedData: row.contract_parsed_data || null,
  posts: (row.posts || []).map(post => ({
    id: post.id,
    campaign_id: post.campaign_id || null,
    description: post.description || '',
    platform: post.platform || 'X',
    date: post.date || '',
    cost: post.cost || '',
    link: post.link || '',
    impressions: post.impressions || '',
    likes: post.likes || '',
    comments: post.comments || '',
    retweets: post.retweets || '',
    quotes: post.quotes || '',
    bookmarks: post.bookmarks || '',
    tweetId: post.tweet_id || null,
    lastScanned: post.last_scanned || null,
    needsRescan: post.needs_rescan || false
  }))
});

/**
 * Transform app format to database format
 * @param {object} creator - App-formatted creator
 * @returns {object} Database row format
 */
const transformToDB = (creator) => ({
  id: creator.id,
  name: creator.name,
  handle: creator.handle,
  notes: creator.notes || '',
  cost_per_post: creator.costPerPost || '',
  pricing_packages: creator.pricingPackages || [],
  platforms: creator.platforms || [],
  active: creator.active !== false,
  contract_file_path: creator.contractFilePath || null,
  contract_uploaded_at: creator.contractUploadedAt || null,
  contract_parsed_data: creator.contractParsedData || null
});

/**
 * Create a new creator
 * @param {object} creatorData - Creator data
 * @returns {Promise<object>} Created creator object
 */
export const createCreator = async (creatorData) => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const newCreator = {
    id: Date.now(), // Timestamp-based ID
    name: creatorData.name,
    handle: creatorData.handle,
    notes: creatorData.notes || '',
    costPerPost: creatorData.costPerPost || '',
    platforms: creatorData.platforms || [],
    active: creatorData.active !== false,
    posts: []
  };

  try {
    const { data, error } = await supabase
      .from('creators')
      .insert([transformToDB(newCreator)])
      .select()
      .single();

    if (error) throw error;
    return transformFromDB({ ...data, posts: [] });
  } catch (error) {
    console.error('Error creating creator:', error);
    throw new Error('Failed to create creator');
  }
};

/**
 * Update creator
 * @param {number} creatorId - Creator ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated creator or null if not found
 */
export const updateCreator = async (creatorId, updates) => {
  if (!supabase) return null;

  try {
    // Get current creator
    const current = await getCreatorById(creatorId);
    if (!current) return null;

    // Merge updates
    const updated = { ...current, ...updates };

    // Save to database (don't include posts in update)
    const { posts, ...creatorData } = updated;
    const { data, error } = await supabase
      .from('creators')
      .update(transformToDB(creatorData))
      .eq('id', creatorId)
      .select()
      .single();

    if (error) throw error;

    // Fetch complete creator with posts
    return getCreatorById(creatorId);
  } catch (error) {
    console.error('Error updating creator:', error);
    return null;
  }
};

/**
 * Delete creator
 * @param {number} creatorId - Creator ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteCreator = async (creatorId) => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('creators')
      .delete()
      .eq('id', creatorId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting creator:', error);
    return false;
  }
};

/**
 * Toggle creator active status
 * @param {number} creatorId - Creator ID
 * @returns {Promise<object|null>} Updated creator
 */
export const toggleCreatorActive = async (creatorId) => {
  const creator = await getCreatorById(creatorId);
  if (!creator) return null;

  return updateCreator(creatorId, { active: !creator.active });
};

// ============================================================================
// POSTS OPERATIONS
// ============================================================================

/**
 * Add post to creator
 * @param {number} creatorId - Creator ID
 * @param {object} postData - Post data
 * @param {number|null} requestId - Optional content request ID
 * @returns {Promise<object|null>} Updated creator with new post
 */
export const addPost = async (creatorId, postData, requestId = null) => {
  if (!supabase) return null;

  const newPost = {
    id: Date.now() + Math.random(),
    creator_id: creatorId,
    campaign_id: requestId,
    description: postData.description || '',
    platform: postData.platform || 'X',
    date: postData.date || null,
    cost: postData.cost || '',
    link: postData.link || '',
    impressions: postData.impressions || '',
    likes: postData.likes || '',
    comments: postData.comments || '',
    retweets: postData.retweets || '',
    quotes: postData.quotes || '',
    bookmarks: postData.bookmarks || '',
    tweet_id: postData.tweetId || null,
    last_scanned: postData.lastScanned || null,
    needs_rescan: false
  };

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([newPost])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Post data that failed:', newPost);
      throw error;
    }

    console.log('Successfully inserted post:', data);

    // Return updated creator
    return getCreatorById(creatorId);
  } catch (error) {
    console.error('Error adding post:', error);
    console.error('Failed post data:', newPost);
    return null;
  }
};

/**
 * Update post
 * @param {number} postId - Post ID
 * @param {object} updates - Fields to update
 * @returns {Promise<boolean>} True if updated successfully
 */
export const updatePost = async (postId, updates) => {
  if (!supabase) return false;

  try {
    const dbUpdates = {
      description: updates.description,
      platform: updates.platform,
      date: updates.date,
      cost: updates.cost,
      link: updates.link,
      impressions: updates.impressions,
      likes: updates.likes,
      comments: updates.comments,
      retweets: updates.retweets,
      quotes: updates.quotes,
      bookmarks: updates.bookmarks,
      tweet_id: updates.tweetId,
      last_scanned: updates.lastScanned,
      needs_rescan: updates.needsRescan
    };

    // Remove undefined values
    Object.keys(dbUpdates).forEach(key =>
      dbUpdates[key] === undefined && delete dbUpdates[key]
    );

    const { error } = await supabase
      .from('posts')
      .update(dbUpdates)
      .eq('id', postId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating post:', error);
    return false;
  }
};

/**
 * Delete post
 * @param {number} postId - Post ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
export const deletePost = async (postId) => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
};

/**
 * Get posts that need rescanning (for background tweet scanner)
 * @returns {Promise<Array>} Posts that are 48+ hours old and need 24-hour rescan
 */
export const getPostsNeedingRescan = async () => {
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
      .eq('platform', 'X')
      .eq('needs_rescan', true)
      .not('tweet_id', 'is', null);

    if (error) throw error;

    return (data || []).map(post => ({
      postId: post.id,
      creatorId: post.creator_id,
      creatorName: post.creator?.name,
      creatorHandle: post.creator?.handle,
      tweetId: post.tweet_id,
      link: post.link,
      date: post.date,
      lastScanned: post.last_scanned
    }));
  } catch (error) {
    console.error('Error fetching posts needing rescan:', error);
    return [];
  }
};

/**
 * Batch update post metrics from Twitter API
 * @param {Array} updates - Array of {postId, metrics, lastScanned}
 * @returns {Promise<boolean>} True if all updates succeeded
 */
export const batchUpdatePostMetrics = async (updates) => {
  if (!supabase) return false;

  try {
    for (const update of updates) {
      await updatePost(update.postId, {
        impressions: update.metrics.impressions,
        likes: update.metrics.likes,
        comments: update.metrics.comments,
        retweets: update.metrics.retweets,
        quotes: update.metrics.quotes,
        bookmarks: update.metrics.bookmarks,
        lastScanned: update.lastScanned,
        needsRescan: false
      });
    }
    return true;
  } catch (error) {
    console.error('Error batch updating post metrics:', error);
    return false;
  }
};

// ============================================================================
// BULK IMPORT/EXPORT
// ============================================================================

/**
 * Bulk import creators (for Google Sheets migration)
 * @param {Array} creators - Array of creator objects
 * @returns {Promise<number>} Number of creators imported
 */
export const bulkImportCreators = async (creators) => {
  if (!supabase) return 0;

  let count = 0;

  for (const creator of creators) {
    try {
      // Check if creator already exists
      const existing = await supabase
        .from('creators')
        .select('id')
        .eq('id', creator.id)
        .single();

      if (existing.data) {
        // Update existing
        await updateCreator(creator.id, creator);
      } else {
        // Create new
        await createCreator(creator);
      }
      count++;
    } catch (error) {
      console.error(`Error importing creator ${creator.name}:`, error);
    }
  }

  return count;
};

// ============================================================================
// PRICING PACKAGE HELPERS
// ============================================================================

/**
 * Add pricing package to creator
 * @param {number} creatorId - Creator ID
 * @param {object} packageData - Package data
 * @returns {Promise<object|null>} Updated creator
 */
export const addPricingPackage = async (creatorId, packageData) => {
  const creator = await getCreatorById(creatorId);
  if (!creator) return null;

  const newPackage = {
    id: Date.now(),
    name: packageData.name || '',
    description: packageData.description || '',
    quantity: packageData.quantity || 1,
    unitType: packageData.unitType || 'post', // 'post', 'video', 'story', etc.
    totalCost: packageData.totalCost || 0,
    costPerUnit: packageData.costPerUnit || 0,
    platforms: packageData.platforms || [],
    notes: packageData.notes || ''
  };

  const packages = [...(creator.pricingPackages || []), newPackage];
  return updateCreator(creatorId, { pricingPackages: packages });
};

/**
 * Update pricing package
 * @param {number} creatorId - Creator ID
 * @param {number} packageId - Package ID
 * @param {object} updates - Package updates
 * @returns {Promise<object|null>} Updated creator
 */
export const updatePricingPackage = async (creatorId, packageId, updates) => {
  const creator = await getCreatorById(creatorId);
  if (!creator) return null;

  const packages = (creator.pricingPackages || []).map(pkg =>
    pkg.id === packageId ? { ...pkg, ...updates } : pkg
  );

  return updateCreator(creatorId, { pricingPackages: packages });
};

/**
 * Delete pricing package
 * @param {number} creatorId - Creator ID
 * @param {number} packageId - Package ID
 * @returns {Promise<object|null>} Updated creator
 */
export const deletePricingPackage = async (creatorId, packageId) => {
  const creator = await getCreatorById(creatorId);
  if (!creator) return null;

  const packages = (creator.pricingPackages || []).filter(pkg => pkg.id !== packageId);
  return updateCreator(creatorId, { pricingPackages: packages });
};

/**
 * Get creator's effective cost per post
 * Returns the cost_per_post if set, otherwise calculates from first package
 * @param {object} creator - Creator object
 * @returns {string} Cost per post
 */
export const getEffectiveCostPerPost = (creator) => {
  if (creator.costPerPost) return creator.costPerPost;

  if (creator.pricingPackages && creator.pricingPackages.length > 0) {
    const firstPackage = creator.pricingPackages[0];
    return `$${firstPackage.costPerUnit.toFixed(2)}`;
  }

  return '';
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  getCreators,
  getCreatorById,
  createCreator,
  updateCreator,
  deleteCreator,
  toggleCreatorActive,
  addPost,
  updatePost,
  deletePost,
  getPostsNeedingRescan,
  batchUpdatePostMetrics,
  bulkImportCreators,
  addPricingPackage,
  updatePricingPackage,
  deletePricingPackage,
  getEffectiveCostPerPost
};
