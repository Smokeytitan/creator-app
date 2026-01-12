import { useState, useEffect, useCallback } from 'react';
import { Plus, Zap, Clock, CheckCircle, XCircle, Eye, Calendar, Tag, Trophy } from 'lucide-react';
import CampaignCreationModal from './CampaignCreationModal';
import CampaignResultsView from './CampaignResultsView';
import ExclusionListManager from './ExclusionListManager';
import {
  getCampaigns,
  getCampaignsByStatus,
  checkAndProcessEndedCampaigns,
  cancelCampaign,
  getStatusDisplay
} from '../services/flashCampaignService';

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

  // Load campaigns
  const loadCampaigns = useCallback(() => {
    const loaded = getCampaigns();
    setCampaigns(loaded);
    setGroupedCampaigns(getCampaignsByStatus());
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

  const handleCancelCampaign = (campaignId) => {
    if (confirm('Are you sure you want to cancel this campaign?')) {
      cancelCampaign(campaignId);
      loadCampaigns();
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCampaign(null);
    loadCampaigns(); // Reload in case results were refetched
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

    return (
      <div
        key={campaign.id}
        className="card-editorial hover:shadow-lg transition-all"
        style={{
          animation: 'fadeInUp 0.4s ease-out forwards',
          animationDelay: `${index * 0.05}s`,
          opacity: 0
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold">{campaign.name}</h3>
              <span className={`px-2 py-0.5 text-xs rounded-full border ${statusDisplay.colorClass}`}>
                {statusDisplay.label}
              </span>
            </div>
            {campaign.description && (
              <p className="text-sm text-[var(--color-text-secondary)]">
                {campaign.description}
              </p>
            )}
          </div>
          {isActive && (
            <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {isScheduled ? 'Starts' : isActive ? 'Ends' : 'Ended'}
              </p>
              <p className="text-sm text-mono">
                {new Date(isScheduled ? campaign.startDateTime : campaign.endDateTime).toLocaleDateString('en-US', { timeZone: 'America/New_York' })} EST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Key Phrases</p>
              <p className="text-sm">{campaign.keyPhrases.length}</p>
            </div>
          </div>

          {campaign.rewardPool && (
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">Reward Pool</p>
                <p className="text-sm">{campaign.rewardPool}</p>
              </div>
            </div>
          )}

          {isCompleted && campaign.results && (
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">Eligible Tweets</p>
                <p className="text-sm font-bold text-[var(--color-accent-primary)]">
                  {campaign.results.eligibleTweets.length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Time Progress */}
        {(isActive || isScheduled) && (
          <div className="mb-4 p-2 bg-white/5 rounded-lg">
            <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {isActive ? getTimeRemaining(campaign.endDateTime) : getTimeUntilStart(campaign.startDateTime)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isCompleted && (
            <button
              onClick={() => handleViewResults(campaign)}
              className="btn-editorial-primary flex-1 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Results
            </button>
          )}

          {(isActive || isScheduled) && (
            <button
              onClick={() => handleCancelCampaign(campaign.id)}
              className="btn-editorial-secondary flex-1 flex items-center justify-center gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
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
