/**
 * Field Mapping Dialog
 * Modal dialog for mapping Excel cells to data fields
 */

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

// Available fields for mapping
const AVAILABLE_FIELDS = {
  creator: {
    label: 'Creator Info',
    fields: [
      { field: 'creator.name', label: 'Creator Name (Display Name)', format: 'text' },
      { field: 'creator.handle', label: 'Creator Handle', format: 'text' },
      { field: 'creator.legalName', label: 'Legal Name (from Contract)', format: 'text' },
      { field: 'creator.legalAddress', label: 'Legal Address (from Contract)', format: 'text' },
      { field: 'creator.city', label: 'City (from Contract)', format: 'text' },
      { field: 'creator.pincode', label: 'Pincode/Zip (from Contract)', format: 'text' },
      { field: 'creator.country', label: 'Country (from Contract)', format: 'text' },
      { field: 'creator.address', label: 'Address (from Contract)', format: 'text' },
      { field: 'creator.businessName', label: 'Business Name (from Contract)', format: 'text' },
      { field: 'creator.email', label: 'Email (from Contract)', format: 'text' },
      { field: 'creator.network', label: 'Network (from Contract)', format: 'text' },
      { field: 'creator.walletAddress', label: 'Wallet Address (from Contract)', format: 'text' },
      { field: 'creator.costPerPost', label: 'Cost Per Post', format: 'currency' },
      { field: 'creator.currency', label: 'Currency (from Contract)', format: 'text' },
      { field: 'creator.poNumber', label: 'PO Number (from Contract)', format: 'text' },
      { field: 'creator.platforms', label: 'Platforms (comma-separated)', format: 'text' }
    ]
  },
  invoiceDates: {
    label: 'Invoice Dates',
    fields: [
      { field: 'invoiceDates.invoiceNumber', label: 'Invoice Number (MMYY format, e.g., 0226)', format: 'text' },
      { field: 'invoiceDates.generated', label: 'Invoice Date (YYYY-MM-DD)', format: 'date' },
      { field: 'invoiceDates.generatedFormatted', label: 'Invoice Date (MM/DD/YYYY)', format: 'text' },
      { field: 'invoiceDates.due', label: 'Due Date (YYYY-MM-DD)', format: 'date' },
      { field: 'invoiceDates.dueFormatted', label: 'Due Date (MM/DD/YYYY)', format: 'text' }
    ]
  },
  dateRange: {
    label: 'Invoice Period',
    fields: [
      { field: 'dateRange.start', label: 'Start Date', format: 'date' },
      { field: 'dateRange.end', label: 'End Date', format: 'date' },
      { field: 'dateRange.label', label: 'Period Label (e.g., "Jan 1-31, 2026")', format: 'text' }
    ]
  },
  contract: {
    label: 'Contract Details',
    fields: [
      { field: 'contract.legalName', label: 'Legal Name (from Contract)', format: 'text' },
      { field: 'contract.legalAddress', label: 'Legal Address (from Contract)', format: 'text' },
      { field: 'contract.city', label: 'City (from Contract)', format: 'text' },
      { field: 'contract.pincode', label: 'Pincode/Zip (from Contract)', format: 'text' },
      { field: 'contract.country', label: 'Country (from Contract)', format: 'text' },
      { field: 'contract.address', label: 'Address (from Contract)', format: 'text' },
      { field: 'contract.businessName', label: 'Business Name (from Contract)', format: 'text' },
      { field: 'contract.email', label: 'Email (from Contract)', format: 'text' },
      { field: 'contract.network', label: 'Network (from Contract)', format: 'text' },
      { field: 'contract.walletAddress', label: 'Wallet Address (from Contract)', format: 'text' },
      { field: 'contract.costPerPost', label: 'Contract Cost Per Post', format: 'currency' },
      { field: 'contract.currency', label: 'Currency (from Contract)', format: 'text' },
      { field: 'contract.poNumber', label: 'PO Number (from Contract)', format: 'text' },
      { field: 'contract.platforms', label: 'Contract Platforms', format: 'text' },
      { field: 'contract.startDate', label: 'Contract Start Date', format: 'date' },
      { field: 'contract.endDate', label: 'Contract End Date', format: 'date' },
      { field: 'contract.paymentSchedule', label: 'Payment Schedule', format: 'text' },
      { field: 'contract.deliverables', label: 'Deliverables', format: 'text' },
      { field: 'contract.exclusivity', label: 'Exclusivity Terms', format: 'text' }
    ]
  },
  totals: {
    label: 'Summary Totals',
    fields: [
      { field: 'totals.postCount', label: 'Total Posts', format: 'number' },
      { field: 'totals.totalCost', label: 'Total Amount (Posts × Cost Per Post)', format: 'currency' },
      { field: 'totals.totalImpressions', label: 'Total Impressions', format: 'number' },
      { field: 'totals.avgImpressions', label: 'Average Impressions', format: 'number' },
      { field: 'totals.avgCPM', label: 'Average CPM', format: 'currency' },
      { field: 'totals.totalEngagements', label: 'Total Engagements', format: 'number' },
      { field: 'totals.engagementRate', label: 'Engagement Rate (%)', format: 'number' }
    ]
  },
  posts: {
    label: 'Posts List (Array - will expand rows)',
    fields: [
      { field: 'posts', label: 'Posts Array Start', type: 'array', columns: {
        'A': { field: 'date', format: 'date' },
        'B': { field: 'description', format: 'text' },
        'C': { field: 'platform', format: 'text' },
        'D': { field: 'cost', format: 'currency' },
        'E': { field: 'impressions', format: 'number' },
        'F': { field: 'likes', format: 'number' },
        'G': { field: 'comments', format: 'number' },
        'H': { field: 'link', format: 'text' }
      }}
    ]
  }
};

