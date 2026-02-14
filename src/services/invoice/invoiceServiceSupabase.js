/**
 * Invoice Service - Supabase Storage Layer
 * Manages invoice template storage and retrieval using Supabase
 */

import { supabase } from '../../lib/supabaseClient';

const STORAGE_BUCKET = 'invoice-templates';

// ============================================================================
// SUPABASE TEMPLATE STORAGE
// ============================================================================

/**
 * Upload Excel template file to Supabase Storage and save mapping to database
 * @param {File} file - Excel file
 * @param {object} workbook - Parsed workbook (for metadata)
 * @param {object} mapping - Cell mapping configuration
 * @param {string} name - Template name
 * @param {string} description - Template description
 * @returns {Promise<object>} Template record with id and file_path
 */
export const uploadTemplateToSupabase = async (file, workbook, mapping, name, description = '') => {
  try {
    console.log('[uploadTemplateToSupabase] Uploading template:', name);

    // Generate unique filename
    const timestamp = new Date().getTime();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${cleanFileName}`;
    const filePath = `templates/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    console.log('[uploadTemplateToSupabase] File uploaded to:', filePath);

    // Get sheet name from workbook
    const sheetName = workbook.SheetNames?.[0] || 'Sheet1';

    // Save template metadata to database
    const { data: templateData, error: dbError } = await supabase
      .from('invoice_templates')
      .insert({
        name,
        description,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        sheet_name: sheetName,
        mapping: mapping,
        is_active: true,
        is_default: false // Will be set to true if no other templates exist
      })
      .select()
      .single();

    if (dbError) {
      // Try to clean up uploaded file if database insert fails
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      throw new Error(`Failed to save template metadata: ${dbError.message}`);
    }

    console.log('[uploadTemplateToSupabase] Template saved with ID:', templateData.id);

    // If this is the first template, set it as default
    const { count } = await supabase
      .from('invoice_templates')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (count === 1) {
      await supabase
        .from('invoice_templates')
        .update({ is_default: true })
        .eq('id', templateData.id);

      console.log('[uploadTemplateToSupabase] Set as default template (first template)');
    }

    return templateData;
  } catch (error) {
    console.error('[uploadTemplateToSupabase] Error:', error);
    throw error;
  }
};

/**
 * Get default (or first available) template from Supabase
 * @returns {Promise<object|null>} Template record or null if none found
 */
export const getDefaultTemplate = async () => {
  try {
    // First try to get the default template
    let { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    // If no default, get the most recent active template
    if (!data || error) {
      const { data: recentData, error: recentError } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentError) {
        console.log('[getDefaultTemplate] No templates found');
        return null;
      }

      data = recentData;
    }

    console.log('[getDefaultTemplate] Found template:', data.name);
    return data;
  } catch (error) {
    console.error('[getDefaultTemplate] Error:', error);
    return null;
  }
};

/**
 * Download template file from Supabase Storage
 * @param {string} filePath - File path in storage
 * @returns {Promise<Blob>} File blob
 */
export const downloadTemplateFile = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(filePath);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('[downloadTemplateFile] Error:', error);
    throw error;
  }
};

/**
 * Get all active templates
 * @returns {Promise<Array>} Array of template records
 */
export const getAllTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('[getAllTemplates] Error:', error);
    return [];
  }
};

/**
 * Set a template as the default
 * @param {string} templateId - Template ID to set as default
 * @returns {Promise<boolean>} Success status
 */
export const setDefaultTemplate = async (templateId) => {
  try {
    // Clear existing default
    await supabase
      .from('invoice_templates')
      .update({ is_default: false })
      .eq('is_default', true);

    // Set new default
    const { error } = await supabase
      .from('invoice_templates')
      .update({ is_default: true })
      .eq('id', templateId);

    if (error) {
      throw new Error(`Failed to set default template: ${error.message}`);
    }

    console.log('[setDefaultTemplate] Template', templateId, 'set as default');
    return true;
  } catch (error) {
    console.error('[setDefaultTemplate] Error:', error);
    return false;
  }
};

/**
 * Delete a template (soft delete by setting is_active = false)
 * @param {string} templateId - Template ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteTemplate = async (templateId) => {
  try {
    const { error } = await supabase
      .from('invoice_templates')
      .update({ is_active: false })
      .eq('id', templateId);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }

    console.log('[deleteTemplate] Template', templateId, 'deleted');
    return true;
  } catch (error) {
    console.error('[deleteTemplate] Error:', error);
    return false;
  }
};

/**
 * Update template mapping (without uploading new file)
 * @param {string} templateId - Template ID
 * @param {object} mapping - New mapping configuration
 * @returns {Promise<boolean>} Success status
 */
export const updateTemplateMapping = async (templateId, mapping) => {
  try {
    const { error } = await supabase
      .from('invoice_templates')
      .update({ mapping })
      .eq('id', templateId);

    if (error) {
      throw new Error(`Failed to update template mapping: ${error.message}`);
    }

    console.log('[updateTemplateMapping] Template', templateId, 'mapping updated');
    return true;
  } catch (error) {
    console.error('[updateTemplateMapping] Error:', error);
    return false;
  }
};

/**
 * Check if Supabase is configured (not using placeholder credentials)
 * @returns {boolean} True if Supabase is properly configured
 */
export const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return supabaseUrl && !supabaseUrl.includes('placeholder');
};
