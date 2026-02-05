/**
 * Invoice Service
 * Manages invoice generation from Excel templates with PDF export
 * Handles template upload, cell mapping, data aggregation, and PDF conversion
 */

import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { supabase } from '../lib/supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// LocalStorage key for template mapping configuration
const TEMPLATE_MAPPING_KEY = 'invoice_template_mapping';
const TEMPLATE_WORKBOOK_KEY = 'invoice_template_workbook';
const TEMPLATE_ORIGINAL_FILE_KEY = 'invoice_template_original_file'; // Original Excel file for styling

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

/**
 * Upload and parse Excel template file
 * @param {File} file - Excel file (.xlsx, .xls)
 * @returns {Promise<object>} Parsed workbook object
 */
export const uploadTemplate = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Excel file has no sheets');
        }

        // Save original file buffer for styling preservation
        saveOriginalTemplateFile(data);

        resolve(workbook);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validate template file before upload
 * @param {File} file - File to validate
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateTemplateFile = (file) => {
  const validExtensions = ['.xlsx', '.xls'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

  if (!extension || !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB'
    };
  }

  return { valid: true };
};

/**
 * Save template workbook to localStorage
 * @param {object} workbook - XLSX workbook object
 * @returns {boolean} Success status
 */
export const saveTemplateWorkbook = (workbook) => {
  try {
    // Convert workbook to binary string
    const binary = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
    localStorage.setItem(TEMPLATE_WORKBOOK_KEY, binary);
    return true;
  } catch (error) {
    console.error('Failed to save template workbook:', error);
    return false;
  }
};

/**
 * Get saved template workbook from localStorage
 * @returns {object|null} Workbook object or null if not found
 */
export const getTemplateWorkbook = () => {
  try {
    const binary = localStorage.getItem(TEMPLATE_WORKBOOK_KEY);
    if (!binary) return null;

    // Convert base64 back to workbook
    const workbook = XLSX.read(binary, { type: 'base64' });
    return workbook;
  } catch (error) {
    console.error('Failed to retrieve template workbook:', error);
    return null;
  }
};

/**
 * Save original Excel file buffer to localStorage for styling preservation
 * @param {Uint8Array} buffer - Original file buffer
 * @returns {boolean} Success status
 */
const saveOriginalTemplateFile = (buffer) => {
  try {
    // Convert Uint8Array to base64 string for storage
    const base64 = btoa(String.fromCharCode(...buffer));
    localStorage.setItem(TEMPLATE_ORIGINAL_FILE_KEY, base64);
    return true;
  } catch (error) {
    console.error('Failed to save original template file:', error);
    return false;
  }
};

/**
 * Get original Excel file buffer from localStorage
 * @returns {Uint8Array|null} File buffer or null if not found
 */
const getOriginalTemplateFile = () => {
  try {
    const base64 = localStorage.getItem(TEMPLATE_ORIGINAL_FILE_KEY);
    if (!base64) return null;

    // Convert base64 back to Uint8Array
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Failed to retrieve original template file:', error);
    return null;
  }
};

/**
 * Save template mapping configuration to localStorage
 * @param {object} mapping - Mapping configuration object
 * @returns {boolean} Success status
 */
