import { useState, useEffect } from "react";
import { Rocket, CheckCircle, DollarSign, Eye, Plus, Search, X, ChevronDown, Calendar, ExternalLink, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { getCampaigns, updateCampaign, createCampaign, deleteCampaign, uploadCampaignMedia } from '../services/campaignsServiceSupabase';
import { getCreators } from '../services/creatorsServiceSupabase';
import { useToast } from '../contexts/ToastContext';
import useConfirmDialog from '../hooks/useConfirmDialog';
import ContentRequestModal from './ContentRequestModal';
import CampaignTableRow from './CampaignTableRow';
import DateRangePicker from './DateRangePicker';
import { ConfirmDialog } from './ui';

export function Campaigns() {
  const toast = useToast();
  const { dialogProps, confirm } = useConfirmDialog();
  const [filter, setFilter] = useState("all");
  const [campaigns, setCampaigns] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt'); // title, status, impressions, cost, cpm, createdAt
  const [sortDirection, setSortDirection] = useState('desc'); // asc, desc
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null, label: 'All Time' });
  const [searchTerm, setSearchTerm] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    startDate: '',
    estimatedCost: 0,
    estimatedImpressions: 0,
    creators: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [campaignsData, creatorsData] = await Promise.all([
          getCampaigns(),
          getCreators()
        ]);
        setCampaigns(campaignsData);
        setCreators(creatorsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateEstimates = (selectedCreatorIds) => {
    const selectedCreators = creators.filter(c => selectedCreatorIds.includes(c.id));

    // Calculate total estimated cost based on cost per post
    const totalCost = selectedCreators.reduce((sum, creator) => {
      const cost = parseFloat(creator.costPerPost) || 0;
      return sum + cost;
    }, 0);

    // Calculate average impressions per creator based on their post history
    const totalImpressions = selectedCreators.reduce((sum, creator) => {
      if (!creator.posts || creator.posts.length === 0) return sum;

      // Calculate average impressions from their posts
      const postImpressions = creator.posts.map(p => parseInt(p.impressions) || 0);
      const avgImpressions = postImpressions.reduce((a, b) => a + b, 0) / postImpressions.length;

      return sum + avgImpressions;
    }, 0);

    return {
      estimatedCost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
      estimatedImpressions: Math.round(totalImpressions)
    };
  };

  const handleEditClick = (campaign) => {
    setEditingCampaign(campaign);
    const creatorIds = (campaign.creators || []).map(c => c.id);
    const estimates = calculateEstimates(creatorIds);

    setEditForm({
      title: campaign.title,
      description: campaign.description,
      status: campaign.status,
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 10) : '',
      estimatedCost: estimates.estimatedCost,
      estimatedImpressions: estimates.estimatedImpressions,
      creators: creatorIds
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;

    try {
      const updated = await updateCampaign(editingCampaign.id, editForm);
      if (updated) {
        setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? updated : c));
        setEditingCampaign(null);
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const handleCancelEdit = () => {
    setEditingCampaign(null);
    setEditForm({ title: '', description: '', status: 'pending', startDate: '', estimatedCost: 0, estimatedImpressions: 0, creators: [] });
  };

  const toggleCreator = (creatorId) => {
    setEditForm(prev => {
      const newCreators = prev.creators.includes(creatorId)
        ? prev.creators.filter(id => id !== creatorId)
        : [...prev.creators, creatorId];

      // Recalculate estimates based on new creator selection
      const estimates = calculateEstimates(newCreators);

      return {
        ...prev,
        creators: newCreators,
        ...estimates
      };
    });
  };

  const handleDelete = async (campaign) => {
    const confirmed = await confirm({
      title: 'Delete Campaign',
      description: 'Are you sure you want to delete "' + campaign.title + '"? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const success = await deleteCampaign(campaign.id);
      if (success) {
        setCampaigns(campaigns.filter(c => c.id !== campaign.id));
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const getSortedCampaigns = (campaignsToSort) => {
    return [...campaignsToSort].sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'impressions':
          aVal = a.actualImpressions || a.estimatedImpressions || 0;
          bVal = b.actualImpressions || b.estimatedImpressions || 0;
          break;
        case 'cost':
          aVal = a.actualCost || a.estimatedCost || 0;
          bVal = b.actualCost || b.estimatedCost || 0;
          break;
        case 'cpm':
          const aImpressions = a.actualImpressions || a.estimatedImpressions || 0;
          const aCost = a.actualCost || a.estimatedCost || 0;
          const bImpressions = b.actualImpressions || b.estimatedImpressions || 0;
          const bCost = b.actualCost || b.estimatedCost || 0;
          aVal = aImpressions > 0 ? (aCost / aImpressions) * 1000 : 0;
          bVal = bImpressions > 0 ? (bCost / bImpressions) * 1000 : 0;
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const filterByDateRange = (campaign) => {
    // If no date range is set (All Time), show all campaigns
    if (!dateRange.startDate && !dateRange.endDate) {
      return true;
    }

    const campaignDate = new Date(campaign.createdAt);
    const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const end = dateRange.endDate ? new Date(dateRange.endDate) : null;

    // Set end date to end of day for inclusive filtering
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    if (start && end) {
      return campaignDate >= start && campaignDate <= end;
    } else if (start) {
      return campaignDate >= start;
    } else if (end) {
      return campaignDate <= end;
    }

    return true;
  };

  const inProgressCount = campaigns.filter(c => c.status === 'active' || c.status === 'in_progress' || c.status === 'pending').length;
  const completedCount = campaigns.filter(c => c.status === 'done' || c.status === 'completed').length;

  const stats = [
    {
      label: "In Progress",
      value: String(inProgressCount),
      icon: Rocket,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "Completed",
      value: String(completedCount),
      icon: CheckCircle,
      iconColor: "text-green-400",
      iconBg: "bg-green-500/10",
    },
  ];

  return (
    <section className="space-y-8 pb-12">
      <div>
        {/* Header */}
        <div className="flex items-end justify-between mb-8 border-b border-[var(--color-border)] pb-8">
          <div>
            <h1 className="text-heading-1 text-[var(--color-text-primary)] mb-2">Campaigns</h1>
            <p className="text-[var(--color-text-secondary)]">
              Manage campaigns and track content delivery across creators
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="rounded-xl px-6 py-3 bg-[var(--color-accent-primary)] text-white font-semibold hover:bg-[var(--color-accent-hover)] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] transition-colors">
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-border-hover)] transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-overline text-[var(--color-text-tertiary)]">
                    {stat.label}
                  </p>
                  <div className={`${stat.iconBg} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-4xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex-1 w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl px-4 py-3 pl-10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-2 focus:ring-[var(--color-accent-muted)]"
              />
              <Search className="w-5 h-5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Date Range Filter */}
            <DateRangePicker
              currentRange={dateRange}
              onRangeChange={setDateRange}
            />
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                All
              </span>
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "active"
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                Active
              </span>
            </button>
            <button
              onClick={() => setFilter("done")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "done"
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Done
              </span>
            </button>
            <button
              onClick={() => setFilter("archived")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "archived"
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                Archived
              </span>
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        {!loading && (
          <div className="mb-4 text-sm text-neutral-400">
            Showing {campaigns.filter(campaign => {
              // Status filter
              let statusMatch = true;
              if (filter === "active") statusMatch = campaign.status === "in-progress";
              else if (filter === "done") statusMatch = campaign.status === "completed";
              else if (filter === "archived") statusMatch = campaign.status === "cancelled";

              // Date filter
              const dateMatch = filterByDateRange(campaign);

              return statusMatch && dateMatch;
            }).length} of {campaigns.length} campaigns
            {dateRange.label !== 'All Time' && ` from ${dateRange.label.toLowerCase()}`}
          </div>
        )}

        {/* Campaign Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
              <p className="mt-4 text-neutral-400 font-medium">Loading campaigns...</p>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            {/* Table Header with Sorting */}
            <div className="bg-neutral-900/30 border border-white/10 rounded-t-lg px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-6 flex-1">
                <button
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Campaign
                  {sortBy === 'title' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => toggleSort('status')}
                  className="flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Status
                  {sortBy === 'status' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => toggleSort('impressions')}
                  className="flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Impressions
                  {sortBy === 'impressions' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => toggleSort('cost')}
                  className="flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Cost
                  {sortBy === 'cost' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => toggleSort('cpm')}
                  className="flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  CPM
                  {sortBy === 'cpm' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </button>
                <div className="w-24"></div> {/* Spacer for action menu */}
              </div>
            </div>

            {/* Campaign Rows */}
            <div className="space-y-1">
              {(() => {
                // Filter by status
                const statusFilteredCampaigns = campaigns.filter(campaign => {
                  if (filter === "all") return true;
                  if (filter === "active") return campaign.status === "in-progress";
                  if (filter === "done") return campaign.status === "completed";
                  if (filter === "archived") return campaign.status === "cancelled";
                  return true;
                });

                // Filter by search term
                const searchFilteredCampaigns = statusFilteredCampaigns.filter(campaign => {
                  if (!searchTerm) return true;
                  const term = searchTerm.toLowerCase();
                  return (
                    (campaign.title || '').toLowerCase().includes(term) ||
                    (campaign.description || '').toLowerCase().includes(term)
                  );
                });

                // Filter by date range
                const filteredCampaigns = searchFilteredCampaigns.filter(filterByDateRange);

                const sortedCampaigns = getSortedCampaigns(filteredCampaigns);

                if (sortedCampaigns.length === 0) {
                  return (
                    <div className="text-center py-12 bg-neutral-900/50 border border-white/10 rounded-b-lg">
                      <p className="text-neutral-400">No campaigns found</p>
                    </div>
                  );
                }

                return sortedCampaigns.map((campaign) => (
                  <CampaignTableRow
                    key={campaign.id}
                    campaign={campaign}
                    creators={creators}
                    onEdit={() => handleEditClick(campaign)}
                    onDelete={handleDelete}
                    onExpand={() => setExpandedCampaignId(expandedCampaignId === campaign.id ? null : campaign.id)}
                    isExpanded={expandedCampaignId === campaign.id}
                  />
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Campaign</h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/20"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Estimated Cost ($)
                  </label>
                  <input
                    type="text"
                    value={`$${editForm.estimatedCost.toFixed(2)}`}
                    readOnly
                    className="w-full bg-neutral-800/50 border border-white/10 rounded-lg px-4 py-3 text-neutral-300 cursor-not-allowed"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Auto-calculated from creator costs</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Estimated Impressions
                  </label>
                  <input
                    type="text"
                    value={editForm.estimatedImpressions.toLocaleString()}
                    readOnly
                    className="w-full bg-neutral-800/50 border border-white/10 rounded-lg px-4 py-3 text-neutral-300 cursor-not-allowed"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Based on creator averages</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Creators ({editForm.creators.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-white/10 rounded-lg bg-neutral-800 p-3 space-y-2">
                  {creators.map((creator) => {
                    const costPerPost = parseFloat(creator.costPerPost) || 0;
                    const avgImpressions = creator.posts && creator.posts.length > 0
                      ? Math.round(creator.posts.reduce((sum, p) => sum + (parseInt(p.impressions) || 0), 0) / creator.posts.length)
                      : 0;

                    return (
                      <label
                        key={creator.id}
                        className="flex items-center justify-between gap-3 p-2 hover:bg-white/5 rounded cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={editForm.creators.includes(creator.id)}
                            onChange={() => toggleCreator(creator.id)}
                            className="w-4 h-4 rounded border-white/20 bg-neutral-700 text-[var(--color-accent-primary)] focus:ring-2 focus:ring-[var(--color-accent-primary)] flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium truncate">{creator.name}</span>
                              <span className="text-neutral-500 text-xs truncate">@{creator.handle}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs">
                              {costPerPost > 0 && (
                                <span className="text-green-400 flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ${costPerPost.toFixed(2)}/post
                                </span>
                              )}
                              {avgImpressions > 0 && (
                                <span className="text-purple-400 flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {avgImpressions.toLocaleString()} avg
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-3 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <ContentRequestModal
          creators={creators}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (newCampaign) => {
            try {
              const created = await createCampaign({
                title: newCampaign.title,
                description: newCampaign.description,
                brief: newCampaign.brief || '',
                creators: newCampaign.creators.map(c => typeof c === 'object' ? c.id : c),
                status: newCampaign.status || 'pending',
                startDate: newCampaign.startDate || null,
                estimatedCost: Number(newCampaign.estimatedCost) || 0,
                estimatedImpressions: Number(newCampaign.estimatedImpressions) || 0
              });

              if (created) {
                // Upload media files if any
                if (newCampaign.mediaFiles?.length > 0) {
                  const uploadedUrls = [];
                  for (const file of newCampaign.mediaFiles) {
                    try {
                      const url = await uploadCampaignMedia(created.id, file);
                      uploadedUrls.push(url);
                    } catch (uploadErr) {
                      console.error('Media upload failed for', file.name, uploadErr);
                    }
                  }
                  if (uploadedUrls.length > 0) {
                    const updated = await updateCampaign(created.id, { mediaUrls: uploadedUrls });
                    setCampaigns([updated || created, ...campaigns]);
                  } else {
                    setCampaigns([created, ...campaigns]);
                  }
                } else {
                  setCampaigns([created, ...campaigns]);
                }
                setShowCreateModal(false);
              }
            } catch (error) {
              console.error('Error creating campaign:', error);
              toast.error('Failed to create campaign: ' + error.message);
            }
          }}
        />
      )}

      <ConfirmDialog {...dialogProps} />
    </section>
  );
}
