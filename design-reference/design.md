# Design System: PolyCharts Analytics Platform

This design system defines the visual language for PolyCharts—an internal Polygon visualization system for producing **dashboard-quality analytics and data visualizations** for marketing, executive reporting, and social media.

**Reference Dashboard**: `design-reference/dashboard-viewport.png`

---

## Design Philosophy

PolyCharts outputs should be:
- **Modern & sophisticated** — dark theme first, with clean lines and premium feel
- **Data-forward** — clarity and legibility over decoration
- **Professionally branded** — Polygon purple as signature accent, balanced with neutral UI tones
- **Dashboard-grade** — modular cards, consistent spacing, production-ready quality
- **Social-ready** — designed to look sharp at small sizes and across platforms

This is not a general charting library—it's a curated design system for Polygon's data storytelling.

---

## Theme Variants

### Dark Theme (Primary)
Modern analytics dashboards use dark themes for sophistication and reduced eye strain. This is our default.

**Usage**: Default for all outputs unless explicitly requesting light theme

### Light Theme (Alternative)
Available for contexts requiring light backgrounds (print, certain marketing materials).

**Usage**: Opt-in via theme parameter

---

## Color System

### Semantic Color Tokens (Dark Theme)

#### Backgrounds
- **background-primary**: `#0F0F0F` — main canvas background
- **background-secondary**: `#1A1A1A` — elevated surfaces (modals, dropdowns)
- **background-card**: `#1F1F1F` — card/tile backgrounds
- **background-card-hover**: `#262626` — interactive card hover state
- **background-input**: `#171717` — form inputs

#### Borders
- **border-primary**: `#2A2A2A` — default card borders
- **border-secondary**: `#3A3A3A` — elevated/hover borders
- **border-subtle**: `#1F1F1F` — very subtle dividers

#### Text
- **text-primary**: `#FFFFFF` — headings, important numbers
- **text-secondary**: `#A1A1AA` — body text, descriptions, labels
- **text-tertiary**: `#71717A` — subtle text, timestamps, metadata
- **text-disabled**: `#52525B` — disabled states

#### Brand & Accents
- **brand-purple**: `#8247E5` — Polygon signature color (primary data series, key highlights)
- **accent-warm**: `#F59E0B` — CTAs, positive trends, interactive elements
- **accent-cool**: `#06B6D4` — secondary highlights, informational badges
- **accent-blue**: `#3B82F6` — alternative data series
- **accent-green**: `#10B981` — success, growth indicators
- **accent-red**: `#EF4444` — alerts, negative trends