export const saveTemplateMapping = (mapping) => {
  try {
    const config = {
      ...mapping,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(TEMPLATE_MAPPING_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save template mapping:', error);
    return false;
  }
};

/**
 * Get saved template mapping configuration
 * @returns {object|null} Mapping configuration or null if not found
 */
export const getTemplateMapping = () => {
  try {
    const data = localStorage.getItem(TEMPLATE_MAPPING_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve template mapping:', error);
    return null;
  }
};

/**
 * Check if template is configured
 * @returns {boolean} True if template mapping exists
 */
export const hasTemplateConfigured = () => {
  return getTemplateMapping() !== null;
};

/**
 * Clear saved template mapping and workbook
 * @returns {boolean} Success status
 */
export const clearTemplateMapping = () => {
  try {
    localStorage.removeItem(TEMPLATE_MAPPING_KEY);
    localStorage.removeItem(TEMPLATE_WORKBOOK_KEY);
    localStorage.removeItem(TEMPLATE_ORIGINAL_FILE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear template mapping:', error);
    return false;
  }
};

// ============================================================================
// DATA AGGREGATION
// ============================================================================

/**
 * Generate mock posts for placeholder mode
 * @param {object} creator - Creator object
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Array of mock post objects
 */
const generateMockPosts = (creator, startDate, endDate) => {
  console.log('[generateMockPosts] Generating mock posts for date range:', startDate, 'to', endDate);

  const posts = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const platforms = creator.platforms || ['X', 'Instagram'];
  const costPerPost = creator.costPerPost || 500;

  // Generate 2-3 posts per week
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const numPosts = Math.max(1, Math.floor(daysDiff / 3));

  console.log('[generateMockPosts] Date range days:', daysDiff, 'Generating', numPosts, 'posts');

  for (let i = 0; i < numPosts; i++) {
    const postDate = new Date(start);
    postDate.setDate(postDate.getDate() + Math.floor((daysDiff / numPosts) * i));
    const postDateStr = postDate.toISOString().split('T')[0];

    console.log('[generateMockPosts] Generated post', i + 1, 'with date:', postDateStr);

    posts.push({
      id: `mock-${i}`,
      date: postDateStr,
      description: `Sample post ${i + 1} - Promotional content`,
      platform: platforms[i % platforms.length],
      cost: costPerPost,
      impressions: Math.floor(Math.random() * 50000) + 10000,
      likes: Math.floor(Math.random() * 2000) + 500,
      comments: Math.floor(Math.random() * 100) + 20,
      retweets: Math.floor(Math.random() * 500) + 50,
      link: `https://example.com/post-${i + 1}`
    });
  }

  console.log('[generateMockPosts] Generated', posts.length, 'mock posts');
  return posts;
};

/**
 * Get creator invoice data for a specific date range
 * @param {number} creatorId - Creator ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {object} creatorData - Optional creator data (used when Supabase unavailable)
 * @returns {Promise<object>} Invoice data with creator info, posts, and totals
 */
export const getCreatorInvoiceData = async (creatorId, startDate, endDate, creatorData = null) => {
  console.log('[getCreatorInvoiceData] Called with:', { creatorId, startDate, endDate });

  // Check if using placeholder Supabase credentials
  const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');
  console.log('[getCreatorInvoiceData] Placeholder mode:', isPlaceholder);

  if (isPlaceholder && !creatorData) {
    throw new Error('Creator data required when Supabase is not configured');
  }

  let creator = creatorData;
  let posts = [];

  try {
    // Only fetch from Supabase if not using placeholder credentials
    if (!isPlaceholder && supabase) {
      console.log('[getCreatorInvoiceData] Fetching from Supabase...');

      // Fetch creator data
      const { data: creatorFromDb, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('id', creatorId)
        .single();

      if (creatorError) throw creatorError;
      if (!creatorFromDb) throw new Error(`Creator not found: ${creatorId}`);
      creator = creatorFromDb;

      // Fetch posts within date range
      const { data: postsFromDb, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('creator_id', creatorId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (postsError) throw postsError;
      posts = postsFromDb || [];
      console.log('[getCreatorInvoiceData] Fetched', posts.length, 'posts from Supabase');
    } else {
      // Placeholder mode - filter existing posts from creator data by date range
      console.log('[getCreatorInvoiceData] Using placeholder mode, filtering existing posts...');

      if (creator.posts && creator.posts.length > 0) {
        // Filter existing posts by date range
        const start = new Date(startDate);
        const end = new Date(endDate);

        posts = creator.posts.filter(post => {
          const postDate = new Date(post.date);
          return postDate >= start && postDate <= end;
        });

        console.log('[getCreatorInvoiceData] Filtered', posts.length, 'posts from', creator.posts.length, 'total posts');
        console.log('[getCreatorInvoiceData] Date range filter:', startDate, 'to', endDate);
      } else {
        // No posts exist, generate mock posts as fallback
        console.log('[getCreatorInvoiceData] No existing posts, generating mock posts...');
        posts = generateMockPosts(creator, startDate, endDate);
        console.log('[getCreatorInvoiceData] Mock posts generated:', posts.length);
      }
    }

    // Get creator's cost per post (remove $ sign if present and convert to number)
    const creatorCostPerPost = creator.cost_per_post || creator.costPerPost || '';
    const costPerPostNum = typeof creatorCostPerPost === 'string'
      ? parseFloat(creatorCostPerPost.replace(/[$,]/g, '')) || 0
      : parseFloat(creatorCostPerPost) || 0;

    console.log('[getCreatorInvoiceData] Creator cost per post:', costPerPostNum);

    // Calculate totals (pass costPerPost to use as default for posts without cost)
    const totals = calculateTotals(posts, costPerPostNum);
    console.log('[getCreatorInvoiceData] Calculated totals:', totals);

    // Format date range
    const dateRange = {
      start: startDate,
      end: endDate,
      label: formatDateRangeLabel(startDate, endDate)
    };

    // Calculate invoice dates
    const generatedDate = new Date();
    const dueDate = new Date(generatedDate);
    dueDate.setMonth(dueDate.getMonth() + 2); // Add 2 months

    // Generate invoice number from the invoice period month (MMYY format)
    const invoiceDate = new Date(startDate);
    const invoiceMonth = String(invoiceDate.getMonth() + 1).padStart(2, '0');
    const invoiceYear = String(invoiceDate.getFullYear()).slice(-2); // Last 2 digits
    const invoiceNumber = `${invoiceMonth}${invoiceYear}`;

    const invoiceDates = {
      generated: generatedDate.toISOString().split('T')[0], // YYYY-MM-DD
      generatedFormatted: formatDate(generatedDate.toISOString().split('T')[0]),
      due: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
      dueFormatted: formatDate(dueDate.toISOString().split('T')[0]),
      invoiceNumber: invoiceNumber // MMYY format (e.g., "0226" for Feb 2026)
    };

    // Extract contract details
    const contract = {
      legalName: creator.legal_name || creator.legalName || creator.name,
      legalAddress: creator.legal_address || creator.legalAddress || '',
      city: creator.city || '',
      pincode: creator.pincode || '',
      country: creator.country || '',
      address: creator.address || '',
      businessName: creator.business_name || creator.businessName || '',
      email: creator.email || '',
      network: creator.network || '',
      walletAddress: creator.wallet_address || creator.walletAddress || '',
      costPerPost: creator.cost_per_post || creator.costPerPost || '',
      currency: creator.currency || 'USD',
      poNumber: creator.po_number || creator.poNumber || '',
      platforms: (creator.platforms || []).join(', '),
      startDate: creator.contract_start_date || '',
      endDate: creator.contract_end_date || '',
      paymentSchedule: creator.payment_schedule || '',
      deliverables: creator.deliverables || '',
      exclusivity: creator.exclusivity || ''
    };

    const result = {
      creator: {
        id: creator.id,
        name: creator.name,
        handle: creator.handle,
        legalName: creator.legal_name || creator.legalName || creator.name,
        legalAddress: creator.legal_address || creator.legalAddress || '',
        city: creator.city || '',
        pincode: creator.pincode || '',
        country: creator.country || '',
        address: creator.address || '',
        businessName: creator.business_name || creator.businessName || '',
        email: creator.email || '',
        network: creator.network || '',
        walletAddress: creator.wallet_address || creator.walletAddress || '',
        costPerPost: creator.cost_per_post || creator.costPerPost,
        currency: creator.currency || 'USD',
        poNumber: creator.po_number || creator.poNumber || '',
        platforms: creator.platforms || []
      },
      dateRange,
      invoiceDates,
      contract,
      posts: (posts || []).map(post => {
        const postCost = parseFloat(post.cost) || 0;
        // Use post's cost if set, otherwise use creator's default cost per post
        const finalCost = postCost > 0 ? postCost : costPerPostNum;
        return {
          id: post.id,
          date: post.date,
          description: post.description,
          platform: post.platform,
          cost: finalCost,
          impressions: parseInt(post.impressions) || 0,
          likes: parseInt(post.likes) || 0,
          comments: parseInt(post.comments) || 0,
          retweets: parseInt(post.retweets) || 0,
          link: post.link
        };
      }),
      totals
    };

    console.log('[getCreatorInvoiceData] Returning invoice data with', result.posts.length, 'posts and totals:', result.totals);
    return result;
  } catch (error) {
    console.error('Error fetching invoice data:', error);
    throw error;
  }
};

/**
 * Calculate totals from posts array
 * @param {Array} posts - Array of post objects
 * @param {number} defaultCostPerPost - Default cost per post from creator contract
 * @returns {object} Totals object
 */
const calculateTotals = (posts, defaultCostPerPost = 0) => {
  const postCount = posts.length;

  let totalCost = 0;
  let totalImpressions = 0;
  let totalEngagements = 0;

  posts.forEach(post => {
    // Use post cost if available, otherwise use creator's default cost per post
    const postCost = parseFloat(post.cost) || 0;
    const cost = postCost > 0 ? postCost : defaultCostPerPost;

    const impressions = parseInt(post.impressions) || 0;
    const likes = parseInt(post.likes) || 0;
    const comments = parseInt(post.comments) || 0;
    const retweets = parseInt(post.retweets) || 0;

    totalCost += cost;
    totalImpressions += impressions;
    totalEngagements += likes + comments + retweets;
  });

  console.log('[calculateTotals] Posts:', postCount, 'Total Cost:', totalCost, 'Default Cost Per Post:', defaultCostPerPost);

  const avgImpressions = postCount > 0 ? Math.round(totalImpressions / postCount) : 0;
  const avgCPM = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;
  const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

  return {
    postCount,
    totalCost,
    totalImpressions,
    avgImpressions,
    avgCPM,
    totalEngagements,
    engagementRate
  };
};

/**
 * Format date as MM/DD/YYYY string
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {string} Formatted date (e.g., "01/15/2026")
 */
const formatDate = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

/**
 * Format date range as human-readable label
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {string} Formatted label (e.g., "Jan 1-31, 2026")
 */
const formatDateRangeLabel = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startMonth = start.toLocaleString('en-US', { month: 'short' });
  const endMonth = end.toLocaleString('en-US', { month: 'short' });
  const year = start.getFullYear();

  if (startMonth === endMonth && start.getFullYear() === end.getFullYear()) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}, ${year}`;
  } else {
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
  }
};

// ============================================================================
// EXCEL TEMPLATE POPULATION
// ============================================================================

/**
 * Populate Excel template with invoice data
 * @param {object} workbook - XLSX workbook object
 * @param {object} data - Invoice data
 * @param {object} mapping - Cell mapping configuration
 * @returns {object} Modified workbook
 */
export const populateTemplate = (workbook, data, mapping) => {
  const sheetName = mapping.sheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in template`);
  }

  console.log('[populateTemplate] Invoice data:', {
    creator: data.creator.name,
    postsCount: data.posts.length,
    totals: data.totals
  });

  // Apply single-cell mappings
  Object.entries(mapping.mappings).forEach(([cellAddress, fieldMapping]) => {
    if (fieldMapping.type === 'array') {
      // Handle array mapping separately
      applyArrayMapping(worksheet, cellAddress, data, fieldMapping);
    } else {
      // Handle single-cell mapping
      const value = getNestedValue(data, fieldMapping.field);
      console.log(`[populateTemplate] Mapping ${fieldMapping.field} to ${cellAddress}: ${value}`);
      applySingleCellMapping(worksheet, cellAddress, value, fieldMapping.format);
    }
  });

  return workbook;
};

/**
 * Apply single-cell mapping to worksheet
 * @param {object} worksheet - XLSX worksheet
 * @param {string} cellAddress - Cell address (e.g., 'A1')
 * @param {any} value - Value to set
 * @param {string} format - Format type (text, number, currency, date)
 */
const applySingleCellMapping = (worksheet, cellAddress, value, format) => {
  console.log(`[applySingleCellMapping] Cell: ${cellAddress}, Value: ${value}, Format: ${format}`);

  if (!worksheet[cellAddress]) {
    worksheet[cellAddress] = {};
  }

  const cell = worksheet[cellAddress];

  switch (format) {
    case 'currency':
      cell.t = 'n'; // number type
      cell.v = parseFloat(value) || 0;
      cell.z = '$#,##0.00'; // Excel format code
      break;

    case 'number':
      cell.t = 'n';
      cell.v = parseFloat(value) || 0;
      cell.z = '#,##0';
      console.log(`[applySingleCellMapping] Number cell created: ${cellAddress} = ${cell.v}`);
      break;

    case 'date':
      cell.t = 'd';
      cell.v = new Date(value);
      cell.z = 'mm/dd/yyyy';
      break;

    default: // text
      cell.t = 's';
      cell.v = String(value || '');
  }
};

/**
 * Apply array mapping to worksheet (for posts list)
 * @param {object} worksheet - XLSX worksheet
 * @param {string} startCell - Starting cell address (e.g., 'A10')
 * @param {object} data - Invoice data
 * @param {object} fieldMapping - Field mapping configuration
 */
const applyArrayMapping = (worksheet, startCell, data, fieldMapping) => {
  const posts = data.posts || [];
  const startRow = parseInt(startCell.match(/\d+/)[0]);
  const columns = fieldMapping.columns || {};

  posts.forEach((post, index) => {
    const rowIndex = startRow + index;

    Object.entries(columns).forEach(([colLetter, columnMapping]) => {
      const cellAddress = `${colLetter}${rowIndex}`;
      const value = post[columnMapping.field];
      applySingleCellMapping(worksheet, cellAddress, value, columnMapping.format);
    });
  });

  // Update sheet range to include new rows
  if (posts.length > 0) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    range.e.r = Math.max(range.e.r, startRow + posts.length - 1);
    worksheet['!ref'] = XLSX.utils.encode_range(range);
  }
};

/**
 * Get nested value from object using dot notation
 * @param {object} obj - Object to search
 * @param {string} path - Dot notation path (e.g., 'creator.name')
 * @returns {any} Value at path or undefined
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// ============================================================================
// PDF CONVERSION & DOWNLOAD
// ============================================================================

/**
 * Convert Excel workbook to PDF with formatting preservation
 * @param {object} workbook - XLSX workbook object (used for data values)
 * @returns {Promise<Blob>} PDF blob
 */
export const convertToPDF = async (workbook) => {
  try {
    console.log('[convertToPDF] Starting PDF conversion with formatting preservation...');

    // Load original Excel file with ExcelJS to get styling
    const originalBuffer = getOriginalTemplateFile();
    if (!originalBuffer) {
      console.warn('[convertToPDF] Original file not found, using basic formatting');
      return convertToPDFBasic(workbook);
    }

    // Parse with ExcelJS
    const excelWorkbook = new ExcelJS.Workbook();
    await excelWorkbook.xlsx.load(originalBuffer.buffer);

    const excelWorksheet = excelWorkbook.worksheets[0];
    if (!excelWorksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    console.log('[convertToPDF] Loaded worksheet with ExcelJS:', excelWorksheet.name);

    // Get XLSX worksheet for updated values
    const xlsxWorksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Scan for the last row with content or formatting
    let maxRow = excelWorksheet.actualRowCount || excelWorksheet.rowCount || 0;

    // Also check XLSX range to be sure
    const xlsxRange = xlsxWorksheet['!ref'] ? XLSX.utils.decode_range(xlsxWorksheet['!ref']) : null;
    if (xlsxRange && xlsxRange.e.r + 1 > maxRow) {
      maxRow = xlsxRange.e.r + 1;
    }

    // Scan ExcelJS worksheet for any row with content or formatting
    for (let r = 1; r <= Math.max(maxRow, 100); r++) {
      const row = excelWorksheet.getRow(r);
      if (row && (row.hasValues || row.height || row.outlineLevel || row.hidden !== undefined)) {
        maxRow = Math.max(maxRow, r);
      }
    }

    // Limit to first 54 rows as requested by user
    const actualRowCount = Math.min(maxRow, 54);
    const actualColumnCount = excelWorksheet.actualColumnCount || excelWorksheet.columnCount;

    console.log('[convertToPDF] Template dimensions from ExcelJS:', actualRowCount, 'rows x', actualColumnCount, 'columns (limited to 54 rows)');
    console.log('[convertToPDF] XLSX range:', xlsxRange ? `${xlsxRange.s.r}:${xlsxRange.e.r}` : 'none');

    // Get merged cell ranges to handle them properly
    const mergedCells = new Set();
    const mergedCellMasters = {}; // Map of merged cells to their master cell

    if (excelWorksheet.model.merges) {
      console.log('[convertToPDF] Found merged cells:', excelWorksheet.model.merges);
      excelWorksheet.model.merges.forEach(merge => {
        // Parse merge range like "A1:C1"
        const match = merge.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
        if (match) {
          const startCol = XLSX.utils.decode_col(match[1]);
          const startRow = parseInt(match[2]) - 1; // Convert to 0-based
          const endCol = XLSX.utils.decode_col(match[3]);
          const endRow = parseInt(match[4]) - 1; // Convert to 0-based

          // Mark all cells in the merge range (except the master/top-left cell)
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
              const cellKey = `${r},${c}`;
              if (r === startRow && c === startCol) {
                // This is the master cell - don't add to mergedCells set
                continue;
              }
              // This is a non-master merged cell - mark it
              mergedCells.add(cellKey);
              mergedCellMasters[cellKey] = `${startRow},${startCol}`;
            }
          }
        }
      });
      console.log('[convertToPDF] Merged cells to skip:', Array.from(mergedCells));
    }

    // Create range based on actual template dimensions, not just populated cells
    const range = {
      s: { r: 0, c: 0 },
      e: { r: actualRowCount - 1, c: Math.min(actualColumnCount - 1, 25) } // Limit to 26 columns (A-Z) for PDF
    };

    // Determine orientation based on column count
    const columnCount = range.e.c - range.s.c + 1;
    const rowCount = range.e.r - range.s.r + 1;
    const orientation = columnCount > 8 ? 'landscape' : 'portrait';

    console.log('[convertToPDF] Creating PDF:', orientation, 'orientation,', columnCount, 'columns,', rowCount, 'rows');

    // Create PDF document
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'pt',
      format: 'letter'
    });

    // Extract rows with values and styling
    const rows = [];
    const cellStyles = []; // Store styling for each cell

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const row = [];
      const rowStyles = [];

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellKey = `${R},${C}`;
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const xlsxCell = xlsxWorksheet[cellAddress];

        // Get ExcelJS cell (original template with styling and original values)
        const excelCell = excelWorksheet.getCell(R + 1, C + 1); // ExcelJS uses 1-based indexing

        // Get updated value from XLSX (post-population), or fall back to original template value
        let value = '';

        // Skip non-master cells in merged ranges (they should be empty)
        if (mergedCells.has(cellKey)) {
          console.log(`[convertToPDF] Skipping merged cell ${cellAddress} (${cellKey}) - not master cell`);
          value = ''; // Leave merged non-master cells empty
        } else if (xlsxCell) {
          // Use populated value from XLSX
          if (xlsxCell.t === 'n') {
            // Number formatting
            if (xlsxCell.z && xlsxCell.z.includes('$')) {
              value = `$${parseFloat(xlsxCell.v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
            } else if (xlsxCell.z && xlsxCell.z.includes('#,##0')) {
              value = parseFloat(xlsxCell.v).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            } else {
              value = String(xlsxCell.v);
            }
          } else {
            value = String(xlsxCell.v || '');
          }
        } else if (excelCell && excelCell.value !== null && excelCell.value !== undefined) {
          // Use original template value if no XLSX value (preserves static content)
          if (typeof excelCell.value === 'object' && excelCell.value.result !== undefined) {
            // Formula result
            value = String(excelCell.value.result || '');
          } else {
            value = String(excelCell.value || '');
          }
        }

        // Get styling from ExcelJS (original template)
        const cellStyle = extractCellStyle(excelCell);

        row.push(value);
        rowStyles.push(cellStyle);
      }

      rows.push(row);
      cellStyles.push(rowStyles);
    }

    console.log('[convertToPDF] Extracted', rows.length, 'rows with', rows[0]?.length || 0, 'columns');
    console.log('[convertToPDF] FIRST ROW DATA:', rows[0]);
    console.log('[convertToPDF] SECOND ROW DATA:', rows[1]);

    // Calculate base font size based on row count to fit everything on one page
    const pageHeight = doc.internal.pageSize.height;
    const availableHeight = pageHeight - 40; // Top and bottom margins
    const estimatedRowHeight = 15; // Rough estimate per row with padding
    const totalEstimatedHeight = rowCount * estimatedRowHeight;

    let fontSize = 8;
    let cellPadding = 2;
    let startY = 20;

    // Adjust font size to fit content
    if (totalEstimatedHeight > availableHeight * 1.5) {
      // Way too much content - use smallest font
      fontSize = 5.5;
      cellPadding = 0.5;
      startY = 10;
    } else if (totalEstimatedHeight > availableHeight) {
      // Content exceeds page - reduce font
      fontSize = 6.5;
      cellPadding = 1;
      startY = 12;
    } else if (rowCount > 40) {
      fontSize = 7;
      cellPadding = 1.5;
      startY = 15;
    } else if (rowCount > 25) {
      fontSize = 7.5;
      cellPadding = 2;
      startY = 15;
    }

    console.log('[convertToPDF] Using fontSize:', fontSize, 'cellPadding:', cellPadding, 'for', rowCount, 'rows (estimated height:', totalEstimatedHeight, 'vs available:', availableHeight, ')');

    // Font size scale factor - reduce Excel font sizes by 50%
    const fontSizeScaleFactor = 0.5;

    // Extract column widths from Excel
    const columnStyles = {};
    const pageWidth = orientation === 'landscape'
      ? doc.internal.pageSize.width - 30 // subtract margins
      : doc.internal.pageSize.width - 30;

    let totalWidth = 0;
    const colWidths = [];

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const excelCol = excelWorksheet.getColumn(C + 1);
      if (excelCol.width) {
        // Convert Excel character units to PDF points (1 Excel char ≈ 7.5 points)
        const width = excelCol.width * 7.5;
        colWidths.push(width);
        totalWidth += width;
      } else {
        colWidths.push(null); // auto-size
      }
    }

    // If total width exceeds page width, scale down proportionally
    const scaleFactor = totalWidth > pageWidth ? pageWidth / totalWidth : 1;

    for (let C = 0; C < colWidths.length; ++C) {
      if (colWidths[C] !== null) {
        columnStyles[C] = { cellWidth: colWidths[C] * scaleFactor };
      } else {
        columnStyles[C] = { cellWidth: 'auto' };
      }
    }

    console.log('[convertToPDF] Column widths scaled by factor:', scaleFactor.toFixed(2));
    console.log('[convertToPDF] Rendering PDF with preserved styling...');

    // Configure autoTable with styling - treat ALL rows as body (no special header)
    autoTable(doc, {
      head: [], // No header row - treat everything as body
      body: rows, // All rows in body
      startY: startY,
      styles: {
        fontSize: fontSize,
        cellPadding: cellPadding,
        overflow: 'visible', // Don't break text - keep it in one line
        lineColor: [0, 0, 0], // Default border color (will be overridden per cell)
        lineWidth: 0, // No borders by default
        minCellHeight: 0, // Allow flexible row heights
        valign: 'middle',
        cellWidth: 'wrap' // Allow cells to expand to fit content
      },
      columnStyles: columnStyles,
      margin: { top: 10, right: 15, bottom: 20, left: 15 }, // Increased bottom margin to prevent page overflow
      tableWidth: 'auto',
      tableLineColor: [255, 255, 255],
      tableLineWidth: 0,
      theme: 'plain', // Plain theme - no automatic borders
      pageBreak: 'auto', // Allow automatic page breaks
      rowPageBreak: 'avoid', // Try to avoid breaking rows across pages
      showHead: 'everyPage', // Not used since head is empty, but good practice
      didDrawPage: (data) => {
        // Log page info for debugging
        console.log('[convertToPDF] Drew page', data.pageNumber, 'final Y:', data.cursor?.y);

        // Check if this is a blank page (no content drawn)
        if (data.pageNumber > 1 && data.cursor && data.cursor.y <= startY + 20) {
          console.warn('[convertToPDF] Detected potential blank page', data.pageNumber);
        }
      },
      // Apply cell-specific styling
      didParseCell: (data) => {
        const rowIndex = data.row.index; // No offset needed since all rows are in body
        const colIndex = data.column.index;

        if (rowIndex < cellStyles.length && colIndex < cellStyles[rowIndex].length) {
          const style = cellStyles[rowIndex][colIndex];

          // Apply background color
          if (style.fillColor) {
            data.cell.styles.fillColor = style.fillColor;
          }

          // Apply text color
          if (style.textColor) {
            data.cell.styles.textColor = style.textColor;
          }

          // Apply font style
          if (style.fontStyle) {
            data.cell.styles.fontStyle = style.fontStyle;
          }

          // Apply alignment
          if (style.halign) {
            data.cell.styles.halign = style.halign;
          }
          if (style.valign) {
            data.cell.styles.valign = style.valign;
          }

          // Apply font size if specified (scale down by 50%)
          if (style.fontSize) {
            data.cell.styles.fontSize = style.fontSize * fontSizeScaleFactor;
          }

          // Store border info for didDrawCell hook
          if (style.borders) {
            data.cell.borders = style.borders;
          }
        }
      },
      // Draw borders only where they exist in Excel template
      didDrawCell: (data) => {
        const borders = data.cell.borders;
        if (!borders) return; // No borders to draw

        const { x, y, width, height } = data.cell;

        // Draw each border side if it exists
        if (borders.top) {
          doc.setDrawColor(...(borders.topColor || [0, 0, 0]));
          doc.setLineWidth(0.5);
          doc.line(x, y, x + width, y);
        }
        if (borders.bottom) {
          doc.setDrawColor(...(borders.bottomColor || [0, 0, 0]));
          doc.setLineWidth(0.5);
          doc.line(x, y + height, x + width, y + height);
        }
        if (borders.left) {
          doc.setDrawColor(...(borders.leftColor || [0, 0, 0]));
          doc.setLineWidth(0.5);
          doc.line(x, y, x, y + height);
        }
        if (borders.right) {
          doc.setDrawColor(...(borders.rightColor || [0, 0, 0]));
          doc.setLineWidth(0.5);
          doc.line(x + width, y, x + width, y + height);
        }
      }
    });

    console.log('[convertToPDF] PDF rendering complete');

    // Check if the last page is blank and remove it
    const totalPages = doc.internal.pages.length - 1; // -1 because first element is null
    console.log('[convertToPDF] Total pages:', totalPages);

    // If there are multiple pages, check if the last page might be blank
    if (totalPages > 1) {
      // jsPDF doesn't have a direct way to remove pages, but we can check if the last page is essentially empty
      // by checking if the final Y position is very close to the start
      // This is a heuristic - if content barely extends past the first page margin, the second page might be blank
      // We'll rely on the warning in didDrawPage to identify this in the console
    }

    // Convert to blob
    const blob = doc.output('blob');
    console.log('[convertToPDF] PDF blob created, size:', blob.size, 'bytes');
    return blob;
  } catch (error) {
    console.error('[convertToPDF] PDF conversion error:', error);
    console.error('[convertToPDF] Error stack:', error.stack);
    throw error;
  }
};

/**
 * Extract cell styling from ExcelJS cell
 * @param {object} cell - ExcelJS cell object
 * @returns {object} Style object for jsPDF
 */
const extractCellStyle = (cell) => {
  const style = {};

  // Extract fill color
  if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
    const argb = cell.fill.fgColor.argb;
    if (argb) {
      // Convert ARGB to RGB array
      const r = parseInt(argb.substring(2, 4), 16);
      const g = parseInt(argb.substring(4, 6), 16);
      const b = parseInt(argb.substring(6, 8), 16);
      style.fillColor = [r, g, b];
    }
  }

  // Extract font properties
  if (cell.font) {
    // Font color
    if (cell.font.color && cell.font.color.argb) {
      const argb = cell.font.color.argb;
      const r = parseInt(argb.substring(2, 4), 16);
      const g = parseInt(argb.substring(4, 6), 16);
      const b = parseInt(argb.substring(6, 8), 16);
      style.textColor = [r, g, b];
    }

    // Font style (bold, italic)
    const fontStyles = [];
    if (cell.font.bold) fontStyles.push('bold');
    if (cell.font.italic) fontStyles.push('italic');
    if (fontStyles.length > 0) {
      style.fontStyle = fontStyles.join('');
    }

    // Font size
    if (cell.font.size) {
      style.fontSize = cell.font.size;
    }
  }

  // Extract alignment
  if (cell.alignment) {
    // Horizontal alignment
    if (cell.alignment.horizontal) {
      const halign = {
        'left': 'left',
        'center': 'center',
        'right': 'right'
      }[cell.alignment.horizontal] || 'left';
      style.halign = halign;
    }

    // Vertical alignment
    if (cell.alignment.vertical) {
      const valign = {
        'top': 'top',
        'middle': 'middle',
        'bottom': 'bottom'
      }[cell.alignment.vertical] || 'top';
      style.valign = valign;
    }
  }

  // Extract border information
  const borders = {};
  if (cell.border) {
    // Check each side for borders
    if (cell.border.top && cell.border.top.style && cell.border.top.style !== 'none') {
      borders.top = true;
      if (cell.border.top.color && cell.border.top.color.argb) {
        const argb = cell.border.top.color.argb;
        borders.topColor = [
          parseInt(argb.substring(2, 4), 16),
          parseInt(argb.substring(4, 6), 16),
          parseInt(argb.substring(6, 8), 16)
        ];
      }
    }
    if (cell.border.bottom && cell.border.bottom.style && cell.border.bottom.style !== 'none') {
      borders.bottom = true;
      if (cell.border.bottom.color && cell.border.bottom.color.argb) {
        const argb = cell.border.bottom.color.argb;
        borders.bottomColor = [
          parseInt(argb.substring(2, 4), 16),
          parseInt(argb.substring(4, 6), 16),
          parseInt(argb.substring(6, 8), 16)
        ];
      }
    }
    if (cell.border.left && cell.border.left.style && cell.border.left.style !== 'none') {
      borders.left = true;
      if (cell.border.left.color && cell.border.left.color.argb) {
        const argb = cell.border.left.color.argb;
        borders.leftColor = [
          parseInt(argb.substring(2, 4), 16),
          parseInt(argb.substring(4, 6), 16),
          parseInt(argb.substring(6, 8), 16)
        ];
      }
    }
    if (cell.border.right && cell.border.right.style && cell.border.right.style !== 'none') {
      borders.right = true;
      if (cell.border.right.color && cell.border.right.color.argb) {
        const argb = cell.border.right.color.argb;
        borders.rightColor = [
          parseInt(argb.substring(2, 4), 16),
          parseInt(argb.substring(4, 6), 16),
          parseInt(argb.substring(6, 8), 16)
        ];
      }
    }
  }

  if (Object.keys(borders).length > 0) {
    style.borders = borders;
  }

  return style;
};

/**
 * Fallback PDF conversion without formatting (original implementation)
 * @param {object} workbook - XLSX workbook object
 * @returns {Promise<Blob>} PDF blob
 */
const convertToPDFBasic = async (workbook) => {
  console.log('[convertToPDFBasic] Using basic conversion without formatting');

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  const columnCount = range.e.c - range.s.c + 1;
  const rowCount = range.e.r - range.s.r + 1;
  const orientation = columnCount > 8 ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation: orientation,
    unit: 'pt',
    format: 'letter'
  });

  // Extract data
  const rows = [];
  for (let R = range.s.r; R <= range.e.r; ++R) {
    const row = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];

      let value = '';
      if (cell) {
        if (cell.t === 'n') {
          if (cell.z && cell.z.includes('$')) {
            value = `$${parseFloat(cell.v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
          } else if (cell.z && cell.z.includes('#,##0')) {
            value = parseFloat(cell.v).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          } else {
            value = String(cell.v);
          }
        } else {
          value = String(cell.v || '');
        }
      }
      row.push(value);
    }
    rows.push(row);
  }

  let fontSize = 9;
  let cellPadding = 2;
  let startY = 20;

  if (rowCount > 50) {
    fontSize = 5;
    cellPadding = 1;
    startY = 10;
  } else if (rowCount > 30) {
    fontSize = 6;
    cellPadding = 1.5;
    startY = 15;
  } else if (rowCount > 20) {
    fontSize = 7;
    cellPadding = 2;
    startY = 15;
  }

  autoTable(doc, {
    head: rows.length > 0 ? [rows[0]] : [],
    body: rows.slice(1),
    startY: startY,
    styles: {
      fontSize: fontSize,
      cellPadding: cellPadding,
      overflow: 'linebreak',
      cellWidth: 'auto'
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: fontSize
    },
    columnStyles: generateColumnStyles(rows[0]?.length || 0),
    margin: { top: startY, right: 15, bottom: 15, left: 15 },
    tableWidth: 'auto',
    showHead: 'firstPage',
    theme: 'plain'
  });

  return doc.output('blob');
};

