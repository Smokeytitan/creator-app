import { Trash2, FileText, FileUp, Download, Edit2, Eye, Calendar, DollarSign } from 'lucide-react';

/**
 * Single creator card in display (non-editing) mode.
 *
 * Shows name, handle, platform badges, notes, stats grid, and action buttons.
 */
export default function CreatorCardDisplay({
  creator,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleViewPosts,
  onUploadContract,
  onGenerateInvoice,
  onEditContractDetails,
  uploadingContract,
  contractCreatorId,
  // Posts section (rendered inline when expanded)
  postsSection,
}) {
  const c = creator;
  const isActive = c.active !== false;

  return (
    <div className={`flex flex-col h-full ${!isActive ? 'opacity-50' : ''}`}>
      {/* Header: Name + Platform Badges + Toggle + Delete */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{c.name}</h3>
            {!isActive && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                Inactive
              </span>
            )}
            {(c.platforms || []).length > 0 && (
              <div className="flex gap-1">
                {c.platforms.map((platform) => (
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
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleActive}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isActive ? 'bg-green-500' : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]'
            }`}
            title={isActive ? 'Deactivate creator' : 'Activate creator'}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-[var(--color-text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Delete creator"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notes */}
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">{c.notes}</p>

      {/* Stats Grid */}
      <CreatorStatsGrid posts={c.posts} />

      {/* Spacer to push action buttons to bottom */}
      <div className="flex-grow" />

      {/* Action Buttons */}
      <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex gap-2 justify-between">
        <button
          onClick={onToggleViewPosts}
          className="flex flex-col items-center justify-center gap-1 p-2 flex-1 text-xs bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/20 rounded-lg transition-colors border border-[var(--color-accent-primary)]/20"
        >
          <FileText className="h-5 w-5" />
          <span>View posts</span>
        </button>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => onUploadContract(e, c.id)}
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
          onClick={onGenerateInvoice}
          className="flex flex-col items-center justify-center gap-1 p-2 flex-1 text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"
        >
          <Download className="h-5 w-5" />
          <span>Generate Invoice</span>
        </button>

        <button
          onClick={onEditContractDetails}
          className="flex flex-col items-center justify-center gap-1 p-2 flex-1 text-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
        >
          <Edit2 className="h-5 w-5" />
          <span>Edit contract details</span>
        </button>
      </div>

      {/* Expandable Posts Section */}
      {postsSection}
    </div>
  );
}

/**
 * Stats grid showing impressions, cost, and CPM for a creator's posts.
 */
function CreatorStatsGrid({ posts = [] }) {
  if (posts.length === 0) return null;

  let totalImpressions = 0;
  let totalCost = 0;

  posts.forEach((post) => {
    if (post.impressions) {
      const impressions = Number(post.impressions);
      if (!isNaN(impressions)) totalImpressions += impressions;
    }
    if (post.cost) {
      const cost = Number(post.cost);
      if (!isNaN(cost)) totalCost += cost;
    }
  });

  const avgImpressions = posts.length > 0 ? Math.round(totalImpressions / posts.length) : 0;
  const cpm = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;
  const avgCostPerPost = posts.length > 0 && totalCost > 0 ? totalCost / posts.length : 0;

  return (
    <div className="space-y-3 mb-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Impressions" value={totalImpressions.toLocaleString()} />
        <StatCard label="Avg Impressions" value={avgImpressions.toLocaleString()} />

        {totalCost > 0 && (
          <>
            <StatCard
              label="Total Cost"
              value={`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              accent
            />
            {avgCostPerPost > 0 && (
              <StatCard
                label="Cost/Post"
                value={`$${avgCostPerPost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                accent
              />
            )}
          </>
        )}

        {cpm > 0 && (
          <div className="bg-[var(--color-accent-primary)]/10 rounded-lg p-3 border-2 border-[var(--color-accent-primary)]/30">
            <div className="text-xs text-[var(--color-accent-primary)] font-medium mb-1 uppercase tracking-wide">
              CPM (Cost/1K)
            </div>
            <div className="text-lg font-bold text-[var(--color-accent-primary)] text-mono">
              ${cpm.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
    <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 border border-[var(--color-border)]">
      <div className="text-xs text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">{label}</div>
      <div
        className={`text-lg font-bold text-mono ${
          accent ? 'text-[var(--color-accent-secondary)]' : 'text-[var(--color-text-primary)]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
