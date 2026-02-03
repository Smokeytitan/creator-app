/**
 * CSV Export Usage Examples
 * Demonstrates how to use the csvExport utility
 */

import { exportCampaignsToCSV, downloadCSV, exportAndDownload } from './csvExport';

// ============================================================================
// EXAMPLE 1: Basic Export with Download
// ============================================================================

function basicExportExample(campaigns) {
  // Simple export with auto-download
  exportAndDownload(campaigns);

  // Custom filename
  exportAndDownload(campaigns, {}, 'q1_campaigns');
}

// ============================================================================
// EXAMPLE 2: Export with Filters
// ============================================================================

function exportWithFiltersExample(campaigns) {
  const filters = {
    status: 'completed',
    search: 'polygon',
    dateRange: {
      start: '2024-01-01',
      end: '2024-03-31'
    }
  };

  exportAndDownload(campaigns, filters, 'filtered_campaigns');
}

// ============================================================================
// EXAMPLE 3: Generate CSV Content Only (No Download)
// ============================================================================

function generateCSVContentExample(campaigns) {
  const filters = { status: 'in-progress' };

  // Get CSV content as string
  const csvContent = exportCampaignsToCSV(campaigns, filters);

  // Use the content however you want:
  console.log(csvContent);

  // Send to API
  // await sendToAPI(csvContent);

  // Copy to clipboard
  // navigator.clipboard.writeText(csvContent);

  return csvContent;
}

// ============================================================================
// EXAMPLE 4: Manual Download with Custom Settings
// ============================================================================

function customDownloadExample(campaigns) {
  // Generate CSV
  const csvContent = exportCampaignsToCSV(campaigns);

  // Trigger download with custom filename
  downloadCSV(csvContent, 'custom_report_name');
}

// ============================================================================
// EXAMPLE 5: In a React Component
// ============================================================================

/*
import { useState } from 'react';
import { Download } from 'lucide-react';
import { exportAndDownload } from '../utils/csvExport';
import { useToast } from '../components/Toast';

function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  const handleExport = () => {
    try {
      const filters = {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      };

      exportAndDownload(campaigns, filters, 'campaign_export');

      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error('Failed to export CSV: ' + error.message);
    }
  };

  return (
    <div>
      <button
        onClick={handleExport}
        className="btn-editorial-primary flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export to CSV
      </button>
    </div>
  );
}
*/

// ============================================================================
// EXAMPLE 6: Campaign Data Structure
// ============================================================================

const exampleCampaign = {
  id: 1234567890,
  title: 'Q1 2024 Product Launch',
  description: 'Promote new NFT marketplace launch',
  status: 'completed',
  estimatedCost: 5000,
  estimatedImpressions: 250000,
  actualCost: 4800,
  actualImpressions: 275000,
  createdAt: '2024-01-15T10:00:00Z',
  posts: [
    {
      id: 1,
      impressions: 100000,
      cost: 1600,
      platform: 'X',
      date: '2024-01-20'
    },
    {
      id: 2,
      impressions: 175000,
      cost: 3200,
      platform: 'Instagram',
      date: '2024-01-22'
    }
  ],
  creators: [
    {
      id: 1,
      name: 'Alice Chen',
      handle: '@alicechen',
      costPerPost: 1600,
      platforms: ['X', 'Instagram']
    },
    {
      id: 2,
      name: 'Bob Martinez',
      handle: '@bobmartinez',
      costPerPost: 1200,
      platforms: ['X', 'YouTube']
    }
  ]
};

// ============================================================================
// EXAMPLE 7: CSV Output Structure
// ============================================================================

/*
Expected CSV Output:

CAMPAIGN DATA EXPORT
Export Date,2/2/2026 11:30:00 PM
Filter Status,completed

campaign_id,campaign_title,description,status,created_at,creators_count,creator_names,posts_delivered,data_confidence,estimated_impressions,estimated_impressions_formatted,actual_impressions,actual_impressions_formatted,impressions_vs_estimate_pct,estimated_cost_usd,estimated_cost_formatted,actual_cost_usd,actual_cost_formatted,cost_vs_estimate_pct,estimated_cpm_usd,estimated_cpm_formatted,actual_cpm_usd,actual_cpm_formatted
1234567890,Q1 2024 Product Launch,Promote new NFT marketplace launch,completed,1/15/2024,2,"Alice Chen; Bob Martinez",2,measured,250000,"250,000",275000,"275,000",10.00,5000.00,"$5,000.00",4800.00,"$4,800.00",-4.00,20.00,$20.00,17.45,$17.45

SUMMARY
metric,value
total_campaigns,1
total_posts_delivered,2
total_estimated_impressions,250000
total_estimated_impressions_formatted,"250,000"
total_actual_impressions,275000
total_actual_impressions_formatted,"275,000"
total_estimated_cost_usd,5000.00
total_estimated_cost_formatted,"$5,000.00"
total_actual_cost_usd,4800.00
total_actual_cost_formatted,"$4,800.00"
avg_estimated_cpm_usd,20.00
avg_estimated_cpm_formatted,$20.00
avg_actual_cpm_usd,17.45
avg_actual_cpm_formatted,$17.45
impressions_variance_pct,10.00
cost_variance_pct,-4.00
campaigns_measured,1
campaigns_partial,0
campaigns_estimated,0
*/
