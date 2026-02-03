# Utility Components Documentation

This document provides detailed information about the new utility components created for the Creator App.

## Table of Contents

1. [Toast Notification System](#toast-notification-system)
2. [CSV Export Utility](#csv-export-utility)

---

## Toast Notification System

**File:** `/src/components/Toast.jsx`

A complete toast notification system to replace `alert()` calls throughout the application.

### Features

- Four toast variants: success, error, warning, info
- Auto-dismiss after configurable duration (default: 5 seconds)
- Manual dismiss with X button
- Smooth slide-in animation from right
- Stack multiple toasts vertically
- Icons for visual identification
- Accessible (ARIA roles, keyboard navigation)
- Uses existing `slide-in-right` CSS animation

### Installation

1. Wrap your app with the `ToastProvider`:

```jsx
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ToastProvider>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

### Basic Usage

```jsx
import { useToast } from './components/Toast';

function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Campaign created!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### API Reference

#### `useToast()` Hook

Returns an object with the following methods:

| Method | Signature | Description | Default Duration |
|--------|-----------|-------------|------------------|
| `success()` | `success(message, duration?)` | Show success toast (green) | 5000ms |
| `error()` | `error(message, duration?)` | Show error toast (red) | 7000ms |
| `warning()` | `warning(message, duration?)` | Show warning toast (yellow) | 5000ms |
| `info()` | `info(message, duration?)` | Show info toast (blue) | 5000ms |
| `removeToast()` | `removeToast(id)` | Manually remove a toast | N/A |

#### Toast Variants

| Variant | Color | Icon | Use Case |
|---------|-------|------|----------|
| `success` | Green | CheckCircle | Successful operations, confirmations |
| `error` | Red | AlertCircle | Errors, failures, critical issues |
| `warning` | Yellow | AlertTriangle | Warnings, validation issues |
| `info` | Blue | Info | General information, tips |

### Examples

#### Replace `alert()` calls

**Before:**
```jsx
alert('Campaign deleted successfully');
```

**After:**
```jsx
const toast = useToast();
toast.success('Campaign deleted successfully');
```

#### Form Validation

```jsx
const toast = useToast();

const handleSubmit = (data) => {
  if (!data.title) {
    toast.warning('Campaign title is required');
    return;
  }

  if (!data.creators.length) {
    toast.warning('Please select at least one creator');
    return;
  }

  // Continue with submission...
};
```

#### API Error Handling

```jsx
const toast = useToast();

const deleteCampaign = async (id) => {
  try {
    await api.deleteCampaign(id);
    toast.success('Campaign deleted successfully');
    refreshList();
  } catch (error) {
    if (error.status === 403) {
      toast.error('You do not have permission to delete this campaign');
    } else {
      toast.error('Failed to delete campaign: ' + error.message);
    }
  }
};
```

#### Long-running Operations

```jsx
const toast = useToast();

const exportData = async () => {
  // Show indefinite toast (duration = 0)
  const toastId = toast.info('Exporting data...', 0);

  try {
    await performLongExport();
    toast.removeToast(toastId);
    toast.success('Export complete! Check your downloads.');
  } catch (error) {
    toast.removeToast(toastId);
    toast.error('Export failed: ' + error.message);
  }
};
```

### Customization

To customize toast styles, edit the color classes in `/src/components/Toast.jsx`:

```jsx
const variantClasses = {
  success: 'bg-green-900/90 border-green-500/50 text-green-100',
  error: 'bg-red-900/90 border-red-500/50 text-red-100',
  // ... modify as needed
};
```

---

## CSV Export Utility

**File:** `/src/utils/csvExport.js`

An improved CSV export function designed for analyst-ready exports with raw and formatted data columns.

### Features

- **Metadata Header**: Export date and applied filters
- **Dual Columns**: Raw numeric values alongside formatted ones
- **Data Confidence**: Indicators for measured/partial/estimated data
- **Performance Metrics**: Variance columns comparing actual vs. estimated
- **Summary Section**: Totals and aggregates at the end
- **Clean Column Names**: snake_case for easy data analysis
- **Null-Safe**: Gracefully handles missing/invalid values
- **Excel/Google Sheets Compatible**: Works in all major spreadsheet tools

### Column Structure

The export includes the following columns:

#### Campaign Information
- `campaign_id` - Unique campaign identifier
- `campaign_title` - Campaign name
- `description` - Campaign description
- `status` - Current status (pending, in-progress, completed, cancelled)
- `created_at` - Creation date
- `creators_count` - Number of creators assigned
- `creator_names` - Semicolon-separated list of creator names
- `posts_delivered` - Number of posts delivered

#### Data Quality
- `data_confidence` - measured | partial | estimated

#### Impressions (Dual Format)
- `estimated_impressions` - Raw number (e.g., 150000)
- `estimated_impressions_formatted` - Formatted (e.g., "150,000")
- `actual_impressions` - Raw number
- `actual_impressions_formatted` - Formatted
- `impressions_vs_estimate_pct` - Variance percentage

#### Cost (Dual Format)
- `estimated_cost_usd` - Raw number (e.g., 2500.00)
- `estimated_cost_formatted` - Formatted (e.g., "$2,500.00")
- `actual_cost_usd` - Raw number
- `actual_cost_formatted` - Formatted
- `cost_vs_estimate_pct` - Variance percentage

#### CPM (Dual Format)
- `estimated_cpm_usd` - Raw CPM value
- `estimated_cpm_formatted` - Formatted CPM
- `actual_cpm_usd` - Raw CPM value
- `actual_cpm_formatted` - Formatted CPM

### Usage

#### Basic Export

```jsx
import { exportAndDownload } from '../utils/csvExport';

function CampaignList({ campaigns }) {
  const handleExport = () => {
    exportAndDownload(campaigns);
    // Downloads: campaign_data_2024-03-15.csv
  };

  return (
    <button onClick={handleExport}>
      Export to CSV
    </button>
  );
}
```

#### Export with Filters

```jsx
import { exportAndDownload } from '../utils/csvExport';

function CampaignList({ campaigns, filterStatus, searchTerm }) {
  const handleExport = () => {
    const filters = {
      status: filterStatus !== 'all' ? filterStatus : undefined,
      search: searchTerm || undefined,
      dateRange: {
        start: '2024-01-01',
        end: '2024-03-31'
      }
    };

    exportAndDownload(campaigns, filters, 'q1_campaigns');
    // Downloads: q1_campaigns_2024-03-15.csv
  };

  return <button onClick={handleExport}>Export Filtered Data</button>;
}
```

#### With Toast Notifications

```jsx
import { exportAndDownload } from '../utils/csvExport';
import { useToast } from '../components/Toast';

function CampaignList({ campaigns }) {
  const toast = useToast();

  const handleExport = () => {
    try {
      exportAndDownload(campaigns);
      toast.success(`Exported ${campaigns.length} campaigns to CSV`);
    } catch (error) {
      toast.error('Failed to export CSV: ' + error.message);
    }
  };

  return <button onClick={handleExport}>Export</button>;
}
```

#### Generate CSV Content Only

```jsx
import { exportCampaignsToCSV } from '../utils/csvExport';

function MyComponent({ campaigns }) {
  const handleGenerateCSV = () => {
    const csvContent = exportCampaignsToCSV(campaigns);

    // Use the CSV content:
    console.log(csvContent);
    // Send to API
    // Copy to clipboard
    // etc.
  };
}
```

### API Reference

#### `exportCampaignsToCSV(campaigns, filters)`

Generates CSV content as a string.

**Parameters:**
- `campaigns` (Array, required) - Array of campaign objects
- `filters` (Object, optional) - Filter metadata to include in header
  - `status` (string) - Status filter applied
  - `creatorId` (number) - Creator ID filter
  - `search` (string) - Search term
  - `dateRange` (object) - Date range with `start` and `end` properties

**Returns:** String (CSV content)

#### `downloadCSV(csvContent, filename)`

Triggers a CSV file download in the browser.

**Parameters:**
- `csvContent` (string, required) - CSV file content
- `filename` (string, optional) - Base filename without extension (default: 'campaign_export')

**Returns:** void

#### `exportAndDownload(campaigns, filters, filename)`

All-in-one function that generates CSV and triggers download.

**Parameters:**
- `campaigns` (Array, required) - Array of campaign objects
- `filters` (Object, optional) - Filter metadata
- `filename` (string, optional) - Base filename (default: 'campaign_data')

**Returns:** void

### Campaign Data Structure

The utility expects campaign objects with the following structure:

```javascript
{
  id: number,
  title: string,
  description: string,
  status: string, // 'pending' | 'in-progress' | 'completed' | 'cancelled'
  estimatedCost: number,
  estimatedImpressions: number,
  actualCost: number,
  actualImpressions: number,
  createdAt: string, // ISO date string
  posts: Array<{
    id: number,
    impressions: number,
    cost: number,
    platform: string,
    date: string
  }>,
  creators: Array<{
    id: number,
    name: string,
    handle: string,
    costPerPost: number,
    platforms: string[]
  }>
}
```

### Data Confidence Calculation

The `data_confidence` column is calculated as follows:

- **`measured`**: Campaign has actual post data (posts delivered ≥ creators assigned)
- **`partial`**: Campaign has some data but is incomplete (0 < posts < creators)
- **`estimated`**: Campaign has no actual data, only estimates (posts = 0)

### CSV Output Example

```csv
CAMPAIGN DATA EXPORT
Export Date,2/2/2026 11:30:00 PM
Filter Status,completed

campaign_id,campaign_title,description,status,created_at,creators_count,creator_names,posts_delivered,data_confidence,estimated_impressions,estimated_impressions_formatted,actual_impressions,actual_impressions_formatted,impressions_vs_estimate_pct,estimated_cost_usd,estimated_cost_formatted,actual_cost_usd,actual_cost_formatted,cost_vs_estimate_pct,estimated_cpm_usd,estimated_cpm_formatted,actual_cpm_usd,actual_cpm_formatted
1234567890,Q1 Product Launch,NFT marketplace launch,completed,1/15/2024,2,"Alice Chen; Bob Martinez",2,measured,250000,"250,000",275000,"275,000",10.00,5000.00,"$5,000.00",4800.00,"$4,800.00",-4.00,20.00,$20.00,17.45,$17.45

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
```

### Integration Example

Replace existing export function in `ContentRequestsEditorial.jsx`:

```jsx
import { exportAndDownload } from '../utils/csvExport';
import { useToast } from '../components/Toast';

function ContentRequestsEditorial() {
  const toast = useToast();

  // Replace existing exportCampaignsToCSV function
  const handleExportCampaigns = () => {
    try {
      const filters = {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      };

      exportAndDownload(filteredRequests, filters, 'campaigns');

      toast.success(`Exported ${filteredRequests.length} campaigns successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export campaigns');
    }
  };

  return (
    <button onClick={handleExportCampaigns}>
      <Download className="w-4 h-4" />
      Export to CSV
    </button>
  );
}
```

---

## Best Practices

### Toast Notifications

1. **Use appropriate types**: Match toast type to the action
   - `success` for completed actions
   - `error` for failures
   - `warning` for validation issues
   - `info` for neutral information

2. **Keep messages concise**: Users should understand at a glance
   - Good: "Campaign created successfully!"
   - Bad: "Your campaign has been successfully created and saved to the database. You can now view it in the campaigns list."

3. **Be specific about errors**:
   - Good: "Failed to upload: File size exceeds 5MB"
   - Bad: "An error occurred"

4. **Don't overuse**: Only show toasts for important feedback

### CSV Exports

1. **Include relevant filters**: Always pass current filters to provide context
2. **Use descriptive filenames**: Help users identify exports later
3. **Show feedback**: Use toast notifications to confirm export success
4. **Handle errors gracefully**: Wrap exports in try-catch and show error toasts

---

## Dependencies

### Toast Component
- React 19+
- Lucide React (for icons)
- Tailwind CSS (for styling)

### CSV Export
- None (vanilla JavaScript)

---

## Browser Compatibility

Both utilities are compatible with:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern browsers with ES6+ support

---

## License

These utilities are part of the Creator App project.
