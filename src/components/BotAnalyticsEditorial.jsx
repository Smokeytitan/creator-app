import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, MessageSquare, Heart, Repeat, Eye, Calendar, ExternalLink, ChevronDown, ChevronUp, Activity, Zap, UserX } from 'lucide-react';
import { BotAnalyticsService } from '../services/botAnalyticsService';
import BotExclusionManager from './BotExclusionManager';
import { filterExcludedPosts } from '../services/botExclusionService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function BotAnalyticsEditorial() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [allTimeSummary, setAllTimeSummary] = useState(null);
  const [posts, setPosts] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [showAllCreators, setShowAllCreators] = useState(false);
  const [viewMode, setViewMode] = useState('analytics'); // 'analytics' | 'exclusions'

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const service = useMemo(() => new BotAnalyticsService(), []);

  useEffect(() => {
    fetchAllTimeData();
  }, []);

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

      // Filter out excluded accounts
      const filteredPosts = await filterExcludedPosts(postsData);

      setSummary(summaryData);
      setPosts(filteredPosts);
      setTimeline(timelineData);
    } catch (err) {
      setError('Failed to load bot analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toLocaleString() || '0';
  };

  const formatCPM = (cost, impressions) => {
    if (!impressions || impressions === 0) return 'N/A';
    return `$${((cost / impressions) * 1000).toFixed(2)}`;
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Activity className="w-12 h-12 text-[var(--color-accent-primary)] mx-auto mb-4 animate-pulse" />
          <p className="text-[var(--color-text-secondary)] font-medium text-mono">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-secondary)] transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show exclusions view
  if (viewMode === 'exclusions') {
    return (
      <div>
        <button
          onClick={() => setViewMode('analytics')}
          className="btn-editorial-secondary mb-6"
        >
          ← Back to Analytics
        </button>
        <BotExclusionManager />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="border-b border-[var(--color-border)] pb-8" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-5xl mb-3 text-[var(--color-text-primary)]">
              Creator Analytics
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg">
              Real-time performance metrics from Telegram channels
            </p>
          </div>
          <button
            onClick={() => setViewMode('exclusions')}
            className="btn-editorial-secondary flex items-center gap-2"
          >
            <UserX className="w-4 h-4" />
            Manage Exclusions
          </button>
        </div>
      </div>

      {/* All-Time Metrics Grid */}
      {allTimeSummary && (
        <div style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-display text-3xl text-[var(--color-text-primary)]">All-Time Performance</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] rounded-full border border-[var(--color-border)]">
              <Zap className="w-4 h-4 text-[var(--color-accent-primary)]" />
              <span className="text-mono text-sm text-[var(--color-text-secondary)]">Live Data</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              icon={<MessageSquare className="w-5 h-5" />}
              label="Total Posts"
              value={formatNumber(allTimeSummary.totalPosts)}
              delay="0s"
            />
            <MetricCard
              icon={<Eye className="w-5 h-5" />}
              label="Impressions"
              value={formatNumber(allTimeSummary.totalViews)}
              delay="0.05s"
            />
            <MetricCard
              icon={<Heart className="w-5 h-5" />}
              label="Likes"
              value={formatNumber(allTimeSummary.totalLikes)}
              delay="0.1s"
            />
            <MetricCard
              icon={<Repeat className="w-5 h-5" />}
              label="Retweets"
              value={formatNumber(allTimeSummary.totalRetweets)}
              delay="0.15s"
            />
            <MetricCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Engagement"
              value={`${allTimeSummary.avgEngagementRate.toFixed(2)}%`}
              delay="0.2s"
            />
          </div>
        </div>
      )}

      {/* Date Range Selector */}
      <div className="card-editorial p-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Date Range Analysis</h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">Filter metrics by custom date range</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                maxDate={new Date()}
                className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all text-mono"
                dateFormat="MMM d, yyyy"
              />
            </div>
            <span className="text-[var(--color-text-tertiary)]">→</span>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              maxDate={new Date()}
              className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-all text-mono"
              dateFormat="MMM d, yyyy"
            />
          </div>
        </div>
      </div>

      {/* Filtered Summary */}
      {summary && (
        <div className="card-editorial p-6 accent-border-left" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Period Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="metric-label mb-2">Posts</div>
              <div className="metric-value text-3xl">{formatNumber(summary.totalPosts)}</div>
            </div>
            <div>
              <div className="metric-label mb-2">Impressions</div>
              <div className="metric-value text-3xl">{formatNumber(summary.totalViews)}</div>
            </div>
            <div>
              <div className="metric-label mb-2">Engagement</div>
              <div className="metric-value text-3xl">{summary.avgEngagementRate.toFixed(2)}%</div>
            </div>
            <div>
              <div className="metric-label mb-2">Total Engagement</div>
              <div className="metric-value text-3xl">
                {formatNumber(summary.totalLikes + summary.totalRetweets + summary.totalReplies + summary.totalBookmarks)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Creators Leaderboard */}
      {allTimeSummary?.topCreators && allTimeSummary.topCreators.length > 0 && (
        <div className="card-editorial p-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-display text-2xl text-[var(--color-text-primary)]">Top Creators</h3>
            {allTimeSummary.topCreators.length > 10 && (
              <button
                onClick={() => setShowAllCreators(!showAllCreators)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-accent-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-all"
              >
                {showAllCreators ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show All ({allTimeSummary.topCreators.length})
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(showAllCreators ? allTimeSummary.topCreators : allTimeSummary.topCreators.slice(0, 10)).map((creator, index) => (
              <div
                key={creator.id}
                className="flex items-center gap-4 p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent-primary)] transition-all group"
                style={{ animation: `slideInRight 0.4s ease-out ${index * 0.05}s both` }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center">
                  <span className="text-display text-xl font-bold text-white">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-mono font-semibold text-[var(--color-text-primary)] truncate">
                    @{creator.xHandle}
                  </div>
                  <div className="text-sm text-[var(--color-text-tertiary)]">
                    {creator.postCount} {creator.postCount === 1 ? 'post' : 'posts'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-mono text-lg font-bold text-[var(--color-text-primary)]">
                    {formatNumber(creator.totalImpressions)}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">Impressions</div>
                </div>
                <div className="text-right">
                  <div className="text-mono text-lg font-bold text-[var(--color-accent-primary)]">
                    {formatNumber(creator.totalEngagement)}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">Engagement</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Chart */}
      {timeline && timeline.length > 0 && (
        <div className="card-editorial p-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.5s both' }}>
          <h3 className="text-display text-2xl text-[var(--color-text-primary)] mb-6">Engagement Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                stroke="var(--color-text-tertiary)"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              />
              <YAxis
                stroke="var(--color-text-tertiary)"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)',
                }}
                labelStyle={{ color: 'var(--color-text-primary)' }}
              />
              <Legend
                wrapperStyle={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="posts"
                stroke="var(--color-accent-primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-accent-primary)', r: 4 }}
                activeDot={{ r: 6 }}
                name="Posts"
              />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="var(--color-accent-secondary)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-accent-secondary)', r: 4 }}
                activeDot={{ r: 6 }}
                name="Engagement"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Posts Table */}
      {posts && posts.length > 0 && (
        <div className="card-editorial overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out 0.6s both' }}>
          <div className="p-6 border-b border-[var(--color-border)]">
            <h3 className="text-display text-2xl text-[var(--color-text-primary)]">Recent Posts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-bg-tertiary)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Likes
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Retweets
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {posts.slice(0, 20).map((post, index) => {
                  const totalEngagement = (post.metrics?.likes || 0) + (post.metrics?.retweets || 0) + (post.metrics?.replies || 0);
                  const engagementRate = post.metrics?.views
                    ? ((totalEngagement / post.metrics.views) * 100).toFixed(2)
                    : '0.00';

                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both` }}
                    >
                      <td className="px-6 py-4 text-mono text-sm text-[var(--color-text-primary)]">
                        @{post.creator?.xHandle}
                      </td>
                      <td className="px-6 py-4 text-mono text-sm text-[var(--color-text-secondary)]">
                        {new Date(post.sharedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-mono text-sm text-right text-[var(--color-text-primary)]">
                        {formatNumber(post.metrics?.views || 0)}
                      </td>
                      <td className="px-6 py-4 text-mono text-sm text-right text-[var(--color-text-primary)]">
                        {formatNumber(post.metrics?.likes || 0)}
                      </td>
                      <td className="px-6 py-4 text-mono text-sm text-right text-[var(--color-text-primary)]">
                        {formatNumber(post.metrics?.retweets || 0)}
                      </td>
                      <td className="px-6 py-4 text-mono text-sm text-right text-[var(--color-accent-primary)] font-semibold">
                        {engagementRate}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={post.xUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon, label, value, delay }) {
  return (
    <div
      className="card-editorial p-5 hover:scale-105 transition-transform duration-300"
      style={{ animation: `fadeInUp 0.6s ease-out ${delay} both` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
      <div className="metric-label mb-2">{label}</div>
      <div className="text-mono text-3xl font-bold text-[var(--color-text-primary)]">{value}</div>
    </div>
  );
}
