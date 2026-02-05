/**
 * Invoice Generator Modal - Simplified
 * Month/year picker for generating monthly invoices
 */

import React, { useState } from 'react';
import { X, Calendar, Download, Loader, AlertCircle } from 'lucide-react';
import { getTemplateMapping, hasTemplateConfigured, generateInvoice } from '../../services/invoiceService';

const InvoiceGeneratorModal = ({ isOpen, onClose, creator }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Generate last 6 months
  const getLastSixMonths = () => {
    const months = [];
    const today = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({ label: monthName, value });
    }

    return months;
  };

  const monthOptions = getLastSixMonths();

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setError(null);

    // Check if template is configured
    if (!hasTemplateConfigured()) {
      setError('Please upload an invoice template first from the main roster page.');
      return;
    }

    if (!selectedMonth) {
      setError('Please select a month and year.');
      return;
    }

    // Convert selected month (YYYY-MM) to start and end dates
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1); // First day of month
    const endDate = new Date(year, month, 0); // Last day of month

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    setGenerating(true);

    try {
      const templateMapping = getTemplateMapping();
      const result = await generateInvoice(
        creator.id,
        { start: startDateStr, end: endDateStr },
        null, // workbook will be loaded from localStorage
        templateMapping,
        creator // pass creator data for placeholder mode
      );

      if (result.success) {
        // Close modal on success
        onClose();
        // Reset form
        setSelectedMonth('');
      } else {
        setError(result.error || 'Failed to generate invoice');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setSelectedMonth('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleClose}>
      <div
        className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Generate Invoice
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {creator.name}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Month Picker */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                <Calendar className="w-4 h-4" />
                Select Invoice Month
              </label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] text-sm cursor-pointer appearance-none"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23999\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">Select a month...</option>
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                Invoice will include all posts from the selected month
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedMonth}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent-primary)] rounded-lg hover:bg-[var(--color-accent-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGeneratorModal;
