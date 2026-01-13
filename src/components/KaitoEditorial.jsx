import { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, Award, Eye, Users, RefreshCw, AlertCircle, Search, Filter, ChevronDown, ChevronUp, ExternalLink, Calendar } from 'lucide-react';
import { KaitoService } from '../services/kaitoService';
import { getExcludedAccounts, normalizeHandle } from '../services/flashCampaignServiceSupabase';
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
  const [excludedAccounts, setExcludedAccounts] = useState([]);
  const [hideExcluded, setHideExcluded] = useState(false);

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

  // Load excluded accounts on mount
  useEffect(() => {
    const loadExcludedAccounts = async () => {
      const accounts = await getExcludedAccounts();
      setExcludedAccounts(accounts);
    };
    loadExcludedAccounts();
  }, []);

  // Fetch on mount only
  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(leaderboardData.map(c => c.category));
    return ['all', ...Array.from(cats)];
  }, [leaderboardData]);

  const filteredLeaderboard = useMemo(() => {
    let filtered = leaderboardData;

    // Filter by exclusion list if enabled
    if (hideExcluded && excludedAccounts.length > 0) {
      const excludedHandles = excludedAccounts.map(a => normalizeHandle(a.handle));
      filtered = filtered.filter(c => {
        const creatorHandle = normalizeHandle(c.handle);
        return !excludedHandles.includes(creatorHandle);
      });
    }

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
  }, [leaderboardData, categoryFilter, searchTerm, hideExcluded, excludedAccounts]);

  // Calculate total impressions across filtered creators
  const totalImpressions = useMemo(() => {
    return filteredLeaderboard.reduce((sum, creator) => sum + (creator.impressions || 0), 0);
  }, [filteredLeaderboard]);

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    if (rank === 2) return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    if (rank === 3) return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
    return 'bg-gray-50 dark:bg-gray-800 text-polygon-text-secondary';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="border-b border-[var(--color-border)] pb-8" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <h1 className="text-display text-5xl mb-3 text-[var(--color-text-primary)]">
          Kaito Leaderboard
        </h1>
        <p className="text-[var(--color-text-secondary)] text-lg">
          Top 115 Polygon creators ranked by influence and community mindshare
        </p>
      </div>

      {/* Date Range Filters */}
      <div className="card-editorial p-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Date Range</h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">Filter creators by time period</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="MMM d, yyyy"
                maxDate={endDate}
                className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all text-mono"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
            <span className="text-[var(--color-text-tertiary)]">→</span>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="MMM d, yyyy"
              minDate={startDate}
              className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all text-mono"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="px-6 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-secondary)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              <TrendingUp className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
              {loading ? 'Fetching...' : 'Fetch Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Total Impressions Card */}
      {!loading && totalImpressions > 0 && (
        <div className="card-editorial p-6 accent-border-left" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="metric-label mb-2">Total Impressions</div>
                <div className="text-mono text-3xl font-bold text-[var(--color-text-primary)]">
                  {totalImpressions.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-[var(--color-text-secondary)]">
                {filteredLeaderboard.length} of {totalReceived} Creators
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] text-mono mt-1">
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Status */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-polygon p-4">
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
      <div className="card-editorial p-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search by name, handle, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Exclusion Filter Toggle */}
          {excludedAccounts.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideExcluded}
                  onChange={(e) => setHideExcluded(e.target.checked)}
                  className="w-4 h-4 text-[var(--color-accent-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent-primary)]"
                />
                <span className="ml-2 text-sm text-[var(--color-text-secondary)]">
                  Hide {excludedAccounts.length} excluded account{excludedAccounts.length !== 1 ? 's' : ''}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card-editorial overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
        {loading && !error ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--color-accent-primary)] border-r-transparent"></div>
              <p className="mt-4 text-[var(--color-text-secondary)] text-mono">Loading leaderboard...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-[var(--color-border)]">
              <h3 className="text-display text-2xl text-[var(--color-text-primary)]">Creator Rankings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--color-border)]">
              <thead className="bg-[var(--color-bg-tertiary)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Impressions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">Tweets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredLeaderboard.map((creator, index) => {
                  const displayRank = index + 1;
                  return (
                  <>
                    <tr
                      key={creator.rank}
                      className="hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${displayRank <= 3 ? 'bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)]' : 'bg-[var(--color-bg-tertiary)]'} font-bold text-sm`}>
                          {displayRank <= 3 ? (
                            <Award className="h-5 w-5 text-white" />
                          ) : (
                            <span className="text-[var(--color-text-primary)] text-mono">{displayRank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-[var(--color-text-primary)] text-mono">{creator.name}</div>
                          <div className="text-sm text-[var(--color-text-secondary)] text-mono">{creator.handle}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                          {creator.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-[var(--color-text-primary)] text-mono font-semibold">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400" />
                          {creator.impressions.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <button
                          onClick={() => setExpandedCreatorId(expandedCreatorId === creator.userId ? null : creator.userId)}
                          className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                        >
                          {expandedCreatorId === creator.userId ? (
                            <>
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">Hide</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">View</span> {creator.tweetCount}
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedCreatorId === creator.userId && (
                      <tr key={`${creator.rank}-tweets`} className="bg-gray-50 dark:bg-gray-900">
                        <td colSpan="5" className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-polygon-text-primary mb-3">
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
                                    className="flex items-center justify-between px-4 py-2 card-polygon border border-gray-200 dark:border-gray-700 rounded-polygon hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
                                  >
                                    <span className="text-sm text-polygon-text-secondary truncate flex-1">
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
                );
                })}
              </tbody>
            </table>
            </div>

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
