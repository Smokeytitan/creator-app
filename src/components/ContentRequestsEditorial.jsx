import { useState, useMemo, useEffect } from 'react';
import { Plus, Calendar, User, CheckCircle, Clock, XCircle, Trash2, Edit2, Save, X, Search, RefreshCw, Eye, DollarSign, Download } from 'lucide-react';
import ContentRequestModal from './ContentRequestModal';
import { INITIAL_REQUESTS } from '../data/initialRequests';

const ContentRequestsEditorial = ({ creators }) => {
  const resetToCampaigns = () => {
    if (confirm('This will load all campaigns from Google Sheets. Your current requests will be replaced. Are you sure?')) {
      setRequests(INITIAL_REQUESTS);
      alert('Campaign data has been loaded from Google Sheets!');
    }
  };
  const [requests, setRequests] = useState(() => {
    const stored = localStorage.getItem('requests');
    if (stored) {
      try {
        const parsedRequests = JSON.parse(stored);
        // Migrate old format (single creator) to new format (multiple creators)
        return parsedRequests.map(req => {
          if (req.creatorId && !req.creators) {
            return {
              ...req,
              creators: [{
                id: req.creatorId,
                name: req.creatorName
              }]
            };
          }
          return req;
        });
      } catch (e) {
        console.error('Failed to parse requests from localStorage:', e);
        return INITIAL_REQUESTS;
      }
    }
    return INITIAL_REQUESTS;
  });
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCreatorId, setFilterCreatorId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [editRequestForm, setEditRequestForm] = useState({
    title: '',
    description: '',
    selectedCreatorIds: [],
    dueDate: '',
    status: 'pending'
  });

  // Save requests to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('requests', JSON.stringify(requests));
  }, [requests]);

  const startEditRequest = (request) => {
    setEditingRequestId(request.id);
    setEditRequestForm({
      title: request.title,
      description: request.description,
      selectedCreatorIds: (request.creators || []).map(c => c.id),
      dueDate: new Date(request.dueDate).toISOString().slice(0, 10),
      status: request.status
    });
  };

  const saveEditRequest = () => {
    if (!editRequestForm.title.trim()) {
      alert('Title is required');
      return;
    }

    if (editRequestForm.selectedCreatorIds.length === 0) {
      alert('At least one creator is required');
      return;
    }

    const selectedCreators = creators.filter(c => editRequestForm.selectedCreatorIds.includes(c.id));

    setRequests(requests.map(req =>
      req.id === editingRequestId
        ? {
            ...req,
            title: editRequestForm.title,
            description: editRequestForm.description,
            creators: selectedCreators.map(c => ({ id: c.id, name: c.name })),
            dueDate: new Date(editRequestForm.dueDate).toISOString(),
            status: editRequestForm.status
          }
        : req
    ));
    setEditingRequestId(null);
  };

  const cancelEditRequest = () => {
    setEditingRequestId(null);
    setEditRequestForm({
      title: '',
      description: '',
      selectedCreatorIds: [],
      dueDate: '',
      status: 'pending'
    });
  };

  const deleteRequest = (requestId) => {
    if (confirm('Are you sure you want to delete this request?')) {
      setRequests(requests.filter(req => req.id !== requestId));
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }

    // Filter by creator
    if (filterCreatorId !== 'all') {
      filtered = filtered.filter(req =>
        (req.creators || []).some(c => String(c.id) === String(filterCreatorId))
      );
    }

    // Filter by search term
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

  const statusCounts = useMemo(() => {
    return {
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in-progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
    };
  }, [requests]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-[var(--color-accent-primary)]" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-[var(--color-text-tertiary)]" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'in-progress':
        return 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default:
        return 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]';
    }
  };

  const getCampaignMetrics = (request) => {
    let totalImpressions = 0;
    let totalCost = 0;

    // Get the campaign creators
    const campaignCreators = request.creators || [];

    // Normalize campaign title for matching
    const campaignTitle = request.title.toLowerCase().trim();

    // For each creator in the campaign
    campaignCreators.forEach(campaignCreator => {
      // Find the creator in the full creators list
      const creator = creators.find(c => c.id === campaignCreator.id);
      if (!creator || !creator.posts) return;

      // Find posts that match this campaign by exact description match
      const matchingPosts = creator.posts.filter(post => {
        if (!post.description) return false;
        const postDesc = post.description.toLowerCase().trim();
        // Try exact match first, then contains match
        return postDesc === campaignTitle || postDesc.includes(campaignTitle) || campaignTitle.includes(postDesc);
      });

      // Sum up impressions and costs from matching posts
      matchingPosts.forEach(post => {
        if (post.impressions) {
          const impressions = parseFloat(post.impressions.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(impressions)) {
            totalImpressions += impressions;
          }
        }
        if (post.cost) {
          const cost = parseFloat(post.cost.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(cost)) {
            totalCost += cost;
          }
        }
      });
    });

    return {
      totalImpressions,
      totalCost
    };
  };

  const exportCampaignsToCSV = () => {
    // Prepare campaign data with metrics
    const campaignRows = filteredRequests.map(request => {
      const metrics = getCampaignMetrics(request);
      const creatorNames = (request.creators || []).map(c => c.name).join(', ');

      return {
        'Campaign': request.title,
        'Description': request.description,
        'Creators': creatorNames,
        'Status': request.status,
        'Due Date': new Date(request.dueDate).toLocaleDateString(),
        'Total Impressions': metrics.totalImpressions.toLocaleString(),
        'Total Cost': `$${metrics.totalCost.toFixed(2)}`,
        'CPM': metrics.totalImpressions > 0 ? `$${((metrics.totalCost / metrics.totalImpressions) * 1000).toFixed(2)}` : '$0.00'
      };
    });

    // Convert to CSV
    let csv = 'CAMPAIGN DATA EXPORT\n';
    csv += `Exported: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    if (filterStatus !== 'all') {
      csv += `Filter: ${filterStatus}\n`;
    }
    csv += '\n';

    if (campaignRows.length > 0) {
      const headers = Object.keys(campaignRows[0]);
      csv += headers.join(',') + '\n';
      campaignRows.forEach(row => {
        csv += headers.map(header => `"${row[header]}"`).join(',') + '\n';
      });
    } else {
      csv += 'No campaigns to export\n';
    }

    // Summary statistics
    const totalImpressions = campaignRows.reduce((sum, row) => {
      const impressions = parseFloat(row['Total Impressions'].replace(/,/g, ''));
      return sum + impressions;
    }, 0);
    const totalCost = campaignRows.reduce((sum, row) => {
      const cost = parseFloat(row['Total Cost'].replace(/[$,]/g, ''));
      return sum + cost;
    }, 0);

    csv += '\nSUMMARY\n';
    csv += `Total Campaigns,${campaignRows.length}\n`;
    csv += `Total Impressions,${totalImpressions.toLocaleString()}\n`;
    csv += `Total Cost,$${totalCost.toFixed(2)}\n`;
    csv += `Average CPM,${totalImpressions > 0 ? `$${((totalCost / totalImpressions) * 1000).toFixed(2)}` : '$0.00'}\n`;

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `campaign_data_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEstimatedMetrics = (request) => {
    let estimatedImpressions = 0;
    let estimatedCost = 0;

    // Get the campaign creators
    const campaignCreators = request.creators || [];

    // For each creator in the campaign
    campaignCreators.forEach(campaignCreator => {
      // Find the creator in the full creators list
      const creator = creators.find(c => c.id === campaignCreator.id);
      if (!creator) return;

      // Calculate average impressions from their posts
      const posts = creator.posts || [];
      if (posts.length > 0) {
        const totalCreatorImpressions = posts.reduce((sum, post) => {
          if (post.impressions) {
            const impressions = parseFloat(post.impressions.replace(/[^0-9.-]+/g, ''));
            if (!isNaN(impressions)) {
              return sum + impressions;
            }
          }
          return sum;
        }, 0);
        estimatedImpressions += Math.round(totalCreatorImpressions / posts.length);
      }

      // Get cost per post from creator
      if (creator.costPerPost) {
        const cost = parseFloat(creator.costPerPost.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(cost)) {
          estimatedCost += cost;
        }
      }
    });

    return {
      estimatedImpressions,
      estimatedCost
    };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="border-b border-[var(--color-border)] pb-8" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <h1 className="text-display text-5xl mb-3 text-[var(--color-text-primary)]">
          Content Requests
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg">
          Manage campaign requests and track content delivery across creators
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        <StatCard label="Pending" value={statusCounts.pending} delay="0s" />
        <StatCard label="In Progress" value={statusCounts.inProgress} delay="0.05s" />
        <StatCard label="Completed" value={statusCounts.completed} delay="0.1s" />
        <StatCard label="Cancelled" value={statusCounts.cancelled} delay="0.15s" />
      </div>

      {/* Filters and Create Button */}
      <div className="card-editorial p-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white shadow-lg shadow-[var(--color-accent-primary)]/25'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCampaignsToCSV}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all duration-200 shadow-lg shadow-green-500/25"
                title="Export campaign data to CSV"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={resetToCampaigns}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-all duration-200 border border-[var(--color-border)]"
                title="Load campaigns from Google Sheets"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Campaigns
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search by title, description, or creator..."
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
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Creator:</label>
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
              {filterCreatorId !== 'all' && (
                <button
                  onClick={() => setFilterCreatorId('all')}
                  className="inline-flex items-center px-2 py-1 text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="card-editorial overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
        <ul className="divide-y divide-[var(--color-border)]">
          {filteredRequests.map((request, index) => (
            <li
              key={request.id}
              className="p-4 sm:p-6 hover:bg-[var(--color-bg-tertiary)] transition-colors"
              style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both` }}
            >
              {editingRequestId === request.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      value={editRequestForm.title}
                      onChange={(e) => setEditRequestForm({ ...editRequestForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                      value={editRequestForm.description}
                      onChange={(e) => setEditRequestForm({ ...editRequestForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Creators ({editRequestForm.selectedCreatorIds.length} selected)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3 bg-[var(--color-bg-tertiary)] space-y-2">
                      {creators.map((c) => (
                        <label key={c.id} className="flex items-center space-x-2 cursor-pointer hover:bg-[var(--color-bg-secondary)] p-2 rounded">
                          <input
                            type="checkbox"
                            checked={editRequestForm.selectedCreatorIds.includes(c.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const isChecked = e.target.checked;
                              setEditRequestForm({
                                ...editRequestForm,
                                selectedCreatorIds: isChecked
                                  ? [...editRequestForm.selectedCreatorIds, c.id]
                                  : editRequestForm.selectedCreatorIds.filter(id => id !== c.id)
                              });
                            }}
                            className="h-4 w-4 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] border-[var(--color-border)] rounded"
                          />
                          <span className="text-sm text-[var(--color-text-primary)]">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Due Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                        value={editRequestForm.dueDate}
                        onChange={(e) => setEditRequestForm({ ...editRequestForm, dueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                        value={editRequestForm.status}
                        onChange={(e) => setEditRequestForm({ ...editRequestForm, status: e.target.value })}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveEditRequest}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25 transition-all duration-200 font-medium"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditRequest}
                      className="inline-flex items-center px-4 py-2 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] transition-all duration-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {getStatusIcon(request.status)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                        {request.title}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">{request.description}</p>
                      <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)] mb-2">
                        <div className="flex items-center text-mono">
                          <User className="h-4 w-4 mr-1" />
                          {(request.creators || []).map(c => c.name).join(', ')}
                        </div>
                        {request.startDate && (
                          <div className="flex items-center text-mono">
                            <Calendar className="h-4 w-4 mr-1" />
                            Started: {new Date(request.startDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center text-mono">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {new Date(request.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      {(() => {
                        // For pending requests, show estimated metrics
                        if (request.status === 'pending') {
                          const estimated = getEstimatedMetrics(request);
                          return (
                            <div className="flex items-center gap-4 text-sm font-medium">
                              <div className="flex items-center text-[var(--color-accent-primary)]">
                                <Eye className="h-4 w-4 mr-1" />
                                <span className="text-mono">
                                  {estimated.estimatedImpressions > 0
                                    ? `~${estimated.estimatedImpressions.toLocaleString()} est. impressions`
                                    : 'N/A est. impressions'}
                                </span>
                              </div>
                              {estimated.estimatedCost > 0 && (
                                <div className="flex items-center text-green-500">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  <span className="text-mono">
                                    ~${estimated.estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} est. cost
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          // For other statuses, show actual metrics
                          const metrics = getCampaignMetrics(request);
                          if (metrics.totalImpressions > 0 || metrics.totalCost > 0) {
                            return (
                              <div className="flex items-center gap-4 text-sm font-medium">
                                {metrics.totalImpressions > 0 && (
                                  <div className="flex items-center text-[var(--color-accent-primary)]">
                                    <Eye className="h-4 w-4 mr-1" />
                                    <span className="text-mono">
                                      {metrics.totalImpressions.toLocaleString()} impressions
                                    </span>
                                  </div>
                                )}
                                {metrics.totalCost > 0 && (
                                  <div className="flex items-center text-green-500">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    <span className="text-mono">
                                      ${metrics.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    <button
                      onClick={() => startEditRequest(request)}
                      className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)] hover:bg-[var(--color-bg-tertiary)] rounded transition-colors"
                      title="Edit request"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRequest(request.id)}
                      className="p-2 text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete request"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--color-text-secondary)]">No content requests found.</p>
          </div>
        )}
      </div>

      {/* Content Request Modal */}
      {showModal && (
        <ContentRequestModal
          creators={creators}
          onClose={() => setShowModal(false)}
          onSubmit={(newRequest) => {
            setRequests([...requests, { ...newRequest, id: Date.now() }]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

// Stat Card Component
function StatCard({ label, value, delay }) {
  return (
    <div
      className="card-editorial p-5 hover:scale-105 transition-transform duration-300"
      style={{ animation: `fadeInUp 0.6s ease-out ${delay} both` }}
    >
      <div className="metric-label mb-2">{label}</div>
      <div className="text-mono text-4xl font-bold text-[var(--color-text-primary)]">{value}</div>
    </div>
  );
}

export default ContentRequestsEditorial;
