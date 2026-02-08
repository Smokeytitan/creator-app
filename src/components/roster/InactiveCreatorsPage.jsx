import { useMemo } from 'react';
import { Search, Filter, SortAsc, X, UserX } from 'lucide-react';

import useCreatorCRUD from '../../hooks/useCreatorCRUD';
import useSearchFilterSort from '../../hooks/useSearchFilterSort';
import useConfirmDialog from '../../hooks/useConfirmDialog';

import CreatorCardDisplay from './CreatorCardDisplay';
import { ConfirmDialog } from '../ui';

/**
 * InactiveCreatorsPage -- shows creators that have been deactivated.
 *
 * Shares the same creators/setCreators state as the Roster page.
 * Toggling a creator back to active moves them back to the Roster tab.
 */
export default function InactiveCreatorsPage({ creators, setCreators }) {
  const { dialogProps, confirm } = useConfirmDialog();

  // Full array for correct state management (map/filter on entire list)
  const crud = useCreatorCRUD({ items: creators, setItems: setCreators, defaultStatus: 'active', itemLabel: 'creator' });

  // Only show inactive creators
  const inactiveOnly = useMemo(() => creators.filter((c) => c.active === false), [creators]);
  const search = useSearchFilterSort({ items: inactiveOnly, searchFields: ['name', 'handle'] });

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

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] pb-8" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-display text-5xl mb-3 text-[var(--color-text-primary)]">Inactive Creators</h1>
            <p className="text-[var(--color-text-secondary)] text-lg">
              Creators that have been deactivated. Toggle them back on to return to the roster.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
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
            {inactiveOnly.length} inactive creator{inactiveOnly.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Card Grid */}
      {search.filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {search.filteredItems.map((c, index) => (
            <div
              key={c.id}
              className="card-editorial p-6 hover:shadow-lg transition-shadow min-h-[400px] flex flex-col"
              style={{ animation: `fadeInUp 0.4s ease-out ${(index + 1) * 0.05}s both` }}
            >
              <CreatorCardDisplay
                creator={c}
                onEdit={() => {}}
                onDelete={(e) => handleDelete(c.id, e)}
                onToggleActive={(e) => { e.stopPropagation(); crud.toggleActive(c.id); }}
                onToggleViewPosts={() => {}}
                onUploadContract={() => {}}
                onGenerateInvoice={() => {}}
                onEditContractDetails={() => {}}
                uploadingContract={false}
                contractCreatorId={null}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4">
            <UserX className="w-6 h-6 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-heading-3 text-[var(--color-text-primary)] mb-1">No inactive creators</h3>
          <p className="text-sm text-[var(--color-text-tertiary)] max-w-sm">
            Creators you deactivate from the roster will appear here.
          </p>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
