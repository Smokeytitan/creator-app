import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * EstimatedVsActual - Display component for showing actual vs estimated with delta
 *
 * Shows:
 * - Actual value (prominent)
 * - Estimated value below (muted)
 * - Delta percentage (color-coded: green = over, red = under)
 * - Optional label
 */
const EstimatedVsActual = ({
  actual,
  estimated,
  label = '',
  format = 'number',
  showIcon = true,
  showDelta = true
}) => {
  // Format value based on type
  const formatValue = (value, formatType) => {
    if (value === null || value === undefined || isNaN(value)) {
      return formatType === 'currency' ? '$0.00' : '0';
    }

    const num = Number(value);

    switch (formatType) {
      case 'currency':
        return `$${num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      case 'number':
      default:
        return num.toLocaleString();
    }
  };

  // Calculate delta percentage
  const calculateDelta = () => {
    if (!estimated || estimated === 0) return { percent: 0, isOver: false };

    const delta = ((actual - estimated) / estimated) * 100;
    return {
      percent: Math.abs(delta),
      isOver: delta > 0
    };
  };

  const delta = calculateDelta();
  const hasVariance = Math.abs(delta.percent) >= 0.01;

  // Delta color coding
  const deltaColor = delta.isOver ? 'text-green-500' : 'text-red-500';
  const deltaBgColor = delta.isOver ? 'bg-green-500/10' : 'bg-red-500/10';
  const deltaBorderColor = delta.isOver ? 'border-green-500/20' : 'border-red-500/20';

  return (
    <div className="space-y-1">
      {/* Label (optional) */}
      {label && (
        <div className="metric-label">
          {label}
        </div>
      )}

      {/* Actual Value (prominent) */}
      <div className="flex items-baseline gap-2">
        <div className="text-mono text-2xl font-bold text-[var(--color-text-primary)]">
          {formatValue(actual, format)}
        </div>

        {/* Delta badge */}
        {showDelta && hasVariance && (
          <div
            className={`
              inline-flex items-center gap-1
              px-2 py-0.5
              ${deltaBgColor}
              ${deltaColor}
              border ${deltaBorderColor}
              rounded-full
              text-xs font-mono font-semibold
            `}
          >
            {showIcon && (
              delta.isOver
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
            )}
            {delta.isOver ? '+' : '-'}{delta.percent.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Estimated Value (muted) */}
      <div className="flex items-baseline gap-2 text-[var(--color-text-tertiary)] text-sm">
        <span className="font-mono">
          Est: {formatValue(estimated, format)}
        </span>

        {/* No variance indicator */}
        {!hasVariance && actual !== 0 && (
          <span className="text-xs text-[var(--color-text-tertiary)]">
            (on target)
          </span>
        )}
      </div>
    </div>
  );
};

EstimatedVsActual.propTypes = {
  actual: PropTypes.number.isRequired,
  estimated: PropTypes.number.isRequired,
  label: PropTypes.string,
  format: PropTypes.oneOf(['number', 'currency']),
  showIcon: PropTypes.bool,
  showDelta: PropTypes.bool
};

export default EstimatedVsActual;
