import PropTypes from 'prop-types';

/**
 * ConfidenceBadge - Displays data confidence level for metrics
 *
 * Confidence levels:
 * - measured: All posts have actual metrics (green)
 * - partial: Some posts have metrics, some are estimates (yellow)
 * - estimated: No posts yet, all values are estimated (gray)
 */
const ConfidenceBadge = ({ confidence = 'estimated', size = 'md' }) => {
  const sizeClasses = {
    sm: { container: 'px-2 py-0.5 text-xs', dot: 'w-1.5 h-1.5' },
    md: { container: 'px-2.5 py-1 text-xs', dot: 'w-1.5 h-1.5' },
    lg: { container: 'px-3 py-1.5 text-sm', dot: 'w-2 h-2' }
  };

  const confidenceConfig = {
    measured: {
      label: 'Measured',
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      description: 'All posts have actual metrics'
    },
    partial: {
      label: 'Partial',
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      description: 'Mix of actual and estimated data'
    },
    estimated: {
      label: 'Est.',
      dotColor: 'bg-gray-400 dark:bg-gray-500',
      textColor: 'text-gray-500 dark:text-gray-400',
      description: 'No actual data yet'
    }
  };

  const config = confidenceConfig[confidence] || confidenceConfig.estimated;
  const sizes = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${sizes.container} ${config.textColor} font-medium`}
      title={config.description}
    >
      <span className={`${sizes.dot} ${config.dotColor} rounded-full flex-shrink-0`} />
      <span>{config.label}</span>
    </div>
  );
};

ConfidenceBadge.propTypes = {
  confidence: PropTypes.oneOf(['measured', 'partial', 'estimated']).isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default ConfidenceBadge;
