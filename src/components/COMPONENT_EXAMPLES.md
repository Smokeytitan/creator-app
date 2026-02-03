# Component Usage Examples

This file demonstrates how to use the new data visualization components.

## ConfidenceBadge

Shows data confidence level (measured, partial, or estimated).

```jsx
import ConfidenceBadge from './components/ConfidenceBadge';

// Green badge - all posts have actual metrics
<ConfidenceBadge confidence="measured" size="md" />

// Yellow badge - mix of actual and estimated data
<ConfidenceBadge confidence="partial" size="lg" />

// Gray badge - no actual data yet (default)
<ConfidenceBadge confidence="estimated" size="sm" />
```

**Props:**
- `confidence` (required): `'measured' | 'partial' | 'estimated'`
- `size` (optional): `'sm' | 'md' | 'lg'` (default: `'md'`)

**Visual Appearance:**
- `measured`: Green badge with pulsing dot
- `partial`: Yellow badge with pulsing dot
- `estimated`: Gray badge with pulsing dot

---

## EstimatedVsActual

Displays actual value vs estimated with delta percentage.

```jsx
import EstimatedVsActual from './components/EstimatedVsActual';

// Show currency values with delta
<EstimatedVsActual
  actual={5250.00}
  estimated={5000.00}
  label="Total Spend"
  format="currency"
  showIcon={true}
/>

// Show number values (impressions, engagement, etc.)
<EstimatedVsActual
  actual={125000}
  estimated={100000}
  label="Total Impressions"
  format="number"
/>

// Minimal display without label
<EstimatedVsActual
  actual={850}
  estimated={1000}
  format="currency"
  showIcon={false}
/>
```

**Props:**
- `actual` (required): Actual value (number)
- `estimated` (required): Estimated value (number)
- `label` (optional): Label to display above values (string)
- `format` (optional): `'number' | 'currency'` (default: `'number'`)
- `showIcon` (optional): Show trending icon in delta badge (boolean, default: `true`)

**Color Coding:**
- Green badge with trending up icon: Actual > Estimated
- Red badge with trending down icon: Actual < Estimated
- "on target" text: Within 0.01% of estimate

---

## Sparkline

Simple sparkline chart for showing trends.

```jsx
import Sparkline from './components/Sparkline';

// Basic sparkline
<Sparkline
  data={[10, 15, 12, 18, 22, 19, 25]}
  width={120}
  height={40}
  color="#D97706"
/>

// With dots at data points
<Sparkline
  data={[100, 150, 120, 180, 220]}
  width={150}
  height={50}
  color="#10B981"
  showDots={true}
  strokeWidth={3}
/>

// Custom styling with Tailwind class
<Sparkline
  data={campaignImpressions}
  width={200}
  height={60}
  color="var(--color-accent-primary)"
  className="opacity-80"
/>

// Empty data shows dashed line
<Sparkline data={[]} width={100} height={32} />
```

**Props:**
- `data` (required): Array of numbers (e.g., `[10, 20, 15, 30]`)
- `width` (optional): SVG width in pixels (default: `100`)
- `height` (optional): SVG height in pixels (default: `32`)
- `color` (optional): Line/dot color (default: `'#D97706'`)
- `showDots` (optional): Show dots at data points (boolean, default: `false`)
- `strokeWidth` (optional): Line thickness (default: `2`)
- `className` (optional): Additional CSS classes (string)

**Features:**
- Auto-scales data to fit height
- Gradient fill under line
- Animated pulsing on last dot (when `showDots` is true)
- Handles empty/invalid data gracefully

---

## Real-World Integration Examples

### Campaign Card with Confidence Badge
```jsx
<div className="card-editorial p-4">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-lg font-semibold">{campaign.title}</h3>
    <ConfidenceBadge
      confidence={campaign.posts?.length > 0 ? 'measured' : 'estimated'}
      size="sm"
    />
  </div>

  <EstimatedVsActual
    actual={campaign.actualCost || 0}
    estimated={campaign.estimatedCost}
    label="Campaign Spend"
    format="currency"
  />
</div>
```

### Analytics Dashboard with Trend
```jsx
<div className="grid grid-cols-2 gap-4">
  <div className="card-editorial p-4">
    <div className="metric-label">Impressions Trend</div>
    <div className="flex items-end justify-between gap-4">
      <EstimatedVsActual
        actual={totalImpressions}
        estimated={estimatedImpressions}
        format="number"
      />
      <Sparkline
        data={last7DaysImpressions}
        width={100}
        height={40}
        color="#10B981"
        showDots={true}
      />
    </div>
  </div>
</div>
```

### Creator Roster Row
```jsx
<tr>
  <td>{creator.name}</td>
  <td>
    <ConfidenceBadge
      confidence={getConfidence(creator)}
      size="sm"
    />
  </td>
  <td>
    <Sparkline
      data={creator.posts.map(p => p.impressions)}
      width={80}
      height={24}
      color="var(--color-accent-primary)"
    />
  </td>
</tr>
```

---

## Helper Functions

### Calculate Confidence Level
```javascript
/**
 * Determine confidence level based on available data
 */
function getConfidence(campaign) {
  const { posts = [], estimatedPosts = 0 } = campaign;

  if (posts.length === 0) {
    return 'estimated'; // No actual data
  }

  if (posts.length < estimatedPosts) {
    return 'partial'; // Some data missing
  }

  return 'measured'; // All data available
}
```

### Extract Trend Data
```javascript
/**
 * Extract numeric trend from campaign posts
 */
function getCampaignTrend(campaign, metric = 'impressions') {
  return (campaign.posts || [])
    .map(post => Number(post[metric]) || 0)
    .filter(n => !isNaN(n));
}
```

---

## Design Tokens Used

All components use the app's CSS custom properties:

```css
--color-bg-secondary: #141414
--color-bg-tertiary: #1A1A1A
--color-border: rgba(217, 119, 6, 0.1)
--color-border-hover: rgba(217, 119, 6, 0.2)
--color-accent-primary: #D97706
--color-text-primary: #F5F5F5
--color-text-secondary: #A3A3A3
--color-text-tertiary: #737373
```

**Semantic Colors:**
- Green: `#10B981` (positive, over-performance)
- Red: `#EF4444` (negative, under-performance)
- Yellow: `#F59E0B` (warning, partial data)
- Gray: `#737373` (neutral, estimated)

---

## Accessibility Notes

- All badges include `title` attributes with descriptions
- Color is not the only indicator (icons and text provide context)
- Components are keyboard-navigable when interactive
- Proper contrast ratios maintained for text
