import { useState, useCallback } from 'react';
import { updateCreator as updateCreatorInDB } from '../services/creatorsServiceSupabase';
import { uploadAndParseContract, applyContractDataToCreator } from '../services/contractService';
import { useToast } from '../contexts/ToastContext';

const EMPTY_MANUAL_DATA = {
  legalName: '',
  legalAddress: '',
  city: '',
  pincode: '',
  country: '',
  businessName: '',
  email: '',
  network: '',
  currency: 'USD',
  walletAddress: '',
  costPerPost: '',
  poNumber: '',
};

/**
 * Contract upload state machine (Roster-only feature).
 *
 * Manages:
 * - PDF upload + AI parsing flow
 * - Contract preview modal (parsed data)
 * - Manual contract entry modal
 * - Editing existing contract details
 *
 * @param {object} options
 * @param {Array}    options.creators    - Current creators list
 * @param {Function} options.setCreators - State setter
 */
export default function useContractUpload({ creators, setCreators }) {
  // Upload state
  const [uploadingContract, setUploadingContract] = useState(false);
  const [contractProgress, setContractProgress] = useState({ stage: '', progress: 0 });

  // Parsed result
  const [parsedContract, setParsedContract] = useState(null);
  const [contractStoragePath, setContractStoragePath] = useState(null);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [contractCreatorId, setContractCreatorId] = useState(null);

  // Manual entry
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualContractData, setManualContractData] = useState(EMPTY_MANUAL_DATA);

  const toast = useToast();

  // -------------------------------------------------------------------------
  // Upload handler
  // -------------------------------------------------------------------------
  const handleContractUpload = useCallback(async (event, creatorId) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const creator = creators.find((c) => c.id === creatorId);
    const creatorName = creator ? creator.name : 'creator';

    // Reset file input
    event.target.value = '';
    setParsedContract(null);
    setContractStoragePath(null);
    setUploadingContract(true);
    setContractProgress({ stage: 'Uploading...', progress: 0 });
    setContractCreatorId(creatorId);

    try {
      const result = await uploadAndParseContract(file, creatorId, setContractProgress);

      if (result.success) {
        setContractStoragePath(result.storagePath);

        // Update creator record with contract file path
        if (result.storagePath) {
          const updatedCreator = await updateCreatorInDB(creatorId, {
            contractFilePath: result.storagePath,
            contractUploadedAt: new Date().toISOString(),
          });

          if (updatedCreator) {
            setCreators(creators.map((c) => (c.id === creatorId ? updatedCreator : c)));
          }
        }

        if (result.mode === 'manual') {
          // No Claude API key - show manual entry form
          setUploadingContract(false);
          setShowManualEntry(true);
        } else {
          // Auto-parsed mode
          setParsedContract(result.data);
          setShowContractPreview(true);
          setUploadingContract(false);
        }
      } else {
        toast.error(`Failed to upload contract for ${creatorName}: ${result.error || 'Unknown error'}`);
        setUploadingContract(false);
      }
    } catch (error) {
      console.error('Contract upload error:', error);
      toast.error(`Failed to upload contract for ${creatorName}: ${error.message}`);
      setUploadingContract(false);
    }
  }, [creators, setCreators, toast]);

  // -------------------------------------------------------------------------
  // Apply parsed contract data
  // -------------------------------------------------------------------------
  const applyContractData = useCallback(async () => {
    if (!parsedContract || !contractCreatorId) return;

    try {
      const updatedCreator = await applyContractDataToCreator(
        contractCreatorId,
        parsedContract,
        contractStoragePath
      );

      setCreators((prev) => prev.map((c) => (c.id === contractCreatorId ? updatedCreator : c)));
      toast.success('Contract data applied successfully!');
      setShowContractPreview(false);
      setParsedContract(null);
      setContractStoragePath(null);
      setContractCreatorId(null);
    } catch (error) {
      console.error('Error applying contract data:', error);
      toast.error('Failed to apply contract data: ' + error.message);
    }
  }, [parsedContract, contractCreatorId, contractStoragePath, setCreators, toast]);

  // -------------------------------------------------------------------------
  // Apply manual contract data
  // -------------------------------------------------------------------------
  const applyManualContractData = useCallback(async () => {
    if (!contractCreatorId) return;

    try {
      const updates = {};
      Object.entries(manualContractData).forEach(([key, value]) => {
        if (value) updates[key] = value;
      });

      const updatedCreator = await updateCreatorInDB(contractCreatorId, updates);

      if (updatedCreator) {
        setCreators((prev) => prev.map((c) => (c.id === contractCreatorId ? updatedCreator : c)));
        toast.success('Contract data saved successfully!');
      } else {
        // Fallback to local update
        setCreators((prev) => prev.map((c) => (c.id === contractCreatorId ? { ...c, ...updates } : c)));
        toast.info('Contract data saved locally!');
      }

      setShowManualEntry(false);
      setManualContractData(EMPTY_MANUAL_DATA);
      setContractCreatorId(null);
      setContractStoragePath(null);
    } catch (error) {
      console.error('Error saving manual contract data:', error);
      toast.error('Failed to save contract data: ' + error.message);
    }
  }, [contractCreatorId, manualContractData, setCreators, toast]);

  // -------------------------------------------------------------------------
  // Open manual editor pre-populated with existing data
  // -------------------------------------------------------------------------
  const startEditContractDetails = useCallback((creator, e) => {
    if (e) e.stopPropagation();

    setManualContractData({
      legalName: creator.legalName || creator.legal_name || '',
      legalAddress: creator.legalAddress || creator.legal_address || '',
      city: creator.city || '',
      pincode: creator.pincode || '',
      country: creator.country || '',
      businessName: creator.businessName || creator.business_name || '',
      email: creator.email || '',
      network: creator.network || '',
      currency: creator.currency || 'USD',
      walletAddress: creator.walletAddress || creator.wallet_address || '',
      costPerPost: creator.costPerPost || creator.cost_per_post || '',
      poNumber: creator.poNumber || creator.po_number || '',
    });

    setContractCreatorId(creator.id);
    setShowManualEntry(true);
  }, []);

  // -------------------------------------------------------------------------
  // Cancel / close helpers
  // -------------------------------------------------------------------------
  const cancelContractPreview = useCallback(() => {
    setShowContractPreview(false);
    setParsedContract(null);
    setContractCreatorId(null);
  }, []);

  const cancelManualEntry = useCallback(() => {
    setShowManualEntry(false);
    setManualContractData(EMPTY_MANUAL_DATA);
    setContractCreatorId(null);
  }, []);

  return {
    // Upload state
    uploadingContract,
    contractProgress,
    contractCreatorId,

    // Parsed preview
    parsedContract,
    showContractPreview,
    applyContractData,
    cancelContractPreview,

    // Manual entry
    showManualEntry,
    manualContractData,
    setManualContractData,
    applyManualContractData,
    cancelManualEntry,

    // Actions
    handleContractUpload,
    startEditContractDetails,
  };
}
