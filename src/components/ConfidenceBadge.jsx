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
  // Size variants
  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-xs',
      dot: 'w-1.5 h-1.5'
    },
    md: {
      container: 'px-2.5 py-1 text-xs',
      dot: 'w-2 h-2'
    },
    lg: {
      container: 'px-3 py-1.5 text-sm',
      dot: 'w-2.5 h-2.5'
    }
  };

  // Confidence level configurations
  const confidenceConfig = {
    measured: {
      label: 'Measured',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500',
      dotColor: 'bg-green-500',
      borderColor: 'border-green-500/20',
      description: 'All posts have actual metrics'
    },
    partial: {
      label: 'Partial',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-500',
      dotColor: 'bg-yellow-500',
      borderColor: 'border-yellow-500/20',
      description: 'Mix of actual and estimated data'
    },
    estimated: {
      label: 'Estimated',
      bgColor: 'bg-gray-500/10',
      textColor: 'text-gray-400',
      dotColor: 'bg-gray-400',
      borderColor: 'border-gray-500/20',
      description: 'No actual data yet'
    }
  };

  const config = confidenceConfig[confidence] || confidenceConfig.estimated;
  const sizes = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        ${sizes.container}
        ${config.bgColor}
        ${config.textColor}
        border ${config.borderColor}
        rounded-full
        font-mono font-medium
        transition-all duration-200
      `}
      title={config.description}
    >
      {/* Status dot */}
      <span
        className={`
          ${sizes.dot}
          ${config.dotColor}
          rounded-full
          animate-pulse
        `}
      />

      {/* Label */}
      <span className="uppercase tracking-wide">
        {config.label}
      </span>
    </div>
  );
};

ConfidenceBadge.propTypes = {
  confidence: PropTypes.oneOf(['measured', 'partial', 'estimated']).isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default ConfidenceBadge;
