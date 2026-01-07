import { useMemo } from 'react';
import { TrendingUp, Users, Eye, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';

export default function Kaito({ creators }) {
  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    const stats = {
      totalCreators: creators.length,
      totalPosts: 0,
      totalImpressions: 0,
      totalSpend: 0,
      avgEngagement: 0
    };

    creators.forEach(creator => {
      const posts = creator.posts || [];
      stats.totalPosts += posts.length;

      posts.forEach(post => {
        // Parse impressions
        if (post.impressions) {
          const impressions = parseFloat(post.impressions.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(impressions)) {
            stats.totalImpressions += impressions;
          }
        }

        // Parse cost
        if (post.cost) {
          const cost = parseFloat(post.cost.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(cost)) {
            stats.totalSpend += cost;
          }
        }
      });
    });

    // Calculate average engagement (impressions per post)
    stats.avgEngagement = stats.totalPosts > 0 ? Math.round(stats.totalImpressions / stats.totalPosts) : 0;

    return stats;
  }, [creators]);

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">Kaito Integration</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Social media analytics and creator insights</p>
        </div>
        <button
          className="inline-flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium"
          title="Refresh data from Kaito API"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync Data
        </button>
      </div>

      {/* Integration Status */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Kaito API Integration Pending</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Connect your Kaito account to unlock advanced social media analytics, engagement tracking, and creator performance insights.
            </p>
          </div>
        </div>
      </div>

      {/* Current Metrics Overview */}
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4">Current Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Creators</div>
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">{metrics.totalCreators}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Posts</div>
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">{metrics.totalPosts}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Impressions</div>
              <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">{formatNumber(metrics.totalImpressions)}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Spend</div>
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">{formatCurrency(metrics.totalSpend)}</div>
          </div>
        </div>
      </div>

      {/* Creator Performance Table */}
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-50 mb-4">Creator Performance</h3>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Creator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Impressions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {creators.map(creator => {
                const posts = creator.posts || [];
                const totalImpressions = posts.reduce((sum, post) => {
                  if (post.impressions) {
                    const impressions = parseFloat(post.impressions.replace(/[^0-9.-]+/g, ''));
                    if (!isNaN(impressions)) return sum + impressions;
                  }
                  return sum;
                }, 0);
                const totalCost = posts.reduce((sum, post) => {
                  if (post.cost) {
                    const cost = parseFloat(post.cost.replace(/[^0-9.-]+/g, ''));
                    if (!isNaN(cost)) return sum + cost;
                  }
                  return sum;
                }, 0);
                const avgEngagement = posts.length > 0 ? Math.round(totalImpressions / posts.length) : 0;

                return (
                  <tr key={creator.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-50">{creator.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{creator.handle}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                      {posts.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                      {formatNumber(totalImpressions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                      {formatNumber(avgEngagement)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                      {formatCurrency(totalCost)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
