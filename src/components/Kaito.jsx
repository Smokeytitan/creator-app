import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Award, Eye, Users, RefreshCw, AlertCircle, Search, Filter } from 'lucide-react';
import { KaitoService } from '../services/kaitoService';

export default function Kaito() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch leaderboard data from Kaito API
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const kaitoService = new KaitoService();
      const data = await kaitoService.fetchLeaderboard();

      // Map API response to display format
      const mappedData = data.map(creator => {
        // Calculate engagement rate
        const totalEngagement =
          (creator.total_retweets || 0) +
          (creator.total_quote_tweets || 0) +
          (creator.total_likes || 0) +
          (creator.total_bookmarks || 0);

        const engagementRate = creator.total_impressions > 0
          ? ((totalEngagement / creator.total_impressions) * 100).toFixed(1)
          : '0.0';

        // Calculate score based on mindshare (normalize to 0-100 scale)
        const score = Math.min(Math.round((creator.mindshare || 0) * 10000), 100);

        // Format followers
        const followers = creator.smart_followers
          ? creator.smart_followers >= 1000000
            ? `${(creator.smart_followers / 1000000).toFixed(1)}M`
            : creator.smart_followers >= 1000
              ? `${(creator.smart_followers / 1000).toFixed(0)}K`
              : creator.smart_followers.toString()
          : '0';

        return {
          rank: parseInt(creator.rank) || 0,
          name: creator.displayname || creator.username || 'Unknown',
          handle: `@${creator.username || 'unknown'}`,
          followers,
          engagement: `${engagementRate}%`,
          category: creator.user_level || 'General',
          score,
          impressions: creator.total_impressions || 0,
          userId: creator.user_id
        };
      });

      setLeaderboardData(mappedData);
    } catch (err) {
      console.error('Failed to fetch Kaito leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(leaderboardData.map(c => c.category));
    return ['all', ...Array.from(cats)];
  }, [leaderboardData]);

  const filteredLeaderboard = useMemo(() => {
    let filtered = leaderboardData;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.handle.toLowerCase().includes(search) ||
        c.category.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [leaderboardData, categoryFilter, searchTerm]);

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    if (rank === 2) return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    if (rank === 3) return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
    return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">Kaito Creator Leaderboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Discover top Web3 creators ranked by influence and engagement</p>
        </div>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh leaderboard from Kaito API"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Leaderboard'}
        </button>
      </div>

      {/* Error Status */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Failed to Load Leaderboard</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
        {loading && !error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 dark:border-indigo-500 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
            </div>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Followers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Engagement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLeaderboard.map((creator) => (
                  <tr key={creator.rank} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getRankBadgeColor(creator.rank)} font-bold text-sm`}>
                        {creator.rank <= 3 ? (
                          <Award className="h-4 w-4" />
                        ) : (
                          creator.rank
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-50">{creator.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{creator.handle}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                        {creator.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-gray-50">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        {creator.followers}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-gray-50">
                        <Eye className="h-4 w-4 mr-1 text-gray-400" />
                        {creator.engagement}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full"
                            style={{ width: `${creator.score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{creator.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filteredLeaderboard.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No creators found matching your search.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
