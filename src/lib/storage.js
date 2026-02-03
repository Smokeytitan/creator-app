/**
 * Centralized Storage Abstraction Layer
 * Provides a unified interface for data persistence
 * Abstracts away differences between localStorage, Supabase, and other storage backends
 */

import { supabase } from './supabaseClient';

/**
 * Storage backend types
 */
export const STORAGE_BACKEND = {
  SUPABASE: 'supabase',
  LOCAL: 'local',
  HYBRID: 'hybrid' // Supabase primary, localStorage fallback
};

/**
 * Get the active storage backend
 * @returns {string} Active backend type
 */
function getStorageBackend() {
  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    return STORAGE_BACKEND.HYBRID; // Use hybrid mode for resilience
  }

  return STORAGE_BACKEND.LOCAL;
}

/**
 * Storage class - unified data access interface
 */
class Storage {
  constructor() {
    this.backend = getStorageBackend();
    this.cache = new Map(); // In-memory cache
  }

  /**
   * Get data from storage
   * @param {string} key - Storage key
   * @param {Object} options - Options { useCache, schema }
   * @returns {Promise<any>} Data or null
   */
  async get(key, options = {}) {
    const { useCache = true, schema = null } = options;

    // Check cache first
    if (useCache && this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      let data = null;

      if (this.backend === STORAGE_BACKEND.SUPABASE || this.backend === STORAGE_BACKEND.HYBRID) {
        // Try Supabase first
        data = await this._getFromSupabase(key);
      }

      if (!data && (this.backend === STORAGE_BACKEND.LOCAL || this.backend === STORAGE_BACKEND.HYBRID)) {
        // Fallback to localStorage
        data = this._getFromLocalStorage(key);
      }

      // Validate schema if provided
      if (data && schema) {
        data = this._validateSchema(data, schema);
      }

      // Update cache
      if (data && useCache) {
        this.cache.set(key, data);
      }

      return data;
    } catch (error) {
      console.error(`Storage get error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set data in storage
   * @param {string} key - Storage key
   * @param {any} value - Data to store
   * @param {Object} options - Options { syncToCloud, updateCache }
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, options = {}) {
    const { syncToCloud = true, updateCache = true } = options;

    try {
      // Update cache
      if (updateCache) {
        this.cache.set(key, value);
      }

      // Save to localStorage (always, for offline support)
      this._setToLocalStorage(key, value);

      // Sync to Supabase if configured and requested
      if (syncToCloud && (this.backend === STORAGE_BACKEND.SUPABASE || this.backend === STORAGE_BACKEND.HYBRID)) {
        await this._setToSupabase(key, value);
      }

      return true;
    } catch (error) {
      console.error(`Storage set error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove data from storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Success status
   */
  async remove(key) {
    try {
      // Remove from cache
      this.cache.delete(key);

      // Remove from localStorage
      this._removeFromLocalStorage(key);

      // Remove from Supabase if configured
      if (this.backend === STORAGE_BACKEND.SUPABASE || this.backend === STORAGE_BACKEND.HYBRID) {
        await this._removeFromSupabase(key);
      }

      return true;
    } catch (error) {
      console.error(`Storage remove error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all data from storage
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    try {
      // Clear cache
      this.cache.clear();

      // Clear localStorage
      localStorage.clear();

      // Note: We don't clear Supabase tables as that requires table-specific logic
      console.warn('Storage cleared locally. Supabase data not affected.');

      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} True if exists
   */
  async has(key) {
    const data = await this.get(key, { useCache: false });
    return data !== null;
  }

  /**
   * Get all keys in storage
   * @returns {Promise<string[]>} Array of keys
   */
  async keys() {
    const localKeys = Object.keys(localStorage);
    // TODO: Add Supabase table introspection if needed
    return localKeys;
  }

  // Private methods for backend-specific operations

  _getFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`localStorage get error for key "${key}":`, error);
      return null;
    }
  }

  _setToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`localStorage set error for key "${key}":`, error);
      return false;
    }
  }

  _removeFromLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`localStorage remove error for key "${key}":`, error);
      return false;
    }
  }

  async _getFromSupabase(key) {
    // This is a simplified implementation
    // In practice, you'd map keys to Supabase tables
    // e.g., 'creators' -> creators table
    // TODO: Implement table mapping
    console.warn('Supabase get not fully implemented - using service layer instead');
    return null;
  }

  async _setToSupabase(key, value) {
    // This is a simplified implementation
    // In practice, you'd map keys to Supabase tables and use service layer
    // TODO: Implement table mapping and service layer integration
    console.warn('Supabase set not fully implemented - use service layer functions instead');
    return true;
  }

  async _removeFromSupabase(key) {
    // TODO: Implement Supabase deletion
    console.warn('Supabase remove not fully implemented');
    return true;
  }

  _validateSchema(data, schema) {
    // Basic schema validation
    // TODO: Implement full JSON schema validation if needed
    if (typeof schema === 'function') {
      return schema(data);
    }
    return data;
  }

  /**
   * Invalidate cache for a key
   * @param {string} key - Key to invalidate
   */
  invalidateCache(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get current backend type
   * @returns {string} Backend type
   */
  getBackend() {
    return this.backend;
  }
}

// Export singleton instance
export const storage = new Storage();

/**
 * Higher-level convenience functions
 */

/**
 * Get creators from storage
 * @returns {Promise<Array>} Array of creators
 */
export async function getStoredCreators() {
  return (await storage.get('creators')) || [];
}

/**
 * Save creators to storage
 * @param {Array} creators - Creators to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveCreators(creators) {
  return await storage.set('creators', creators);
}

/**
 * Get campaigns from storage
 * @returns {Promise<Array>} Array of campaigns
 */
export async function getStoredCampaigns() {
  return (await storage.get('campaigns')) || [];
}

/**
 * Save campaigns to storage
 * @param {Array} campaigns - Campaigns to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveCampaigns(campaigns) {
  return await storage.set('campaigns', campaigns);
}

/**
 * Get active tab from storage
 * @returns {Promise<string>} Active tab name
 */
export async function getActiveTab() {
  return (await storage.get('activeTab')) || 'roster';
}

/**
 * Save active tab to storage
 * @param {string} tab - Tab name
 * @returns {Promise<boolean>} Success status
 */
export async function saveActiveTab(tab) {
  return await storage.set('activeTab', tab);
}

export default storage;
