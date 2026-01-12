/**
 * Bot Analytics Exclusion Service
 * Manages excluded Twitter accounts for bot analytics using Supabase
 */

import { supabase } from '../lib/supabaseClient';

const TABLE_NAME = 'bot_excluded_accounts';

/**
 * Get all excluded accounts for bot analytics
 * @returns {Promise<Array>} Array of excluded account objects
 */
export const getBotExcludedAccounts = async () => {
  if (!supabase) {
    console.error('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
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
    console.error('Error loading bot excluded accounts:', error);
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
 * Add excluded account for bot analytics
 * @param {string} handle - Twitter handle
 * @param {string} reason - Optional reason for exclusion
 * @returns {Promise<object>} Created exclusion object
 */
export const addBotExcludedAccount = async (handle, reason = '') => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Check if already exists
  const existing = await getBotExcludedAccounts();
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
      .from(TABLE_NAME)
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
    console.error('Error adding bot excluded account:', error);
    throw new Error('Failed to add excluded account');
  }
};

/**
 * Remove excluded account for bot analytics
 * @param {number} exclusionId - Exclusion ID
 * @returns {Promise<boolean>} True if removed, false if not found
 */
export const removeBotExcludedAccount = async (exclusionId) => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', exclusionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing bot excluded account:', error);
    return false;
  }
};

/**
 * Check if a handle is excluded
 * @param {string} handle - Twitter handle to check
 * @returns {Promise<boolean>} True if excluded
 */
export const isHandleExcluded = async (handle) => {
  const exclusions = await getBotExcludedAccounts();
  const normalized = normalizeHandle(handle);
  return exclusions.some(e => normalizeHandle(e.handle) === normalized);
};

/**
 * Filter posts by excluding certain handles
 * @param {Array} posts - Array of post objects with handle property
 * @returns {Promise<Array>} Filtered posts
 */
export const filterExcludedPosts = async (posts) => {
  const exclusions = await getBotExcludedAccounts();
  const excludedHandles = new Set(exclusions.map(e => normalizeHandle(e.handle)));

  return posts.filter(post => {
    const postHandle = normalizeHandle(post.handle || post.creator_handle || '');
    return !excludedHandles.has(postHandle);
  });
};

export default {
  getBotExcludedAccounts,
  addBotExcludedAccount,
  removeBotExcludedAccount,
  isHandleExcluded,
  filterExcludedPosts,
  normalizeHandle
};
