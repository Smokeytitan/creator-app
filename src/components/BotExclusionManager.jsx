import { useState, useEffect } from 'react';
import { UserX, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  getBotExcludedAccounts,
  addBotExcludedAccount,
  removeBotExcludedAccount
} from '../services/botExclusionService';

const BotExclusionManager = () => {
  const [exclusions, setExclusions] = useState([]);
  const [newHandle, setNewHandle] = useState('');
  const [newReason, setNewReason] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load exclusions on mount
  useEffect(() => {
    loadExclusions();
  }, []);

  const loadExclusions = async () => {
    console.log('Loading bot exclusions from Supabase...');
    const loaded = await getBotExcludedAccounts();
    console.log('Loaded bot exclusions:', loaded);
    setExclusions(loaded);
  };

  const handleAdd = async (e) => {
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

      await addBotExcludedAccount(handle, newReason.trim());

      // Reload exclusions
      await loadExclusions();

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

  const handleRemove = async (exclusionId) => {
    try {
      await removeBotExcludedAccount(exclusionId);
      await loadExclusions();
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
            Bot Analytics - Excluded Accounts
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Manage accounts excluded from bot analytics (e.g., test accounts, spam, etc.)
          </p>
        </div>
        <div className="px-3 py-1 bg-[var(--color-accent-primary)]/10 rounded-full">
          <span className="text-sm font-semibold text-[var(--color-accent-primary)]">
            {exclusions.length} excluded
          </span>
        </div>
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Twitter Handle
            </label>
            <input
              type="text"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              placeholder="@polygon or polygon"
              className="input-polygon w-full"
              disabled={isAdding}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="e.g., Test account, Spam"
              className="input-polygon w-full"
              disabled={isAdding}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isAdding || !newHandle.trim()}
          className="btn-editorial-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </form>

      {/* Exclusions List */}
      {exclusions.length === 0 ? (
        <div className="text-center py-12 px-4">
          <UserX className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-3 opacity-30" />
          <p className="text-[var(--color-text-secondary)] mb-1">No accounts excluded yet</p>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Add Twitter handles to exclude them from bot analytics
          </p>
        </div>
      ) : (
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
            Excluded Accounts
          </h4>
          <div className="space-y-2">
            {exclusions.map((exclusion) => (
              <div
                key={exclusion.id}
                className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] border border-white/5 rounded-lg hover:border-white/10 transition-all duration-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[var(--color-text-primary)]">
                      @{exclusion.handle}
                    </span>
                  </div>
                  {exclusion.reason && (
                    <p className="text-sm text-[var(--color-text-tertiary)]">{exclusion.reason}</p>
                  )}
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    Added {new Date(exclusion.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(exclusion.id)}
                  className="p-2 text-[var(--color-text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  title="Remove exclusion"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <h5 className="text-sm font-semibold text-blue-400 mb-2">About Bot Analytics Exclusions</h5>
        <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
          <li>• Excluded accounts will be filtered out of all bot analytics data</li>
          <li>• Useful for removing test accounts, spam, or irrelevant data</li>
          <li>• Exclusions persist across all analytics views</li>
        </ul>
      </div>
    </div>
  );
};

export default BotExclusionManager;
