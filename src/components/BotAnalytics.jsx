import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, MessageSquare, Heart, Repeat, Eye, Calendar, ExternalLink, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { BotAnalyticsService } from '../services/botAnalyticsService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BotAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [allTimeSummary, setAllTimeSummary] = useState(null);
  const [posts, setPosts] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [showAllCreators, setShowAllCreators] = useState(false);
  const [dateRange, setDateRange] = useState('30d');

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

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const end = new Date();
    const start = new Date();

    if (range === '7d') {
      start.setDate(start.getDate() - 7);
    } else if (range === '30d') {
      start.setDate(start.getDate() - 30);
    } else if (range === '90d') {
      start.setDate(start.getDate() - 90);
    }

    setStartDate(start);
    setEndDate(end);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  // Skeleton loader
  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-[#0A0A0F]">
        {/* Slim top bar skeleton */}
        <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-xl">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="h-6 w-32 bg-white/5 rounded animate-pulse"></div>
            <div className="h-9 w-64 bg-white/5 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* KPI cards skeleton */}
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse"></div>
            ))}
          </div>

          {/* Chart skeleton */}
          <div className="h-96 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
            <Activity className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-red-400 mb-4 text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/90 rounded-lg text-sm transition-colors border border-white/[0.06]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Slim sticky header */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h1 className="text-lg font-semibold text-white/90 tracking-tight">Bot Analytics</h1>
            </div>
            <div className="hidden sm:block text-xs text-white/40 font-mono">
              {allTimeSummary?.totalPosts || 0} posts tracked
            </div>
          </div>

          {/* Date range selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
              {['7d', '30d', '90d', 'custom'].map((range) => (
                <button
                  key={range}
                  onClick={() => range !== 'custom' && handleDateRangeChange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    dateRange === range
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  {range === 'custom' ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Custom
                    </div>
                  ) : (
                    range.toUpperCase()
                  )}
                </button>
              ))}
            </div>

            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 ml-2">
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white/90 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  dateFormat="MMM d, yyyy"
                />
                <span className="text-white/30 text-xs">→</span>
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white/90 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  dateFormat="MMM d, yyyy"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 py-8 max-w-[1600px] mx-auto">
        {/* KPI row - hero metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Posts */}
          <div className="group relative bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              {summary?.totalPosts && (
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 font-medium">Active</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white/95 tracking-tight tabular-nums">
                {formatNumber(summary?.totalPosts || 0)}
              </p>
              <p className="text-xs uppercase tracking-wider text-white/40 font-medium">Total Posts</p>
            </div>
          </div>

          {/* Total Impressions */}
          <div className="group relative bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Eye className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white/95 tracking-tight tabular-nums">
                {formatNumber(summary?.totalViews || 0)}
              </p>
              <p className="text-xs uppercase tracking-wider text-white/40 font-medium">Impressions</p>
            </div>
          </div>

          {/* Total Engagement */}
          <div className="group relative bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Heart className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white/95 tracking-tight tabular-nums">
                {formatNumber((summary?.totalLikes || 0) + (summary?.totalRetweets || 0))}
              </p>
              <p className="text-xs uppercase tracking-wider text-white/40 font-medium">Engagement</p>
            </div>
          </div>

          {/* Engagement Rate */}
          <div className="group relative bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white/95 tracking-tight tabular-nums">
                {summary?.avgEngagementRate?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-xs uppercase tracking-wider text-white/40 font-medium">Avg Engagement</p>
            </div>
          </div>
        </div>

        {/* Primary chart - centerpiece */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Activity Timeline</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                Posts
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="postsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 15, 20, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  backdropFilter: 'blur(12px)',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginBottom: '4px' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}
              />
              <Area
                type="monotone"
                dataKey="posts"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#postsGradient)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Engagement breakdown */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-6">Engagement Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Likes', value: summary?.totalLikes || 0 },
                { name: 'Retweets', value: summary?.totalRetweets || 0 },
                { name: 'Replies', value: summary?.totalReplies || 0 },
                { name: 'Bookmarks', value: summary?.totalBookmarks || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 15, 20, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Creators - compact */}
          {allTimeSummary?.topCreators && allTimeSummary.topCreators.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Top Creators</h3>
                {allTimeSummary.topCreators.length > 10 && (
                  <button
                    onClick={() => setShowAllCreators(!showAllCreators)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-indigo-400 hover:bg-white/5 rounded-md transition-colors"
                  >
                    {showAllCreators ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        All {allTimeSummary.topCreators.length}
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(showAllCreators ? allTimeSummary.topCreators : allTimeSummary.topCreators.slice(0, 10)).map((creator, index) => (
                  <div key={creator.xHandle} className="flex items-center justify-between p-2.5 hover:bg-white/[0.03] rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-indigo-500/10 text-indigo-400 rounded-md text-xs font-bold font-mono">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white/90 text-sm truncate">{creator.name}</p>
                        <p className="text-xs text-white/40 truncate">@{creator.xHandle}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-white/90 tabular-nums">{formatNumber(creator.totalImpressions)}</p>
                      <p className="text-xs text-white/40">{creator.postCount} posts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Posts table */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Recent Posts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Likes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Retweets</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white/40 uppercase tracking-wider">Link</th>
                </tr>
              </thead>
              <tbody>
                {posts.slice(0, 20).map((post, index) => (
                  <tr
                    key={post.id}
                    className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${
                      index % 2 === 0 ? 'bg-white/[0.01]' : ''
                    }`}
                  >
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-white/90 text-sm">{post.creator.name}</p>
                        <p className="text-xs text-white/40">@{post.creator.xHandle}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-white/60 font-mono">
                      {new Date(post.sharedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-white/80 tabular-nums">
                      {formatNumber(post.metrics?.likes || 0)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-white/80 tabular-nums">
                      {formatNumber(post.metrics?.retweets || 0)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-white/80 tabular-nums">
                      {formatNumber(post.metrics?.views || 0)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <a
                        href={post.xUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {posts.length > 20 && (
            <div className="px-6 py-4 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/40">Showing 20 of {posts.length} posts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
