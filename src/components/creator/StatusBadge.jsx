import { Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';

/**
 * StatusBadge - Colored pill badge for campaign statuses.
 *
 * Statuses:
 *   pending     -> yellow
 *   in-progress -> green with subtle pulse
 *   completed   -> blue/gray
 *   cancelled   -> red
 *
 * @param {Object}  props
 * @param {string}  props.status - One of 'pending', 'in-progress', 'completed', 'cancelled'
 * @param {string}  [props.size='md'] - 'sm' | 'md' | 'lg'
 */
export default function StatusBadge({ status = 'pending', size = 'md' }) {
  const config = {
    pending: {
      label: 'Pending',
      icon: Clock,
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/20',
      pulse: false,
    },
    'in-progress': {
      label: 'In Progress',
      icon: Loader2,
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/20',
      pulse: true,
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle,
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      pulse: false,
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20',
      pulse: false,
    },
  };

  const sizeClasses = {
    sm: { container: 'text-xs px-2 py-0.5', icon: 'w-3 h-3' },
    md: { container: 'text-xs px-2.5 py-1', icon: 'w-3.5 h-3.5' },
    lg: { container: 'text-sm px-3 py-1.5', icon: 'w-4 h-4' },
  };

  const cfg = config[status] || config.pending;
  const sz = sizeClasses[size] || sizeClasses.md;
  const Icon = cfg.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${cfg.bg} ${cfg.text} ${cfg.border}
        ${sz.container}
      `}
    >
      {cfg.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
      )}
      {!cfg.pulse && <Icon className={sz.icon} />}
      {cfg.label}
    </span>
  );
}
