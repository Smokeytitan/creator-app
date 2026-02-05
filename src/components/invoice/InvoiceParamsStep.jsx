/**
 * Invoice Parameters Step
 * Second step: select date range and creators for invoice generation
 */

import React, { useState, useMemo } from 'react';
import { Calendar, FileText, AlertCircle, Loader } from 'lucide-react';
import { validateDateRange, generateInvoice } from '../../services/invoiceService';

const InvoiceParamsStep = ({ creators, templateWorkbook, templateMapping, onComplete }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCreatorIds, setSelectedCreatorIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState([]);
  const [dateError, setDateError] = useState(null);

  // Filtered creators based on search
  const filteredCreators = useMemo(() => {
    if (!searchTerm) return creators;
    const search = searchTerm.toLowerCase();
    return creators.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.handle?.toLowerCase().includes(search)
    );
  }, [creators, searchTerm]);

  // Handle date change with validation
  const handleDateChange = (field, value) => {
    if (field === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }

    // Validate when both dates are set
    if ((field === 'start' && endDate) || (field === 'end' && startDate)) {
      const start = field === 'start' ? value : startDate;
      const end = field === 'end' ? value : endDate;

      const validation = validateDateRange(start, end);
      setDateError(validation.valid ? null : validation.error);
    }
  };

  // Toggle creator selection
  const toggleCreator = (creatorId) => {
    const newSelection = new Set(selectedCreatorIds);
    if (newSelection.has(creatorId)) {
      newSelection.delete(creatorId);
    } else {
      newSelection.add(creatorId);
    }
    setSelectedCreatorIds(newSelection);
  };

  // Select/deselect all
  const handleSelectAll = () => {
    if (selectedCreatorIds.size === filteredCreators.length) {
      setSelectedCreatorIds(new Set());
    } else {
      setSelectedCreatorIds(new Set(filteredCreators.map(c => c.id)));
    }
  };

  // Generate invoices
  const handleGenerate = async () => {
    if (!startDate || !endDate || selectedCreatorIds.size === 0) {
      return;
    }

    const validation = validateDateRange(startDate, endDate);
    if (!validation.valid) {
      setDateError(validation.error);
      return;
    }

    setGenerating(true);
    setErrors([]);
    setProgress({ current: 0, total: selectedCreatorIds.size });

    const selectedCreators = creators.filter(c => selectedCreatorIds.has(c.id));
    const results = [];

    for (let i = 0; i < selectedCreators.length; i++) {
      const creator = selectedCreators[i];
      setProgress({ current: i + 1, total: selectedCreatorIds.size });

      try {
        const result = await generateInvoice(
          creator.id,
          { start: startDate, end: endDate },
          templateWorkbook,
          templateMapping
        );

        results.push({
          creatorId: creator.id,
          creatorName: creator.name,
          ...result
        });

        // Small delay between generations
        if (i < selectedCreators.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        results.push({
          creatorId: creator.id,
          creatorName: creator.name,
          success: false,
          error: error.message
        });
      }
    }

    // Collect errors
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      setErrors(failedResults.map(r => `${r.creatorName}: ${r.error}`));
    }

    setGenerating(false);

    // Call completion handler with results
    if (onComplete) {
      onComplete(results);
    }
  };

  const canGenerate = startDate && endDate && selectedCreatorIds.size > 0 && !dateError && !generating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-polygon-text-primary mb-2">
          Generate Invoices
        </h3>
        <p className="text-sm text-polygon-text-secondary">
          Select the date range and creators to generate PDF invoices.
        </p>
      </div>

      {/* Date Range Selection */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-polygon-text-primary flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Invoice Period
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-polygon-text-secondary mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-white/[0.12] rounded-polygon bg-transparent text-polygon-text-primary focus:outline-none focus:border-polygon-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-polygon-text-secondary mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-white/[0.12] rounded-polygon bg-transparent text-polygon-text-primary focus:outline-none focus:border-polygon-primary"
            />
          </div>
        </div>
        {dateError && (
          <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{dateError}</p>
          </div>
        )}
      </div>

      {/* Creator Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-polygon-text-primary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Select Creators
          </h4>
          <span className="text-xs text-polygon-text-secondary">
            {selectedCreatorIds.size} selected
          </span>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search creators..."
          className="w-full px-3 py-2 border border-white/[0.12] rounded-polygon bg-transparent text-polygon-text-primary placeholder-polygon-text-tertiary focus:outline-none focus:border-polygon-primary text-sm"
        />

        {/* Select All */}
        <button
          onClick={handleSelectAll}
          className="text-xs text-polygon-primary hover:text-polygon-primary-light"
        >
          {selectedCreatorIds.size === filteredCreators.length ? 'Deselect All' : 'Select All'}
        </button>

        {/* Creators List */}
        <div className="max-h-64 overflow-y-auto border border-white/[0.12] rounded-lg">
          {filteredCreators.map((creator) => {
            const isSelected = selectedCreatorIds.has(creator.id);
            return (
              <label
                key={creator.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer border-b border-white/[0.06] last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCreator(creator.id)}
                  className="w-4 h-4 rounded border-white/[0.12] text-polygon-primary focus:ring-polygon-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-polygon-text-primary">
                    {creator.name}
                  </div>
                  <div className="text-xs text-polygon-text-secondary">
                    {creator.handle || 'No handle'}
                    {creator.posts && ` • ${creator.posts.length} posts`}
                  </div>
                </div>
              </label>
            );
          })}
          {filteredCreators.length === 0 && (
            <div className="text-center py-8 text-polygon-text-secondary text-sm">
              No creators found
            </div>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-red-400">Generation Errors:</h5>
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generation Progress */}
      {generating && (
        <div className="flex items-center justify-center gap-3 p-4 bg-white/[0.02] border border-white/[0.12] rounded-lg">
          <Loader className="w-5 h-5 animate-spin text-polygon-primary" />
          <span className="text-sm text-polygon-text-primary">
            Generating invoices... {progress.current} of {progress.total}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/[0.12]">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="flex-1 btn-polygon-primary rounded-polygon-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Generate {selectedCreatorIds.size} Invoice{selectedCreatorIds.size !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
};

export default InvoiceParamsStep;
