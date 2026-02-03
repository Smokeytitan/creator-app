import { Eye, DollarSign, TrendingUp, Activity } from 'lucide-react';

/**
 * KPI Strip - Executive dashboard metrics
 * Replaces status count cards with outcome-focused KPIs
 */
const KPIStrip = ({ campaigns = [], filteredCampaigns = [] }) => {
  const calculateKPIs = (campaignList) => {
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalEngagements = 0;
    let postsDelivered = 0;
    let postsPlanned = 0;

    campaignList.forEach(campaign => {
      // Use actual metrics if available, otherwise estimated
      const impressions = campaign.actualImpressions || campaign.estimatedImpressions || 0;
      const cost = campaign.actualCost || campaign.estimatedCost || 0;
      const engagements = (campaign.totalLikes || 0) + (campaign.totalComments || 0);

      totalImpressions += impressions;
      totalSpend += cost;
      totalEngagements += engagements;

      // Count posts
      if (campaign.posts) {
        postsDelivered += campaign.posts.length;
      }

      // Estimate posts planned (creators × platforms, or just count creators)
      postsPlanned += (campaign.creators || []).length;
    });

    const blendedCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;
    const deliveryRate = postsPlanned > 0 ? (postsDelivered / postsPlanned) * 100 : 0;

    return {
      totalSpend,
      totalImpressions,
      blendedCPM,
      engagementRate,
      postsDelivered,
      postsPlanned,
      deliveryRate
    };
  };

  const kpis = calculateKPIs(filteredCampaigns);
  const allKPIs = calculateKPIs(campaigns);

  // Determine if we're showing filtered data
  const isFiltered = filteredCampaigns.length !== campaigns.length;

  return (
    <div className="space-y-2">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Spend */}
        <KPICard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Spend"
          value={`$${kpis.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={isFiltered ? `of $${allKPIs.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total` : null}
          iconColor="text-green-500"
          delay="0s"
        />

        {/* Total Impressions */}
        <KPICard
          icon={<Eye className="h-5 w-5" />}
          label="Total Impressions"
          value={kpis.totalImpressions.toLocaleString()}
          subtitle={isFiltered ? `of ${allKPIs.totalImpressions.toLocaleString()} total` : null}
          iconColor="text-[var(--color-accent-primary)]"
          delay="0.05s"
        />

        {/* Blended CPM */}
        <KPICard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Blended CPM"
          value={`$${kpis.blendedCPM.toFixed(2)}`}
          subtitle={kpis.blendedCPM > 0 ? 'avg across campaigns' : null}
          iconColor="text-blue-400"
          delay="0.1s"
        />

        {/* Engagement Rate */}
        <KPICard
          icon={<Activity className="h-5 w-5" />}
          label="Engagement Rate"
          value={`${kpis.engagementRate.toFixed(2)}%`}
          subtitle={kpis.engagementRate > 0 ? 'likes + comments' : null}
          iconColor="text-purple-400"
          delay="0.15s"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="flex items-center justify-between px-2 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg">
        <div className="flex items-center gap-6 text-sm">
          <StatChip
            label="Campaigns"
            value={filteredCampaigns.length}
            total={isFiltered ? campaigns.length : null}
          />
          <StatChip
            label="Posts Delivered"
            value={kpis.postsDelivered}
            total={kpis.postsPlanned > 0 ? kpis.postsPlanned : null}
            percentage={kpis.deliveryRate}
          />
          <StatChip
            label="Pending"
            value={filteredCampaigns.filter(c => c.status === 'pending').length}
          />
          <StatChip
            label="In Progress"
            value={filteredCampaigns.filter(c => c.status === 'in-progress').length}
          />
          <StatChip
            label="Completed"
            value={filteredCampaigns.filter(c => c.status === 'completed').length}
          />
        </div>

        {/* Last Updated */}
        <div className="text-xs text-[var(--color-text-tertiary)]">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

/**
 * Individual KPI Card
 */
const KPICard = ({ icon, label, value, subtitle, iconColor, delay }) => {
  return (
    <div
      className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4 hover:border-[var(--color-border-hover)] transition-all duration-300"
      style={{ animation: `fadeInUp 0.6s ease-out ${delay} both` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="metric-label">{label}</div>
        <div className={iconColor}>{icon}</div>
      </div>

      <div className="text-mono text-3xl font-bold text-[var(--color-text-primary)] mb-1">
        {value}
      </div>

      {subtitle && (
        <div className="text-xs text-[var(--color-text-tertiary)]">
          {subtitle}
        </div>
      )}
    </div>
  );
};

/**
 * Small stat chip for secondary metrics
 */
const StatChip = ({ label, value, total, percentage }) => {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[var(--color-text-tertiary)]">{label}:</span>
      <span className="text-mono font-semibold text-[var(--color-text-primary)]">
        {value}
        {total && <span className="text-[var(--color-text-tertiary)] font-normal">/{total}</span>}
        {percentage > 0 && (
          <span className="text-xs text-[var(--color-text-tertiary)] ml-1">
            ({percentage.toFixed(0)}%)
          </span>
        )}
      </span>
    </div>
  );
};

export default KPIStrip;
