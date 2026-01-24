/**
 * Contract Service
 * Handles uploading and parsing creator contracts
 */

import { parseContractWithClaude } from '../lib/claudeClient';
import { updateCreator, addPricingPackage } from './creatorsServiceSupabase';
import { uploadContractToStorage } from './contractStorage';

/**
 * Upload and parse a creator contract
 * @param {File} file - PDF file
 * @param {number} creatorId - Creator ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<object>} Result with parsed data and storage path
 */
export async function uploadAndParseContract(file, creatorId, onProgress = null) {
  try {
    // Validate file
    if (!file.type.includes('pdf')) {
      throw new Error('Only PDF files are supported');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be less than 10MB');
    }

    if (onProgress) onProgress({ stage: 'uploading', progress: 25 });

    // Upload to Supabase Storage
    let storagePath = null;
    try {
      const uploadResult = await uploadContractToStorage(file, creatorId);
      storagePath = uploadResult.path;
      console.log('✅ Contract uploaded to Supabase Storage:', storagePath);
    } catch (uploadError) {
      console.warn('⚠️ Failed to upload to Supabase Storage, continuing with parsing:', uploadError.message);
      // Continue even if storage fails - we can still parse
    }

    if (onProgress) onProgress({ stage: 'parsing', progress: 50 });

    // Parse with Claude (only if API key is available)
    const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

    if (CLAUDE_API_KEY) {
      // Auto-parse with Claude
      const result = await parseContractWithClaude(file);

      if (!result.success) {
        console.warn('Claude parsing failed, will use manual entry:', result.error);
        // Fall through to manual entry
      } else {
        if (onProgress) onProgress({ stage: 'complete', progress: 100 });

        return {
          success: true,
          data: result.data,
          raw: result.raw,
          storagePath: storagePath,
          mode: 'auto'
        };
      }
    }

    // Manual entry mode (no Claude API key or parsing failed)
    if (onProgress) onProgress({ stage: 'complete', progress: 100 });

    return {
      success: true,
      data: null, // No parsed data - user will enter manually
      raw: null,
      storagePath: storagePath,
      mode: 'manual',
      message: CLAUDE_API_KEY
        ? 'Claude parsing failed. Please enter data manually.'
        : 'No Claude API key configured. Please enter data manually.'
    };
  } catch (error) {
    console.error('Error uploading contract:', error);
    return {
      success: false,
      error: error.message,
      data: null,
      storagePath: null
    };
  }
}

/**
 * Apply parsed contract data to a creator
 * @param {number} creatorId - Creator ID
 * @param {object} parsedData - Parsed contract data
 * @param {string} storagePath - Path to contract in Supabase Storage (optional)
 * @returns {Promise<object>} Updated creator
 */
export async function applyContractDataToCreator(creatorId, parsedData, storagePath = null) {
  try {
    const updates = {};

    // Save contract storage path
    if (storagePath) {
      updates.contractFilePath = storagePath;
      updates.contractUploadedAt = new Date().toISOString();
    }

    // Extract pricing data
    if (parsedData.pricing) {
      if (parsedData.pricing.costPerPost) {
        updates.costPerPost = `$${parsedData.pricing.costPerPost.toFixed(2)}`;
      }

      // Add pricing packages
      if (parsedData.pricing.packages && parsedData.pricing.packages.length > 0) {
        for (const pkg of parsedData.pricing.packages) {
          await addPricingPackage(creatorId, pkg);
        }
      }
    }

    // Extract platforms
    if (parsedData.deliverables?.platforms) {
      updates.platforms = parsedData.deliverables.platforms;
    }

    // Add contract data to notes
    if (parsedData.terms || parsedData.payment) {
      let contractNotes = '\n\n--- Contract Terms ---\n';

      if (parsedData.terms?.startDate && parsedData.terms?.endDate) {
        contractNotes += `Duration: ${parsedData.terms.startDate} to ${parsedData.terms.endDate}\n`;
      }

      if (parsedData.terms?.exclusivity) {
        contractNotes += `Exclusivity: ${parsedData.terms.exclusivityDetails || 'Yes'}\n`;
      }

      if (parsedData.payment?.schedule) {
        contractNotes += `Payment: ${parsedData.payment.schedule}\n`;
      }

      if (parsedData.deliverables?.frequency) {
        contractNotes += `Frequency: ${parsedData.deliverables.frequency}\n`;
      }

      updates.notes = (updates.notes || '') + contractNotes;
    }

    // Update creator
    if (Object.keys(updates).length > 0) {
      return await updateCreator(creatorId, updates);
    }

    return null;
  } catch (error) {
    console.error('Error applying contract data:', error);
    throw error;
  }
}

/**
 * Format parsed data for preview
 * @param {object} parsedData - Parsed contract data
 * @returns {object} Formatted data for display
 */
export function formatParsedDataForPreview(parsedData) {
  const formatted = {
    pricing: [],
    deliverables: [],
    terms: [],
    payment: []
  };

  // Format pricing
  if (parsedData.pricing) {
    if (parsedData.pricing.packages) {
      parsedData.pricing.packages.forEach(pkg => {
        formatted.pricing.push({
          label: pkg.name || 'Package',
          value: `${pkg.quantity} ${pkg.unitType}s for $${pkg.totalCost.toLocaleString()} ($${pkg.costPerUnit.toLocaleString()} each)`,
          platforms: pkg.platforms?.join(', ')
        });
      });
    }

    if (parsedData.pricing.costPerPost) {
      formatted.pricing.push({
        label: 'Cost Per Post',
        value: `$${parsedData.pricing.costPerPost.toLocaleString()}`
      });
    }
  }

  // Format deliverables
  if (parsedData.deliverables) {
    if (parsedData.deliverables.totalPosts) {
      formatted.deliverables.push({
        label: 'Total Posts',
        value: parsedData.deliverables.totalPosts
      });
    }
    if (parsedData.deliverables.platforms) {
      formatted.deliverables.push({
        label: 'Platforms',
        value: parsedData.deliverables.platforms.join(', ')
      });
    }
    if (parsedData.deliverables.contentType) {
      formatted.deliverables.push({
        label: 'Content Type',
        value: parsedData.deliverables.contentType
      });
    }
    if (parsedData.deliverables.frequency) {
      formatted.deliverables.push({
        label: 'Frequency',
        value: parsedData.deliverables.frequency
      });
    }
  }

  // Format terms
  if (parsedData.terms) {
    if (parsedData.terms.startDate && parsedData.terms.endDate) {
      formatted.terms.push({
        label: 'Duration',
        value: `${parsedData.terms.startDate} to ${parsedData.terms.endDate}`
      });
    }
    if (parsedData.terms.exclusivity) {
      formatted.terms.push({
        label: 'Exclusivity',
        value: parsedData.terms.exclusivityDetails || 'Yes'
      });
    }
    if (parsedData.terms.revisions) {
      formatted.terms.push({
        label: 'Revisions',
        value: parsedData.terms.revisions
      });
    }
  }

  // Format payment
  if (parsedData.payment) {
    if (parsedData.payment.schedule) {
      formatted.payment.push({
        label: 'Schedule',
        value: parsedData.payment.schedule
      });
    }
    if (parsedData.payment.milestones) {
      parsedData.payment.milestones.forEach(milestone => {
        formatted.payment.push({
          label: milestone.description,
          value: `$${milestone.amount.toLocaleString()}`
        });
      });
    }
  }

  return formatted;
}

export default {
  uploadAndParseContract,
  applyContractDataToCreator,
  formatParsedDataForPreview
};
