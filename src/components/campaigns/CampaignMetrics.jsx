import { DollarSign, TrendingUp, Users, Eye } from 'lucide-react';

/**
 * CampaignMetrics - Display campaign metrics/statistics
 * @param {Object} props
 * @param {number} props.estimatedCost - Estimated or actual cost
 * @param {number} props.estimatedImpressions - Estimated or actual impressions
 * @param {number} props.creatorCount - Number of creators
 * @param {number} props.postCount - Number of posts
 * @param {boolean} props.isCompact - Compact display mode
 */
export default function CampaignMetrics({
  estimatedCost = 0,
  estimatedImpressions = 0,
  creatorCount = 0,
  postCount = 0,
  isCompact = false
}) {
  const metrics = [
    {
      label: 'Estimated Cost',
      value: `$${estimatedCost.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      label: 'Estimated Impressions',
      value: estimatedImpressions.toLocaleString(),
      icon: TrendingUp,
      color: 'text-blue-400'
    },
    {
      label: 'Creators',
      value: creatorCount,
      icon: Users,
      color: 'text-purple-400'
    },
    {
      label: 'Posts',
      value: postCount,
      icon: Eye,
      color: 'text-amber-400'
    }
  ];

  if (isCompact) {
    return (
      <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="flex items-center gap-1.5">
              <Icon className={`w-4 h-4 ${metric.color}`} />
              <span>{metric.value}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 border border-[var(--color-border)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 ${metric.color}`} />
              <span className="text-xs text-[var(--color-text-secondary)]">
                {metric.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">
              {metric.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
