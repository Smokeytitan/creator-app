import { useState, useMemo } from 'react';
import { Plus, Trash2, X, Edit2, Search, Filter, SortAsc, Download, TrendingUp } from 'lucide-react';
import { deleteCreator as deleteCreatorFromDB, createCreator, updateCreator as updateCreatorInDB, promoteProspect as promoteProspectInDB } from '../services/creatorsServiceSupabase';

export default function CreatorProspectsEditorial({ prospects, setProspects, setCreators }) {
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });

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

  const startEdit = (prospect) => {
    setEditingId(prospect.id);
    setIsAdding(false);
    setEditForm({
      name: prospect.name,
      handle: prospect.handle,
      notes: prospect.notes || '',
      costPerPost: prospect.costPerPost || '',
      platforms: prospect.platforms || []
    });
  };

  const startAdd = () => {
    console.log('Starting to add new prospect');
    setIsAdding(true);
    setEditingId(null);
    setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
  };

  const saveEdit = async (prospectId) => {
    try {
      const updatedProspect = await updateCreatorInDB(prospectId, editForm);
      if (updatedProspect) {
        setProspects(prospects.map((p) =>
          p.id === prospectId ? updatedProspect : p
        ));
        setEditingId(null);
        setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
      } else {
        // Fallback: update local state if Supabase update fails
        console.warn('Supabase update failed, updating local state only');
        setProspects(prospects.map((p) =>
          p.id === prospectId ? { ...p, ...editForm } : p
        ));
        setEditingId(null);
        setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
      }
    } catch (error) {
      console.error('Error updating prospect:', error);
      // Fallback: update local state if error occurs
      console.warn('Error occurred, updating local state only');
      setProspects(prospects.map((p) =>
        p.id === prospectId ? { ...p, ...editForm } : p
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
      console.log('Creating new prospect with data:', editForm);
      const newProspect = await createCreator({
        name: editForm.name,
        handle: editForm.handle || '@' + editForm.name.toLowerCase().replace(/\s+/g, '_'),
        notes: editForm.notes,
        costPerPost: editForm.costPerPost,
        platforms: editForm.platforms || [],
        status: 'prospect' // Important: set status to prospect
      });

      console.log('Prospect created successfully:', newProspect);
      setProspects([...prospects, newProspect]);
      setIsAdding(false);
      setEditForm({ name: '', handle: '', notes: '', costPerPost: '', platforms: [] });
    } catch (error) {
      console.error('Failed to create prospect:', error);
      alert('Failed to create prospect: ' + error.message);
    }
  };

  const deleteProspect = async (prospectId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this prospect?')) {
      const success = await deleteCreatorFromDB(prospectId);
      if (success) {
        setProspects(prospects.filter(p => p.id !== prospectId));
      } else {
        alert('Failed to delete prospect');
      }
    }
  };

  const promoteProspect = async (prospectId, e) => {
    e.stopPropagation();

    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) {
      alert('Prospect not found');
      return;
    }

    if (!prospect.name || !prospect.handle) {
      alert('Please ensure the prospect has a name and handle before promoting');
      return;
    }

    if (confirm(`Promote ${prospect.name} to active creator roster?`)) {
      try {
        const promotedCreator = await promoteProspectInDB(prospectId);

        if (promotedCreator) {
          // Remove from prospects list
          setProspects(prospects.filter(p => p.id !== prospectId));

          // Add to creators list
          setCreators(prevCreators => [...prevCreators, promotedCreator]);

          alert(`${prospect.name} has been promoted to active roster!`);
        } else {
          alert('Failed to promote prospect');
        }
      } catch (error) {
        console.error('Error promoting prospect:', error);
        alert('Failed to promote prospect: ' + error.message);
      }
    }
  };

  // Filtered and sorted prospects
  const filteredProspects = useMemo(() => {
    let filtered = [...prospects];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.handle.toLowerCase().includes(search)
      );
    }

    // Apply activity filter
    if (filterActivity === 'has_cost') {
      filtered = filtered.filter(p => p.costPerPost && parseFloat(p.costPerPost.replace(/[^0-9.]/g, '')) > 0);
    } else if (filterActivity === 'no_cost') {
      filtered = filtered.filter(p => !p.costPerPost || parseFloat(p.costPerPost.replace(/[^0-9.]/g, '')) === 0);
    }

    // Apply sorting
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'cost') {
      filtered.sort((a, b) => {
        const costA = parseFloat((a.costPerPost || '0').replace(/[^0-9.]/g, ''));
        const costB = parseFloat((b.costPerPost || '0').replace(/[^0-9.]/g, ''));
        return costB - costA;
      });
    }

    return filtered;
  }, [prospects, searchTerm, filterActivity, sortBy]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Handle', 'Estimated Cost Per Post', 'Platforms', 'Notes'];
    const rows = filteredProspects.map(p => [
      p.name,
      p.handle,
      p.costPerPost || '',
      (p.platforms || []).join('; '),
      p.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creator_prospects_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterActivity('all');
    setSortBy('name');
  };

  const hasActiveFilters = searchTerm || filterActivity !== 'all' || sortBy !== 'name';

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
              onClick={startAdd}
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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search prospects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
            />
          </div>

          {/* Filter Activity */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <select
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] appearance-none cursor-pointer"
            >
              <option value="all">All Prospects</option>
              <option value="has_cost">Has Estimated Cost</option>
              <option value="no_cost">No Cost Estimate</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] appearance-none cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="cost">Sort by Cost</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results counter */}
        <div className="mt-3 text-xs text-[var(--color-text-tertiary)]">
          Showing {filteredProspects.length} of {prospects.length} prospects
        </div>
      </div>

      {/* Prospects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Add New Prospect Card */}
        {isAdding && (
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 border-2 border-dashed border-[var(--color-accent-primary)] min-h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">New Prospect</h3>

            {/* Form Fields */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  placeholder="Creator name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Handle
                </label>
                <input
                  type="text"
                  placeholder="@username"
                  value={editForm.handle}
                  onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm font-mono text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Research Notes
                </label>
                <textarea
                  placeholder="Notes about this prospect..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Estimated Cost Per Post
                </label>
                <input
                  type="text"
                  placeholder="$0.00"
                  value={editForm.costPerPost}
                  onChange={(e) => setEditForm({ ...editForm, costPerPost: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                  Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PLATFORMS.map(platform => (
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
                onClick={saveNew}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] rounded-lg hover:shadow-lg transition-all"
              >
                Save Prospect
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Prospect Cards */}
        {filteredProspects.map(prospect => {
          const isEditing = editingId === prospect.id;

          if (isEditing) {
            // Edit Mode
            return (
              <div key={prospect.id} className="bg-[var(--color-bg-secondary)] rounded-xl p-5 border-2 border-[var(--color-accent-primary)] min-h-[400px] flex flex-col">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Edit Prospect</h3>

                {/* Form Fields */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Creator name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Handle
                    </label>
                    <input
                      type="text"
                      placeholder="@username"
                      value={editForm.handle}
                      onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm font-mono text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Research Notes
                    </label>
                    <textarea
                      placeholder="Notes about this prospect..."
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Estimated Cost Per Post
                    </label>
                    <input
                      type="text"
                      placeholder="$0.00"
                      value={editForm.costPerPost}
                      onChange={(e) => setEditForm({ ...editForm, costPerPost: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                      Platforms
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_PLATFORMS.map(platform => (
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
                    onClick={() => saveEdit(prospect.id)}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] rounded-lg hover:shadow-lg transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          // View Mode
          return (
            <div
              key={prospect.id}
              onClick={() => startEdit(prospect)}
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
                        {prospect.platforms.map(platform => (
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
                  {prospect.notes && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-3">
                      {prospect.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => deleteProspect(prospect.id, e)}
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
                  <div className="text-2xl font-bold text-[var(--color-accent-primary)]">
                    {prospect.costPerPost}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    per post
                  </div>
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
                    startEdit(prospect);
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
      {filteredProspects.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            {searchTerm || hasActiveFilters ? 'No prospects match your filters' : 'No prospects yet'}
          </h3>
          <p className="text-[var(--color-text-secondary)] mb-6">
            {searchTerm || hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Start tracking potential creators before adding them to your roster'}
          </p>
          {!searchTerm && !hasActiveFilters && (
            <button
              onClick={startAdd}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Your First Prospect
            </button>
          )}
        </div>
      )}
    </div>
  );
}
