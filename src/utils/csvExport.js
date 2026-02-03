/**
 * CSV Export Utility for Campaign Data
 * Provides analyst-ready exports with raw and formatted data columns
 *
 * Features:
 * - Metadata header with export date and applied filters
 * - Raw numeric columns alongside formatted ones
 * - Data confidence indicators
 * - Performance variance columns
 * - Summary section with totals
 * - Clean snake_case column names
 * - Null-safe value handling
 */

/**
 * Format number with commas (e.g., 150000 -> "150,000")
 */
const formatNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? '0' : num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

/**
 * Format currency (e.g., 2500 -> "$2,500.00")
 */
const formatCurrency = (value) => {
  const num = Number(value);
  return isNaN(num) ? '$0.00' : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Safe number conversion - returns 0 for null/undefined/invalid values
 */
const safeNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Calculate data confidence based on posts delivered
 * - "measured": Has actual post data (posts > 0)
 * - "partial": Has some data but incomplete (0 < posts < expected)
 * - "estimated": No actual data, only estimates (posts = 0)
 */
const calculateConfidence = (campaign) => {
  const postsDelivered = campaign.posts?.length || 0;
  const creatorsCount = campaign.creators?.length || 0;

  if (postsDelivered === 0) return 'estimated';
  if (postsDelivered < creatorsCount) return 'partial';
  return 'measured';
};

/**
 * Calculate variance percentage
 * Returns percentage difference: (actual - estimated) / estimated * 100
 */
const calculateVariance = (actual, estimated) => {
  const actualNum = safeNumber(actual);
  const estimatedNum = safeNumber(estimated);

  if (estimatedNum === 0) return 0;

  return ((actualNum - estimatedNum) / estimatedNum) * 100;
};

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Export campaigns to analyst-ready CSV format
 *
 * @param {Array} campaigns - Array of campaign objects
 * @param {Object} filters - Applied filters (status, creatorId, search, dateRange, etc.)
 * @returns {string} CSV file content
 *
 * Campaign object structure:
 * {
 *   id: number,
 *   title: string,
 *   description: string,
 *   status: string,
 *   estimatedCost: number,
 *   estimatedImpressions: number,
 *   actualCost: number,
 *   actualImpressions: number,
 *   createdAt: string,
 *   posts: Array<{ impressions, cost, ... }>,
 *   creators: Array<{ id, name, handle, ... }>
 * }
 */
export function exportCampaignsToCSV(campaigns, filters = {}) {
  // Validate input
  if (!Array.isArray(campaigns)) {
    console.error('exportCampaignsToCSV: campaigns must be an array');
    return '';
  }

  const exportDate = new Date();
  const timestamp = exportDate.toISOString().split('T')[0];

  // ============================================================================
  // METADATA HEADER
  // ============================================================================

  let csv = 'CAMPAIGN DATA EXPORT\n';
  csv += `Export Date,${exportDate.toLocaleDateString('en-US')} ${exportDate.toLocaleTimeString('en-US')}\n`;

  // Add filter information
  if (filters.status && filters.status !== 'all') {
    csv += `Filter Status,${filters.status}\n`;
  }
  if (filters.creatorId && filters.creatorId !== 'all') {
    csv += `Filter Creator ID,${filters.creatorId}\n`;
  }
  if (filters.search) {
    csv += `Search Term,${escapeCSV(filters.search)}\n`;
  }
  if (filters.dateRange) {
    csv += `Date Range,${filters.dateRange.start} to ${filters.dateRange.end}\n`;
  }

  csv += '\n';

  // ============================================================================
  // DATA SECTION
  // ============================================================================

  if (campaigns.length === 0) {
    csv += 'No campaigns to export\n';
    return csv;
  }

  // Define column headers (clean snake_case names)
  const headers = [
    'campaign_id',
    'campaign_title',
    'description',
    'status',
    'created_at',
    'creators_count',
    'creator_names',
    'posts_delivered',
    'data_confidence',
    'estimated_impressions',
    'estimated_impressions_formatted',
    'actual_impressions',
    'actual_impressions_formatted',
    'impressions_vs_estimate_pct',
    'estimated_cost_usd',
    'estimated_cost_formatted',
    'actual_cost_usd',
    'actual_cost_formatted',
    'cost_vs_estimate_pct',
    'estimated_cpm_usd',
    'estimated_cpm_formatted',
    'actual_cpm_usd',
    'actual_cpm_formatted'
  ];

  // Write headers
  csv += headers.join(',') + '\n';

  // Track totals for summary
  let totalEstimatedImpressions = 0;
  let totalActualImpressions = 0;
  let totalEstimatedCost = 0;
  let totalActualCost = 0;
  let totalPostsDelivered = 0;

  // Write data rows
  campaigns.forEach(campaign => {
    // Extract and calculate metrics
    const campaignId = campaign.id || '';
    const title = campaign.title || 'Untitled Campaign';
    const description = campaign.description || '';
    const status = campaign.status || 'pending';
    const createdAt = campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString('en-US') : '';

    const creatorsCount = campaign.creators?.length || 0;
    const creatorNames = (campaign.creators || []).map(c => c.name || 'Unknown').join('; ');

    const postsDelivered = campaign.posts?.length || 0;
    const dataConfidence = calculateConfidence(campaign);

    const estimatedImpressions = safeNumber(campaign.estimatedImpressions);
    const actualImpressions = safeNumber(campaign.actualImpressions);
    const impressionsVariance = calculateVariance(actualImpressions, estimatedImpressions);

    const estimatedCost = safeNumber(campaign.estimatedCost);
    const actualCost = safeNumber(campaign.actualCost);
    const costVariance = calculateVariance(actualCost, estimatedCost);

    // Calculate CPM (Cost Per Mille/Thousand)
    const estimatedCpm = estimatedImpressions > 0 ? (estimatedCost / estimatedImpressions) * 1000 : 0;
    const actualCpm = actualImpressions > 0 ? (actualCost / actualImpressions) * 1000 : 0;

    // Update totals
    totalEstimatedImpressions += estimatedImpressions;
    totalActualImpressions += actualImpressions;
    totalEstimatedCost += estimatedCost;
    totalActualCost += actualCost;
    totalPostsDelivered += postsDelivered;

    // Build row data
    const row = [
      campaignId,
      escapeCSV(title),
      escapeCSV(description),
      status,
      createdAt,
      creatorsCount,
      escapeCSV(creatorNames),
      postsDelivered,
      dataConfidence,
      estimatedImpressions,
      formatNumber(estimatedImpressions),
      actualImpressions,
      formatNumber(actualImpressions),
      impressionsVariance.toFixed(2),
      estimatedCost.toFixed(2),
      formatCurrency(estimatedCost),
      actualCost.toFixed(2),
      formatCurrency(actualCost),
      costVariance.toFixed(2),
      estimatedCpm.toFixed(2),
      formatCurrency(estimatedCpm),
      actualCpm.toFixed(2),
      formatCurrency(actualCpm)
    ];

    csv += row.join(',') + '\n';
  });

  // ============================================================================
  // SUMMARY SECTION
  // ============================================================================

  csv += '\n';
  csv += 'SUMMARY\n';
  csv += 'metric,value\n';
  csv += `total_campaigns,${campaigns.length}\n`;
  csv += `total_posts_delivered,${totalPostsDelivered}\n`;
  csv += `total_estimated_impressions,${totalEstimatedImpressions}\n`;
  csv += `total_estimated_impressions_formatted,${formatNumber(totalEstimatedImpressions)}\n`;
  csv += `total_actual_impressions,${totalActualImpressions}\n`;
  csv += `total_actual_impressions_formatted,${formatNumber(totalActualImpressions)}\n`;
  csv += `total_estimated_cost_usd,${totalEstimatedCost.toFixed(2)}\n`;
  csv += `total_estimated_cost_formatted,${formatCurrency(totalEstimatedCost)}\n`;
  csv += `total_actual_cost_usd,${totalActualCost.toFixed(2)}\n`;
  csv += `total_actual_cost_formatted,${formatCurrency(totalActualCost)}\n`;

  // Calculate average CPM across all campaigns
  const avgEstimatedCpm = totalEstimatedImpressions > 0 ? (totalEstimatedCost / totalEstimatedImpressions) * 1000 : 0;
  const avgActualCpm = totalActualImpressions > 0 ? (totalActualCost / totalActualImpressions) * 1000 : 0;

  csv += `avg_estimated_cpm_usd,${avgEstimatedCpm.toFixed(2)}\n`;
  csv += `avg_estimated_cpm_formatted,${formatCurrency(avgEstimatedCpm)}\n`;
  csv += `avg_actual_cpm_usd,${avgActualCpm.toFixed(2)}\n`;
  csv += `avg_actual_cpm_formatted,${formatCurrency(avgActualCpm)}\n`;

  // Overall variance
  const totalImpressionsVariance = calculateVariance(totalActualImpressions, totalEstimatedImpressions);
  const totalCostVariance = calculateVariance(totalActualCost, totalEstimatedCost);

  csv += `impressions_variance_pct,${totalImpressionsVariance.toFixed(2)}\n`;
  csv += `cost_variance_pct,${totalCostVariance.toFixed(2)}\n`;

  // Data confidence distribution
  const measured = campaigns.filter(c => calculateConfidence(c) === 'measured').length;
  const partial = campaigns.filter(c => calculateConfidence(c) === 'partial').length;
  const estimated = campaigns.filter(c => calculateConfidence(c) === 'estimated').length;

  csv += `campaigns_measured,${measured}\n`;
  csv += `campaigns_partial,${partial}\n`;
  csv += `campaigns_estimated,${estimated}\n`;

  return csv;
}

/**
 * Trigger CSV download in browser
 *
 * @param {string} csvContent - CSV file content
 * @param {string} filename - Desired filename (without extension)
 */
export function downloadCSV(csvContent, filename = 'campaign_export') {
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${timestamp}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fullFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Export campaigns to CSV and trigger download
 *
 * @param {Array} campaigns - Array of campaign objects
 * @param {Object} filters - Applied filters
 * @param {string} filename - Optional custom filename
 */
export function exportAndDownload(campaigns, filters = {}, filename = 'campaign_data') {
  const csvContent = exportCampaignsToCSV(campaigns, filters);
  downloadCSV(csvContent, filename);
}

export default {
  exportCampaignsToCSV,
  downloadCSV,
  exportAndDownload
};