#### Chart Colors (Multi-Series)
When displaying multiple data series:
1. **Primary series**: `brand-purple` (#8247E5)
2. **Secondary series**: `accent-cool` (#06B6D4)
3. **Tertiary series**: `accent-warm` (#F59E0B)
4. **Fourth series**: `accent-blue` (#3B82F6)

**Rule**: Never use more than 4 distinct colors per chart. Prefer 1-2 colors for clarity.

---

### Semantic Color Tokens (Light Theme)

#### Backgrounds
- **background-primary**: `#FFFFFF`
- **background-secondary**: `#F9FAFB`
- **background-card**: `#FFFFFF`
- **background-card-hover**: `#F3F4F6`
- **background-input**: `#F9FAFB`

#### Borders
- **border-primary**: `#E5E7EB`
- **border-secondary**: `#D1D5DB`
- **border-subtle**: `#F3F4F6`

#### Text
- **text-primary**: `#111827`
- **text-secondary**: `#6B7280`
- **text-tertiary**: `#9CA3AF`
- **text-disabled**: `#D1D5DB`

#### Brand & Accents
Colors remain the same as dark theme, with adjusted opacity/usage as needed for contrast.

---

## Typography System

### Font Family
- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Fallback**: System sans-serif stack
- **Monospace** (for code/data): `'JetBrains Mono', 'Fira Code', Consolas, monospace`

### Type Scale

#### Display (Large Metrics)
- **display-xl**: 64px / Bold / 1.0 line-height — hero numbers on landing cards
- **display-lg**: 48px / Bold / 1.1 line-height — primary metric displays
- **display-md**: 40px / Bold / 1.2 line-height — stat cards

#### Headings
- **h1**: 32px / Bold / 1.2 line-height — page titles
- **h2**: 24px / Semibold / 1.3 line-height — section headers
- **h3**: 20px / Semibold / 1.4 line-height — card titles
- **h4**: 18px / Medium / 1.4 line-height — subsection titles

#### Body
- **body-lg**: 16px / Regular / 1.6 line-height — primary descriptions
- **body**: 14px / Regular / 1.5 line-height — standard text
- **body-sm**: 13px / Regular / 1.5 line-height — captions, footnotes

#### Chart-Specific
- **chart-title**: 20px / Semibold / text-primary
- **chart-label**: 14px / Medium / text-secondary
- **axis-label**: 13px / Regular / text-tertiary
- **tick-label**: 12px / Regular / text-tertiary
- **legend-label**: 14px / Medium / text-secondary
- **tooltip**: 14px / Regular / text-primary (on dark background)

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

---

## Spacing System

Use multiples of 4px for consistency. Common tokens:

- **spacing-1**: `4px`
- **spacing-2**: `8px`
- **spacing-3**: `12px`
- **spacing-4**: `16px`
- **spacing-5**: `20px`
- **spacing-6**: `24px`
- **spacing-8**: `32px`
- **spacing-10**: `40px`
- **spacing-12**: `48px`
- **spacing-16**: `64px`

### Application
- **Card padding**: 24px (spacing-6)
- **Card gap** (between cards): 20px (spacing-5)
- **Section spacing**: 32px (spacing-8)
- **Chart internal padding**: 16px (spacing-4)
- **Stat card padding**: 20px (spacing-5)

---

## Layout Grid

### Dashboard Grid System
- **Container max-width**: 1400px (centered)
- **Stat card row**: 4 columns (equal width)
- **Chart grid**: 2 columns (equal width)
- **Gap between columns**: 20px (spacing-5)
- **Gap between rows**: 20px (spacing-5)

### Responsive Breakpoints
- **Desktop**: 1280px+ → 4-col stats, 2-col charts
- **Tablet**: 768px - 1279px → 2-col stats, 1-col charts
- **Mobile**: <768px → 1-col stats, 1-col charts

### Export Sizes (Social Media)
- **Square**: 1080×1080px (Instagram, Twitter square)
- **Landscape**: 1200×675px (Twitter, LinkedIn)
- **Story**: 1080×1920px (Instagram Stories, TikTok)

---

## Component Library

### Stat Card

**Anatomy**:
```
┌─────────────────────────────────┐
│ [Icon] Label (text-secondary)   │
│                                  │
│ 123,456 (display-md, text-prim) │
│                                  │
│ ↑ 12.5% vs last period (accent) │
└─────────────────────────────────┘
```

**Specs**:
- Background: `background-card`
- Border: `1px solid border-primary`
- Border radius: `12px`
- Padding: `20px` (spacing-5)
- Min height: `140px`

**Elements**:
- Icon: 20×20px, `accent-warm` or `accent-cool`
- Label: `body` size, `text-secondary`
- Value: `display-md`, `text-primary`, Bold
- Trend: `body-sm`, colored by direction (green up, red down)

---

### Chart Card

**Anatomy**:
```
┌────────────────────────────────────────┐
│ Chart Title (h3)              [Icon]   │
│ Subtitle/description (body-sm)         │
│                                         │
│ ╔═══════════════════════════╗          │
│ ║   [Chart Area]            ║          │
│ ║                           ║          │
│ ╚═══════════════════════════╝          │
│                                         │
│ Source: Dune • As of 2026-01-18        │
└────────────────────────────────────────┘
```

**Specs**:
- Background: `background-card`
- Border: `1px solid border-primary`
- Border radius: `12px`
- Padding: `24px` (spacing-6)
- Min height: `400px`

**Header**:
- Title: `h3`, `text-primary`
- Icon: 20×20px, `accent-cool`
- Description: `body-sm`, `text-secondary`, margin-top 4px

**Chart Area**:
- Margin-top from header: `16px` (spacing-4)
- Internal padding: maintain breathing room
- Gridlines: `border-subtle`, 1px, dashed or solid at low opacity

**Footer**:
- Attribution: `body-sm`, `text-tertiary`
- Margin-top: `16px` (spacing-4)

---

### Empty State

**Pattern**:
```
Center-aligned text:
"No data available"
(text-tertiary, body)
```

**Specs**:
- Display: Centered within chart area
- Text: `body`, `text-tertiary`
- Icon (optional): 32×32px icon above text, same color
- Spacing: 12px between icon and text

---

### Loading State

**Pattern**:
- Skeleton loaders matching component structure
- Animated shimmer effect
- Background: `background-card-hover`
- Animation: subtle gradient sweep

---

## Chart Visual Specifications

### Line Charts
- **Line width**: 2.5px
- **Line color**: `brand-purple` (primary), `accent-cool` (secondary)
- **Point markers**: 6px diameter circles (optional, use sparingly)
- **Area fill** (if used): 10% opacity gradient from line color to transparent
- **Grid**: Horizontal only, `border-subtle`, every major tick

### Bar Charts
- **Bar color**: `brand-purple`
- **Bar border radius**: 4px (top corners only)
- **Bar spacing**: 20% of bar width
- **Grid**: Horizontal only, behind bars

### Pie/Donut Charts
- **Slice colors**: Use chart colors 1-4 in order
- **Stroke**: 2px white (dark theme) or black (light theme) between slices
- **Label placement**: Outside with leader lines, or inside if space permits
- **Donut hole**: 60% of radius

### Area Charts
- **Area fill**: 20% opacity of line color
- **Stacking**: If multiple series, use additive stacking
- **Grid**: Same as line charts

---

## Accessibility & Contrast

### Contrast Ratios (WCAG AA)
- **Text-primary on background-primary**: 15:1 (dark), 14:1 (light)
- **Text-secondary on background-primary**: 7:1 (dark), 6:1 (light)
- **Text-tertiary on background-primary**: 4.5:1 minimum

### Color-Blind Safe Palettes
For critical charts, ensure dual encoding:
- **Color + shape** (different markers for each series)
- **Color + pattern** (hatching, dots, stripes)
- Avoid red/green as sole differentiators

### Interactive States
- **Hover**: Increase border to `border-secondary`, background to `background-card-hover`
- **Focus**: 2px outline in `accent-warm` with 2px offset
- **Active/Selected**: Border color to `brand-purple`

---

## Icons & Imagery

### Icon System
- **Style**: Outlined, consistent 2px stroke width
- **Sizes**: 16px, 20px, 24px
- **Color**: Inherit from text or use accent colors
- **Library**: Lucide Icons or Heroicons recommended

### Icon Usage
- **Stat cards**: 20px icon, top-left or inline with label
- **Chart headers**: 20px icon, right-aligned or inline with title
- **Buttons/CTAs**: 16px icon, left or right of text

### Polygon Logo
- **Placement**: Bottom-right corner of export images
- **Size**: 80×24px (landscape), 60×18px (square)
- **Color**: `brand-purple` or white depending on background
- **Margin**: 16px from edges

---

## Branding & Attribution

Every exported chart MUST include:

### Required Elements
1. **Title**: Clear metric name (h3, top of card)
2. **Source attribution**: "Source: Dune Analytics" (footer, text-tertiary)
3. **Query link**: Hyperlink to Dune dashboard/query (if digital) or URL in print
4. **Timestamp**: "As of YYYY-MM-DD" (footer, text-tertiary)
5. **Polygon logo**: Small wordmark or icon (bottom-right)

### Footer Format
```
Source: Dune Analytics • As of 2026-01-18 • polygon.technology
```

### Margin & Positioning
- Footer: 16px margin from bottom edge
- Logo: 16px margin from bottom-right corner
- Attribution text: Left-aligned or center-aligned within card

---

## Export Requirements

### Image Formats
- **PNG**: Required, 2x resolution for retina (e.g., 2160×2160 for 1080×1080)
- **SVG**: Optional, for scalability and web use
- **Metadata JSON**: Include chart config, data snapshot, timestamp

### Quality Standards
- **PNG compression**: Optimize with pngquant or similar (target <500KB)
- **Font embedding**: Ensure Inter is embedded or converted to outlines in SVG
- **Color profile**: sRGB for consistency across platforms

### File Naming
```
[metric-name]_[size]_[theme]_[date].png

Examples:
fees_daily_1080_dark_2026-01-18.png
gas_used_1200x675_light_2026-01-18.png
```

---

## Visual Design Checklist

Before finalizing any output, verify:

- [ ] Dark theme applied (or light if explicitly requested)
- [ ] Brand purple used for primary data series
- [ ] Typography scale followed (no arbitrary font sizes)
- [ ] Spacing tokens used (multiples of 4px)
- [ ] Card border radius is 12px
- [ ] Chart has clear title and description
- [ ] Attribution footer included with source + timestamp
- [ ] Polygon logo present in export images
- [ ] Contrast ratios meet WCAG AA standards
- [ ] Empty states handled gracefully
- [ ] Grid/axes are subtle, not overpowering
- [ ] Colors are semantically appropriate (green for growth, red for decline)
- [ ] Export size matches target platform (1080×1080, etc.)

---

## Implementation Notes

### Rendering Pipeline
1. Fetch data → normalize → cache
2. Select theme (dark default)
3. Apply color tokens from this system
4. Render SVG using component specs
5. Convert to PNG at 2x resolution
6. Add attribution footer and logo
7. Optimize and export

### Theme Switching
Both dark and light themes use the same semantic tokens—only the hex values change. Implement theme as a single variable swap, not per-component overrides.

### Component Reusability
Build charts from composable primitives:
- `StatCard` component
- `ChartCard` wrapper
- `EmptyState` fallback
- `ChartFooter` attribution

---

## References

**Visual inspiration**:
- `design-reference/dashboard-viewport.png` — Modern analytics dashboard (primary reference)
- `design-reference/dashboard-snapshot.png` — Full page context

**Design principles**:
- Polygon Technology brand guidelines
- Modern SaaS dashboard patterns (Linear, Vercel, Stripe analytics)
- Data visualization best practices (Edward Tufte, Stephen Few)

---

## Version History
- **v2.0** (2026-01-18): Complete redesign based on modern analytics dashboard reference; added dark theme, component system, semantic tokens
- **v1.0** (Initial): Polygon brand colors and basic chart guidelines
