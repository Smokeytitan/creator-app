import PropTypes from 'prop-types';

/**
 * Sparkline - Simple sparkline chart component for trends
 *
 * Renders a compact SVG line chart showing data trends.
 * Useful for showing quick visual trends without full chart overhead.
 */
const Sparkline = ({
  data = [],
  width = 100,
  height = 32,
  color = '#3B82F6',
  showDots = false,
  strokeWidth = 2,
  className = ''
}) => {
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        className={className}
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.3"
        />
      </svg>
    );
  }

  // Filter out non-numeric values
  const validData = data.filter(d => typeof d === 'number' && !isNaN(d));

  if (validData.length === 0) {
    return null;
  }

  // Calculate min/max for scaling
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1; // Avoid division by zero

  // Add padding to prevent clipping
  const padding = strokeWidth * 2;
  const chartHeight = height - (padding * 2);
  const chartWidth = width - (padding * 2);

  // Calculate points
  const points = validData.map((value, index) => {
    const x = padding + (index * chartWidth / (validData.length - 1 || 1));
    const y = padding + chartHeight - ((value - min) / range * chartHeight);
    return { x, y, value };
  });

  // Generate SVG path
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x},${point.y}`;
    }
    return `${path} L ${point.x},${point.y}`;
  }, '');

  // Generate area fill path (optional gradient fill under line)
  const areaPath = pathData
    + ` L ${points[points.length - 1].x},${height}`
    + ` L ${points[0].x},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        {/* Gradient for area fill */}
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#sparkline-gradient-${color})`}
      />

      {/* Line path */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots at data points */}
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={strokeWidth * 1.5}
          fill={color}
          opacity="0.8"
        />
      ))}

      {/* Highlight last point */}
      {showDots && points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={strokeWidth * 2}
          fill={color}
          opacity="1"
        >
          <animate
            attributeName="r"
            values={`${strokeWidth * 2};${strokeWidth * 2.5};${strokeWidth * 2}`}
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  );
};

Sparkline.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.string,
  showDots: PropTypes.bool,
  strokeWidth: PropTypes.number,
  className: PropTypes.string
};

export default Sparkline;
