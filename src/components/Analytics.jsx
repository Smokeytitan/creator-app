import { useMemo, useState } from 'react';
import { TrendingUp, DollarSign, FileText, Eye, Award, Download, Calendar, X, Target, Users, BarChart3 } from 'lucide-react';
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
  const [viewMode] = useState('creators'); // Keep for export functionality

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
      const posts = creator.posts || [];
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
  }, [creators, requests]);

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
    let csv = '';
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = '';

    if (viewMode === 'creators') {
      // Creator Analytics Export
      csv = 'CREATOR ANALYTICS\n';
      csv += 'Date Range: All Time\n';
      csv += '\n';

      // Overall Summary
      csv += 'Overall Summary\n';
      csv += 'Total Creators,Total Posts,Total Spend,Total Impressions,Overall CPM\n';
      const overallCPM = analytics.totalImpressions > 0 ? (analytics.totalSpend / analytics.totalImpressions * 1000).toFixed(2) : '0.00';
      csv += `${analytics.totalCreators},${analytics.totalPosts},"$${analytics.totalSpend.toFixed(2)}",${analytics.totalImpressions},"$${overallCPM}"\n\n`;

      // Creator-Level Performance
      csv += 'Creator-Level Performance\n';
      csv += 'Creator Name,Total Posts,Total Spend,Total Impressions,Avg Cost Per Post,CPM\n';

      const creatorRows = analytics.creatorStats
        .sort((a, b) => b.spend - a.spend);

      creatorRows.forEach(creator => {
        const avgCost = creator.avgCost > 0 ? creator.avgCost.toFixed(2) : '0.00';
        const cpm = creator.cpi > 0 ? (creator.cpi * 1000).toFixed(2) : '0.00';
        csv += `"${creator.name}",${creator.posts},"$${creator.spend.toFixed(2)}",${creator.impressions},"$${avgCost}","$${cpm}"\n`;
      });

      // Top Performers
      csv += '\nTop Performers by Posts\n';
      csv += 'Rank,Creator Name,Total Posts\n';
      analytics.topByPosts.forEach((creator, index) => {
        csv += `${index + 1},"${creator.name}",${creator.posts}\n`;
      });

      csv += '\nTop Performers by Spend\n';
      csv += 'Rank,Creator Name,Total Spend\n';
      analytics.topBySpend.forEach((creator, index) => {
        csv += `${index + 1},"${creator.name}","$${creator.spend.toFixed(2)}"\n`;
      });

      csv += '\nTop Performers by Impressions\n';
      csv += 'Rank,Creator Name,Total Impressions\n';
      analytics.topByImpressions.forEach((creator, index) => {
        csv += `${index + 1},"${creator.name}",${creator.impressions}\n`;
      });

      csv += '\nBest ROI (Lowest CPM)\n';
      csv += 'Rank,Creator Name,CPM\n';
      analytics.topByROI.forEach((creator, index) => {
        csv += `${index + 1},"${creator.name}","$${(creator.cpi * 1000).toFixed(2)}"\n`;
      });

      filename = `creator_analytics_${timestamp}.csv`;
    } else {
      // Campaign Analytics Export
      csv = 'CAMPAIGN ANALYTICS\n';
      if (startDate || endDate) {
        csv += `Date Range: ${startDate || 'Beginning'} to ${endDate || 'Present'}\n`;
      } else {
        csv += 'Date Range: All Time\n';
      }
      csv += '\n';

      // Overall Summary
      csv += 'Overall Summary\n';
      const totalCampaignCost = analytics.campaignStats.reduce((sum, c) => sum + c.cost, 0);
      const totalCampaignImpressions = analytics.campaignStats.reduce((sum, c) => sum + c.impressions, 0);
      const overallCPM = totalCampaignImpressions > 0 ? (totalCampaignCost / totalCampaignImpressions * 1000).toFixed(2) : '0.00';
      csv += 'Total Campaigns,Completed Campaigns,Total Cost,Total Impressions,Overall CPM\n';
      csv += `${analytics.totalCampaigns},${analytics.completedCampaigns},"$${totalCampaignCost.toFixed(2)}",${totalCampaignImpressions},"$${overallCPM}"\n\n`;

      // All Campaigns
      csv += 'Campaign Performance\n';
      csv += 'Campaign Title,Status,Creators,Posts,Total Cost,Total Impressions,CPM,Due Date\n';

      analytics.campaignStats
        .sort((a, b) => b.cost - a.cost)
        .forEach(campaign => {
          const cpm = campaign.cpm > 0 ? campaign.cpm.toFixed(2) : '0.00';
          const dueDate = new Date(campaign.dueDate).toLocaleDateString();
          csv += `"${campaign.title}","${campaign.status}",${campaign.creatorCount},${campaign.postCount},"$${campaign.cost.toFixed(2)}",${campaign.impressions},"$${cpm}","${dueDate}"\n`;
        });

      // Top Campaigns by Impressions
      csv += '\nTop Campaigns by Impressions\n';
      csv += 'Rank,Campaign Title,Total Impressions,Posts\n';
      analytics.topCampaignsByImpressions.forEach((campaign, index) => {
        csv += `${index + 1},"${campaign.title}",${campaign.impressions},${campaign.postCount}\n`;
      });

      // Top Campaigns by Cost
      csv += '\nTop Campaigns by Cost\n';
      csv += 'Rank,Campaign Title,Total Cost,Creators\n';
      analytics.topCampaignsByCost.forEach((campaign, index) => {
        csv += `${index + 1},"${campaign.title}","$${campaign.cost.toFixed(2)}",${campaign.creatorCount}\n`;
      });

      // Best Campaign ROI
      csv += '\nBest Campaign ROI (Lowest CPM)\n';
      csv += 'Rank,Campaign Title,CPM,Impressions\n';
      analytics.topCampaignsByROI.forEach((campaign, index) => {
        csv += `${index + 1},"${campaign.title}","$${campaign.cpm.toFixed(2)}",${campaign.impressions}\n`;
      });

      // Status Distribution
      csv += '\nCampaign Status Distribution\n';
      csv += 'Status,Count\n';
      analytics.statusDistribution.forEach(status => {
        csv += `"${status.name}",${status.value}\n`;
      });

      filename = `campaign_analytics_${timestamp}.csv`;
    }

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate platform distribution (based on creator handles/platforms)
  const platformData = useMemo(() => {
    const platforms = {};
    creators.forEach(creator => {
      // Simple platform detection based on handle prefix or assume Twitter/X
      const platform = 'Twitter/X'; // Could be enhanced with actual platform data
      if (!platforms[platform]) {
        platforms[platform] = { spend: 0, impressions: 0 };
      }

      const creatorStat = analytics.creatorStats.find(c => c.id === creator.id);
      if (creatorStat) {
        platforms[platform].spend += creatorStat.spend;
        platforms[platform].impressions += creatorStat.impressions;
      }
    });

    return Object.entries(platforms).map(([name, data]) => ({
      name,
      value: data.spend,
      impressions: data.impressions
    }));
  }, [creators, analytics.creatorStats]);

  // Calculate progress metrics
  const avgImpressionsPerPost = analytics.totalPosts > 0
    ? analytics.totalImpressions / analytics.totalPosts
    : 0;

  const creatorsWithActivity = analytics.creatorStats.filter(c => c.posts > 0).length;
  const activityPercentage = analytics.totalCreators > 0
    ? (creatorsWithActivity / analytics.totalCreators) * 100
    : 0;

  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-polygon-text-primary">Analytics Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track influencer performance and campaign metrics</p>
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-polygon hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-polygon-primary to-polygon-primary-hover rounded-polygon p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Total Influencers</p>
              <p className="text-2xl sm:text-3xl font-bold">{analytics.totalCreators}</p>
            </div>
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-purple-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-polygon p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Total Spend</p>
              <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(analytics.totalSpend)}</p>
            </div>
            <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-polygon p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs sm:text-sm font-medium mb-1">Total Impressions</p>
              <p className="text-2xl sm:text-3xl font-bold">{formatNumber(analytics.totalImpressions)}</p>
            </div>
            <Eye className="h-10 w-10 sm:h-12 sm:w-12 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-polygon p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs sm:text-sm font-medium mb-1">Total Posts</p>
              <p className="text-2xl sm:text-3xl font-bold">{analytics.totalPosts}</p>
            </div>
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-orange-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* CPM by Influencer */}
        <div className="card-polygon rounded-polygon shadow-sm border border-white/[0.08] p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-polygon-text-primary mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-polygon-primary" />
            CPM by Influencer
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.topByROI.slice(0, 5)}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [`$${(value * 1000).toFixed(2)}`, 'CPM']}
              />
              <Bar dataKey="cpi" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Budget by Platform */}
        <div className="card-polygon rounded-polygon shadow-sm border border-white/[0.08] p-6">
          <h3 className="text-lg font-semibold text-polygon-text-primary mb-4">Budget by Platform</h3>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#F9FAFB'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              No platform data available
            </div>
          )}
        </div>
      </div>

      {/* Progress Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Q4 Budget Used */}
        <div className="card-polygon rounded-polygon shadow-sm border border-white/[0.08] p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-polygon-text-secondary">Total Budget Used</h4>
            <span className="text-sm font-semibold text-polygon-text-primary">
              {analytics.totalSpend > 0 ? '100%' : '0%'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: analytics.totalSpend > 0 ? '100%' : '0%' }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {formatCurrency(analytics.totalSpend)} spent
          </p>
        </div>

        {/* Avg Impressions per Post */}
        <div className="card-polygon rounded-polygon shadow-sm border border-white/[0.08] p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-polygon-text-secondary">Avg Impressions per Post</h4>
            <span className="text-sm font-semibold text-polygon-text-primary">
              {formatNumber(avgImpressionsPerPost)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: avgImpressionsPerPost > 0 ? '85%' : '0%' }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Across {analytics.totalPosts} posts
          </p>
        </div>

        {/* Influencers with Activity */}
        <div className="card-polygon rounded-polygon shadow-sm border border-white/[0.08] p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-polygon-text-secondary">Influencers with Activity</h4>
            <span className="text-sm font-semibold text-polygon-text-primary">
              {activityPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-polygon-primary to-polygon-primary-hover h-3 rounded-full transition-all duration-500"
              style={{ width: `${activityPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {creatorsWithActivity} of {analytics.totalCreators} active
          </p>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="card-polygon rounded-polygon shadow-sm border border-white/[0.08] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.08]">
          <h3 className="text-base sm:text-lg font-semibold text-polygon-text-primary flex items-center gap-2">
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            Top Performers by ROI
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Influencer
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Posts
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Spend
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  CPM
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {analytics.topByROI.length > 0 ? (
                analytics.topByROI.map((creator, index) => (
                  <tr key={creator.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                          index === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                          index === 2 ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                          'bg-gray-100 dark:bg-gray-700 text-polygon-text-secondary'
                        } font-bold text-xs sm:text-sm`}>
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-polygon-text-primary">{creator.name}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-polygon-text-secondary">{creator.posts}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-polygon-text-primary">{formatCurrency(creator.spend)}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-polygon-text-secondary">{formatNumber(creator.impressions)}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">
                        ${(creator.cpi * 1000).toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-3 sm:px-6 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    No performance data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Category (Top Spend) */}
        <div className="card-polygon rounded-polygon shadow-sm border border-white/[0.08] p-6">
          <h3 className="text-lg font-semibold text-polygon-text-primary mb-4">Performance by Spend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.topBySpend.slice(0, 5)}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [formatCurrency(value), 'Spend']}
              />
              <Bar dataKey="spend" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Impressions by Influencer */}
        <div className="card-polygon rounded-polygon shadow-sm border border-white/[0.08] p-6">
          <h3 className="text-lg font-semibold text-polygon-text-primary mb-4">Impressions by Influencer</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.topByImpressions.slice(0, 5)}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [formatNumber(value), 'Impressions']}
              />
              <Bar dataKey="impressions" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
