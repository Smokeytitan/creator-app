/**
 * Template Upload Step
 * First step in invoice generation: upload Excel template and map data fields to cells
 */

import React, { useState, useRef } from 'react';
import { Upload, Save, AlertCircle } from 'lucide-react';
import ExcelPreview from './ExcelPreview';
import FieldMappingDialog from './FieldMappingDialog';
import { uploadTemplate, validateTemplateFile, saveTemplateMapping } from '../../services/invoiceService';

const TemplateUploadStep = ({ onComplete, initialWorkbook, initialMapping }) => {
  const [workbook, setWorkbook] = useState(initialWorkbook || null);
  const [uploadedFile, setUploadedFile] = useState(null); // Store original file for Supabase upload
  const [mappings, setMappings] = useState(initialMapping?.mappings || {});
  const [templateName, setTemplateName] = useState(initialMapping?.templateName || 'Invoice Template');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateTemplateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setUploading(true);

    try {
      const wb = await uploadTemplate(file);
      setWorkbook(wb);
      setUploadedFile(file); // Store file for Supabase upload
      setMappings({}); // Reset mappings when new template uploaded
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle cell click for mapping
  const handleCellClick = (cellAddress, rowIndex, colIndex) => {
    setSelectedCell(cellAddress);
    setShowMappingDialog(true);
  };

  // Handle field mapping save
  const handleSaveMapping = (cellAddress, fieldConfig) => {
    if (fieldConfig === null) {
      // Clear mapping
      const newMappings = { ...mappings };
      delete newMappings[cellAddress];
      setMappings(newMappings);
    } else {
      // Add/update mapping
      setMappings({
        ...mappings,
        [cellAddress]: fieldConfig
      });
    }
  };

  // Save template configuration
  const handleSaveTemplate = async () => {
    if (!workbook) {
      setError('No template uploaded');
      return;
    }

    if (Object.keys(mappings).length === 0) {
      setError('Please map at least one field');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const config = {
        templateName,
        sheetName: workbook.SheetNames[0],
        mappings
      };

      // Save to Supabase (throws error if not configured)
      await saveTemplateMapping(config, uploadedFile, workbook);

      // Success - complete the step
      onComplete(workbook, config);
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err.message || 'Failed to save template configuration');
    } finally {
      setSaving(false);
    }
  };

  const mappedCount = Object.keys(mappings).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-polygon-text-primary mb-2">
          Upload Invoice Template
        </h3>
        <p className="text-sm text-polygon-text-secondary">
          Upload your Excel invoice template and map data fields to cells. This configuration will be saved for future use.
        </p>
      </div>

      {/* Template Name Input */}
      <div>
        <label className="block text-sm font-medium text-polygon-text-primary mb-2">
          Template Name
        </label>
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="My Invoice Template"
          className="w-full px-3 py-2 border border-white/[0.12] rounded-polygon bg-transparent text-polygon-text-primary placeholder-polygon-text-tertiary focus:outline-none focus:border-polygon-primary"
        />
      </div>

      {/* File Upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center px-4 py-2 btn-polygon-primary rounded-polygon-button text-sm shadow-polygon disabled:opacity-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : workbook ? 'Change Template' : 'Upload Template'}
        </button>
        <p className="text-xs text-polygon-text-secondary mt-2">
          Supported formats: .xlsx, .xls (max 5MB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Excel Preview */}
      {workbook && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-polygon-text-primary">
              Template Preview
            </h4>
            <span className="text-xs text-polygon-text-secondary">
              {mappedCount} field{mappedCount !== 1 ? 's' : ''} mapped
            </span>
          </div>
          <ExcelPreview
            workbook={workbook}
            onCellClick={handleCellClick}
            mappedCells={mappings}
          />
        </div>
      )}

      {/* Mapped Fields Summary */}
      {mappedCount > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-polygon-text-primary">
            Mapped Fields
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(mappings).map(([cellAddress, fieldConfig]) => (
              <div
                key={cellAddress}
                className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg"
              >
                <span className="text-xs text-polygon-text-secondary font-mono">
                  {cellAddress}
                </span>
                <span className="text-xs text-polygon-text-primary truncate ml-2">
                  {fieldConfig.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/[0.12]">
        <button
          onClick={handleSaveTemplate}
          disabled={!workbook || mappedCount === 0 || saving}
          className="flex-1 btn-polygon-primary rounded-polygon-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 inline mr-2" />
          {saving ? 'Saving...' : 'Save Template & Continue'}
        </button>
      </div>

      {/* Field Mapping Dialog */}
      <FieldMappingDialog
        isOpen={showMappingDialog}
        onClose={() => setShowMappingDialog(false)}
        cellAddress={selectedCell}
        onSave={handleSaveMapping}
        currentMapping={selectedCell ? mappings[selectedCell] : null}
      />
    </div>
  );
};

export default TemplateUploadStep;
