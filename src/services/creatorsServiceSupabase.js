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
  status: row.status || 'active',
  contentLink: row.content_link || '',
  contractFilePath: row.contract_file_path || null,
  contractUploadedAt: row.contract_uploaded_at || null,
  contractParsedData: row.contract_parsed_data || null,
  // Contract details
  legalName: row.legal_name || '',
  legalAddress: row.legal_address || '',
  city: row.city || '',
  pincode: row.pincode || '',
  country: row.country || '',
  address: row.address || '',
  businessName: row.business_name || '',
  email: row.email || '',
  network: row.network || '',
  walletAddress: row.wallet_address || '',
  currency: row.currency || 'USD',
  poNumber: row.po_number || '',
  posts: (row.posts || []).map(post => ({
    id: post.id,
    campaign_id: post.campaign_id || null,
    description: post.description || '',
    platform: post.platform || 'X',
    date: post.date || '',
    cost: Number(post.cost) || 0,
    link: post.link || '',
    impressions: Number(post.impressions) || 0,
    likes: Number(post.likes) || 0,
    comments: Number(post.comments) || 0,
    retweets: Number(post.retweets) || 0,
    quotes: Number(post.quotes) || 0,
    bookmarks: Number(post.bookmarks) || 0,
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
  status: creator.status || 'active',
  content_link: creator.contentLink || '',
  contract_file_path: creator.contractFilePath || null,
  contract_uploaded_at: creator.contractUploadedAt || null,
  contract_parsed_data: creator.contractParsedData || null,
  // Contract details
  legal_name: creator.legalName || '',
  legal_address: creator.legalAddress || '',
  city: creator.city || '',
  pincode: creator.pincode || '',
  country: creator.country || '',
  address: creator.address || '',
  business_name: creator.businessName || '',
  email: creator.email || '',
  network: creator.network || '',
  wallet_address: creator.walletAddress || '',
  currency: creator.currency || 'USD',
  po_number: creator.poNumber || ''
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
    status: creatorData.status || 'active',
    contentLink: creatorData.contentLink || '',
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
  if (!supabase) return null;

  try {
    // Get current active state
    const { data: current, error: fetchError } = await supabase
      .from('creators')
      .select('active')
      .eq('id', creatorId)
      .single();

    if (fetchError) throw fetchError;
    if (!current) return null;

    const newActive = !(current.active !== false);

    // Update only the active column
    const { error: updateError } = await supabase
      .from('creators')
      .update({ active: newActive })
      .eq('id', creatorId);

    if (updateError) throw updateError;

    // Return full creator with posts
    return getCreatorById(creatorId);
  } catch (error) {
    console.error('Error toggling creator active:', error);
    return null;
  }
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

  // Validate and convert numeric fields
  const validateNumber = (value, fieldName) => {
    const num = Number(value) || 0;
    if (num < 0) {
      console.warn(`${fieldName} cannot be negative, using 0 instead`);
      return 0;
    }
    return num;
  };

  const newPost = {
    id: Date.now() + Math.random(),
    creator_id: creatorId,
    campaign_id: requestId,
    description: postData.description || '',
    platform: postData.platform || 'X',
    date: postData.date || null,
    cost: validateNumber(postData.cost, 'cost'),
    link: postData.link || '',
    impressions: validateNumber(postData.impressions, 'impressions'),
    likes: validateNumber(postData.likes, 'likes'),
    comments: validateNumber(postData.comments, 'comments'),
    retweets: validateNumber(postData.retweets, 'retweets'),
    quotes: validateNumber(postData.quotes, 'quotes'),
    bookmarks: validateNumber(postData.bookmarks, 'bookmarks'),
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

    // Return updated creator with numeric post metrics
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
    // Validate numeric fields if present
    const validateNumber = (value, fieldName) => {
      if (value === undefined) return undefined;
      const num = Number(value) || 0;
      if (num < 0) {
        console.warn(`${fieldName} cannot be negative, using 0 instead`);
        return 0;
      }
      return num;
    };

    const dbUpdates = {
      description: updates.description,
      platform: updates.platform,
      date: updates.date,
      cost: validateNumber(updates.cost, 'cost'),
      link: updates.link,
      impressions: validateNumber(updates.impressions, 'impressions'),
      likes: validateNumber(updates.likes, 'likes'),
      comments: validateNumber(updates.comments, 'comments'),
      retweets: validateNumber(updates.retweets, 'retweets'),
      quotes: validateNumber(updates.quotes, 'quotes'),
      bookmarks: validateNumber(updates.bookmarks, 'bookmarks'),
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
      // Ensure all metrics are numeric
      await updatePost(update.postId, {
        impressions: Number(update.metrics.impressions) || 0,
        likes: Number(update.metrics.likes) || 0,
        comments: Number(update.metrics.comments) || 0,
        retweets: Number(update.metrics.retweets) || 0,
        quotes: Number(update.metrics.quotes) || 0,
        bookmarks: Number(update.metrics.bookmarks) || 0,
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
// STATUS/PROSPECT HELPERS
// ============================================================================

/**
 * Get all prospects (creators with status='prospect')
 * @returns {Promise<Array>} Array of prospect creator objects
 */
export const getProspects = async () => {
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
      .eq('status', 'prospect')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(transformFromDB);
  } catch (error) {
    console.error('Error loading prospects:', error);
    return [];
  }
};

/**
 * Get all active creators (creators with status='active')
 * @returns {Promise<Array>} Array of active creator objects
 */
export const getActiveCreators = async () => {
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
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(transformFromDB);
  } catch (error) {
    console.error('Error loading active creators:', error);
    return [];
  }
};

/**
 * Promote a prospect to active creator status
 * @param {number} prospectId - Prospect ID
 * @returns {Promise<object|null>} Updated creator with 'active' status
 */
export const promoteProspect = async (prospectId) => {
  if (!supabase) return null;

  try {
    const prospect = await getCreatorById(prospectId);
    if (!prospect) {
      console.error('Prospect not found:', prospectId);
      return null;
    }

    if (prospect.status !== 'prospect') {
      console.warn('Creator is not a prospect:', prospectId);
      return null;
    }

    // Update status to 'active'
    return updateCreator(prospectId, { status: 'active' });
  } catch (error) {
    console.error('Error promoting prospect:', error);
    return null;
  }
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
  getEffectiveCostPerPost,
  getProspects,
  getActiveCreators,
  promoteProspect
};
