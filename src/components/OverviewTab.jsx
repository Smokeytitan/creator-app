import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import KPIStrip from './KPIStrip';
import ConfidenceBadge from './ConfidenceBadge';

/**
 * OverviewTab - Executive Overview Dashboard
 *
 * Answers "are we winning?" at a glance with:
 * - Highlights (top insights)
 * - Platform breakdown (impressions by platform)
 * - Creator efficiency scatter (CPM vs impressions)
 * - Timeline view (campaign schedule)
 *
 * Bloomberg terminal aesthetic with dark gold theme.
 */
const OverviewTab = ({ campaigns = [], creators = [], posts = [] }) => {
  // Calculate all analytics
  const analytics = useMemo(() => {
    return calculateAnalytics(campaigns, creators, posts);
  }, [campaigns, creators, posts]);

  return (
    <div className="space-y-6">
      {/* KPI Strip at top */}
      <KPIStrip campaigns={campaigns} filteredCampaigns={campaigns} />

      {/* Highlights Section - 3 insight cards */}
      <section>
        <h2 className="text-display text-xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--color-accent-primary)]" />
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HighlightCard
            title="Highest CPM Campaign"
            value={analytics.highestCPMCampaign?.name || 'N/A'}
            metric={analytics.highestCPMCampaign?.cpm ? `$${analytics.highestCPMCampaign.cpm.toFixed(2)}` : 'N/A'}
            icon={<TrendingUp className="h-5 w-5" />}
            iconColor="text-[var(--color-accent-primary)]"
          />
          <HighlightCard
            title="Most Efficient Creator"
            value={analytics.mostEfficientCreator?.handle || 'N/A'}
            metric={analytics.mostEfficientCreator?.cpm ? `$${analytics.mostEfficientCreator.cpm.toFixed(2)} CPM` : 'N/A'}
            icon={<CheckCircle className="h-5 w-5" />}
            iconColor="text-green-500"
          />
          <HighlightCard
            title="Underperforming vs Estimate"
            value={analytics.underperformingCampaign?.name || 'N/A'}
            metric={analytics.underperformingCampaign?.delta ? `${analytics.underperformingCampaign.delta.toFixed(1)}%` : 'N/A'}
            icon={<AlertTriangle className="h-5 w-5" />}
            iconColor="text-red-500"
          />
        </div>
      </section>

      {/* Platform Breakdown - Horizontal bar chart */}
      <section>
        <h2 className="text-display text-xl font-bold text-[var(--color-text-primary)] mb-4">
          Platform Distribution
        </h2>
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
          <PlatformBreakdown platforms={analytics.platformBreakdown} />
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Creator Efficiency Scatter */}
        <section>
          <h2 className="text-display text-xl font-bold text-[var(--color-text-primary)] mb-4">
            Creator Efficiency Matrix
          </h2>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
            <CreatorScatter creators={analytics.creatorEfficiency} />
          </div>
        </section>

        {/* Timeline View */}
        <section>
          <h2 className="text-display text-xl font-bold text-[var(--color-text-primary)] mb-4">
            Campaign Timeline
          </h2>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 max-h-[600px] overflow-y-auto">
            <Timeline campaigns={analytics.timelineCampaigns} />
          </div>
        </section>
      </div>
    </div>
  );
};

/**
 * Highlight Card - Individual insight card
 */
const HighlightCard = ({ title, value, metric, icon, iconColor }) => {
  return (
    <div className="card-editorial p-5 accent-border-left">
      <div className="flex items-start justify-between mb-3">
        <div className="metric-label">{title}</div>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="text-mono text-2xl font-bold text-[var(--color-text-primary)] mb-1">
        {value}
      </div>
      <div className="text-lg text-[var(--color-accent-primary)] font-semibold">
        {metric}
      </div>
    </div>
  );
};

/**
 * Platform Breakdown - Horizontal bar chart
 */
