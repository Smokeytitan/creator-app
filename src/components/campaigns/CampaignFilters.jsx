import { Search, Filter } from 'lucide-react';

/**
 * CampaignFilters - Filter and search controls for campaigns
 * @param {Object} props
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Callback when search changes
 * @param {string} props.filterStatus - Current status filter
 * @param {Function} props.onStatusChange - Callback when status filter changes
 * @param {string} props.filterCreatorId - Current creator filter
 * @param {Function} props.onCreatorChange - Callback when creator filter changes
 * @param {Array} props.creators - List of creators for filter dropdown
 */
export default function CampaignFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterCreatorId,
  onCreatorChange,
  creators = []
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
              placeholder="Search campaigns..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <select
            value={filterStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-4 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Creator Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterCreatorId}
            onChange={(e) => onCreatorChange(e.target.value)}
            className="px-4 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent-primary)]"
          >
            <option value="all">All Creators</option>
            {creators.map((creator) => (
              <option key={creator.id} value={creator.id}>
                {creator.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
