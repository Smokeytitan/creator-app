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
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    },
    'in-progress': {
      label: 'In Progress',
      icon: Loader2,
      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle,
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
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
        inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap
        ${config.className}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
