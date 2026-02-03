import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

/**
 * CampaignStatusBadge - Visual status indicator for campaigns
 * @param {Object} props
 * @param {string} props.status - Campaign status ('pending', 'in-progress', 'completed', 'cancelled')
 * @param {boolean} props.showIcon - Whether to show icon
 * @param {string} props.size - Size variant ('sm', 'md', 'lg')
 */
export default function CampaignStatusBadge({
  status = 'pending',
  showIcon = true,
  size = 'md'
}) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30'
    },
    'in-progress': {
      label: 'In Progress',
      icon: Loader2,
      className: 'bg-blue-900/20 text-blue-400 border-blue-500/30'
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle,
      className: 'bg-green-900/20 text-green-400 border-green-500/30'
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      className: 'bg-red-900/20 text-red-400 border-red-500/30'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.className}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
