import { useState, useEffect } from 'react';
import { UserX, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  getExcludedAccounts,
  addExcludedAccount,
  removeExcludedAccount
} from '../services/flashCampaignService';

const ExclusionListManager = () => {
  const [exclusions, setExclusions] = useState([]);
  const [newHandle, setNewHandle] = useState('');
  const [newReason, setNewReason] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load exclusions on mount
  useEffect(() => {
    loadExclusions();
  }, []);

  const loadExclusions = () => {
    const loaded = getExcludedAccounts();
    setExclusions(loaded);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    setError('');

    if (!newHandle.trim()) {
      setError('Twitter handle is required');
      return;
    }

    setIsAdding(true);

    try {
      // Add @ prefix if not present
      const handle = newHandle.trim().startsWith('@')
        ? newHandle.trim()
        : `@${newHandle.trim()}`;

      addExcludedAccount(handle, newReason.trim());

      // Reload exclusions
      loadExclusions();

      // Reset form
      setNewHandle('');
      setNewReason('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add exclusion');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = (exclusionId) => {
    try {
      removeExcludedAccount(exclusionId);
      loadExclusions();
    } catch (err) {
      console.error('Error removing exclusion:', err);
    }
  };

  return (
    <div className="card-editorial">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-display text-xl mb-1 flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Excluded Accounts
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Manage accounts excluded from all flash campaigns (e.g., Polygon employees, affiliates)
          </p>
        </div>
        <div className="px-3 py-1 bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/30 rounded-full">
          <span className="text-mono text-sm font-medium text-[var(--color-accent-primary)]">
            {exclusions.length} excluded
          </span>
        </div>
      </div>

      {/* Add Exclusion Form */}
      <form onSubmit={handleAdd} className="space-y-3 mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Twitter Handle Input */}
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">
              Twitter Handle
            </label>
            <input
              type="text"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              placeholder="@polygon or polygon"
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] text-sm transition-all"
              disabled={isAdding}
            />
          </div>

          {/* Reason Input */}
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="e.g., Employee, Affiliate"
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] text-sm transition-all"
              disabled={isAdding}
            />
          </div>

          {/* Add Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="btn-editorial-primary flex items-center gap-2 whitespace-nowrap"
              disabled={isAdding}
            >
              <Plus className="w-4 h-4" />
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
      </form>

      {/* Exclusion List */}
      {exclusions.length === 0 ? (
        <div className="text-center py-8">
          <UserX className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-[var(--color-text-secondary)] text-sm">
            No accounts excluded yet
          </p>
          <p className="text-[var(--color-text-tertiary)] text-xs mt-1">
            Add Twitter handles of Polygon employees or affiliates to exclude them from campaigns
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {exclusions.map((exclusion, index) => (
            <div
              key={exclusion.id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              style={{
                animation: 'fadeInUp 0.4s ease-out forwards',
                animationDelay: `${index * 0.05}s`,
                opacity: 0
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    @{exclusion.handle}
                  </span>
                  {exclusion.reason && (
                    <span className="px-2 py-0.5 text-xs bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-full border border-[var(--color-accent-primary)]/30">
                      {exclusion.reason}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  Added {new Date(exclusion.addedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(exclusion.id)}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                title="Remove exclusion"
              >
                <Trash2 className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-red-500 transition-colors" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-400">
            <p className="font-medium mb-1">Global Exclusions</p>
            <p className="text-xs text-blue-400/80">
              These accounts will be automatically excluded from all flash campaign results.
              This list persists across all campaigns and browser sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExclusionListManager;