/**
 * Generate column styles for PDF table
 * @param {number} columnCount
 * @returns {object} Column styles
 */
function generateColumnStyles(columnCount) {
  const styles = {};
  for (let i = 0; i < columnCount; i++) {
    styles[i] = { cellWidth: 'auto' };
  }
  return styles;
}

/**
 * Download PDF file to user's computer
 * @param {Blob} blob - PDF blob
 * @param {string} fileName - Filename without extension
 */
export const downloadInvoice = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.pdf`;
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Generate invoice filename
 * @param {string} creatorName - Creator name
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {string} Sanitized filename
 */
export const generateInvoiceFileName = (creatorName, startDate, endDate) => {
  // Sanitize creator name (remove special characters)
  const sanitized = creatorName.replace(/[^a-zA-Z0-9]/g, '_');

  // Format dates (remove hyphens)
  const start = startDate.replace(/-/g, '');
  const end = endDate.replace(/-/g, '');

  return `Invoice_${sanitized}_${start}_${end}`;
};

// ============================================================================
// MAIN INVOICE GENERATION
// ============================================================================

/**
 * Generate invoice for a creator with error handling
 * @param {number} creatorId - Creator ID
 * @param {object} dateRange - { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
 * @param {object} templateWorkbook - XLSX workbook object
 * @param {object} mapping - Cell mapping configuration
 * @returns {Promise<object>} Result object { success, fileName, postCount, error }
 */
export const generateInvoice = async (creatorId, dateRange, templateWorkbook, mapping, creatorData = null) => {
  try {
    console.log('[generateInvoice] Starting invoice generation for creator:', creatorId);
    console.log('[generateInvoice] Date range:', dateRange);

    // Load template workbook from localStorage if not provided
    let workbook = templateWorkbook;
    if (!workbook) {
      console.log('[generateInvoice] Loading workbook from localStorage...');
      workbook = getTemplateWorkbook();
      if (!workbook) {
        throw new Error('No template workbook found. Please upload a template first.');
      }
      console.log('[generateInvoice] Workbook loaded successfully');
    }

    // Fetch invoice data
    console.log('[generateInvoice] Fetching invoice data...');
    const data = await getCreatorInvoiceData(creatorId, dateRange.start, dateRange.end, creatorData);
    console.log('[generateInvoice] Invoice data fetched:', data.posts.length, 'posts');

    if (data.posts.length === 0) {
      console.warn(`No posts found for creator ${data.creator.name} in date range`);
      // Continue with zero values
    }

    // Clone workbook to avoid mutating original
    const workbookCopy = XLSX.utils.book_new();
    Object.keys(workbook.Sheets).forEach(sheetName => {
      const sheet = Object.assign({}, workbook.Sheets[sheetName]);
      XLSX.utils.book_append_sheet(workbookCopy, sheet, sheetName);
    });

    // Populate template with data
    console.log('[generateInvoice] Populating template with data...');
    populateTemplate(workbookCopy, data, mapping);
    console.log('[generateInvoice] Template populated successfully');

    // Convert to PDF
    console.log('[generateInvoice] Converting to PDF...');
    const pdfBlob = await convertToPDF(workbookCopy);
    console.log('[generateInvoice] PDF conversion complete');

    // Generate filename
    const fileName = generateInvoiceFileName(
      data.creator.name,
      dateRange.start,
      dateRange.end
    );
    console.log('[generateInvoice] Generated filename:', fileName);

    // Download
    console.log('[generateInvoice] Initiating download...');
    downloadInvoice(pdfBlob, fileName);
    console.log('[generateInvoice] Download initiated successfully');

    return {
      success: true,
      fileName,
      postCount: data.posts.length,
      totalCost: data.totals.totalCost
    };
  } catch (error) {
    console.error('[generateInvoice] Invoice generation failed:', error);
    console.error('[generateInvoice] Error stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================================================
// DATE VALIDATION
// ============================================================================

/**
 * Validate date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start > today) {
    return { valid: false, error: 'Start date cannot be in the future' };
  }

  // Optional: limit to reasonable range (2 years)
  const maxRange = 730; // days
  const daysDiff = (end - start) / (1000 * 60 * 60 * 24);

  if (daysDiff > maxRange) {
    return { valid: false, error: 'Date range too large (max 2 years)' };
  }

  return { valid: true };
};
