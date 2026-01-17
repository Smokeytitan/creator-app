# Design System — Polygon Creator Hub

## Direction

**Data & Analysis**
Chart-optimized interface with numbers-first approach. Designed for creator tools, metrics dashboards, and technical documentation.

### Foundation
- **Personality**: Professional, data-focused, accessible
- **Primary Color**: Polygon Purple (#6C2BD9 / rgb(108, 43, 217))
- **Accent Color**: Lighter Purple (#8247E5 / rgb(130, 71, 229))
- **Background**: White (light) / #0a0a0a (dark)
- **Depth Strategy**: Subtle borders + minimal shadows on hover

---

## Spacing Scale

**Base Unit**: 4px
**Scale**: 8, 12, 16, 24, 32, 48, 64, 80, 96, 128

### Usage
- **Section Padding**: 80px vertical (py-20), 24px horizontal (px-6)
- **Component Padding**: 24px (p-6) for cards, 32px (p-8) for featured content
- **Element Spacing**: 16px (mb-4) for text, 48px (mb-12) for sections
- **Grid Gaps**: 24px (gap-6) for card grids

---

## Typography

### Fonts
- **Sans**: Geist Sans (primary)
- **Mono**: Geist Mono (code blocks)

### Scale
- **Hero**: 60px / 3.75rem (text-6xl on md+, text-5xl on mobile)
- **Section Heading**: 30px / 1.875rem (text-3xl)
- **Card Heading**: 20px / 1.25rem (text-xl)
- **Subsection**: 18px / 1.125rem (text-lg)
- **Body**: 16px / 1rem (base)
- **Small**: 14px / 0.875rem (text-sm)
- **Micro**: 12px / 0.75rem (text-xs)

### Usage
- Headings: font-bold
- Body text: font-normal
- Labels: font-medium or font-semibold

---

## Color Tokens

### Brand
```
--brand-50: 245 240 255 (light tint)
--brand-100: 235 225 255
--brand-600: 130 71 229 (primary purple)
--brand-700: 108 43 217 (deep purple)
```

Dark mode overrides:
```
--brand-50: 34 22 52
--brand-100: 44 28 68
```

### Neutrals
- **50**: Subtle background tint (bg-neutral-50)
- **100**: Border light (border-neutral-100)
- **200**: Border emphasis (border-neutral-200)
- **300**: Disabled text (text-neutral-300)
- **400**: Supporting text (text-neutral-400)
- **500**: Icon color (text-neutral-500)
- **600**: Body text secondary (text-neutral-600)
- **700**: Body text emphasis (text-neutral-700)
- **950**: Dark surface (bg-neutral-950)

### Dark Mode
- Border: `border-white/10` or `border-white/15`
- Hover: `hover:bg-white/10`
- Surface: `bg-white/5`
- Text: `text-neutral-300` (secondary), `text-neutral-200` (primary)

---

## Border Radius

- **Small**: 8px (rounded-lg) — Buttons, inputs, small cards
- **Medium**: 12px (rounded-xl) — Default cards
- **Large**: 16px (var(--radius-xl)) — Feature cards
- **XL**: 20px (rounded-2xl / var(--radius-2xl)) — Hero cards, major sections
- **Full**: 999px (rounded-full) — Pills, avatar, circular buttons

---

## Depth & Shadows

### Strategy
Borders-first with minimal shadows

### Shadow Scale
- **None**: Default state (border only)
- **Hover**: `shadow-sm` on cards
- **Emphasis**: `shadow-md` on primary buttons

### Borders
- Light: `border border-neutral-100`
- Dark: `border border-white/10` or `border-white/15`
- Brand: `border border-[color:rgb(var(--brand-100))]`

### Backdrop Effects
- Secondary buttons: `backdrop-blur` with `bg-white/60` or `bg-white/5`

---

## Components

### Button Primary
- **Height**: 48px (py-3)
- **Padding**: 24px horizontal (px-6)
- **Border Radius**: 999px (rounded-full)
- **Background**: `bg-[color:rgb(var(--brand-700))]`
- **Hover**: `hover:bg-[color:rgb(var(--brand-600))]`
- **Shadow**: `shadow-md`
- **Text**: White, font-medium
- **Focus**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgb(var(--brand-600))]`

**Example**:
```tsx
<a className="rounded-full px-6 py-3 text-white bg-[color:rgb(var(--brand-700))] hover:bg-[color:rgb(var(--brand-600))] shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgb(var(--brand-600))]">
  Primary Action
</a>
```

### Button Secondary
- **Height**: 48px (py-3)
- **Padding**: 24px horizontal (px-6)
- **Border Radius**: 999px (rounded-full)
- **Border**: `border border-black/10 dark:border-white/15`
- **Background**: `bg-white/60 dark:bg-white/5`
- **Backdrop**: `backdrop-blur`
- **Hover**: `hover:border-black/20 dark:hover:border-white/25`

**Example**:
```tsx
<a className="rounded-full px-6 py-3 border border-black/10 dark:border-white/15 hover:border-black/20 dark:hover:border-white/25 bg-white/60 dark:bg-white/5 backdrop-blur">
  Secondary Action
</a>
```

### Button Icon
- **Size**: 40px (p-2)
- **Border Radius**: 8px (rounded-lg)
- **Hover**: `hover:bg-neutral-100 dark:hover:bg-white/10`

**Example**:
```tsx
<button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10">
  <Icon className="w-4 h-4" />
</button>
```

---

### Card Default
- **Border Radius**: 20px (rounded-2xl)
- **Padding**: 24px (p-6)
- **Background**: `bg-white dark:bg-neutral-950`
- **Border**: `border border-neutral-100 dark:border-white/10`
- **Hover**: `hover:shadow-sm transition-shadow`

**Example**:
```tsx
<div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-100 dark:border-white/10 hover:shadow-sm transition-shadow">
  Card Content
</div>
```

### Card Featured
- **Border Radius**: 20px (rounded-2xl)
- **Padding**: 32px (p-8)
- **Background**: `bg-[color:rgb(var(--brand-50))] dark:bg-white/5`
- **Text Alignment**: center

**Example**:
```tsx
<div className="bg-[color:rgb(var(--brand-50))] dark:bg-white/5 rounded-2xl p-8 text-center">
  Featured Content
</div>
```

### Card Metric
- **Border Radius**: 20px (rounded-2xl)
- **Padding**: 24px (p-6)
- **Background**: `bg-white`
- **Border**: `border border-neutral-100`
- **Hover**: `hover:shadow-sm transition-shadow`

**Structure**:
- Value: text-2xl font-bold
- Label: text-sm text-neutral-600
- Change: text-xs font-medium text-emerald-600

**Example**:
```tsx
<div className="bg-white rounded-2xl p-6 border border-neutral-100 hover:shadow-sm transition-shadow">
  <div className="text-2xl font-bold">5.3B+</div>
  <div className="text-sm text-neutral-600">Total Transactions</div>
  <div className="text-xs font-medium text-emerald-600">+287K today</div>
</div>
```

---

### Code Block
- **Border Radius**: 4px (rounded)
- **Padding**: 8px horizontal (px-2), 4px vertical (py-1)
- **Background**: `bg-neutral-50 dark:bg-white/5`
- **Border**: `border border-neutral-200 dark:border-white/10`
- **Text**: text-xs, mono font, `dark:text-neutral-200`

**Example**:
```tsx
<code className="text-xs bg-neutral-50 dark:bg-white/5 dark:text-neutral-200 px-2 py-1 rounded border border-neutral-200 dark:border-white/10">
  api.polygon.technology
</code>
```

---

### Section Container
- **Max Width**: 1152px (max-w-6xl)
- **Horizontal Padding**: 24px (px-6)
- **Vertical Padding**: 80px (py-20)
- **Margin**: Auto-centered (mx-auto)

**Example**:
```tsx
<section className="py-20 px-6">
  <div className="max-w-6xl mx-auto">
    {/* Section content */}
  </div>
</section>
```

---

### Gradient Text
- **Background**: `linear-gradient(90deg,rgba(var(--brand-600),1),rgba(var(--brand-700),1))`
- **Clip**: `bg-clip-text text-transparent`
- **Enhancement**: `drop-shadow-sm`

**Example**:
```tsx
<span className="bg-[linear-gradient(90deg,rgba(var(--brand-600),1),rgba(var(--brand-700),1))] bg-clip-text text-transparent drop-shadow-sm">
  Highlighted Text
</span>
```

---

## Accessibility

### Focus States
All interactive elements receive visible focus indicator:
```css
box-shadow: 0 0 0 2px color-mix(in oklab, rgb(var(--brand-600)), transparent 50%);
```

### Skip Links
- Position: `fixed top-2 left-2 z-[100]`
- Default: `sr-only` (screen reader only)
- Focus: `focus:not-sr-only`

### Reduced Motion
Respects `prefers-reduced-motion: reduce` by disabling all animations and transitions.

### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels on icon buttons
- Landmark elements (header, nav, main, section, footer)

---

## Grid Systems

### Card Grids
- **Mobile**: 1 column
- **Tablet**: 2 columns (md:grid-cols-2)
- **Desktop**: 4 columns (lg:grid-cols-4)
- **Gap**: 24px (gap-6)

**Example**:
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Cards */}
</div>
```

### Content Grids
- **Mobile**: 1 column
- **Desktop**: 2 columns (md:grid-cols-2)
- **Gap**: 24px (gap-6)

---

## Animation & Transitions

### Default Transitions
- **Duration**: 150ms (transition-shadow, transition-colors)
- **Easing**: Default ease

### Hover Effects
- Shadows: `transition-shadow`
- Colors: `transition-colors`
- Borders: Instant (no transition)

### Scroll Behavior
- Smooth scroll: `scroll-smooth` on html element
- Respects reduced motion preference

---

## Brand Assets

### Logos
- **Primary (Dark)**: `/Polygon_Primary_Dark.svg`
- **Icon (White/Purple)**: `/Polygon_Icon_White_Purple_Rn-1.svg`

### Preloading
Critical brand assets are preloaded in layout:
```html
<link rel="preload" as="image" href="/Polygon_Primary_Dark.svg" />
```

---

## Implementation Notes

### CSS Variables
Use the inline theme syntax for Tailwind:
```css
@theme inline {
  --color-brand-600: rgb(var(--brand-600));
}
```

### Color Usage
Prefer `[color:rgb(var(--brand-700))]` syntax for dynamic brand colors to ensure proper dark mode support.

### Dark Mode Strategy
- System preference: `prefers-color-scheme: dark`
- Manual override: `.dark` class on `<html>`
- Both approaches supported simultaneously

---

## Validation Rules

### Spacing
- All spacing values must be multiples of 4px
- Use scale: 8, 12, 16, 24, 32, 48, 64, 80, 96, 128
- Avoid arbitrary values like `py-5` or `px-7`

### Borders
- Always pair borders with appropriate dark mode variants
- Light: `border-neutral-100`
- Dark: `border-white/10` or `border-white/15`

### Buttons
- Minimum touch target: 44px (iOS) / 48px (Android)
- Always include focus-visible states
- Icon buttons need aria-label

### Cards
- Consistent border radius: 20px (rounded-2xl)
- Consistent padding: 24px (p-6) or 32px (p-8)
- Always include dark mode background variants

---

*Last updated: 2026-01-16*
