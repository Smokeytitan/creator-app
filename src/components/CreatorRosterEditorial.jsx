import { useState, useRef, useMemo } from 'react';
import { Upload, Plus, Trash2, FileText, X, DollarSign, Edit2, Search, Filter, SortAsc, Download, Eye, RefreshCw, Calendar, FileSpreadsheet, FileUp } from 'lucide-react';
import { IMPORTED_CREATORS } from '../data/importedCreators';
import { deleteCreator as deleteCreatorFromDB, createCreator, updateCreator as updateCreatorInDB, addPost as addPostToDB, updatePost as updatePostInDB, deletePost as deletePostFromDB, getCreators } from '../services/creatorsServiceSupabase';
import { importExcelWorkbook } from '../services/excelImportService';
import { uploadAndParseContract, applyContractDataToCreator, formatParsedDataForPreview } from '../services/contractService';
import InvoiceGeneratorModal from './invoice/InvoiceGeneratorModal';
import TemplateUploadStep from './invoice/TemplateUploadStep';

export default function CreatorRosterEditorial({ creators, setCreators }) {
  const resetToImportedData = () => {
    if (confirm('This will replace all current creator data with the data from Google Sheets. Are you sure?')) {
      setCreators(IMPORTED_CREATORS);
      alert('Creator data has been reset to imported data from Google Sheets!');
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
  const [viewingPostsId, setViewingPostsId] = useState(null);
  const [addingPostId, setAddingPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postForm, setPostForm] = useState({ description: '', date: '', cost: 0, link: '', impressions: 0 });
  const excelFileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  // Contract upload state
  const contractInputRef = useRef(null);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [contractProgress, setContractProgress] = useState({ stage: '', progress: 0 });
  const [parsedContract, setParsedContract] = useState(null);
  const [contractStoragePath, setContractStoragePath] = useState(null);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [contractCreatorId, setContractCreatorId] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualContractData, setManualContractData] = useState({
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
    poNumber: ''
  });

  // Invoice generation state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedCreatorForInvoice, setSelectedCreatorForInvoice] = useState(null);
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivity, setFilterActivity] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const AVAILABLE_PLATFORMS = ['X', 'TikTok', 'Instagram', 'YouTube', 'Facebook'];

  const togglePlatform = (platform) => {
    const platforms = editForm.platforms || [];
    if (platforms.includes(platform)) {
      setEditForm({ ...editForm, platforms: platforms.filter(p => p !== platform) });
    } else {
      setEditForm({ ...editForm, platforms: [...platforms, platform] });
    }
  };

  const startEdit = (creator) => {
    setEditingId(creator.id);
    setIsAdding(false);
    setEditForm({
      name: creator.name,
      handle: creator.handle,
      notes: creator.notes || '',
      costPerPost: creator.costPerPost || '',
      platforms: creator.platforms || []
    });
  };

  const startAdd = () => {
    console.log('Starting to add new creator');
    setIsAdding(true);
    setEditingId(null);
    setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
  };

  const saveEdit = async (creatorId) => {
    try {
      const updatedCreator = await updateCreatorInDB(creatorId, editForm);
      if (updatedCreator) {
        setCreators(creators.map((c) =>
          c.id === creatorId ? updatedCreator : c
        ));
        setEditingId(null);
        setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
      } else {
        // Fallback: update local state if Supabase update fails
        console.warn('Supabase update failed, updating local state only');
        setCreators(creators.map((c) =>
          c.id === creatorId ? { ...c, ...editForm } : c
        ));
        setEditingId(null);
        setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
      }
    } catch (error) {
      console.error('Error updating creator:', error);
      // Fallback: update local state if error occurs
      console.warn('Error occurred, updating local state only');
      setCreators(creators.map((c) =>
        c.id === creatorId ? { ...c, ...editForm } : c
      ));
      setEditingId(null);
      setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
    }
  };

  const saveNew = async () => {
    if (!editForm.name.trim()) {
      alert('Name is required');
      return;
    }

    try {
      console.log('Creating new creator with data:', editForm);
      const newCreator = await createCreator({
        name: editForm.name,
        handle: editForm.handle || '@' + editForm.name.toLowerCase().replace(/\s+/g, '_'),
        notes: editForm.notes,
        costPerPost: editForm.costPerPost,
        platforms: editForm.platforms || []
      });

      console.log('Creator created successfully:', newCreator);
      setCreators([...creators, newCreator]);
      setIsAdding(false);
      setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
    } catch (error) {
      console.error('Failed to create creator:', error);
      alert('Failed to create creator: ' + error.message);
    }
  };

  const deleteCreator = async (creatorId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this creator?')) {
      const success = await deleteCreatorFromDB(creatorId);
      if (success) {
        setCreators(creators.filter(c => c.id !== creatorId));
      } else {
        alert('Failed to delete creator');
      }
    }
  };

  const toggleViewPosts = (creatorId, e) => {
    e.stopPropagation();
    setViewingPostsId(viewingPostsId === creatorId ? null : creatorId);
    setAddingPostId(null);
  };

  const startAddPost = (creatorId, e) => {
    e.stopPropagation();
    const creator = creators.find(c => c.id === creatorId);
    setAddingPostId(creatorId);
    setPostForm({
      description: '',
      date: new Date().toISOString().split('T')[0],
      cost: Number(creator?.costPerPost) || 0,
      link: '',
      impressions: 0
    });
  };

  const cancelAddPost = (e) => {
    e.stopPropagation();
    setAddingPostId(null);
    setPostForm({ description: '', date: '', cost: 0, link: '', impressions: 0 });
  };

  const savePost = (creatorId, e) => {
    e.stopPropagation();
    if (!postForm.description.trim()) {
      alert('Description is required');
      return;
    }

    const newPost = {
      id: Date.now(),
      description: postForm.description,
      date: postForm.date || new Date().toISOString().split('T')[0],
      cost: Number(postForm.cost) || 0,
      link: postForm.link,
      impressions: Number(postForm.impressions) || 0
    };

    setCreators(creators.map(c => {
      if (c.id === creatorId) {
        return {
          ...c,
          posts: [...(c.posts || []), newPost]
        };
      }
      return c;
    }));

    setAddingPostId(null);
    setPostForm({ description: '', date: '', cost: 0, link: '', impressions: 0 });
  };

  const deletePost = (creatorId, postId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this post?')) {
      setCreators(creators.map(c => {
        if (c.id === creatorId) {
          return {
            ...c,
            posts: (c.posts || []).filter(p => p.id !== postId)
          };
        }
        return c;
      }));
    }
  };

  const startEditPost = (post, e) => {
    e.stopPropagation();
    setEditingPostId(post.id);
    setAddingPostId(null);
    setPostForm({
      description: post.description,
      date: post.date,
      cost: Number(post.cost) || 0,
      link: post.link || '',
      impressions: Number(post.impressions) || 0
    });
  };

  const cancelEditPost = (e) => {
    e.stopPropagation();
    setEditingPostId(null);
    setPostForm({ description: '', date: '', cost: 0, link: '', impressions: 0 });
  };

  const saveEditPost = (creatorId, postId, e) => {
    e.stopPropagation();
    if (!postForm.description.trim()) {
      alert('Description is required');
      return;
    }

    setCreators(creators.map(c => {
      if (c.id === creatorId) {
        return {
          ...c,
          posts: (c.posts || []).map(p => {
            if (p.id === postId) {
              return {
                ...p,
                description: postForm.description,
                date: postForm.date,
                cost: Number(postForm.cost) || 0,
                link: postForm.link,
                impressions: Number(postForm.impressions) || 0
              };
            }
            return p;
          })
        };
      }
      return c;
    }));

    setEditingPostId(null);
    setPostForm({ description: '', date: '', cost: 0, link: '', impressions: 0 });
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Get headers (first row)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Find column indices
    const nameIdx = headers.findIndex(h => h.includes('name'));
    const handleIdx = headers.findIndex(h => h.includes('handle') || h.includes('twitter') || h.includes('username'));
    const notesIdx = headers.findIndex(h => h.includes('note'));
    const costPerPostIdx = headers.findIndex(h => h.includes('cost') && h.includes('post'));

    // Parse data rows
    const creators = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      const creator = {
        id: Date.now() + i,
        name: nameIdx >= 0 ? values[nameIdx] : '',
        handle: handleIdx >= 0 ? values[handleIdx] : '',
        notes: notesIdx >= 0 ? values[notesIdx] : '',
        costPerPost: costPerPostIdx >= 0 ? values[costPerPostIdx] : '',
        posts: []
      };

      // Only add if we have at least a name
      if (creator.name) {
        creators.push(creator);
      }
    }

    return creators;
  };

  const exportToCSV = () => {
    // Use filtered creators for export
    const dataToExport = filteredCreators.length > 0 ? filteredCreators : creators;

    // Prepare CSV data
    const csvRows = dataToExport.map(creator => {
      const posts = creator.posts || [];
      const totalPosts = posts.length;

      // Calculate total spend
      let totalSpend = 0;
      posts.forEach(post => {
        if (post.cost) {
          const cost = Number(post.cost);
          if (!isNaN(cost)) {
            totalSpend += cost;
          }
        }
      });

      return {
        'Name': creator.name,
        'Handle': creator.handle,
        'Cost Per Post': creator.costPerPost || '',
        'Total Posts': totalPosts,
        'Total Spend': totalSpend > 0 ? `$${totalSpend.toFixed(2)}` : '$0.00',
        'Notes': creator.notes || ''
      };
    });

    // Convert to CSV
    let csv = 'CREATOR ROSTER\n';

    // Add filter info
    if (searchTerm) {
      csv += `Search: "${searchTerm}"\n`;
    }
    if (filterActivity !== 'all') {
      csv += `Filter: ${filterActivity === 'active' ? 'Has Posts' : 'No Posts'}\n`;
    }
    if (sortBy !== 'name') {
      csv += `Sort: ${sortBy === 'posts' ? 'By Posts' : 'By Name'}\n`;
    }
    csv += `\nTotal Creators: ${dataToExport.length}\n\n`;

    // Add headers
    const headers = Object.keys(csvRows[0] || {});
    csv += headers.join(',') + '\n';

    // Add data rows
    csvRows.forEach(row => {
      csv += headers.map(header => `"${row[header]}"`).join(',') + '\n';
    });

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `creator_roster_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setImporting(true);

    try {
      const results = await importExcelWorkbook(file);

      // Refresh creators list
      const updatedCreators = await getCreators();
      setCreators(updatedCreators);

      // Show results
      let message = 'Excel Import Complete!\n\n';

      if (results.roster) {
        message += `Creators:\n`;
        message += `  Created: ${results.roster.created.length}\n`;
        message += `  Updated: ${results.roster.updated.length}\n`;
        if (results.roster.errors.length > 0) {
          message += `  Errors: ${results.roster.errors.length}\n`;
        }
        message += '\n';
      }

      if (results.deliverables) {
        message += `Campaigns:\n`;
        message += `  Created: ${results.deliverables.created.length}\n`;
        message += `  Updated: ${results.deliverables.updated.length}\n`;
        message += `  Posts Imported: ${results.deliverables.posts}\n`;
        if (results.deliverables.errors.length > 0) {
          message += `  Errors: ${results.deliverables.errors.length}\n`;
        }
      }

      alert(message);
    } catch (error) {
      console.error('Excel import error:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      // Reset file input
      if (excelFileInputRef.current) {
        excelFileInputRef.current.value = '';
      }
    }
  };

  // Filter and sort creators
  const filteredCreators = useMemo(() => {
    let filtered = [...creators];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.handle.toLowerCase().includes(search)
      );
    }

    // Activity filter
    if (filterActivity !== 'all') {
      if (filterActivity === 'active') {
        filtered = filtered.filter(c => (c.posts || []).length > 0);
      } else if (filterActivity === 'inactive') {
        filtered = filtered.filter(c => (c.posts || []).length === 0);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'posts':
          return ((b.posts || []).length) - ((a.posts || []).length);
        default:
          return 0;
      }
    });

    return filtered;
  }, [creators, searchTerm, filterActivity, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterActivity('all');
    setSortBy('name');
  };

  const hasActiveFilters = searchTerm || filterActivity !== 'all' || sortBy !== 'name';

  // Contract upload handlers
  const handleContractUpload = async (event, creatorId) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📄 Contract upload started:', file.name);

    // Find creator name for better messaging
    const creator = creators.find(c => c.id === creatorId);
    const creatorName = creator ? creator.name : 'creator';

    // Reset
    event.target.value = '';
    setParsedContract(null);
    setContractStoragePath(null);
    setUploadingContract(true);
    setContractProgress({ stage: 'Uploading...', progress: 0 });
    setContractCreatorId(creatorId);

    try {
      // Upload and parse contract
      console.log('📄 Calling uploadAndParseContract...');
      const result = await uploadAndParseContract(file, creatorId, setContractProgress);
      console.log('📄 Result:', result);

      if (result.success) {
        setContractStoragePath(result.storagePath);

        // Update creator record with contract file path
        if (result.storagePath) {
          const updatedCreator = await updateCreatorInDB(creatorId, {
            contractFilePath: result.storagePath,
            contractUploadedAt: new Date().toISOString()
          });

          if (updatedCreator) {
            setCreators(creators.map(c => c.id === creatorId ? updatedCreator : c));
          }
        }

        console.log('📄 Mode:', result.mode);
        if (result.mode === 'manual') {
          // No Claude API key - show manual entry form
          console.log('📄 Opening manual entry form');
          setUploadingContract(false);
          setShowManualEntry(true);
        } else {
          // Auto-parsed mode
          console.log('📄 Opening preview with parsed data');
          setParsedContract(result.data);
          setShowContractPreview(true);
          setUploadingContract(false);
        }
      } else {
        console.error('📄 Upload failed:', result.error);
        alert(`Failed to upload contract for ${creatorName}: ` + (result.error || 'Unknown error'));
        setUploadingContract(false);
      }
    } catch (error) {
      console.error('📄 Contract upload error:', error);
      alert(`Failed to upload contract for ${creatorName}: ` + error.message);
      setUploadingContract(false);
    }
  };

  const applyContractData = async () => {
    if (!parsedContract || !contractCreatorId) return;

    try {
      const updatedCreator = await applyContractDataToCreator(
        contractCreatorId,
        parsedContract,
        contractStoragePath
      );

      // Update local state
      setCreators(prev => prev.map(c => c.id === contractCreatorId ? updatedCreator : c));

      alert('Contract data applied successfully!');
      setShowContractPreview(false);
      setParsedContract(null);
      setContractStoragePath(null);
      setContractCreatorId(null);
    } catch (error) {
      console.error('Error applying contract data:', error);
      alert('Failed to apply contract data: ' + error.message);
    }
  };

  const applyManualContractData = async () => {
    if (!contractCreatorId) return;

    try {
      const updates = {};
      if (manualContractData.legalName) updates.legalName = manualContractData.legalName;
      if (manualContractData.legalAddress) updates.legalAddress = manualContractData.legalAddress;
      if (manualContractData.city) updates.city = manualContractData.city;
      if (manualContractData.pincode) updates.pincode = manualContractData.pincode;
      if (manualContractData.country) updates.country = manualContractData.country;
      if (manualContractData.businessName) updates.businessName = manualContractData.businessName;
      if (manualContractData.email) updates.email = manualContractData.email;
      if (manualContractData.network) updates.network = manualContractData.network;
      if (manualContractData.currency) updates.currency = manualContractData.currency;
      if (manualContractData.walletAddress) updates.walletAddress = manualContractData.walletAddress;
      if (manualContractData.costPerPost) updates.costPerPost = manualContractData.costPerPost;
      if (manualContractData.poNumber) updates.poNumber = manualContractData.poNumber;

      const updatedCreator = await updateCreatorInDB(contractCreatorId, updates);

      if (updatedCreator) {
        setCreators(prev => prev.map(c => c.id === contractCreatorId ? updatedCreator : c));
        alert('Contract data saved successfully!');
      } else {
        // Fallback to local update
        setCreators(prev => prev.map(c => c.id === contractCreatorId ? { ...c, ...updates } : c));
        alert('Contract data saved locally!');
      }

      setShowManualEntry(false);
      setManualContractData({
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
        poNumber: ''
      });
      setContractCreatorId(null);
      setContractStoragePath(null);
    } catch (error) {
      console.error('Error saving manual contract data:', error);
      alert('Failed to save contract data: ' + error.message);
    }
  };

  // Function to open contract details editor for a creator
  const startEditContractDetails = (creator, e) => {
    e.stopPropagation();

    // Pre-populate form with existing creator data
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
      poNumber: creator.poNumber || creator.po_number || ''
    });

    setContractCreatorId(creator.id);
    setShowManualEntry(true);
  };

  const cancelContractPreview = () => {
    setShowContractPreview(false);
    setParsedContract(null);
    setContractCreatorId(null);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="border-b border-[var(--color-border)] pb-8" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-display text-5xl mb-3 text-[var(--color-text-primary)]">
              Creator Roster
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg">
              Manage your content creator network and track campaign performance
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={startAdd}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-lg hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200 text-sm font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Creator</span>
              <span className="sm:hidden">New</span>
            </button>
            <input
              ref={excelFileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleExcelImport}
              className="hidden"
            />
            <button
              onClick={() => excelFileInputRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)] transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{importing ? 'Importing...' : 'Import Excel'}</span>
              <span className="sm:hidden">{importing ? '...' : 'Excel'}</span>
            </button>
            <button
              onClick={() => setShowTemplateUpload(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-500 rounded-lg hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-200 text-sm font-semibold"
              title="Upload invoice template for PDF generation"
            >
              <FileUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Invoice Template</span>
              <span className="sm:hidden">Template</span>
            </button>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)] transition-all duration-200 text-sm font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button
              onClick={resetToImportedData}
              className="inline-flex items-center px-4 py-2 bg-[var(--color-bg-tertiary)] border border-orange-500/30 text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] hover:border-orange-500/50 transition-all duration-200 text-sm font-semibold"
              title="Reset to Google Sheets data"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Reset Data</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="card-editorial p-4" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        {/* Search Bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by name or handle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Filters:</span>
          </div>

          {/* Activity Filter */}
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
          >
            <option value="all">All Activity</option>
            <option value="active">Has Posts</option>
            <option value="inactive">No Posts</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            >
              <option value="name">Sort by Name</option>
              <option value="posts">Sort by Posts</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}

          {/* Results Count */}
          <span className="text-sm text-[var(--color-text-tertiary)] ml-auto text-mono">
            Showing {filteredCreators.length} of {creators.length} creators
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isAdding && (
          <div className="card-editorial p-6 border-2 border-[var(--color-accent-primary)] min-h-[400px]" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
            {console.log('Add creator form is rendering, isAdding:', isAdding)}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Name *</label>
                <input
                  type="text"
                  className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Creator name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Handle</label>
                <input
                  type="text"
                  className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
                  value={editForm.handle}
                  onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Notes</label>
                <input
                  type="text"
                  className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Cost Per Post</label>
                <input
                  type="text"
                  className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
                  value={editForm.costPerPost}
                  onChange={(e) => setEditForm({ ...editForm, costPerPost: e.target.value })}
                  placeholder="e.g., $1,250.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PLATFORMS.map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlatform(platform);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        (editForm.platforms || []).includes(platform)
                          ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white'
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-lg hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200 font-semibold"
                  onClick={(e) => {
                    console.log('Create button clicked!');
                    e.preventDefault();
                    saveNew();
                  }}
                >
                  Create
                </button>
                <button
                  className="flex-1 px-4 py-2 text-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {filteredCreators.map((c, index) => (
          <div
            key={c.id}
            className="card-editorial p-6 hover:shadow-lg transition-shadow cursor-pointer min-h-[400px] flex flex-col"
            onClick={() => !isAdding && editingId !== c.id && startEdit(c)}
            style={{ animation: `fadeInUp 0.4s ease-out ${(index + 1) * 0.05}s both` }}
          >
            {editingId === c.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Name</label>
                  <input
                    type="text"
                    className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Handle</label>
                  <input
                    type="text"
                    className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
                    value={editForm.handle}
                    onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Notes</label>
                  <input
                    type="text"
                    className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Cost Per Post</label>
                  <input
                    type="text"
                    className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
                    value={editForm.costPerPost}
                    onChange={(e) => setEditForm({ ...editForm, costPerPost: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="e.g., $1,250.00"
                  />
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_PLATFORMS.map(platform => (
                      <button
                        key={platform}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlatform(platform);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          (editForm.platforms || []).includes(platform)
                            ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-lg hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200 font-semibold"
                    onClick={() => saveEdit(c.id)}
                  >
                    Save
                  </button>
                  <button
                    className="flex-1 px-4 py-2 text-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{c.name}</h3>
                      {(c.platforms || []).length > 0 && (
                        <div className="flex gap-1">
                          {c.platforms.map(platform => (
                            <span
                              key={platform}
                              className="px-2 py-0.5 text-xs font-medium bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)] rounded-full"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] text-mono">{c.handle}</p>
                  </div>
                  <button
                    onClick={(e) => deleteCreator(c.id, e)}
                    className="p-1 text-[var(--color-text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete creator"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">{c.notes}</p>

                {/* Stats */}
                {(c.posts || []).length > 0 && (() => {
                  const posts = c.posts || [];
                  let totalImpressions = 0;
                  let totalCost = 0;

                  posts.forEach(post => {
                    if (post.impressions) {
                      const impressions = Number(post.impressions);
                      if (!isNaN(impressions)) {
                        totalImpressions += impressions;
                      }
                    }
                    if (post.cost) {
                      const cost = Number(post.cost);
                      if (!isNaN(cost)) {
                        totalCost += cost;
                      }
                    }
                  });

                  const avgImpressions = posts.length > 0 ? Math.round(totalImpressions / posts.length) : 0;
                  const cpm = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;
                  const avgCostPerPost = posts.length > 0 && totalCost > 0 ? totalCost / posts.length : 0;

                  return (
                    <div className="space-y-3 mb-4">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 border border-[var(--color-border)]">
                          <div className="text-xs text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Total Impressions</div>
                          <div className="text-lg font-bold text-[var(--color-text-primary)] text-mono">
                            {totalImpressions.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 border border-[var(--color-border)]">
                          <div className="text-xs text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Avg Impressions</div>
                          <div className="text-lg font-bold text-[var(--color-text-primary)] text-mono">
                            {avgImpressions.toLocaleString()}
                          </div>
                        </div>

                        {totalCost > 0 && (
                          <>
                            <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 border border-[var(--color-border)]">
                              <div className="text-xs text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Total Cost</div>
                              <div className="text-lg font-bold text-[var(--color-accent-secondary)] text-mono">
                                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>

                            {avgCostPerPost > 0 && (
                              <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 border border-[var(--color-border)]">
                                <div className="text-xs text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">Cost/Post</div>
                                <div className="text-lg font-bold text-[var(--color-accent-secondary)] text-mono">
                                  ${avgCostPerPost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {cpm > 0 && (
                          <div className="bg-[var(--color-accent-primary)]/10 rounded-lg p-3 border-2 border-[var(--color-accent-primary)]/30">
                            <div className="text-xs text-[var(--color-accent-primary)] font-medium mb-1 uppercase tracking-wide">CPM (Cost/1K)</div>
                            <div className="text-lg font-bold text-[var(--color-accent-primary)] text-mono">
                              ${cpm.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex-grow"></div>

                <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex gap-2 justify-between">
                  <button
                    onClick={(e) => toggleViewPosts(c.id, e)}
                    className="flex flex-col items-center justify-center gap-1 p-2 flex-1 text-xs bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/20 rounded-lg transition-colors border border-[var(--color-accent-primary)]/20"
                  >
                    <FileText className="h-5 w-5" />
                    <span>View posts</span>
                  </button>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleContractUpload(e, c.id)}
                    className="hidden"
                    id={`contract-upload-${c.id}`}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById(`contract-upload-${c.id}`).click();
                    }}
                    disabled={uploadingContract && contractCreatorId === c.id}
                    className="flex flex-col items-center justify-center gap-1 p-2 flex-1 text-xs bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileUp className="h-5 w-5" />
                    <span>Upload contract</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCreatorForInvoice(c);
                      setShowInvoiceModal(true);
                    }}
                    className="flex flex-col items-center justify-center gap-1 p-2 flex-1 text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"
                  >
                    <Download className="h-5 w-5" />
                    <span>Generate Invoice</span>
                  </button>
                  <button
                    onClick={(e) => startEditContractDetails(c, e)}
                    className="flex flex-col items-center justify-center gap-1 p-2 flex-1 text-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
                  >
                    <Edit2 className="h-5 w-5" />
                    <span>Edit contract details</span>
                  </button>
                </div>

                {viewingPostsId === c.id && (
                  <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Posts</h4>
                      <button
                        onClick={(e) => startAddPost(c.id, e)}
                        className="inline-flex items-center px-2 py-1 text-xs bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-lg hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Post
                      </button>
                    </div>

                    {addingPostId === c.id && (
                      <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 space-y-2 border border-[var(--color-accent-primary)]">
                        <input
                          type="text"
                          placeholder="Description *"
                          className="w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                          value={postForm.description}
                          onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                        />
                        <input
                          type="date"
                          placeholder="Date"
                          className="w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                          value={postForm.date}
                          onChange={(e) => setPostForm({ ...postForm, date: e.target.value })}
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Cost (e.g., 1250.00)"
                          className="w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                          value={postForm.cost}
                          onChange={(e) => setPostForm({ ...postForm, cost: Number(e.target.value) || 0 })}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Impressions"
                          className="w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                          value={postForm.impressions}
                          onChange={(e) => setPostForm({ ...postForm, impressions: Number(e.target.value) || 0 })}
                        />
                        <input
                          type="url"
                          placeholder="Link (optional)"
                          className="w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                          value={postForm.link}
                          onChange={(e) => setPostForm({ ...postForm, link: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => savePost(c.id, e)}
                            className="flex-1 px-3 py-1 text-xs bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-lg hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelAddPost}
                            className="flex-1 px-3 py-1 text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(c.posts || []).length === 0 && addingPostId !== c.id ? (
                        <p className="text-xs text-[var(--color-text-tertiary)] text-center py-2">No posts yet</p>
                      ) : (
                        (c.posts || []).map((post) => (
                          <div key={post.id} className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 text-sm border border-[var(--color-border)]">
                            {editingPostId === post.id ? (
                              <div className="space-y-2 border border-[var(--color-accent-primary)] rounded-lg p-2 bg-[var(--color-bg-primary)]">
                                <input
                                  type="text"
                                  placeholder="Description *"
                                  className="w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                                  value={postForm.description}
                                  onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                                />
                                <input
                                  type="date"
                                  placeholder="Date"
                                  className="w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                                  value={postForm.date}
                                  onChange={(e) => setPostForm({ ...postForm, date: e.target.value })}
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Cost (e.g., 1250.00)"
                                  className="w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                                  value={postForm.cost}
                                  onChange={(e) => setPostForm({ ...postForm, cost: Number(e.target.value) || 0 })}
                                />
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Impressions"
                                  className="w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                                  value={postForm.impressions}
                                  onChange={(e) => setPostForm({ ...postForm, impressions: Number(e.target.value) || 0 })}
                                />
                                <input
                                  type="url"
                                  placeholder="Link (optional)"
                                  className="w-full px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                                  value={postForm.link}
                                  onChange={(e) => setPostForm({ ...postForm, link: e.target.value })}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => saveEditPost(c.id, post.id, e)}
                                    className="flex-1 px-3 py-1 text-xs bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-lg hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditPost}
                                    className="flex-1 px-3 py-1 text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="font-semibold text-[var(--color-text-primary)]">{post.description}</p>
                                    {post.platform && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                                        {post.platform}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-[var(--color-text-secondary)] text-sm">
                                    {post.date && (
                                      <span className="inline-flex items-center text-mono">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {post.date}
                                      </span>
                                    )}
                                    {post.cost && (
                                      <span className="inline-flex items-center text-mono">
                                        <DollarSign className="h-3 w-3 mr-0.5" />
                                        {post.cost}
                                      </span>
                                    )}
                                    {post.impressions && (
                                      <span className="inline-flex items-center text-mono">
                                        <Eye className="h-3 w-3 mr-1" />
                                        {post.impressions} impressions
                                      </span>
                                    )}
                                    {post.likes && (
                                      <span className="inline-flex items-center text-mono">
                                        ❤️ {post.likes} likes
                                      </span>
                                    )}
                                    {post.comments && (
                                      <span className="inline-flex items-center text-mono">
                                        💬 {post.comments} comments
                                      </span>
                                    )}
                                  </div>
                                  {post.link && (
                                    <a
                                      href={post.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] font-medium mt-2 text-sm hover:underline"
                                    >
                                      View Post {post.platform ? `on ${post.platform}` : ''} →
                                    </a>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => startEditPost(post, e)}
                                    className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)] rounded"
                                    title="Edit post"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => deletePost(c.id, post.id, e)}
                                    className="p-1 text-[var(--color-text-tertiary)] hover:text-red-400 rounded"
                                    title="Delete post"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Template Upload Modal */}
      {showTemplateUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowTemplateUpload(false)}>
          <div
            className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  Upload Invoice Template
                </h2>
                <button
                  onClick={() => setShowTemplateUpload(false)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <TemplateUploadStep
                onComplete={() => setShowTemplateUpload(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual Contract Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    Contract Details
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Enter or update contract information for this creator.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowManualEntry(false);
                    setManualContractData({
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
                      poNumber: ''
                    });
                    setContractCreatorId(null);
                  }}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Legal Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={manualContractData.legalName}
                    onChange={(e) => setManualContractData({ ...manualContractData, legalName: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                    placeholder="Enter legal name"
                  />
                </div>

                {/* Legal Address */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Legal Address
                  </label>
                  <textarea
                    value={manualContractData.legalAddress}
                    onChange={(e) => setManualContractData({ ...manualContractData, legalAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                    placeholder="Enter street address"
                    rows="2"
                  />
                </div>

                {/* City, Pincode, Country row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={manualContractData.city}
                      onChange={(e) => setManualContractData({ ...manualContractData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={manualContractData.pincode}
                      onChange={(e) => setManualContractData({ ...manualContractData, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      placeholder="Zip/Pincode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={manualContractData.country}
                      onChange={(e) => setManualContractData({ ...manualContractData, country: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      placeholder="Country"
                    />
                  </div>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Business Name (if applicable)
                  </label>
                  <input
                    type="text"
                    value={manualContractData.businessName}
                    onChange={(e) => setManualContractData({ ...manualContractData, businessName: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                    placeholder="Enter business name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={manualContractData.email}
                    onChange={(e) => setManualContractData({ ...manualContractData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                    placeholder="creator@example.com"
                  />
                </div>

                {/* Network and Currency row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Network
                    </label>
                    <input
                      type="text"
                      value={manualContractData.network}
                      onChange={(e) => setManualContractData({ ...manualContractData, network: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      placeholder="e.g., Ethereum, Bitcoin, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={manualContractData.currency}
                      onChange={(e) => setManualContractData({ ...manualContractData, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      placeholder="USD"
                    />
                  </div>
                </div>

                {/* Wallet Address */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Wallet Address (cryptocurrency)
                  </label>
                  <input
                    type="text"
                    value={manualContractData.walletAddress}
                    onChange={(e) => setManualContractData({ ...manualContractData, walletAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                    placeholder="0x... or crypto wallet address"
                  />
                </div>

                {/* Row with Cost Per Post and PO Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Cost Per Post
                    </label>
                    <input
                      type="text"
                      value={manualContractData.costPerPost}
                      onChange={(e) => setManualContractData({ ...manualContractData, costPerPost: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      placeholder="$500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      PO Number
                    </label>
                    <input
                      type="text"
                      value={manualContractData.poNumber}
                      onChange={(e) => setManualContractData({ ...manualContractData, poNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      placeholder="PO-12345"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-[var(--color-border)]">
                <button
                  onClick={() => {
                    setShowManualEntry(false);
                    setManualContractData({
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
                      poNumber: ''
                    });
                    setContractCreatorId(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyManualContractData}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent-primary)] rounded-lg hover:bg-[var(--color-accent-primary-dark)] transition-colors"
                >
                  Save Contract Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      {showContractPreview && parsedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  Review Contract Data
                </h2>
                <button
                  onClick={() => {
                    setShowContractPreview(false);
                    setParsedContract(null);
                    setContractCreatorId(null);
                  }}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Creator Info */}
                {formatParsedDataForPreview(parsedContract).creatorInfo.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Creator Information
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {formatParsedDataForPreview(parsedContract).creatorInfo.map((item, idx) => (
                        <div key={idx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3">
                          <div className="text-xs text-[var(--color-text-secondary)] mb-1">{item.label}</div>
                          <div className="text-sm text-[var(--color-text-primary)] font-medium">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                {formatParsedDataForPreview(parsedContract).pricing.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pricing Information
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {formatParsedDataForPreview(parsedContract).pricing.map((item, idx) => (
                        <div key={idx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3">
                          <div className="text-xs text-[var(--color-text-secondary)] mb-1">{item.label}</div>
                          <div className="text-sm text-[var(--color-text-primary)] font-medium">{item.value}</div>
                          {item.platforms && (
                            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                              Platforms: {item.platforms}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deliverables */}
                {formatParsedDataForPreview(parsedContract).deliverables.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                      Deliverables
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {formatParsedDataForPreview(parsedContract).deliverables.map((item, idx) => (
                        <div key={idx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3">
                          <div className="text-xs text-[var(--color-text-secondary)] mb-1">{item.label}</div>
                          <div className="text-sm text-[var(--color-text-primary)] font-medium">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contract Terms */}
                {formatParsedDataForPreview(parsedContract).terms.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                      Contract Terms
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {formatParsedDataForPreview(parsedContract).terms.map((item, idx) => (
                        <div key={idx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3">
                          <div className="text-xs text-[var(--color-text-secondary)] mb-1">{item.label}</div>
                          <div className="text-sm text-[var(--color-text-primary)] font-medium">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment */}
                {formatParsedDataForPreview(parsedContract).payment.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                      Payment Terms
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {formatParsedDataForPreview(parsedContract).payment.map((item, idx) => (
                        <div key={idx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3">
                          <div className="text-xs text-[var(--color-text-secondary)] mb-1">{item.label}</div>
                          <div className="text-sm text-[var(--color-text-primary)] font-medium">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-[var(--color-border)]">
                <button
                  onClick={() => {
                    setShowContractPreview(false);
                    setParsedContract(null);
                    setContractCreatorId(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyContractData}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent-primary)] rounded-lg hover:bg-[var(--color-accent-primary-dark)] transition-colors"
                >
                  Apply Contract Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      {selectedCreatorForInvoice && (
        <InvoiceGeneratorModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedCreatorForInvoice(null);
          }}
          creator={selectedCreatorForInvoice}
        />
      )}
    </div>
  );
}
