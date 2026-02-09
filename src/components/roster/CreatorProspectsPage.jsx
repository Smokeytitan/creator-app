import { Plus, Trash2, Edit2, Search, Filter, SortAsc, Download, TrendingUp, ExternalLink } from 'lucide-react';

import useCreatorCRUD from '../../hooks/useCreatorCRUD';
import useSearchFilterSort from '../../hooks/useSearchFilterSort';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import { useToast } from '../../contexts/ToastContext';

import CreatorCardEdit from './CreatorCardEdit';
import { ConfirmDialog } from '../ui';
import { AVAILABLE_PLATFORMS } from '../../constants/platforms';
import { promoteProspect as promoteProspectInDB } from '../../services/creatorsServiceSupabase';

/**
 * CreatorProspectsPage -- thin orchestrator for the Prospects tab.
 *
 * Props mirror the original CreatorProspectsEditorial interface:
 *   { prospects, setProspects, setCreators }
 */
export default function CreatorProspectsPage({ prospects, setProspects, setCreators }) {
  const toast = useToast();
  const { dialogProps, confirm } = useConfirmDialog();

  // -------------------------------------------------------------------------
  // Hooks
  // -------------------------------------------------------------------------
  const crud = useCreatorCRUD({ items: prospects, setItems: setProspects, defaultStatus: 'prospect', itemLabel: 'prospect' });
  const search = useSearchFilterSort({ items: prospects, searchFields: ['name', 'handle'] });

  // -------------------------------------------------------------------------
  // Promote prospect to active roster
  // -------------------------------------------------------------------------
  const promoteProspect = async (prospectId, e) => {
    e.stopPropagation();

    const prospect = prospects.find((p) => p.id === prospectId);
    if (!prospect) {
      toast.error('Prospect not found');
      return;
    }

    if (!prospect.name || !prospect.handle) {
      toast.warning('Please ensure the prospect has a name and handle before promoting');
      return;
    }

    const confirmed = await confirm({
      title: 'Promote to Roster',
      description: `Promote ${prospect.name} to active creator roster?`,
      confirmLabel: 'Promote',
      variant: 'primary',
    });

    if (!confirmed) return;

    try {
      const promotedCreator = await promoteProspectInDB(prospectId);

      if (promotedCreator) {
        setProspects(prospects.filter((p) => p.id !== prospectId));
        setCreators((prevCreators) => [...prevCreators, promotedCreator]);
        toast.success(`${prospect.name} has been promoted to active roster!`);
      } else {
        toast.error('Failed to promote prospect');
      }
    } catch (error) {
      console.error('Error promoting prospect:', error);
      toast.error('Failed to promote prospect: ' + error.message);
    }
  };

  // -------------------------------------------------------------------------
  // Delete handler (with confirm dialog)
  // -------------------------------------------------------------------------
  const handleDelete = async (prospectId, e) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Prospect',
      description: 'Are you sure you want to delete this prospect? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (confirmed) {
      crud.deleteItem(prospectId);
    }
  };

  // -------------------------------------------------------------------------
  // CSV export
  // -------------------------------------------------------------------------
  const exportToCSV = () => {
    const headers = ['Name', 'Handle', 'Content Link', 'Estimated Cost Per Post', 'Platforms', 'Notes'];
    const rows = search.filteredItems.map((p) => [
      p.name,
      p.handle,
      p.contentLink || '',
      p.costPerPost || '',
      (p.platforms || []).join('; '),
      p.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creator_prospects_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Hero Header */}
      <div className="mb-6 sm:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--color-accent-primary)]" />
              Creator Prospects
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm sm:text-base">
              Research and track potential creators before adding them to your roster
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={crud.startAdd}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              New Prospect
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-[var(--color-bg-secondary)] rounded-xl p-4 border border-[var(--color-border)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search prospects..."
              value={search.searchTerm}
              onChange={(e) => search.setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <select
              value={search.filterActivity}
              onChange={(e) => search.setFilterActivity(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] appearance-none cursor-pointer"
            >
              <option value="all">All Prospects</option>
              <option value="has_cost">Has Estimated Cost</option>
              <option value="no_cost">No Cost Estimate</option>
            </select>
          </div>

          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <select
              value={search.sortBy}
              onChange={(e) => search.setSortBy(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] appearance-none cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="cost">Sort by Cost</option>
            </select>
          </div>

          {search.hasActiveFilters && (
            <button
              onClick={search.clearFilters}
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="mt-3 text-xs text-[var(--color-text-tertiary)]">
          Showing {search.filteredItems.length} of {prospects.length} prospects
        </div>
      </div>

      {/* Prospects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Add New Prospect Card */}
        {crud.isAdding && (
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 border-2 border-dashed border-[var(--color-accent-primary)] min-h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">New Prospect</h3>
            <ProspectForm
              editForm={crud.editForm}
              setEditForm={crud.setEditForm}
              togglePlatform={crud.togglePlatform}
              onSave={crud.saveNew}
              onCancel={crud.cancelEdit}
              isNew
            />
          </div>
        )}

        {/* Prospect Cards */}
        {search.filteredItems.map((prospect) => {
          const isEditing = crud.editingId === prospect.id;

          if (isEditing) {
            return (
              <div key={prospect.id} className="bg-[var(--color-bg-secondary)] rounded-xl p-5 border-2 border-[var(--color-accent-primary)] min-h-[400px] flex flex-col">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Edit Prospect</h3>
                <ProspectForm
                  editForm={crud.editForm}
                  setEditForm={crud.setEditForm}
                  togglePlatform={crud.togglePlatform}
                  onSave={() => crud.saveEdit(prospect.id)}
                  onCancel={crud.cancelEdit}
                />
              </div>
            );
          }

          // View Mode
          return (
            <div
              key={prospect.id}
              onClick={() => crud.startEdit(prospect)}
              className="bg-[var(--color-bg-secondary)] rounded-xl p-5 border border-[var(--color-border)] hover:border-[var(--color-accent-primary)] hover:shadow-lg transition-all min-h-[400px] flex flex-col cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors">
                      {prospect.name}
                    </h3>
                    {prospect.platforms && prospect.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {prospect.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-mono text-[var(--color-text-secondary)]">{prospect.handle}</p>
                  {prospect.contentLink && (
                    <a
                      href={prospect.contentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] hover:underline transition-colors"
                      title={prospect.contentLink}
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{prospect.contentLink.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    </a>
                  )}
                  {prospect.notes && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-3">{prospect.notes}</p>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(prospect.id, e)}
                  className="p-2 text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  title="Delete prospect"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Estimated Cost */}
              {prospect.costPerPost && (
                <div className="mb-4 p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                  <div className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                    Estimated Cost
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-accent-primary)]">{prospect.costPerPost}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)] mt-1">per post</div>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={(e) => promoteProspect(prospect.id, e)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:shadow-lg transition-all"
                >
                  <TrendingUp className="w-4 h-4" />
                  Promote to Roster
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    crud.startEdit(prospect);
                  }}
                  className="p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all"
                  title="Edit prospect"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {search.filteredItems.length === 0 && !crud.isAdding && (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            {search.searchTerm || search.hasActiveFilters ? 'No prospects match your filters' : 'No prospects yet'}
          </h3>
          <p className="text-[var(--color-text-secondary)] mb-6">
            {search.searchTerm || search.hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Start tracking potential creators before adding them to your roster'}
          </p>
          {!search.searchTerm && !search.hasActiveFilters && (
            <button
              onClick={crud.startAdd}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Your First Prospect
            </button>
          )}
        </div>
      )}

      {/* Confirm Dialog (shared) */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

/**
 * Prospect-specific form (uses textarea for notes, different labels).
 * Preserves the original Prospects form layout.
 */
function ProspectForm({ editForm, setEditForm, togglePlatform, onSave, onCancel, isNew = false }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Name *</label>
          <input
            type="text"
            placeholder="Creator name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Handle</label>
          <input
            type="text"
            placeholder="@username"
            value={editForm.handle}
            onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm font-mono text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Sample Content Link</label>
          <input
            type="url"
            placeholder="https://x.com/username/status/..."
            value={editForm.contentLink}
            onChange={(e) => setEditForm({ ...editForm, contentLink: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Research Notes</label>
          <textarea
            placeholder="Notes about this prospect..."
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Estimated Cost Per Post</label>
          <input
            type="text"
            placeholder="$0.00"
            value={editForm.costPerPost}
            onChange={(e) => setEditForm({ ...editForm, costPerPost: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_PLATFORMS.map((platform) => (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  (editForm.platforms || []).includes(platform)
                    ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent-primary)]'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onSave}
          className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] rounded-lg hover:shadow-lg transition-all"
        >
          {isNew ? 'Save Prospect' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
