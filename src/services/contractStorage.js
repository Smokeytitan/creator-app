/**
 * Contract Storage Service
 * Handles uploading and retrieving creator contracts from Supabase Storage
 */

import { supabase } from '../lib/supabaseClient';

const BUCKET_NAME = 'creator-contracts';

/**
 * Initialize the contracts bucket (call this once during setup)
 * @returns {Promise<boolean>} Success status
 */
export async function initializeContractsBucket() {
  if (!supabase) {
    console.error('Supabase not configured');
    return false;
  }

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false, // Private bucket
        fileSizeLimit: 10485760 // 10MB limit
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }

      console.log('✅ Created creator-contracts bucket');
    }

    return true;
  } catch (error) {
    console.error('Error initializing bucket:', error);
    return false;
  }
}

/**
 * Upload contract PDF to Supabase Storage
 * @param {File} file - PDF file
 * @param {number} creatorId - Creator ID
 * @returns {Promise<object>} Upload result with path
 */
export async function uploadContractToStorage(file, creatorId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `creator_${creatorId}/${timestamp}_${sanitizedFileName}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    return {
      success: true,
      path: data.path,
      fullPath: `${BUCKET_NAME}/${data.path}`
    };
  } catch (error) {
    console.error('Error uploading contract:', error);
    throw new Error(`Failed to upload contract: ${error.message}`);
  }
}

/**
 * Get signed URL for contract download
 * @param {string} filePath - File path in storage
 * @param {number} expiresIn - URL expiration in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export async function getContractDownloadUrl(filePath, expiresIn = 3600) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw new Error(`Failed to get download URL: ${error.message}`);
  }
}

/**
 * Download contract file from storage for parsing
 * @param {string} filePath - File path in storage
 * @returns {Promise<File>} File object
 */
export async function downloadContractFromStorage(filePath) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (error) throw error;

    // Convert blob to File object
    const file = new File([data], filePath.split('/').pop(), { type: 'application/pdf' });
    return file;
  } catch (error) {
    console.error('Error downloading contract:', error);
    throw new Error(`Failed to download contract: ${error.message}`);
  }
}

/**
 * Delete contract from storage
 * @param {string} filePath - File path in storage
 * @returns {Promise<boolean>} Success status
 */
export async function deleteContractFromStorage(filePath) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting contract:', error);
    return false;
  }
}

/**
 * List all contracts for a creator
 * @param {number} creatorId - Creator ID
 * @returns {Promise<Array>} List of contract files
 */
export async function listCreatorContracts(creatorId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`creator_${creatorId}`, {
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error listing contracts:', error);
    return [];
  }
}

export default {
  initializeContractsBucket,
  uploadContractToStorage,
  getContractDownloadUrl,
  downloadContractFromStorage,
  deleteContractFromStorage,
  listCreatorContracts
};
