import { useState, useMemo, useEffect } from 'react';
import { Plus, Download, Search, User, X, RefreshCw } from 'lucide-react';
import ContentRequestModal from './ContentRequestModal';
import KPIStrip from './KPIStrip';
import CampaignTableRow from './CampaignTableRow';
import OverviewTab from './OverviewTab';
import { extractTweetId, fetchTweets } from '../services/twitterService';
import { createCampaign, updateCampaign, deleteCampaign as deleteCampaignSupabase, getCampaigns } from '../services/campaignsServiceSupabase';
import { addPost } from '../services/creatorsServiceSupabase';
import { supabase } from '../lib/supabaseClient';
import { exportAndDownload } from '../utils/csvExport';
import { useToast } from './Toast';

/**
 * ContentRequestsEditorialImproved - Executive-ready analytics dashboard
 *
 * Key improvements:
 * - KPI strip with outcome-focused metrics (spend, impressions, CPM, engagement)
 * - Table-row campaign list for better scanning
 * - Estimated vs Actual with confidence indicators
 * - Overview tab with data visualization
 * - Toast notifications instead of alerts
 * - Analyst-ready CSV exports
 */
const ContentRequestsEditorialImproved = ({ creators, setCreators, requests = [], setRequests }) => {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'overview' | 'campaigns'
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCreatorId, setFilterCreatorId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const toast = useToast();

  // Add content state
  const [addingContentForRequest, setAddingContentForRequest] = useState(null);
  const [contentForm, setContentForm] = useState({
    selectedCreatorIds: [],
    description: '',
    platforms: ['X'],
    platformData: {
      'X': { link: '', impressions: '', likes: '', comments: '' },
      'Facebook': { link: '', impressions: '', likes: '', comments: '' },
      'Instagram': { link: '', impressions: '', likes: '', comments: '' },
      'YouTube': { link: '', impressions: '', likes: '', comments: '' },
      'TikTok': { link: '', impressions: '', likes: '', comments: '' }
    },
    cost: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [fetchingTweetData, setFetchingTweetData] = useState(false);

  // Background tweet scanner - runs every 24 hours
  useEffect(() => {
    const scanTweetsForUpdates = async () => {
      console.log('Running background tweet scanner...');

      setCreators(currentCreators => {
        const tweetsToScan = [];

        currentCreators.forEach(creator => {
          (creator.posts || []).forEach(post => {
            if (post.platform === 'X' && post.link) {
              const tweetId = extractTweetId(post.link);
              if (!tweetId) return;

              if (isTweetOldEnough(post.date) && needsRescan(post.lastScanned)) {
                tweetsToScan.push({
                  creatorId: creator.id,
                  postId: post.id,
                  tweetId,
                  link: post.link,
                  date: post.date
                });
              }
            }
          });
        });

        if (tweetsToScan.length === 0) return currentCreators;

        console.log(`Scanning ${tweetsToScan.length} tweets for updates...`);

        (async () => {
          for (let i = 0; i < tweetsToScan.length; i += 100) {
            const batch = tweetsToScan.slice(i, i + 100);
            const tweetIds = batch.map(t => t.tweetId);

            try {
              const response = await fetchTweets(tweetIds);

              if (response.data && response.data.length > 0) {
                setCreators(prevCreators => {
                  return prevCreators.map(creator => {
                    const creatorTweets = batch.filter(t => t.creatorId === creator.id);
                    if (creatorTweets.length === 0) return creator;

                    return {
                      ...creator,
                      posts: (creator.posts || []).map(post => {
                        const tweetToUpdate = creatorTweets.find(t => t.postId === post.id);
                        if (!tweetToUpdate) return post;

                        const tweetData = response.data.find(t => t.id === tweetToUpdate.tweetId);
                        if (!tweetData) return post;

                        const metrics = tweetData.public_metrics;

                        return {
                          ...post,
                          impressions: metrics.impression_count?.toString() || post.impressions,
                          likes: metrics.like_count?.toString() || post.likes,
                          comments: metrics.reply_count?.toString() || post.comments,
                          lastScanned: new Date().toISOString()
                        };
                      })
                    };
                  });
                });
              }
            } catch (error) {
              console.error('Error scanning tweet batch:', error);
            }

            if (i + 100 < tweetsToScan.length) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }
        })();

        return currentCreators;
      });
    };

    scanTweetsForUpdates();
    const interval = setInterval(scanTweetsForUpdates, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filter by status
    if (filterStatus === 'completed') {
      filtered = filtered.filter(req => req.status === 'completed');
    } else if (filterStatus === 'all') {
      filtered = filtered.filter(req => req.status !== 'completed');
    }

    // Filter by creator
    if (filterCreatorId !== 'all') {
      filtered = filtered.filter(req =>
        (req.creators || []).some(c => String(c.id) === String(filterCreatorId))
      );
    }

    // Filter by search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(req => {
        const titleMatch = req.title?.toLowerCase().includes(search);
        const descriptionMatch = req.description?.toLowerCase().includes(search);
        const creatorMatch = (req.creators || []).some(c =>
          c.name?.toLowerCase().includes(search)
        );
        return titleMatch || descriptionMatch || creatorMatch;
      });
    }

    return filtered;
  }, [requests, filterStatus, filterCreatorId, searchTerm]);

  // Handlers
  const handleRefresh = async () => {
    try {
      const freshCampaigns = await getCampaigns();
      setRequests(freshCampaigns);
      setLastUpdated(new Date());
      toast.success('Campaigns refreshed');
    } catch (error) {
      toast.error('Failed to refresh campaigns');
    }
  };

  const handleEdit = (campaign) => {
    // Open edit modal or navigate to edit page
    toast.info('Edit functionality - implement as needed');
  };

  const handleDelete = async (campaign) => {
    if (!confirm(`Delete campaign "${campaign.title}"?`)) return;

    try {
      const success = await deleteCampaignSupabase(campaign.id);
      if (success) {
        setRequests(requests.filter(r => r.id !== campaign.id));
        toast.success('Campaign deleted');
      } else {
        toast.error('Failed to delete campaign');
      }
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const handleAddContent = (campaign) => {
    setAddingContentForRequest(campaign);
    // Reset form...
  };

  const handleExpand = (campaignId) => {
    setExpandedCampaignId(expandedCampaignId === campaignId ? null : campaignId);
  };

  const handleExportCSV = () => {
    const filters = {
      status: filterStatus !== 'all' ? filterStatus : null,
      creatorId: filterCreatorId !== 'all' ? filterCreatorId : null,
      search: searchTerm || null
    };

    exportAndDownload(filteredRequests, filters);
    toast.success('CSV export downloaded');
  };

  const handleCreateCampaign = async (newCampaign) => {
    if (!supabase) {
      setRequests([...requests, { ...newCampaign, id: Date.now() }]);
      setShowModal(false);
      toast.success('Campaign created (local only)');
      return;
    }

    try {
      const creatorIds = (newCampaign.creators || []).map(c => c.id);
      const created = await createCampaign({
        title: newCampaign.title,
        description: newCampaign.description,
        creators: creatorIds,
        status: newCampaign.status || 'pending',
        estimatedCost: newCampaign.estimatedCost || 0,
        estimatedImpressions: newCampaign.estimatedImpressions || 0
      });

      if (created) {
        setRequests([...requests, created]);
        setShowModal(false);
        toast.success('Campaign created');
      } else {
        toast.error('Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign: ' + error.message);
    }
  };

  // Helper functions
  const isTweetOldEnough = (tweetDate) => {
    if (!tweetDate) return false;
    const tweetTime = new Date(tweetDate).getTime();
    const now = Date.now();
    const hoursSincePost = (now - tweetTime) / (1000 * 60 * 60);
    return hoursSincePost >= 48;
  };

  const needsRescan = (lastScanned) => {
    if (!lastScanned) return true;
    const lastScanTime = new Date(lastScanned).getTime();
    const now = Date.now();
    const hoursSinceScan = (now - lastScanTime) / (1000 * 60 * 60);
    return hoursSinceScan >= 24;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="border-b border-[var(--color-border)] pb-6" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-display text-5xl mb-2 text-[var(--color-text-primary)]">
              Campaign Analytics
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg">
              Executive dashboard for campaign performance and content delivery
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
            <div className="text-xs text-[var(--color-text-tertiary)]">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'border-b-2 border-[var(--color-accent-primary)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'campaigns'
              ? 'border-b-2 border-[var(--color-accent-primary)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Campaigns ({requests.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
          <OverviewTab
            campaigns={requests}
            creators={creators}
          />
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <>
          {/* KPI Strip */}
          <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            <KPIStrip campaigns={requests} filteredCampaigns={filteredRequests} />
          </div>

          {/* Filters Bar */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
            <div className="flex flex-col gap-4">
              {/* Top Row: Status Filters + Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      filterStatus === 'all'
                        ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white shadow-lg'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] border border-[var(--color-border)]'
                    }`}
                  >
                    Ongoing
                  </button>
                  <button
                    onClick={() => setFilterStatus('completed')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      filterStatus === 'completed'
                        ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white shadow-lg'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] border border-[var(--color-border)]'
                    }`}
                  >
                    Completed
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all shadow-lg shadow-green-500/25"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white hover:shadow-lg transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </button>
                </div>
              </div>

              {/* Bottom Row: Search + Creator Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 w-full sm:w-auto sm:min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Creator Filter */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                  <select
                    value={filterCreatorId}
                    onChange={(e) => setFilterCreatorId(e.target.value)}
                    className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
                  >
                    <option value="all">All Creators</option>
                    {creators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign List (Table-Row Style) */}
          <div className="space-y-2" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
            {filteredRequests.length === 0 ? (
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-12 text-center">
                <p className="text-[var(--color-text-secondary)] mb-4">No campaigns found</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first campaign
                </button>
              </div>
            ) : (
              filteredRequests.map((campaign, index) => (
                <CampaignTableRow
                  key={campaign.id}
                  campaign={campaign}
                  creators={creators}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddContent={handleAddContent}
                  onExpand={handleExpand}
                  isExpanded={expandedCampaignId === campaign.id}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Campaign Create Modal */}
      {showModal && (
        <ContentRequestModal
          creators={creators}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateCampaign}
        />
      )}

      {/* Add Content Modal - TODO: Create AddContentModal component */}
      {addingContentForRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              Add Content for: {addingContentForRequest.title}
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              Add content modal - implement with multi-platform support
            </p>
            <button
              onClick={() => setAddingContentForRequest(null)}
              className="mt-4 px-4 py-2 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentRequestsEditorialImproved;