const FieldMappingDialog = ({ isOpen, onClose, cellAddress, onSave, currentMapping }) => {
  const [selectedCategory, setSelectedCategory] = useState('creator');
  const [selectedField, setSelectedField] = useState(currentMapping?.field || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!selectedField) return;

    // Find the field configuration
    let fieldConfig = null;
    Object.values(AVAILABLE_FIELDS).forEach(category => {
      const found = category.fields.find(f => f.field === selectedField);
      if (found) fieldConfig = found;
    });

    if (fieldConfig) {
      onSave(cellAddress, fieldConfig);
      onClose();
    }
  };

  const handleClearMapping = () => {
    onSave(cellAddress, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card-polygon rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-polygon-text-primary">
                Map Field to Cell {cellAddress}
              </h3>
              <p className="text-sm text-polygon-text-secondary mt-1">
                Select which data field should populate this cell
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-polygon-text-secondary hover:text-polygon-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-4 border-b border-white/[0.12] overflow-x-auto">
            {Object.entries(AVAILABLE_FIELDS).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`
                  px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === key
                    ? 'text-polygon-primary border-b-2 border-polygon-primary'
                    : 'text-polygon-text-secondary hover:text-polygon-text-primary'
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Fields List */}
          <div className="space-y-2 mb-6">
            {AVAILABLE_FIELDS[selectedCategory].fields.map((field) => {
              const isSelected = selectedField === field.field;

              return (
                <button
                  key={field.field}
                  onClick={() => setSelectedField(field.field)}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg border transition-all
                    ${isSelected
                      ? 'border-polygon-primary bg-polygon-primary/10 text-polygon-text-primary'
                      : 'border-white/[0.12] hover:border-white/[0.24] text-polygon-text-secondary hover:text-polygon-text-primary'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-polygon-text-primary">
                        {field.label}
                      </div>
                      <div className="text-xs text-polygon-text-tertiary mt-1">
                        {field.field}
                        {field.format && ` • Format: ${field.format}`}
                        {field.type === 'array' && ' • Expands rows dynamically'}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-polygon-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!selectedField}
              className="flex-1 btn-polygon-primary rounded-polygon-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 inline mr-2" />
              Save Mapping
            </button>
            {currentMapping && (
              <button
                onClick={handleClearMapping}
                className="btn-polygon-secondary rounded-polygon-button px-4 py-2"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-polygon-secondary rounded-polygon-button px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldMappingDialog;
