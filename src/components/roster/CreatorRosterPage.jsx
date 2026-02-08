import { useRef, useState, useMemo } from 'react';
import { Plus, Download, RefreshCw, FileSpreadsheet, FileUp, Search, Filter, SortAsc, X } from 'lucide-react';

import useCreatorCRUD from '../../hooks/useCreatorCRUD';
import useSearchFilterSort from '../../hooks/useSearchFilterSort';
import useContractUpload from '../../hooks/useContractUpload';
import usePosts from '../../hooks/usePosts';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import { useToast } from '../../contexts/ToastContext';

import CreatorCardDisplay from './CreatorCardDisplay';
import CreatorCardEdit from './CreatorCardEdit';
import PostsList from './PostsList';
import ContractPreviewModal from './ContractPreviewModal';
import ContractEntryModal from './ContractEntryModal';

import InvoiceGeneratorModal from '../invoice/InvoiceGeneratorModal';
import TemplateUploadStep from '../invoice/TemplateUploadStep';
import { ConfirmDialog } from '../ui';

import { IMPORTED_CREATORS } from '../../data/importedCreators';
import { importExcelWorkbook } from '../../services/excelImportService';
import { getCreators } from '../../services/creatorsServiceSupabase';

/**
 * CreatorRosterPage -- top-level orchestrator for the Roster tab.
 *
 * Props mirror the original CreatorRosterEditorial interface:
 *   { creators, setCreators }
 */