const PlatformBreakdown = ({ platforms }) => {
  const platformColors = {
    'X': '#1DA1F2',
    'Facebook': '#4267B2',
    'Instagram': '#E4405F',
    'YouTube': '#FF0000',
    'TikTok': '#000000'
  };

  const maxImpressions = Math.max(...platforms.map(p => p.impressions), 1);

  if (platforms.length === 0) {
    return (
      <div className="text-center text-[var(--color-text-tertiary)] py-8">
        No platform data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {platforms.map((platform) => {
        const percentage = (platform.impressions / maxImpressions) * 100;
        const color = platformColors[platform.name] || 'var(--color-accent-primary)';

        return (
          <div key={platform.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[var(--color-text-primary)] font-semibold min-w-[80px]">
                  {platform.name}
                </span>
                <div className="flex-1 h-8 bg-[var(--color-bg-tertiary)] rounded-md overflow-hidden relative">
                  <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                      opacity: 0.7
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-6 ml-4 min-w-[240px] justify-end">
                <div className="text-right">
                  <div className="text-mono text-[var(--color-text-primary)] font-bold">
                    {platform.impressions.toLocaleString()}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">impressions</div>
                </div>
                <div className="text-right">
                  <div className="text-mono text-[var(--color-accent-primary)] font-bold">
                    ${platform.cpm.toFixed(2)}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">CPM</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Creator Efficiency Scatter - Simple HTML/CSS scatter plot
 */
const CreatorScatter = ({ creators }) => {
  if (creators.length === 0) {
    return (
      <div className="text-center text-[var(--color-text-tertiary)] py-8">
        No creator data available
      </div>
    );
  }

  // Calculate bounds
  const maxImpressions = Math.max(...creators.map(c => c.impressions), 1);
  const maxCPM = Math.max(...creators.map(c => c.cpm), 1);
  const maxSpend = Math.max(...creators.map(c => c.spend), 1);

  // Chart dimensions
  const chartWidth = 100; // percentage
  const chartHeight = 400; // pixels

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>High Engagement (&gt;5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--color-accent-primary)]" />
            <span>Medium (2-5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Low (&lt;2%)</span>
          </div>
        </div>
        <span>Bubble size = Spend</span>
      </div>

      {/* Chart Container */}
      <div className="relative bg-[var(--color-bg-tertiary)] rounded-lg p-4 border border-[var(--color-border)]" style={{ height: chartHeight }}>
        {/* Y Axis Labels - CPM */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-[var(--color-text-tertiary)] py-4">
          <span>${maxCPM.toFixed(1)}</span>
          <span>${(maxCPM / 2).toFixed(1)}</span>
          <span>$0</span>
        </div>

        {/* X Axis Labels - Impressions */}
        <div className="absolute left-12 right-0 bottom-0 h-8 flex justify-between text-xs text-[var(--color-text-tertiary)] px-4">
          <span>0</span>
          <span>{(maxImpressions / 2).toLocaleString()}</span>
          <span>{maxImpressions.toLocaleString()}</span>
        </div>

        {/* Grid Lines */}
        <div className="absolute left-12 top-4 right-4 bottom-8 border-l border-b border-[var(--color-border)]">
          {/* Horizontal grid lines */}
          <div className="absolute top-1/3 left-0 right-0 border-t border-[var(--color-border)] opacity-30" />
          <div className="absolute top-2/3 left-0 right-0 border-t border-[var(--color-border)] opacity-30" />
          {/* Vertical grid lines */}
          <div className="absolute top-0 bottom-0 left-1/3 border-l border-[var(--color-border)] opacity-30" />
          <div className="absolute top-0 bottom-0 left-2/3 border-l border-[var(--color-border)] opacity-30" />
        </div>

        {/* Plot Area */}
        <div className="absolute left-12 top-4 right-4 bottom-8">
          {creators.map((creator, index) => {
            // Position calculations (inverted Y for top=high CPM)
            const x = (creator.impressions / maxImpressions) * 100;
            const y = 100 - (creator.cpm / maxCPM) * 100; // Invert Y axis
            const size = Math.max(12, Math.min(40, (creator.spend / maxSpend) * 50)); // Bubble size

            // Color based on engagement rate
            let color = '#EF4444'; // red - low engagement
            if (creator.engagementRate > 5) {
              color = '#10B981'; // green - high engagement
            } else if (creator.engagementRate > 2) {
              color = '#D97706'; // orange - medium engagement
            }

            return (
              <div
                key={index}
                className="absolute group cursor-pointer transition-transform hover:scale-110"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={`${creator.name}\nImpressions: ${creator.impressions.toLocaleString()}\nCPM: $${creator.cpm.toFixed(2)}\nSpend: $${creator.spend.toFixed(2)}\nEngagement: ${creator.engagementRate.toFixed(2)}%`}
              >
                <div
                  className="rounded-full border-2 border-[var(--color-bg-primary)] shadow-lg"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: color,
                    opacity: 0.8
                  }}
                />
                {/* Tooltip on hover */}
                <div className="absolute hidden group-hover:block bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-3 py-2 text-xs whitespace-nowrap z-10 -top-2 left-full ml-2 shadow-lg">
                  <div className="font-bold text-[var(--color-text-primary)]">{creator.name}</div>
                  <div className="text-[var(--color-text-secondary)] mt-1">
                    {creator.impressions.toLocaleString()} impressions
                  </div>
                  <div className="text-[var(--color-text-secondary)]">
                    ${creator.cpm.toFixed(2)} CPM
                  </div>
                  <div className="text-[var(--color-text-secondary)]">
                    ${creator.spend.toFixed(2)} spend
                  </div>
                  <div className="text-[var(--color-text-secondary)]">
                    {creator.engagementRate.toFixed(2)}% engagement
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Axis Labels */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-semibold text-[var(--color-text-tertiary)]">
          CPM
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-semibold text-[var(--color-text-tertiary)]">
          Impressions
        </div>
      </div>
    </div>
  );
};

/**
 * Timeline View - Campaign timeline grouped by month
 */
const Timeline = ({ campaigns }) => {
  if (campaigns.length === 0) {
    return (
      <div className="text-center text-[var(--color-text-tertiary)] py-8">
        No campaigns scheduled
      </div>
    );
  }

  // Group campaigns by month
  const grouped = campaigns.reduce((acc, campaign) => {
    const monthKey = campaign.monthKey;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(campaign);
    return acc;
  }, {});

  const sortedMonths = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      {sortedMonths.map((monthKey) => {
        const monthCampaigns = grouped[monthKey];
        return (
          <div key={monthKey} className="space-y-3">
            <div className="text-display text-sm font-bold text-[var(--color-accent-primary)] uppercase tracking-wider border-b border-[var(--color-border)] pb-2">
              {monthKey}
            </div>
            <div className="space-y-2">
              {monthCampaigns.map((campaign) => (
                <TimelineItem key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Timeline Item - Individual campaign in timeline
 */
const TimelineItem = ({ campaign }) => {
  const statusConfig = {
    'completed': {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Completed'
    },
    'in-progress': {
      icon: Clock,
      color: 'text-[var(--color-accent-primary)]',
      bgColor: 'bg-[var(--color-accent-primary)]/10',
      label: 'In Progress'
    },
    'pending': {
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      label: 'Pending'
    },
    'cancelled': {
      icon: AlertCircle,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      label: 'Cancelled'
    }
  };

  const config = statusConfig[campaign.status] || statusConfig['pending'];
  const StatusIcon = config.icon;

  // Determine if overdue
  const isOverdue = campaign.isOverdue && campaign.status !== 'completed' && campaign.status !== 'cancelled';

  return (
    <div className={`group flex items-start gap-3 p-3 rounded-lg border transition-all hover:border-[var(--color-border-hover)] ${
      isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)]'
    }`}>
      {/* Status Indicator */}
      <div className={`flex-shrink-0 ${config.bgColor} p-2 rounded-lg`}>
        <StatusIcon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Campaign Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {campaign.title}
          </h4>
          <ConfidenceBadge confidence={campaign.confidence} size="sm" />
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Start: {campaign.startDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Due: {campaign.dueDate}</span>
          </div>
          {isOverdue && (
            <span className="text-red-500 font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              OVERDUE
            </span>
          )}
        </div>

        {/* Mini metrics */}
        <div className="flex items-center gap-3 mt-2 text-xs">
          <div className="text-mono">
            <span className="text-[var(--color-text-tertiary)]">Cost:</span>{' '}
            <span className="text-[var(--color-text-primary)] font-semibold">
              ${campaign.cost.toLocaleString()}
            </span>
          </div>
          <div className="text-mono">
            <span className="text-[var(--color-text-tertiary)]">Impressions:</span>{' '}
            <span className="text-[var(--color-text-primary)] font-semibold">
              {campaign.impressions.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Calculate all analytics from raw data
 */
function calculateAnalytics(campaigns, creators, posts) {
  // Helper: Get confidence level
  const getConfidence = (campaign) => {
    const actualPosts = campaign.posts?.length || 0;
    const expectedPosts = campaign.creators?.length || 0;

    if (actualPosts === 0) return 'estimated';
    if (actualPosts < expectedPosts) return 'partial';
    return 'measured';
  };

  // 1. Highest CPM Campaign
  let highestCPMCampaign = null;
  let maxCPM = 0;

  campaigns.forEach(campaign => {
    const impressions = campaign.actualImpressions || campaign.estimatedImpressions || 0;
    const cost = campaign.actualCost || campaign.estimatedCost || 0;
    const cpm = impressions > 0 ? (cost / impressions) * 1000 : 0;

    if (cpm > maxCPM) {
      maxCPM = cpm;
      highestCPMCampaign = { name: campaign.title, cpm };
    }
  });

  // 2. Most Efficient Creator (lowest CPM)
  let mostEfficientCreator = null;
  let minCPM = Infinity;

  creators.forEach(creator => {
    const creatorPosts = creator.posts || [];
    if (creatorPosts.length === 0) return;

    const totalImpressions = creatorPosts.reduce((sum, post) => sum + (parseInt(post.impressions) || 0), 0);
    const totalCost = creatorPosts.reduce((sum, post) => sum + (parseFloat(post.cost) || 0), 0);
    const cpm = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;

    if (cpm > 0 && cpm < minCPM) {
      minCPM = cpm;
      mostEfficientCreator = { handle: creator.handle || creator.name, cpm };
    }
  });

  // 3. Underperforming Campaign (actual vs estimated)
  let underperformingCampaign = null;
  let maxNegativeDelta = 0;

  campaigns.forEach(campaign => {
    const actual = campaign.actualImpressions || 0;
    const estimated = campaign.estimatedImpressions || 0;

    if (actual > 0 && estimated > 0) {
      const delta = ((actual - estimated) / estimated) * 100;
      if (delta < maxNegativeDelta) {
        maxNegativeDelta = delta;
        underperformingCampaign = { name: campaign.title, delta };
      }
    }
  });

  // 4. Platform Breakdown
  const platformStats = {};

  campaigns.forEach(campaign => {
    const campaignPosts = campaign.posts || [];
    const campaignCreators = campaign.creators || [];

    // Get platforms from creators in this campaign
    campaignCreators.forEach(creator => {
      const creatorData = creators.find(c => c.id === creator.id || c.id === creator);
      if (!creatorData) return;

      const platforms = creatorData.platforms || [];
      const creatorPosts = creatorData.posts || [];

      if (creatorPosts.length === 0) return;

      const totalImpressions = creatorPosts.reduce((sum, post) => sum + (parseInt(post.impressions) || 0), 0);
      const totalCost = creatorPosts.reduce((sum, post) => sum + (parseFloat(post.cost) || 0), 0);

      platforms.forEach(platform => {
        if (!platformStats[platform]) {
          platformStats[platform] = { impressions: 0, cost: 0 };
        }
        platformStats[platform].impressions += totalImpressions / platforms.length;
        platformStats[platform].cost += totalCost / platforms.length;
      });
    });
  });

  const platformBreakdown = Object.entries(platformStats)
    .map(([name, stats]) => ({
      name,
      impressions: Math.round(stats.impressions),
      cpm: stats.impressions > 0 ? (stats.cost / stats.impressions) * 1000 : 0
    }))
    .sort((a, b) => b.impressions - a.impressions);

  // 5. Creator Efficiency Data (for scatter plot)
  const creatorEfficiency = creators
    .map(creator => {
      const creatorPosts = creator.posts || [];
      if (creatorPosts.length === 0) return null;

      const totalImpressions = creatorPosts.reduce((sum, post) => sum + (parseInt(post.impressions) || 0), 0);
      const totalCost = creatorPosts.reduce((sum, post) => sum + (parseFloat(post.cost) || 0), 0);
      const totalEngagements = creatorPosts.reduce((sum, post) => {
        return sum + (parseInt(post.likes) || 0) + (parseInt(post.comments) || 0);
      }, 0);

      const cpm = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;
      const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

      return {
        name: creator.name,
        handle: creator.handle,
        impressions: totalImpressions,
        cpm,
        spend: totalCost,
        engagementRate
      };
    })
    .filter(Boolean)
    .filter(c => c.impressions > 0); // Only creators with data

  // 6. Timeline Campaigns
  const today = new Date();
  const timelineCampaigns = campaigns
    .map(campaign => {
      const startDate = campaign.createdAt ? new Date(campaign.createdAt) : null;
      const dueDate = campaign.dueDate ? new Date(campaign.dueDate) : null;

      return {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status || 'pending',
        startDate: startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        dueDate: dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        monthKey: dueDate ? dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'No Date',
        isOverdue: dueDate ? dueDate < today : false,
        cost: campaign.actualCost || campaign.estimatedCost || 0,
        impressions: campaign.actualImpressions || campaign.estimatedImpressions || 0,
        confidence: getConfidence(campaign)
      };
    })
    .sort((a, b) => {
      // Sort by due date
      const dateA = a.dueDate !== 'N/A' ? new Date(a.dueDate) : new Date('2099-12-31');
      const dateB = b.dueDate !== 'N/A' ? new Date(b.dueDate) : new Date('2099-12-31');
      return dateA - dateB;
    });

  return {
    highestCPMCampaign,
    mostEfficientCreator,
    underperformingCampaign,
    platformBreakdown,
    creatorEfficiency,
    timelineCampaigns
  };
}

export default OverviewTab;
