import { Search, Filter, SortAsc, X } from 'lucide-react';

/**
 * SearchFilterBar - Search, filter, and sort controls
 * @param {Object} props
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Callback when search term changes
 * @param {string} props.filterActivity - Current filter ('all', 'active', 'inactive')
 * @param {Function} props.onFilterChange - Callback when filter changes
 * @param {string} props.sortBy - Current sort field ('name', 'posts', 'cost', 'recent')
 * @param {Function} props.onSortChange - Callback when sort changes
 * @param {Function} props.onClearFilters - Callback to clear all filters
 * @param {boolean} props.hasActiveFilters - Whether any filters are active
 */
export default function SearchFilterBar({
  searchTerm,
  onSearchChange,
  filterActivity,
  onFilterChange,
  sortBy,
  onSortChange,
  onClearFilters,
  hasActiveFilters = false
}) {
  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search creators by name or handle..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
            />
          </div>
        </div>

        {/* Filter by Activity */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <select
            value={filterActivity}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-4 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
          >
            <option value="all">All Creators</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <SortAsc className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
          >
            <option value="name">Name (A-Z)</option>
            <option value="posts">Most Posts</option>
            <option value="cost">Highest Cost</option>
            <option value="recent">Most Recent Post</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