export default function CreatorRosterPage({ creators, setCreators }) {
  const toast = useToast();
  const { dialogProps, confirm } = useConfirmDialog();

  // -------------------------------------------------------------------------
  // Hooks
  // -------------------------------------------------------------------------
  const crud = useCreatorCRUD({ items: creators, setItems: setCreators, defaultStatus: 'active', itemLabel: 'creator' });
  const activeOnly = useMemo(() => creators.filter((c) => c.active !== false), [creators]);
  const search = useSearchFilterSort({ items: activeOnly, searchFields: ['name', 'handle'] });
  const contract = useContractUpload({ creators, setCreators });
  const posts = usePosts({ creators, setCreators });

  // -------------------------------------------------------------------------
  // Excel import
  // -------------------------------------------------------------------------
  const excelFileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.warning('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setImporting(true);

    try {
      const results = await importExcelWorkbook(file);
      const updatedCreators = await getCreators();
      setCreators(updatedCreators);

      let message = 'Excel Import Complete!\n\n';
      if (results.roster) {
        message += `Creators: Created ${results.roster.created.length}, Updated ${results.roster.updated.length}`;
        if (results.roster.errors.length > 0) message += `, Errors ${results.roster.errors.length}`;
        message += '\n';
      }
      if (results.deliverables) {
        message += `Campaigns: Created ${results.deliverables.created.length}, Updated ${results.deliverables.updated.length}, Posts ${results.deliverables.posts}`;
        if (results.deliverables.errors.length > 0) message += `, Errors ${results.deliverables.errors.length}`;
      }

      toast.success(message);
    } catch (error) {
      console.error('Excel import error:', error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      if (excelFileInputRef.current) excelFileInputRef.current.value = '';
    }
  };

  // -------------------------------------------------------------------------
  // CSV export (uses filtered list)
  // -------------------------------------------------------------------------
  const exportToCSV = () => {
    const dataToExport = search.filteredItems.length > 0 ? search.filteredItems : creators;

    const csvRows = dataToExport.map((creator) => {
      const creatorPosts = creator.posts || [];
      let totalSpend = 0;
      creatorPosts.forEach((post) => {
        const cost = Number(post.cost);
        if (!isNaN(cost)) totalSpend += cost;
      });

      return {
        Name: creator.name,
        Handle: creator.handle,
        'Cost Per Post': creator.costPerPost || '',
        'Total Posts': creatorPosts.length,
        'Total Spend': totalSpend > 0 ? `$${totalSpend.toFixed(2)}` : '$0.00',
        Notes: creator.notes || '',
      };
    });

    let csv = 'CREATOR ROSTER\n';
    if (search.searchTerm) csv += `Search: "${search.searchTerm}"\n`;
    if (search.filterActivity !== 'all') csv += `Filter: ${search.filterActivity === 'active' ? 'Has Posts' : 'No Posts'}\n`;
    if (search.sortBy !== 'name') csv += `Sort: ${search.sortBy === 'posts' ? 'By Posts' : 'By Name'}\n`;
    csv += `\nTotal Creators: ${dataToExport.length}\n\n`;

    const headers = Object.keys(csvRows[0] || {});
    csv += headers.join(',') + '\n';
    csvRows.forEach((row) => {
      csv += headers.map((h) => `"${row[h]}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `creator_roster_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------------------
  // Reset to imported data
  // -------------------------------------------------------------------------
  const resetToImportedData = async () => {
    const confirmed = await confirm({
      title: 'Reset Creator Data',
      description: 'This will replace all current creator data with the data from Google Sheets. Are you sure?',
      confirmLabel: 'Reset',
      variant: 'danger',
    });
    if (confirmed) {
      setCreators(IMPORTED_CREATORS);
      toast.success('Creator data has been reset to imported data from Google Sheets!');
    }
  };

  // -------------------------------------------------------------------------
  // Invoice state
  // -------------------------------------------------------------------------
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedCreatorForInvoice, setSelectedCreatorForInvoice] = useState(null);
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);

  // -------------------------------------------------------------------------
  // Delete handler (with confirm dialog)
  // -------------------------------------------------------------------------
  const handleDelete = async (creatorId, e) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Creator',
      description: 'Are you sure you want to delete this creator? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      crud.deleteItem(creatorId);
    }
  };

  // -------------------------------------------------------------------------
  // Post delete handler (with confirm dialog)
  // -------------------------------------------------------------------------
  const handleDeletePost = async (creatorId, postId, e) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Post',
      description: 'Are you sure you want to delete this post?',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      posts.deletePost(creatorId, postId);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="border-b border-[var(--color-border)] pb-8" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-display text-5xl mb-3 text-[var(--color-text-primary)]">Creator Roster</h1>
            <p className="text-[var(--color-text-secondary)] text-lg">
              Manage your content creator network and track campaign performance
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={crud.startAdd}
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
              className="inline-flex items-center px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-accent-primary)]/30 text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-primary)]/50 transition-all duration-200 text-sm font-semibold"
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
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by name or handle..."
              value={search.searchTerm}
              onChange={(e) => search.setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Filters:</span>
          </div>

          <select
            value={search.filterActivity}
            onChange={(e) => search.setFilterActivity(e.target.value)}
            className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
          >
            <option value="all">All Activity</option>
            <option value="active">Has Posts</option>
            <option value="inactive">No Posts</option>
          </select>

          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <select
              value={search.sortBy}
              onChange={(e) => search.setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            >
              <option value="name">Sort by Name</option>
              <option value="posts">Sort by Posts</option>
            </select>
          </div>

          {search.hasActiveFilters && (
            <button
              onClick={search.clearFilters}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}

          <span className="text-sm text-[var(--color-text-tertiary)] ml-auto text-mono">
            Showing {search.filteredItems.length} of {activeOnly.length} creators
          </span>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Add-new card */}
        {crud.isAdding && (
          <div
            className="card-editorial p-6 border-2 border-[var(--color-accent-primary)] min-h-[400px]"
            style={{ animation: 'fadeInUp 0.4s ease-out' }}
          >
            <CreatorCardEdit
              editForm={crud.editForm}
              setEditForm={crud.setEditForm}
              togglePlatform={crud.togglePlatform}
              onSave={crud.saveNew}
              onCancel={crud.cancelEdit}
              isNew
            />
          </div>
        )}

        {search.filteredItems.map((c, index) => (
          <div
            key={c.id}
            className="card-editorial p-6 hover:shadow-lg transition-shadow cursor-pointer min-h-[400px] flex flex-col"
            onClick={() => !crud.isAdding && crud.editingId !== c.id && crud.startEdit(c)}
            style={{ animation: `fadeInUp 0.4s ease-out ${(index + 1) * 0.05}s both` }}
          >
            {crud.editingId === c.id ? (
              <CreatorCardEdit
                editForm={crud.editForm}
                setEditForm={crud.setEditForm}
                togglePlatform={crud.togglePlatform}
                onSave={() => crud.saveEdit(c.id)}
                onCancel={crud.cancelEdit}
              />
            ) : (
              <CreatorCardDisplay
                creator={c}
                onEdit={() => crud.startEdit(c)}
                onDelete={(e) => handleDelete(c.id, e)}
                onToggleActive={(e) => { e.stopPropagation(); crud.toggleActive(c.id); }}
                onToggleViewPosts={(e) => posts.toggleViewPosts(c.id, e)}
                onUploadContract={contract.handleContractUpload}
                onGenerateInvoice={(e) => {
                  e.stopPropagation();
                  setSelectedCreatorForInvoice(c);
                  setShowInvoiceModal(true);
                }}
                onEditContractDetails={(e) => contract.startEditContractDetails(c, e)}
                uploadingContract={contract.uploadingContract}
                contractCreatorId={contract.contractCreatorId}
                postsSection={
                  posts.viewingPostsId === c.id && (
                    <PostsList
                      creator={c}
                      addingPostId={posts.addingPostId}
                      editingPostId={posts.editingPostId}
                      postForm={posts.postForm}
                      setPostForm={posts.setPostForm}
                      onStartAddPost={posts.startAddPost}
                      onCancelAddPost={posts.cancelAddPost}
                      onSavePost={posts.savePost}
                      onDeletePost={handleDeletePost}
                      onStartEditPost={posts.startEditPost}
                      onCancelEditPost={posts.cancelEditPost}
                      onSaveEditPost={posts.saveEditPost}
                    />
                  )
                }
              />
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
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Upload Invoice Template</h2>
                <button
                  onClick={() => setShowTemplateUpload(false)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <TemplateUploadStep onComplete={() => setShowTemplateUpload(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Contract Entry Modal (manual) */}
      <ContractEntryModal
        open={contract.showManualEntry}
        data={contract.manualContractData}
        setData={contract.setManualContractData}
        onSave={contract.applyManualContractData}
        onCancel={contract.cancelManualEntry}
      />

      {/* Contract Preview Modal (parsed) */}
      <ContractPreviewModal
        open={contract.showContractPreview}
        parsedContract={contract.parsedContract}
        onApply={contract.applyContractData}
        onCancel={contract.cancelContractPreview}
      />

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

      {/* Confirm Dialog (shared) */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
