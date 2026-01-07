import { useMemo, useState } from 'react';
import { TrendingUp, DollarSign, FileText, Eye, Award, Download, Calendar, X, Target, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function Analytics({ creators, requests = [] }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState('creators'); // 'creators' or 'campaigns'

  // Calculate analytics metrics
  const analytics = useMemo(() => {
    const stats = {
      totalCreators: creators.length,
      totalPosts: 0,
      totalSpend: 0,
      totalImpressions: 0,
      creatorStats: []
    };

    creators.forEach(creator => {
      const allPosts = creator.posts || [];

      // Filter posts by date range
      const posts = allPosts.filter(post => {
        if (!post.date) return true; // Include posts without dates

        const postDate = new Date(post.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && postDate < start) return false;
        if (end && postDate > end) return false;

        return true;
      });

      const postCount = posts.length;
      let creatorSpend = 0;
      let creatorImpressions = 0;

      posts.forEach(post => {
        // Parse cost
        if (post.cost) {
          const cost = parseFloat(post.cost.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(cost)) {
            creatorSpend += cost;
          }
        }

        // Parse impressions
        if (post.impressions) {
          const impressions = parseFloat(post.impressions.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(impressions)) {
            creatorImpressions += impressions;
          }
        }
      });

      stats.totalPosts += postCount;
      stats.totalSpend += creatorSpend;
      stats.totalImpressions += creatorImpressions;

      // Per-creator stats
      stats.creatorStats.push({
        id: creator.id,
        name: creator.name,
        posts: postCount,
        spend: creatorSpend,
        impressions: creatorImpressions,
        cpi: creatorImpressions > 0 ? creatorSpend / creatorImpressions : 0,
        avgCost: postCount > 0 ? creatorSpend / postCount : 0
      });
    });

    // Sort creators by different metrics
    stats.topByPosts = [...stats.creatorStats]
      .filter(c => c.posts > 0)
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 5);

    stats.topBySpend = [...stats.creatorStats]
      .filter(c => c.spend > 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    stats.topByImpressions = [...stats.creatorStats]
      .filter(c => c.impressions > 0)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5);

    stats.topByROI = [...stats.creatorStats]
      .filter(c => c.impressions > 0 && c.cpi > 0)
      .sort((a, b) => a.cpi - b.cpi)
      .slice(0, 5);

    // Campaign analytics
    stats.totalCampaigns = requests.length;
    stats.completedCampaigns = requests.filter(r => r.status === 'completed').length;
    stats.campaignStats = [];

    requests.forEach(request => {
      // Filter by date if needed
      const requestDate = new Date(request.dueDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && requestDate < start) return;
      if (end && requestDate > end) return;

      let campaignImpressions = 0;
      let campaignCost = 0;
      let postCount = 0;

      // Calculate metrics for this campaign
      (request.creators || []).forEach(campaignCreator => {
        const creator = creators.find(c => c.id === campaignCreator.id);
        if (!creator || !creator.posts) return;

        // Find posts matching this campaign
        const matchingPosts = creator.posts.filter(post =>
          post.description && post.description.toLowerCase().includes(request.title.toLowerCase().split(' ').slice(0, 2).join(' ').toLowerCase())
        );

        postCount += matchingPosts.length;

        matchingPosts.forEach(post => {
          if (post.impressions) {
            const impressions = parseFloat(post.impressions.replace(/[^0-9.-]+/g, ''));
            if (!isNaN(impressions)) {
              campaignImpressions += impressions;
            }
          }
          if (post.cost) {
            const cost = parseFloat(post.cost.replace(/[^0-9.-]+/g, ''));
            if (!isNaN(cost)) {
              campaignCost += cost;
            }
          }
        });
      });

      stats.campaignStats.push({
        id: request.id,
        title: request.title,
        status: request.status,
        creatorCount: (request.creators || []).length,
        postCount,
        impressions: campaignImpressions,
        cost: campaignCost,
        cpm: campaignImpressions > 0 ? (campaignCost / campaignImpressions) * 1000 : 0,
        dueDate: request.dueDate
      });
    });

    // Top campaigns
    stats.topCampaignsByImpressions = [...stats.campaignStats]
      .filter(c => c.impressions > 0)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5);

    stats.topCampaignsByCost = [...stats.campaignStats]
      .filter(c => c.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    stats.topCampaignsByROI = [...stats.campaignStats]
      .filter(c => c.impressions > 0 && c.cpm > 0)
      .sort((a, b) => a.cpm - b.cpm)
      .slice(0, 5);

    // Status distribution
    stats.statusDistribution = [
      { name: 'Completed', value: requests.filter(r => r.status === 'completed').length },
      { name: 'In Progress', value: requests.filter(r => r.status === 'in-progress').length },
      { name: 'Pending', value: requests.filter(r => r.status === 'pending').length },
      { name: 'Cancelled', value: requests.filter(r => r.status === 'cancelled').length }
    ].filter(s => s.value > 0);

    return stats;
  }, [creators, requests, startDate, endDate]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  const exportToCSV = () => {
    // Prepare creator-level data
    const creatorRows = analytics.creatorStats
      .sort((a, b) => b.spend - a.spend)
      .map(creator => ({
        'Creator Name': creator.name,
        'Total Posts': creator.posts,
        'Total Spend': `$${creator.spend.toFixed(2)}`,
        'Total Impressions': creator.impressions,
        'Avg Cost Per Post': creator.avgCost > 0 ? `$${creator.avgCost.toFixed(2)}` : '$0.00',
        'CPM': creator.cpi > 0 ? `$${(creator.cpi * 1000).toFixed(2)}` : '$0.00'
      }));

    // Prepare overall summary
    const overallRow = {
      'Summary Type': 'OVERALL TOTAL',
      'Creators': analytics.totalCreators,
      'Posts': analytics.totalPosts,
      'Spend': `$${analytics.totalSpend.toFixed(2)}`,
      'Impressions': analytics.totalImpressions,
      'CPM': analytics.totalImpressions > 0 ? `$${(analytics.totalSpend / analytics.totalImpressions * 1000).toFixed(2)}` : '$0.00'
    };

    // Convert to CSV
    let csv = 'CREATOR ANALYTICS\n';
    if (startDate || endDate) {
      csv += `Date Range: ${startDate || 'Beginning'} to ${endDate || 'Present'}\n`;
    } else {
      csv += 'Date Range: All Time\n';
    }
    csv += '\n';

    // Creator data section
    csv += 'Creator-Level Performance\n';
    if (creatorRows.length > 0) {
      const creatorHeaders = Object.keys(creatorRows[0]);
      csv += creatorHeaders.join(',') + '\n';
      creatorRows.forEach(row => {
        csv += creatorHeaders.map(header => `"${row[header]}"`).join(',') + '\n';
      });
    } else {
      csv += 'No creator data available\n';
    }

    // Overall summary
    csv += '\nOverall Summary\n';
    const overallHeaders = Object.keys(overallRow);
    csv += overallHeaders.join(',') + '\n';
    csv += overallHeaders.map(header => `"${overallRow[header]}"`).join(',') + '\n';

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `creator_analytics_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">Analytics</h2>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Date:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={clearDateFilter}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filter
            </button>
          )}

          {(startDate || endDate) && (
            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
              {startDate && endDate
                ? `${startDate} to ${endDate}`
                : startDate
                ? `From ${startDate}`
                : `Until ${endDate}`}
            </span>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('creators')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors ${
              viewMode === 'creators'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="h-4 w-4" />
            Creator Performance
          </button>
          <button
            onClick={() => setViewMode('campaigns')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors ${
              viewMode === 'campaigns'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Target className="h-4 w-4" />
            Campaign Performance
          </button>
        </div>
      </div>

      {viewMode === 'creators' ? (
        <>
          {/* Creator Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Creators</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{analytics.totalCreators}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Posts</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{analytics.totalPosts}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Spend</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{formatCurrency(analytics.totalSpend)}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Impressions</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{formatNumber(analytics.totalImpressions)}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Creators by Spend */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4">Top Creators by Spend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.topBySpend.slice(0, 5).reverse()}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" width={120} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [`$${value.toLocaleString()}`, 'Spend']}
              />
              <Bar dataKey="spend" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Creators by Impressions */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4">Top Creators by Impressions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.topByImpressions.slice(0, 5).reverse()}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" width={120} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [value.toLocaleString(), 'Impressions']}
              />
              <Bar dataKey="impressions" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top by Posts */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Top by Posts
          </h3>
          <div className="space-y-3">
            {analytics.topByPosts.length > 0 ? (
              analytics.topByPosts.map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-600 w-6">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{creator.name}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{creator.posts}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No post data yet</p>
            )}
          </div>
        </div>

        {/* Top by Spend */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Top by Spend
          </h3>
          <div className="space-y-3">
            {analytics.topBySpend.length > 0 ? (
              analytics.topBySpend.map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-600 w-6">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{creator.name}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(creator.spend)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No spend data yet</p>
            )}
          </div>
        </div>

        {/* Top by Impressions */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600" />
            Top by Impressions
          </h3>
          <div className="space-y-3">
            {analytics.topByImpressions.length > 0 ? (
              analytics.topByImpressions.map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-600 w-6">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{creator.name}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatNumber(creator.impressions)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No impression data yet</p>
            )}
          </div>
        </div>

        {/* Best ROI */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Best ROI (Lowest CPM)
          </h3>
          <div className="space-y-3">
            {analytics.topByROI.length > 0 ? (
              analytics.topByROI.map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-600 w-6">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{creator.name}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    ${(creator.cpi * 1000).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No ROI data yet</p>
            )}
          </div>
        </div>
      </div>
        </>
      ) : (
        <>
          {/* Campaign Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Campaigns</div>
              <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{analytics.totalCampaigns}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Completed</div>
              <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{analytics.completedCampaigns}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Cost</div>
              <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">
                {formatCurrency(analytics.campaignStats.reduce((sum, c) => sum + c.cost, 0))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Impressions</div>
              <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">
                {formatNumber(analytics.campaignStats.reduce((sum, c) => sum + c.impressions, 0))}
              </div>
            </div>
          </div>

          {/* Campaign Performance Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Campaigns by Impressions */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                Top Campaigns by Impressions
              </h3>
              <div className="space-y-3">
                {analytics.topCampaignsByImpressions.length > 0 ? (
                  analytics.topCampaignsByImpressions.map((campaign, index) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400 dark:text-gray-600 w-6">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-50">{campaign.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{campaign.postCount} posts</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatNumber(campaign.impressions)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No campaign data yet</p>
                )}
              </div>
            </div>

            {/* Top Campaigns by Cost */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Top Campaigns by Cost
              </h3>
              <div className="space-y-3">
                {analytics.topCampaignsByCost.length > 0 ? (
                  analytics.topCampaignsByCost.map((campaign, index) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400 dark:text-gray-600 w-6">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-50">{campaign.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{campaign.creatorCount} creators</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(campaign.cost)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No campaign data yet</p>
                )}
              </div>
            </div>

            {/* Best Campaign ROI */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Best Campaign ROI (Lowest CPM)
              </h3>
              <div className="space-y-3">
                {analytics.topCampaignsByROI.length > 0 ? (
                  analytics.topCampaignsByROI.map((campaign, index) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400 dark:text-gray-600 w-6">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-50">{campaign.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(campaign.impressions)} impressions</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        ${campaign.cpm.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No campaign ROI data yet</p>
                )}
              </div>
            </div>

            {/* Campaign Status Distribution */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-6">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4">Campaign Status</h3>
              {analytics.statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.statusDistribution.map((entry, index) => {
                        const colors = ['#10B981', '#F59E0B', '#6B7280', '#EF4444'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No campaign status data</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
