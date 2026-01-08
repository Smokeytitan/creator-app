import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, MessageSquare, Heart, Repeat, Eye, Calendar, ExternalLink } from 'lucide-react';
import { BotAnalyticsService } from '../services/botAnalyticsService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function BotAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [allTimeSummary, setAllTimeSummary] = useState(null);
  const [posts, setPosts] = useState([]);
  const [timeline, setTimeline] = useState([]);

  // Date range (default: last 30 days)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const service = useMemo(() => new BotAnalyticsService(), []);

  // Fetch all-time data once on mount
  useEffect(() => {
    fetchAllTimeData();
  }, []);

  // Fetch data when dates change
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchAllTimeData = async () => {
    try {
      const allTimeData = await service.fetchSummary({});
      setAllTimeSummary(allTimeData);
    } catch (err) {
      console.error('Failed to load all-time summary:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const [summaryData, postsData, timelineData] = await Promise.all([
        service.fetchSummary({ startDate: start, endDate: end }),
        service.fetchPosts({ startDate: start, endDate: end }),
        service.fetchTimeline({ startDate: start, endDate: end, groupBy: 'day' }),
      ]);

      setSummary(summaryData);
      setPosts(postsData);
      setTimeline(timelineData);
    } catch (err) {
      setError('Failed to load bot analytics. Make sure the bot is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-indigo-600 dark:border-indigo-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading bot analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Bot Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            X post tracking from Telegram channels
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              dateFormat="MMM d, yyyy"
            />
            <span className="text-gray-500">to</span>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
              dateFormat="MMM d, yyyy"
            />
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      {summary && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Total Posts</p>
                <p className="text-2xl font-bold">{summary.totalPosts || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Impressions</p>
                <p className="text-2xl font-bold">{formatNumber(summary.totalViews)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Likes</p>
                <p className="text-2xl font-bold">{formatNumber(summary.totalLikes)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Retweets</p>
                <p className="text-2xl font-bold">{formatNumber(summary.totalRetweets)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Engagement</p>
                <p className="text-2xl font-bold">{summary.avgEngagementRate?.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Posts Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
              />
              <Line type="monotone" dataKey="posts" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Engagement Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
              />
              <Bar dataKey="engagement" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Creators - Always shows all-time data */}
      {allTimeSummary?.topCreators && allTimeSummary.topCreators.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Top Creators (All Time)</h3>
          <div className="space-y-3">
            {allTimeSummary.topCreators.map((creator, index) => (
              <div key={creator.xHandle} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-50">{creator.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{creator.xHandle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-50">{formatNumber(creator.totalImpressions)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{creator.postCount} posts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Recent Posts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Creator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Retweets
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Replies
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Link
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {posts.slice(0, 10).map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{post.creator.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@{post.creator.xHandle}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(post.sharedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-gray-50">
                    {formatNumber(post.metrics?.likes || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-gray-50">
                    {formatNumber(post.metrics?.retweets || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-gray-50">
                    {formatNumber(post.metrics?.replies || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <a
                      href={post.xUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
