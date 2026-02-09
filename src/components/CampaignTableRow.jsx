import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Plus,
  Calendar,
  ExternalLink
} from 'lucide-react';
import CampaignStatusBadge from './campaigns/CampaignStatusBadge';
import ConfidenceBadge from './ConfidenceBadge';

/**
 * CampaignTableRow - Table-row style layout for campaign display
 *
 * Features:
 * - Row-based layout with column alignment for easy scanning
 * - Left: Campaign info (title, description, creators, dates)
 * - Right: Metrics (impressions, cost, CPM) - right-aligned, monospace
 * - Status badge and confidence badge
 * - Expandable section for posts with smooth animation
 * - Action menu (Edit, Delete)
 * - "Add Content" button in expanded area
 * - Hover state with subtle background change
 */
export default function CampaignTableRow({
  campaign,
  creators = [],
  onEdit,
  onDelete,
  onAddContent,
  onExpand,
  isExpanded = false
}) {
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Calculate metrics
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  // Use actual metrics from posts when available, fall back to estimates
  const displayImpressions = campaign.actualImpressions > 0 ? campaign.actualImpressions : (campaign.estimatedImpressions || 0);
  const displayCost = campaign.actualCost > 0 ? campaign.actualCost : (campaign.estimatedCost || 0);
  const cpm = displayImpressions > 0 ? (displayCost / displayImpressions) * 1000 : 0;

  // Get creator names
  const getCreatorNames = () => {
    if (!campaign.creators || campaign.creators.length === 0) {
      return 'No creators assigned';
    }

    const creatorList = campaign.creators
      .map(entry => {
        // Handle both object format {id, name, ...} and plain ID format
        if (typeof entry === 'object' && entry.name) return entry.name;
        const creator = creators.find(c => c.id === entry);
        return creator ? creator.name : null;
      })
      .filter(Boolean);

    if (creatorList.length === 0) return 'No creators assigned';
    if (creatorList.length <= 2) return creatorList.join(', ');
    return `${creatorList[0]}, ${creatorList[1]}, +${creatorList.length - 2} more`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  };

  // Determine confidence level based on posts
  const getConfidenceLevel = () => {
    if (!campaign.posts || campaign.posts.length === 0) return 'estimated';

    const postsWithMetrics = campaign.posts.filter(
      post => post.actualImpressions && post.actualImpressions > 0
    );

    if (postsWithMetrics.length === campaign.posts.length) return 'measured';
    if (postsWithMetrics.length > 0) return 'partial';
    return 'estimated';
  };

  const confidence = getConfidenceLevel();

  // Toggle expansion
  const handleToggleExpand = () => {
    if (onExpand) {
      onExpand(campaign.id);
    }
  };

  // Action handlers
  const handleEdit = (e) => {
    e.stopPropagation();
    setShowActionMenu(false);
    if (onEdit) onEdit(campaign);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowActionMenu(false);
    if (onDelete) onDelete(campaign);
  };

  const handleAddContent = (e) => {
    e.stopPropagation();
    if (onAddContent) onAddContent(campaign);
  };

  return (
    <div className="campaign-table-row">
      {/* Main Row */}
      <div
        className="
          bg-[var(--color-bg-secondary)]
          border border-[var(--color-border)]
          rounded-lg
          transition-all duration-200
          hover:bg-[var(--color-bg-tertiary)]
          hover:border-[var(--color-border-hover)]
          cursor-pointer
        "
        onClick={handleToggleExpand}
      >
        {/* Top Row - Main Info */}
        <div className="flex items-start justify-between gap-4 p-4">
          {/* Left Side - Campaign Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Expand/Collapse Icon */}
              <button
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleExpand();
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>

              {/* Status Badge */}
              <CampaignStatusBadge status={campaign.status} size="sm" />

              {/* Campaign Title */}
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] truncate">
                {campaign.title}
              </h3>
            </div>

            {/* Secondary Info Row */}
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] ml-8">
              <span className="truncate">{campaign.description || 'No description'}</span>
              <span className="text-[var(--color-text-tertiary)]">•</span>
              <span className="truncate">{getCreatorNames()}</span>
              <span className="text-[var(--color-text-tertiary)]">•</span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Calendar className="w-3 h-3" />
                Due {formatDate(campaign.dueDate || campaign.createdAt)}
              </span>
            </div>
          </div>

          {/* Right Side - Metrics */}
          <div className="flex items-center gap-6">
            {/* Metrics - Right-aligned, Monospace */}
            <div className="flex items-center gap-4 text-sm font-mono">
              {/* Impressions */}
              <div className="text-right">
                <div className="text-[var(--color-text-primary)] font-semibold whitespace-nowrap">
                  {formatNumber(displayImpressions)} imp
                </div>
              </div>

              {/* Cost */}
              <div className="text-right">
                <div className="text-[var(--color-text-primary)] font-semibold whitespace-nowrap">
                  {formatCurrency(displayCost)}
                </div>
              </div>

              {/* CPM */}
              <div className="text-right">
                <div className="text-[var(--color-text-primary)] font-semibold whitespace-nowrap">
                  ${cpm.toFixed(2)} CPM
                </div>
              </div>
            </div>

            {/* Confidence Badge */}
            <ConfidenceBadge confidence={confidence} size="sm" />

            {/* Action Menu */}
            <div className="relative">
              <button
                className="
                  p-1.5 rounded-md
                  text-[var(--color-text-secondary)]
                  hover:text-[var(--color-text-primary)]
                  hover:bg-[var(--color-bg-tertiary)]
                  transition-colors
                "
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(!showActionMenu);
                }}
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Action Menu Dropdown */}
              {showActionMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionMenu(false);
                    }}
                  />

                  {/* Menu */}
                  <div
                    className="
                      absolute right-0 top-full mt-1 z-20
                      w-40
                      bg-[var(--color-bg-tertiary)]
                      border border-[var(--color-border)]
                      rounded-lg
                      shadow-xl
                      overflow-hidden
                    "
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="
                        w-full px-4 py-2.5
                        flex items-center gap-2
                        text-sm text-[var(--color-text-primary)]
                        hover:bg-[var(--color-bg-secondary)]
                        transition-colors
                        text-left
                      "
                      onClick={handleEdit}
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      className="
                        w-full px-4 py-2.5
                        flex items-center gap-2
                        text-sm text-red-400
                        hover:bg-[var(--color-bg-secondary)]
                        transition-colors
                        text-left
                      "
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Section - Posts List */}
        <div
          className={`
            overflow-hidden
            transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="border-t border-[var(--color-border)] px-4 py-4 max-h-[400px] overflow-y-auto">
            {/* Posts Header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Content Posts
                {campaign.posts && campaign.posts.length > 0 && (
                  <span className="ml-2 text-[var(--color-text-tertiary)]">
                    ({campaign.posts.length})
                  </span>
                )}
              </h4>

              {/* Add Content Button */}
              <button
                className="
                  flex items-center gap-1.5
                  px-3 py-1.5
                  bg-[var(--color-accent-primary)]
                  hover:bg-[var(--color-accent-secondary)]
                  text-white text-sm font-medium
                  rounded-md
                  transition-all duration-200
                  hover:shadow-lg
                "
                onClick={handleAddContent}
              >
                <Plus className="w-4 h-4" />
                Add Content
              </button>
            </div>

            {/* Posts List */}
            {campaign.posts && campaign.posts.length > 0 ? (
              <div className="space-y-2">
                {campaign.posts.map((post, index) => (
                  <div
                    key={post.id || index}
                    className="
                      flex items-center justify-between
                      p-3
                      bg-[var(--color-bg-primary)]
                      border border-[var(--color-border)]
                      rounded-md
                    "
                  >
                    <div className="flex-1 min-w-0">
                      {/* Creator name */}
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">
                        {post.creatorName || 'Unknown creator'}
                        {post.creatorHandle && (
                          <span className="ml-1.5 text-xs font-normal text-[var(--color-text-tertiary)]">
                            {post.creatorHandle}
                          </span>
                        )}
                      </div>

                      {/* Post link */}
                      {post.link ? (
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] hover:underline transition-colors"
                          title={post.link}
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[300px]">
                            {post.link.replace(/^https?:\/\/(www\.)?/, '')}
                          </span>
                        </a>
                      ) : post.description ? (
                        <div className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">
                          {post.description}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-4 ml-4 text-xs font-mono text-[var(--color-text-secondary)] whitespace-nowrap">
                      {post.impressions > 0 && (
                        <span>{formatNumber(post.impressions)} imp</span>
                      )}
                      {post.cost > 0 && (
                        <span>{formatCurrency(post.cost)}</span>
                      )}
                      {post.date && (
                        <span>{formatDate(post.date)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="
                py-8
                text-center text-sm text-[var(--color-text-tertiary)]
              ">
                No content posts yet. Click "Add Content" to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

CampaignTableRow.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['pending', 'in-progress', 'completed', 'cancelled']).isRequired,
    creators: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    estimatedCost: PropTypes.number,
    estimatedImpressions: PropTypes.number,
    posts: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      description: PropTypes.string,
      link: PropTypes.string,
      creatorName: PropTypes.string,
      creatorHandle: PropTypes.string,
      impressions: PropTypes.number,
      cost: PropTypes.number,
      date: PropTypes.string,
      platform: PropTypes.string
    })),
    createdAt: PropTypes.string,
    dueDate: PropTypes.string
  }).isRequired,
  creators: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired
  })),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onAddContent: PropTypes.func,
  onExpand: PropTypes.func,
  isExpanded: PropTypes.bool
};
