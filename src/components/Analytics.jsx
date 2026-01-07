import { useMemo } from 'react';
import { TrendingUp, DollarSign, FileText, Eye, Award, BarChart3 } from 'lucide-react';

export default function Analytics({ creators }) {
  // Calculate analytics metrics
  const analytics = useMemo(() => {
    const stats = {
      totalCreators: creators.length,
      totalPosts: 0,
      totalSpend: 0,
      totalImpressions: 0,
      creatorStats: [],
      tierStats: { A: { posts: 0, spend: 0, impressions: 0, count: 0 },
                   B: { posts: 0, spend: 0, impressions: 0, count: 0 },
                   C: { posts: 0, spend: 0, impressions: 0, count: 0 } }
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
        tier: creator.tier,
        posts: postCount,
        spend: creatorSpend,
        impressions: creatorImpressions,
        cpi: creatorImpressions > 0 ? creatorSpend / creatorImpressions : 0,
        avgCost: postCount > 0 ? creatorSpend / postCount : 0
      });

      // Tier stats
      if (stats.tierStats[creator.tier]) {
        stats.tierStats[creator.tier].posts += postCount;
        stats.tierStats[creator.tier].spend += creatorSpend;
        stats.tierStats[creator.tier].impressions += creatorImpressions;
        stats.tierStats[creator.tier].count += 1;
      }
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

    return stats;
  }, [creators]);

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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Analytics</h2>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Creators</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{analytics.totalCreators}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{analytics.totalPosts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{formatCurrency(analytics.totalSpend)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Impressions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{formatNumber(analytics.totalImpressions)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance by Tier
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['A', 'B', 'C'].map(tier => {
            const tierData = analytics.tierStats[tier];
            const avgCostPerImpression = tierData.impressions > 0
              ? (tierData.spend / tierData.impressions * 1000).toFixed(2)
              : 0;

            return (
              <div key={tier} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">Tier {tier}</span>
                  <span className="px-3 py-1 text-sm font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full">
                    {tierData.count} creators
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Posts:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-50">{tierData.posts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Spend:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-50">{formatCurrency(tierData.spend)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Impressions:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-50">{formatNumber(tierData.impressions)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">CPM:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-50">${avgCostPerImpression}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top by Posts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tier {creator.tier}</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tier {creator.tier}</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tier {creator.tier}</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tier {creator.tier}</p>
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
    </div>
  );
}
