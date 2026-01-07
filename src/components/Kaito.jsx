import { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, Award, Eye, Users, RefreshCw, AlertCircle, Search, Filter, ChevronDown, ChevronUp, ExternalLink, Calendar } from 'lucide-react';
import { KaitoService } from '../services/kaitoService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function Kaito() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date('2025-12-01'));
  const [endDate, setEndDate] = useState(new Date('2025-12-31'));
  const [expandedCreatorId, setExpandedCreatorId] = useState(null);
  const [totalReceived, setTotalReceived] = useState(0);

  // Format dates for API
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch leaderboard data from Kaito API
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const kaitoService = new KaitoService();
      console.log('Kaito Component: Starting leaderboard fetch...');
      const formattedStartDate = formatDateForAPI(startDate);
      const formattedEndDate = formatDateForAPI(endDate);
      console.log(`Date Range: ${formattedStartDate} to ${formattedEndDate}`);
      const data = await kaitoService.fetchLeaderboard({
        start_date: formattedStartDate,
        end_date: formattedEndDate
      });
      console.log('Kaito Component: Received data:', data);

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
          userId: creator.user_id,
          tweetUrls: creator.tweet_urls || [],
          tweetCount: creator.tweet_counts || 0
        };
      });

      setLeaderboardData(mappedData);
      setTotalReceived(mappedData.length);
      console.log(`✓ Loaded ${mappedData.length} creators from Kaito API`);
    } catch (err) {
      console.error('Failed to fetch Kaito leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch on mount only
  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate total impressions across all creators
  const totalImpressions = useMemo(() => {
    return leaderboardData.reduce((sum, creator) => sum + (creator.impressions || 0), 0);
  }, [leaderboardData]);

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
      <div>
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-50">Kaito Creator Leaderboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Discover top Web3 creators ranked by influence and engagement
        </p>
      </div>

      {/* Date Range Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <div className="relative">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="MMMM d, yyyy"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 pr-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                maxDate={endDate}
                showPopperArrow={false}
                wrapperClassName="w-full"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <div className="relative">
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="MMMM d, yyyy"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 pr-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                minDate={startDate}
                showPopperArrow={false}
                wrapperClassName="w-full"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            title="Fetch Kaito data for selected date range"
          >
            <TrendingUp className={`w-4 h-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Fetching...' : 'Fetch Kaito Data'}
          </button>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing data from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Total Impressions Card */}
      {!loading && totalImpressions > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 dark:bg-indigo-500 rounded-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Impressions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                  {totalImpressions.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Top {totalReceived} Creators</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Impressions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tweets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLeaderboard.map((creator) => (
                  <>
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
                          <Eye className="h-4 w-4 mr-1 text-gray-400" />
                          {creator.impressions.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setExpandedCreatorId(expandedCreatorId === creator.userId ? null : creator.userId)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                        >
                          {expandedCreatorId === creator.userId ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              View {creator.tweetCount}
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedCreatorId === creator.userId && (
                      <tr key={`${creator.rank}-tweets`} className="bg-gray-50 dark:bg-gray-900">
                        <td colSpan="5" className="px-6 py-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">
                              Tweets from {creator.name} ({creator.tweetUrls.length} tweets)
                            </h4>
                            {creator.tweetUrls.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                                {creator.tweetUrls.map((url, index) => (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
                                  >
                                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                                      Tweet #{index + 1}
                                    </span>
                                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 ml-2 flex-shrink-0" />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">No tweets found for this creator in the selected date range.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
