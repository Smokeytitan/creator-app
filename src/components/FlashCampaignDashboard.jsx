import { useState, useEffect, useCallback } from 'react';
import { Plus, Zap, Clock, CheckCircle, XCircle, Eye, Calendar, Tag, Trophy, Trash2, RefreshCw, ChevronDown } from 'lucide-react';
import CampaignCreationModal from './CampaignCreationModal';
import CampaignResultsView from './CampaignResultsView';
import ExclusionListManager from './ExclusionListManager';
import {
  getCampaigns,
  getCampaignsByStatus,
  checkAndProcessEndedCampaigns,
  cancelCampaign,
  deleteCampaign,
  getStatusDisplay
} from '../services/flashCampaignServiceSupabase';

const FlashCampaignDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [groupedCampaigns, setGroupedCampaigns] = useState({
    active: [],
    scheduled: [],
    completed: [],
    cancelled: []
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'results' | 'exclusions'
  const [processingNotifications, setProcessingNotifications] = useState([]);
  const [isManualProcessing, setIsManualProcessing] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    const loaded = await getCampaigns();
    setCampaigns(loaded);
    const grouped = {
      active: loaded.filter(c => c.status === 'active'),
      scheduled: loaded.filter(c => c.status === 'scheduled'),
      completed: loaded.filter(c => c.status === 'completed'),
      cancelled: loaded.filter(c => c.status === 'cancelled')
    };
    setGroupedCampaigns(grouped);
  }, []);

  // Check for ended campaigns
  const checkCampaigns = useCallback(async () => {
    try {
      const processed = await checkAndProcessEndedCampaigns();

      if (processed.length > 0) {
        // Show notifications for processed campaigns
        const notifications = processed.map(c => `Campaign "${c.name}" has ended. Results fetched!`);
        setProcessingNotifications(prev => [...prev, ...notifications]);

        // Clear notifications after 5 seconds
        setTimeout(() => {
          setProcessingNotifications(prev => prev.filter(n => !notifications.includes(n)));
        }, 5000);

        // Reload campaigns
        loadCampaigns();
      }
    } catch (error) {
      console.error('Error checking campaigns:', error);
    }
  }, [loadCampaigns]);

  // Initial load
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Automatic checking interval (every 1 minute)
  useEffect(() => {
    // Check on mount
    checkCampaigns();

    // Set up interval
    const interval = setInterval(() => {
      checkCampaigns();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [checkCampaigns]);

  const handleCampaignCreated = (newCampaign) => {
    loadCampaigns();
    // Show success notification
    setProcessingNotifications(prev => [
      ...prev,
      `Campaign "${newCampaign.name}" created successfully!`
    ]);
    setTimeout(() => {
      setProcessingNotifications(prev =>
        prev.filter(n => !n.includes(newCampaign.name))
      );
    }, 3000);
  };

  const handleViewResults = (campaign) => {
    setSelectedCampaign(campaign);
    setViewMode('results');
  };

  const handleCancelCampaign = async (campaignId) => {
    if (confirm('Are you sure you want to cancel this campaign?')) {
      await cancelCampaign(campaignId);
      await loadCampaigns();
    }
  };

  const handleDeleteCampaign = async (campaignId, campaignName) => {
    if (confirm(`Are you sure you want to permanently delete the campaign "${campaignName}"? This will delete all campaign data including results and cannot be undone.`)) {
      await deleteCampaign(campaignId);
      await loadCampaigns();
      // Show success notification
      setProcessingNotifications(prev => [
        ...prev,
        `Campaign "${campaignName}" deleted successfully`
      ]);
      setTimeout(() => {
        setProcessingNotifications(prev =>
          prev.filter(n => !n.includes(campaignName))
        );
      }, 3000);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCampaign(null);
    loadCampaigns(); // Reload in case results were refetched
  };

  const handleManualProcess = async () => {
    setIsManualProcessing(true);
    try {
      const processed = await checkAndProcessEndedCampaigns();

      if (processed.length > 0) {
        setProcessingNotifications(prev => [
          ...prev,
          `Processed ${processed.length} campaign(s): ${processed.map(c => c.name).join(', ')}`
        ]);
        setTimeout(() => {
          setProcessingNotifications(prev => prev.slice(1));
        }, 5000);
        await loadCampaigns();
      } else {
        setProcessingNotifications(prev => [
          ...prev,
          'No campaigns need processing at this time'
        ]);
        setTimeout(() => {
          setProcessingNotifications(prev => prev.slice(1));
        }, 3000);
      }
    } catch (error) {
      console.error('Manual processing error:', error);
      setProcessingNotifications(prev => [
        ...prev,
        `Error: ${error.message}`
      ]);
      setTimeout(() => {
        setProcessingNotifications(prev => prev.slice(1));
      }, 5000);
    } finally {
      setIsManualProcessing(false);
    }
  };

  const getTimeRemaining = (endDateTime) => {
    const now = new Date();
    const end = new Date(endDateTime);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getTimeUntilStart = (startDateTime) => {
    const now = new Date();
    const start = new Date(startDateTime);
    const diff = start - now;

    if (diff <= 0) return 'Starting...';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Starts in ${days}d ${hours}h`;
    if (hours > 0) return `Starts in ${hours}h`;
    return 'Starting soon';
  };

  // Render campaign card
  const renderCampaignCard = (campaign, index) => {
    const statusDisplay = getStatusDisplay(campaign.status);
    const isActive = campaign.status === 'active';
    const isScheduled = campaign.status === 'scheduled';
    const isCompleted = campaign.status === 'completed';
    const isExpanded = expandedCampaignId === campaign.id;

    const toggleExpanded = (e) => {
      // Don't toggle if clicking on buttons
      if (e.target.closest('button')) return;
      setExpandedCampaignId(isExpanded ? null : campaign.id);
    };

    return (
      <div
        key={campaign.id}
        className="card-editorial hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden"
        style={{
          animation: 'fadeInUp 0.4s ease-out forwards',
          animationDelay: `${index * 0.05}s`,
          opacity: 0
        }}
        onClick={toggleExpanded}
      >
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-600/0 group-hover:from-amber-500/5 group-hover:to-amber-600/10 transition-all duration-300 pointer-events-none" />
        {/* Header */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold group-hover:text-amber-400 transition-colors duration-300">{campaign.name}</h3>
              <span className={`px-2.5 py-1 text-xs rounded-full border font-semibold ${statusDisplay.colorClass} transition-all duration-300 group-hover:scale-110`}>
                {statusDisplay.label}
              </span>
              <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            {campaign.description && (
              <p className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors duration-300">
                {campaign.description}
              </p>
            )}
          </div>
          {isActive && (
            <Zap className="w-5 h-5 text-yellow-500 animate-pulse group-hover:scale-125 transition-transform duration-300" />
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 group-hover:bg-amber-500/10 transition-all duration-300">
            <Calendar className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-amber-500 transition-colors duration-300" />
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)] group-hover:text-amber-400 transition-colors duration-300">
                {isScheduled ? 'Starts' : isActive ? 'Ends' : 'Ended'}
              </p>
              <p className="text-sm text-mono font-semibold">
                {new Date(isScheduled ? campaign.startDateTime : campaign.endDateTime).toLocaleDateString('en-US', { timeZone: 'America/New_York' })} EST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 group-hover:bg-amber-500/10 transition-all duration-300">
            <Tag className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-amber-500 transition-colors duration-300" />
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)] group-hover:text-amber-400 transition-colors duration-300">Key Phrases</p>
              <p className="text-sm font-semibold">{campaign.keyPhrases.length}</p>
            </div>
          </div>

          {campaign.rewardPool && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 group-hover:bg-amber-500/10 transition-all duration-300">
              <Trophy className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-amber-500 transition-colors duration-300" />
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] group-hover:text-amber-400 transition-colors duration-300">Reward Pool</p>
                <p className="text-sm font-semibold">{campaign.rewardPool}</p>
              </div>
            </div>
          )}

          {isCompleted && campaign.results && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 group-hover:bg-amber-500/10 transition-all duration-300">
              <Eye className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-amber-500 transition-colors duration-300" />
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] group-hover:text-amber-400 transition-colors duration-300">Eligible Tweets</p>
                <p className="text-sm font-bold text-[var(--color-accent-primary)] group-hover:scale-110 inline-block transition-transform duration-300">
                  {campaign.results.eligibleTweets.length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Time Progress */}
        {(isActive || isScheduled) && (
          <div className="mb-4 p-3 bg-white/5 rounded-lg border border-amber-500/20 group-hover:border-amber-500/40 group-hover:bg-amber-500/5 transition-all duration-300 relative z-10">
            <p className="text-xs text-[var(--color-text-secondary)] group-hover:text-amber-400 flex items-center gap-2 font-semibold transition-colors duration-300">
              <Clock className="w-4 h-4 group-hover:animate-pulse" />
              {isActive ? getTimeRemaining(campaign.endDateTime) : getTimeUntilStart(campaign.startDateTime)} (EST)
            </p>
          </div>
        )}

        {/* Expandable Content */}
        <div
          className={`relative z-10 overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-amber-500/20 pt-4 space-y-4">
            {/* Key Phrases */}
            <div>
              <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Key Phrases ({campaign.keyPhrases.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {campaign.keyPhrases.map((phrase, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-300 hover:bg-amber-500/20 transition-colors duration-200"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Start Date</p>
                <p className="text-sm font-semibold text-mono">
                  {new Date(campaign.startDateTime).toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })} EST
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-[var(--color-text-tertiary)] mb-1">End Date</p>
                <p className="text-sm font-semibold text-mono">
                  {new Date(campaign.endDateTime).toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })} EST
                </p>
              </div>
            </div>

            {/* Campaign ID */}
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Campaign ID</p>
              <p className="text-xs font-mono text-[var(--color-text-secondary)]">{campaign.id}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 relative z-10">
          {isCompleted && (
            <button
              onClick={() => handleViewResults(campaign)}
              className="btn-editorial-primary flex-1 flex items-center justify-center gap-2 hover:shadow-amber-500/20 hover:shadow-lg"
            >
              <Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              View Results
            </button>
          )}

          {(isActive || isScheduled) && (
            <button
              onClick={() => handleCancelCampaign(campaign.id)}
              className="btn-editorial-secondary flex-1 flex items-center justify-center gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 hover:scale-105 transition-all duration-300"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}

          {/* Delete button - show for all statuses */}
          <button
            onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
            className="btn-editorial-secondary flex items-center justify-center gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 hover:scale-110 transition-all duration-300"
            title="Delete campaign permanently"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Show results view
  if (viewMode === 'results' && selectedCampaign) {
    return (
      <div>
        <button
          onClick={handleBackToList}
          className="btn-editorial-secondary mb-6"
        >
          ← Back to Campaigns
        </button>
        <CampaignResultsView
          campaign={selectedCampaign}
          onResultsUpdated={loadCampaigns}
        />
      </div>
    );
  }

  // Show exclusions view
  if (viewMode === 'exclusions') {
    return (
      <div>
        <button
          onClick={handleBackToList}
          className="btn-editorial-secondary mb-6"
        >
          ← Back to Campaigns
        </button>
        <ExclusionListManager />
      </div>
    );
  }

  // Show campaign list
  return (
    <div>
      {/* Notifications */}
      {processingNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {processingNotifications.map((notification, idx) => (
            <div
              key={idx}
              className="card-editorial bg-green-500/10 border-green-500/30 shadow-xl"
              style={{
                animation: 'slideInRight 0.3s ease-out'
              }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-500">{notification}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display text-4xl mb-2 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] bg-clip-text text-transparent">
          Flash Campaigns
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Manage weekly content campaigns and track creator submissions
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-editorial-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
        <button
          onClick={() => setViewMode('exclusions')}
          className="btn-editorial-secondary flex items-center gap-2"
        >
          Manage Exclusions
        </button>
        <button
          onClick={handleManualProcess}
          disabled={isManualProcessing}
          className="btn-editorial-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Manually check for ended campaigns and process them"
        >
          <RefreshCw className={`w-4 h-4 ${isManualProcessing ? 'animate-spin' : ''}`} />
          {isManualProcessing ? 'Processing...' : 'Process Now'}
        </button>
      </div>

      {/* Campaign Sections */}
      {campaigns.length === 0 ? (
        <div className="card-editorial text-center py-12">
          <Zap className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
          <h3 className="text-xl font-bold mb-2">No campaigns yet</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Create your first flash campaign to start tracking creator submissions
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-editorial-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Campaigns */}
          {groupedCampaigns.active.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-green-400" />
                Active Campaigns
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groupedCampaigns.active.map((campaign, index) =>
                  renderCampaignCard(campaign, index)
                )}
              </div>
            </div>
          )}

          {/* Scheduled Campaigns */}
          {groupedCampaigns.scheduled.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-400" />
                Scheduled Campaigns
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groupedCampaigns.scheduled.map((campaign, index) =>
                  renderCampaignCard(campaign, index)
                )}
              </div>
            </div>
          )}

          {/* Completed Campaigns */}
          {groupedCampaigns.completed.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-purple-400" />
                Completed Campaigns
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groupedCampaigns.completed.map((campaign, index) =>
                  renderCampaignCard(campaign, index)
                )}
              </div>
            </div>
          )}

          {/* Cancelled Campaigns */}
          {groupedCampaigns.cancelled.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-gray-400" />
                Cancelled Campaigns
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groupedCampaigns.cancelled.map((campaign, index) =>
                  renderCampaignCard(campaign, index)
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaign Creation Modal */}
      <CampaignCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={handleCampaignCreated}
      />
    </div>
  );
};

export default FlashCampaignDashboard;
