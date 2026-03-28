# Design System -- Smart Trader Frontend

> **Owner:** Espresso (Design Guardian)
> **Last Updated:** 2026-03-28
> **Version:** 2.0.0 -- Glassmorphism Dark Theme

---

## 1. Design Philosophy & Principles

### Core Philosophy
Smart Trader is a **mobile-first glassmorphism dark trading dashboard** -- designed for traders who glance at their phone to check market status. Every pixel serves a purpose: data clarity, fast scanning, and visual hierarchy that lets you read the most important number in under 1 second.

### Design Principles
1. **True Glassmorphism** -- Semi-transparent surfaces with backdrop-filter blur over ambient gradient mesh background. Glass creates depth and hierarchy.
2. **Numbers First** -- Financial data gets monospace font, high contrast, large size
3. **Color = Meaning** -- Green is bullish/profit, Red is bearish/loss, Grey is neutral. No decorative colors.
4. **Mobile-First** -- 375px viewport is the primary design target. Desktop is a bonus.
5. **Layered Depth** -- 3-tier glass system creates clear visual hierarchy without solid backgrounds
6. **Consistency Over Creativity** -- Every component follows the system. No one-off designs.
7. **Ambient Light** -- Subtle glow effects on interactive and semantic elements reinforce meaning

### Target Users
- Thai retail traders checking signals on mobile
- Quick glance usage (5-15 seconds per session)
- Low-light environments (dark mode essential)

---

## 2. Color System

### 2.1 Theme Colors (from nuxt.config.ts)

| Token | Hex | Vuetify Variable | Usage |
|-------|-----|------------------|-------|
| **primary** | `#4ADE80` | `color="primary"` | Primary CTA, active states, bullish indicators, profit |
| **secondary** | `#1E88E5` | `color="secondary"` | Links, informational highlights |
| **accent** | `#FFD54F` | `color="accent"` | Star ratings, watchlist, special highlights |
| **background** | `#060A13` | `bg-color="background"` | App background (deep space navy) |
| **surface** | `#0A0F1C` | `bg-color="surface"` | Bottom nav base, standard surfaces |

### 2.2 Semantic Colors

| Token | Hex | Vuetify Variable | Usage |
|-------|-----|------------------|-------|
| **success** | `#4CAF50` | `color="success"` | Bullish trend, validation pass, UP direction |
| **error** | `#FF5252` | `color="error"` | Bearish trend, validation fail, DOWN direction, loss |
| **warning** | `#FB8C00` | `color="warning"` | Caution states, moderate consensus, WAIT signal |
| **info** | `#2196F3` | `color="info"` | Informational chips, secondary stats, strong consensus |

### 2.3 Glass Surface System (replaces Solid Surfaces)

All surfaces use **semi-transparent white** over the ambient gradient background. No solid opaque backgrounds.

| Tier | Name | Background | Backdrop-Filter | Border | Usage |
|------|------|-----------|-----------------|--------|-------|
| BG | Ambient Mesh | `#060A13` + gradient orbs | -- | -- | Full-page background |
| 1 | Glass Card | `rgba(255,255,255,0.03)` | `blur(20px) saturate(1.2)` | `1px solid rgba(255,255,255,0.08)` | Outer cards (portfolio, trade cards, filter cards) |
| 2 | Glass Inner | `rgba(255,255,255,0.04)` | `blur(12px)` | `1px solid rgba(255,255,255,0.06)` | Hero cards, nested panels |
| 3 | Glass Surface | `rgba(255,255,255,0.03)` | none (performance) | `1px solid rgba(255,255,255,0.05)` | Stat cells, badges, small surfaces |

**Inset highlight:** All Tier 1 & 2 have `inset 0 1px 0 rgba(255,255,255,0.04)` for top-edge light catch.

**Card Shadows:**

| Level | Value | Usage |
|-------|-------|-------|
| Standard | `0 4px 24px rgba(0,0,0,0.3)` | Tier 1 cards |
| Heavy | `0 8px 32px rgba(0,0,0,0.35)` | Portfolio card |
| Hover | `0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(74,222,128,0.06)` | Card hover state |

### 2.4 Ambient Background Mesh

Three gradient orbs floating behind glass surfaces:

| Orb | Color | Size | Position | Animation |
|-----|-------|------|----------|-----------|
| Primary | `rgba(74,222,128,0.08)` emerald | 600px | Top-left | 25s drift |
| Secondary | `rgba(30,136,229,0.06)` blue | 500px | Bottom-right | 30s drift |
| Tertiary | `rgba(139,92,246,0.04)` violet | 450px | Center | 35s drift |

### 2.5 Text Colors

| Name | Value | Usage |
|------|-------|-------|
| Primary text | `rgba(226,232,240,0.95)` | Main content, numbers, titles |
| Label muted | `rgba(148,163,184,0.7)` | Section headers, subtitles |
| Secondary | `rgba(148,163,184,0.5)` | Timestamps, metadata, stat labels |
| Tertiary | `rgba(148,163,184,0.4)` | Dates, least-important info |
| Disabled | `rgba(100,116,139,0.3)` | Non-interactive elements |

### 2.6 Color Mapping Rules (Trading Specific)

| Concept | Color | Notes |
|---------|-------|-------|
| Profit / Bullish / UP / BUY | `success` (green) | Always green for positive |
| Loss / Bearish / DOWN / SELL | `error` (red) | Always red for negative |
| Neutral / WAIT / Sideways | `grey` or `warning` | Grey for neutral, warning for caution |
| Active/Live indicator | `success` (small dot + glow) | WebSocket connected status |
| Offline indicator | `grey` | WebSocket disconnected |

**Rule:** No decorative colors outside this palette. Every color must carry semantic meaning.

---

## 3. Typography

### 3.1 Font Families

| Font | CSS Class | Usage |
|------|-----------|-------|
| **Noto Sans Thai** | Default (global.css forces it) | All text: labels, titles, descriptions, Thai text |
| **JetBrains Mono** | `.font-mono` | All numbers: prices, percentages, pips, scores, R:R ratios |

### 3.2 Font Loading
- Google Fonts via `<link>` in `nuxt.config.ts app.head`
- JetBrains Mono: weights 400, 500, 600, 700
- Noto Sans Thai: weights 300, 400, 500, 600, 700

### 3.3 Typography Hierarchy (used in production)

| Level | Vuetify Class | Weight | Usage Example |
|-------|---------------|--------|---------------|
| Page title | `text-h5` | `font-weight-bold` | "Smart Trader" on index |
| Card title / Symbol name | `text-h6` | `font-weight-bold` | Symbol name, price display |
| Section label | `text-caption` | `font-weight-bold text-uppercase` | "UPTREND STRENGTH", "ENTRY" |
| Body text | `text-body-2` | normal | Analysis summary, descriptions |
| Small label | `text-caption` | `font-weight-medium` | Timestamps, "updated ago" |
| Tiny label | `text-caption` | normal + `text-medium-emphasis` | Footer, disclaimers |

### 3.4 Monospace Number Styling
```css
.font-mono {
  font-family: 'JetBrains Mono', 'Noto Sans Thai', monospace !important;
  letter-spacing: -0.02em;
}
```
Applied to: prices, percentages, scores, pips, R:R ratios, confidence numbers.

---

## 4. Spacing & Grid System

### 4.1 Base Unit
- **4px base grid** (Vuetify default: 1 spacing unit = 4px)
- All spacing uses Vuetify spacing classes: `pa-1` (4px), `pa-2` (8px), `pa-3` (12px), `pa-4` (16px), etc.

### 4.2 Common Spacing Patterns (from production code)

| Pattern | Value | Vuetify Class | Where Used |
|---------|-------|---------------|------------|
| Page horizontal padding (mobile) | 12px | `pa-3` | `v-container.page-container` |
| Page horizontal padding (sm+) | 16px | `pa-sm-4` | `v-container` responsive |
| Card internal padding | 12-16px | `v-card-text` default or `pa-4` | All cards |
| Section gap (between cards) | 12px | `mb-3` | Card stack |
| Row internal gap | 12px | `mb-3` | Within card sections |
| Chip gap | 4px | `ga-1` | Chip groups |
| Item gap | 8px | `ga-2` | Flex item groups |
| General gap | 12px | `ga-3` | Header layout |
| Divider margin | 16px bottom | `mb-4` on divider | Section separators |
| Page container max-width | 800px | `.page-container` | All pages |
| Page container top padding | 16px (1rem) | `.page-container` | All pages |

### 4.3 Grid System
- `v-container fluid` with `.page-container` (max-width: 800px, centered)
- `v-row dense` for tight grid layouts
- `v-col` with `cols` prop for column layouts
- No sidebar -- single column mobile layout with bottom navigation

---

## 5. Layout Patterns

### 5.1 App Shell
```
+---------------------------+
| [Background Mesh]         |  <- Fixed, z-index: 0, gradient orbs
|                           |
|     <NuxtPage />          |  <- v-main with pb-130px, z-index: 1
|     (max-width: 800px)    |
|     (centered)            |
|                           |
+---------------------------+
| [Frosted Glass Nav]       |  <- Fixed bottom, backdrop-filter blur(24px)
| [Dashboard][History][Perf]|
+---------------------------+
```

### 5.2 Standard Page Layout
```
v-container.fluid.page-container.pa-3.pa-sm-4
  +-- Header row (d-flex align-center ga-3 mb-5 mt-1)
  |   +-- .page-header-icon (44x44 glass with green glow, rounded-12px)
  |   |   +-- v-icon size="22" color="#4ADE80"
  |   +-- .flex-grow-1
  |   |   +-- Title (text-h5 font-weight-bold)
  |   |   +-- Subtitle (text-caption text-label-muted mt-1)
  |   +-- .refresh-btn (glass button)
  +-- .page-header-divider.mb-5 (gradient line)
  +-- Content (component slot)
  +-- Footer (text-center, disclaimer text)
```

**Header Icon (Glassmorphism):**
- Background: `rgba(74,222,128,0.15)` (green-tinted glass)
- Border: `1px solid rgba(74,222,128,0.2)`
- Glow: `0 0 20px rgba(74,222,128,0.15), 0 0 40px rgba(74,222,128,0.05)`
- Icon color: `#4ADE80` (not dark on solid -- green on glass)

**Header Divider (Gradient):**
- Linear gradient: transparent -> green -> transparent

### 5.3 Card Stack Pattern (Primary mobile layout)
- Cards stacked vertically with `mb-3` gap
- Each card: `.dark-card` class (Tier 1 glass)
- Card content via padding classes

### 5.4 Responsive Behavior
- **Mobile (< 600px):** Single column, `pa-3`, full-width cards
- **sm+ (>= 600px):** `pa-sm-4`, same single column (800px max)
- **No multi-column layout** -- mobile-first single column throughout

---

## 6. Component Catalog

### 6.1 Cards

| Variant | Classes/CSS | Usage |
|---------|-------------|-------|
| Dark Card (Tier 1) | `.dark-card` | Primary card (trade cards, filter cards, stat cards) |
| Portfolio Card (Tier 1+) | `.portfolio-card` | Portfolio overview (heavier shadow, 24px radius) |
| Hero Card (Tier 2) | `.hero-card` | Inner featured content (Total Pips hero) |
| Glass Card (Vuetify) | `v-card.glass-card` | Legacy/Vuetify-wrapped cards |
| Glass Sheet (Tier 3) | `.glass-sheet` | Inner nested surfaces |
| Stat Cell (Tier 3) | `.stat-cell` | Individual stat display in grid |
| Stat Mini Cell (Tier 3) | `.stat-mini-cell` | Compact stat in Performance |

### 6.2 Chips & Badges

| Variant | Style | Usage |
|---------|-------|-------|
| Direction badge (BUY) | Green tonal: `rgba(16,185,129,0.1)` bg + green text + green border | BUY trades |
| Direction badge (SELL) | Red tonal: `rgba(239,68,68,0.1)` bg + red text + red border | SELL trades |
| Exit badge (TP) | Green tonal | Take Profit exit |
| Exit badge (SL) | Red tonal | Stop Loss exit |
| Exit badge (Signal) | Blue tonal | Signal Exit |
| Exit badge (Manual) | Orange tonal | Manual exit |
| Filter pill | Glass: `rgba(255,255,255,0.04)` bg | Inactive filter |
| Filter pill (active) | Green glass: `rgba(74,222,128,0.15)` bg + green border + glow | Active filter |
| Count badge | Blue glass: `rgba(59,130,246,0.1)` + border | Position count |
| Extra filter badge | Green glass | Active filter count indicator |

### 6.3 Buttons

| Variant | Style | Usage |
|---------|-------|-------|
| Refresh button | Glass: `rgba(255,255,255,0.04)` bg + border | Page header refresh |
| Nav arrow button | Glass + hover | Month navigator arrows |
| Sort button | Transparent + hover | Sort toggle |
| More filters button | Transparent text | Expand/collapse filters |
| Text action | `v-btn variant="text" size="small"` | Retry, inline actions |
| Bottom nav btn | `NuxtLink` with glass nav | Navigation items |

### 6.4 Progress Indicators

| Variant | Props | Usage |
|---------|-------|-------|
| Win Rate bar | `v-progress-linear color="success" bg-color="rgba(255,255,255,0.04)" height="6"` + glow | Win rate display |
| Bar chart fill (positive) | `rgba(16,185,129,0.8)` + green glow shadow | Monthly P&L bars |
| Bar chart fill (negative) | `rgba(239,68,68,0.8)` + red glow shadow | Monthly P&L bars (loss) |
| Loading spinner | `v-progress-circular indeterminate color="primary"` | Loading states |

### 6.5 Navigation

| Component | Details |
|-----------|---------|
| Bottom Navigation | Frosted glass: `rgba(6,10,19,0.7)` + `blur(24px)` |
| Active state | Green color + glow dot behind icon + drop-shadow on icon |
| Dividers | `rgba(255,255,255,0.04)` vertical lines |
| Home indicator | `rgba(255,255,255,0.1)` pill |

### 6.6 Empty / Error / Loading States

| State | Pattern |
|-------|---------|
| **Loading** | Skeleton loaders inside glass cards |
| **Error** | `v-alert type="error" variant="tonal"` with retry button |
| **Empty** | Large mdi icon (size 48) + descriptive text, centered |

---

## 7. Interactive States

| State | Behavior |
|-------|----------|
| **Hover (glass card)** | Border brightens to `rgba(255,255,255,0.12)`, shadow deepens |
| **Hover (stat cell)** | Background brightens to `rgba(255,255,255,0.05)` |
| **Hover (filter pill)** | Border to green, background brightens |
| **Active filter** | Green glass bg + green border + outer glow |
| **Active month row** | Green border + green glow shadow |
| **Active nav item** | Green text + glow dot + icon drop-shadow |
| **Focus** | Default Vuetify focus ring |
| **Disabled** | Reduced opacity (0.3) |
| **Transition** | 200-300ms ease on border-color, box-shadow, background |

---

## 8. Elevation & Shadows

| Level | Value | Usage |
|-------|-------|-------|
| Tier 1 card | `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)` | Standard glass cards |
| Portfolio card | `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)` | Portfolio overview |
| Hover | `+ 0 0 24px rgba(74,222,128,0.06)` added | Card hover glow |
| Bottom nav | `0 -4px 32px rgba(0,0,0,0.4)` | Frosted nav shadow |
| Header icon | `0 0 20px rgba(74,222,128,0.15), 0 0 40px rgba(74,222,128,0.05)` | Green glow |
| Bar fill glow | `0 0 8px rgba(color,0.3)` | Chart bars (green/red) |
| Active accent | `0 0 12px rgba(74,222,128,0.08)` | Selected month, active states |

---

## 9. Border & Border Radius

### 9.1 Border Radius Scale

| Value | Usage |
|-------|-------|
| `3-4px` | Direction badges, small badges, sl-type badge |
| `5px` | Exit badges |
| `6px` | Time badge, TF badge, nav-arrow-btn, count badge |
| `8px` | Price box, refresh button |
| `12px` | Stat cells, page-header-icon, position cards |
| `16px` | Dark cards, hero card |
| `24px` | Portfolio card |
| `9999px` | Filter pills, extra-filter badge, home indicator |

### 9.2 Border Styles (Glassmorphism)

| Style | Usage |
|-------|-------|
| `1px solid rgba(255,255,255,0.08)` | Tier 1 cards, primary borders |
| `1px solid rgba(255,255,255,0.06)` | Tier 2 inner cards, secondary borders |
| `1px solid rgba(255,255,255,0.05)` | Tier 3 surfaces, stat cells |
| `1px solid rgba(255,255,255,0.04)` | Subtle elements (nav dividers, time badges) |
| `1px solid rgba(74,222,128,0.2)` | Header icon, active green border |
| `1px solid rgba(74,222,128,0.3)` | Active filter pill, active month row |
| `1px solid rgba(16,185,129,0.2)` | BUY direction badge |
| `1px solid rgba(239,68,68,0.2)` | SELL direction badge |

---

## 10. Responsive Design

### Breakpoints (Vuetify defaults)
| Name | Width | Behavior |
|------|-------|----------|
| xs | < 600px | Primary target. `pa-3`. Single column. |
| sm | >= 600px | `pa-sm-4`. Same layout. |
| md | >= 960px | Same layout (800px max-width container) |
| lg+ | >= 1280px | Same layout. Centered in viewport. |

### Touch Targets
- Minimum interactive size: Vuetify defaults (48px for buttons)
- Bottom nav items: full-width with flex: 1
- Filter pills: adequate padding for touch

---

## 11. Accessibility Standards

- WCAG AA target
- Vuetify built-in aria attributes on components
- `NuxtRouteAnnouncer` for route change announcements
- Color alone never conveys meaning -- always paired with text/icons
- Semantic heading hierarchy maintained
- Text on glass maintains sufficient contrast (white text on dark semi-transparent)

---

## 12. Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Background mesh | 0 | `.app-bg-mesh` (fixed, full viewport) |
| Page content | 1 | `.page-container` (relative) |
| Bottom navigation | 1000 | `.bottom-nav` (fixed) |
| Tooltips | 100 | Price tooltip |
| Vuetify overlays | Vuetify default | Dialogs, menus |

---

## 13. Motion & Animation

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Card hover | 250-300ms | ease | Glass card border/shadow transition |
| Stat cell hover | 200ms | ease | Background brightness shift |
| Filter pill | 200ms | ease | Background, border, shadow transition |
| Orb drift 1 | 25s | ease-in-out infinite | Primary emerald orb |
| Orb drift 2 | 30s | ease-in-out infinite | Secondary blue orb |
| Orb drift 3 | 35s | ease-in-out infinite | Tertiary violet orb |
| Refresh spin | 700ms | linear infinite | Spinning refresh icon |
| Flash pulse | 600ms | ease-in-out infinite | Loading flash icon |
| Ping dot | 1.5s | cubic-bezier(0,0,0.2,1) infinite | Live status indicator |
| Tooltip fade | 150-200ms | ease | Price tooltip enter/leave |

---

## 14. Dark Mode Policy

- **Dark mode is the default and only supported theme**
- Background: Deep space navy `#060A13` (not neutral black)
- All surfaces are semi-transparent glass over ambient gradient mesh
- Light theme colors are defined in config but not used
- Glass effects depend on dark background + gradient mesh

---

## 15. Custom CSS Classes

| Class | What It Does | Tier | File |
|-------|-------------|------|------|
| `.app-bg-mesh` | Fixed background with gradient orbs | BG | `global.css` |
| `.bg-orb-3` | Third ambient orb (violet) | BG | `global.css` |
| `.glass-card` | Tier 1 glass with blur + border + shadow + hover | 1 | `global.css` |
| `.glass-inner` | Tier 2 inner glass with blur | 2 | `global.css` |
| `.glass-surface` | Tier 3 surface (no blur) | 3 | `global.css` |
| `.glass-sheet` | Legacy alias for Tier 3 | 3 | `global.css` |
| `.dark-card` | Tier 1 glass card (rounded-16px) | 1 | `global.css` |
| `.font-mono` | JetBrains Mono with tight letter-spacing | -- | `global.css` |
| `.page-container` | Max-width 800px, centered, top padding | -- | `global.css` |
| `.text-label-muted` | Muted text `rgba(148,163,184,0.7)` | -- | `global.css` |
| `.page-header-icon` | Glass icon box with green glow | -- | `global.css` |
| `.page-header-divider` | Gradient divider (transparent-green-transparent) | -- | `global.css` |
| `.refresh-btn` | Glass refresh button with hover/spin states | -- | `global.css` |
| `.border-primary` | Green border for selected state | -- | `global.css` |
| `.cursor-pointer` | Cursor pointer utility | -- | `global.css` |
| `.glow-success` | Green glow utility | -- | `global.css` |
| `.glow-error` | Red glow utility | -- | `global.css` |
| `.glow-info` | Blue glow utility | -- | `global.css` |

---

## 16. Icon System

### Library
- Material Design Icons (`@mdi/font`)
- Used via Vuetify `v-icon` component

### Icon Color on Glassmorphism
- Header icons: `#4ADE80` (green on glass -- NOT dark on solid)
- General icons: inherit or semantic color
- Muted icons: `text-label-muted` or `text-medium-emphasis`

### Common Icons (same as v1 -- no changes)
(Full icon list maintained from v1.0.0)

### Icon Sizes (from production code)
| Size | Pixels | Usage |
|------|--------|-------|
| 10-12 | 10-12px | Status dots, inline caption |
| 14-16 | 14-16px | Small action icons, inline labels |
| 18-22 | 18-22px | Header icons, nav icons, warning icons |
| 24-28 | 24-28px | Strategy button, FAB |
| 48 | 48px | Empty state icon |

---

## 17. Design Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| 2026-03-28 | **Glassmorphism Dark Theme v2.0** | Full redesign from solid dark to true glassmorphism. Semi-transparent surfaces with backdrop-filter blur over ambient gradient mesh. Creates premium, modern aesthetic with layered depth. | Enhanced solid dark (incremental), Neumorphism (too heavy), Material You (too Google) |
| 2026-03-28 | Background `#060A13` (deep space navy) with gradient orbs | Glass effect requires visible background variation. Orbs provide subtle color shifts that make glass surfaces visible. Static would feel dead; animated orbs add life without distraction. | Solid black (glass invisible), Noise texture (too busy), Static gradient (too flat) |
| 2026-03-28 | 3-tier glass system (Card/Inner/Surface) | Hierarchy needs visual distinction. Tier 1 has full blur (heavy). Tier 3 has no blur (perf). Inner tier is middle ground for nested panels. | 2-tier (not enough depth), 4-tier (too complex), Single tier (flat) |
| 2026-03-28 | `rgba(255,255,255,0.03-0.05)` backgrounds (not higher) | Higher opacity (0.1+) looks milky/muddy on dark. 0.03-0.05 is barely visible but catches light from inset highlight. Subtlety is key. | 0.08-0.1 (too milky), 0.01 (invisible), Colored tint (clashes with semantic colors) |
| 2026-03-28 | Header icon: green glass (not solid green) | Solid green icon box felt out of place on glass UI. Green-tinted glass with glow integrates naturally. Icon color changed from dark to green for readability on glass. | Keep solid (inconsistent), White icon (no brand color), No icon box (loses hierarchy) |
| 2026-03-28 | Divider: gradient line (not solid) | Solid 1px line looks harsh on glass. Gradient (transparent->green->transparent) is softer and echoes the primary color subtly. | Solid white/grey (harsh), No divider (loses structure), Dotted (too playful) |
| 2026-03-28 | Filter pill active: green glass with glow (not solid green bg) | Solid green felt too aggressive on glass UI. Green-tinted glass with outer glow is consistent with the glass language while maintaining clear active state. | Solid green (too heavy), Border only (too subtle), Underline (too minimal) |
| 2026-03-28 | Bottom nav: frosted glass with glow dot | Solid nav looked like a separate element from the glass UI. Frosted glass integrates it. Glow dot behind active icon adds premium touch. | Solid dark (disconnected), Fully transparent (no boundary), Tab indicator line (too minimal) |
| 2026-03-28 | Bar chart fills: semi-transparent with glow | Solid bars looked flat on glass. Semi-transparent (0.8 opacity) with colored box-shadow glow integrates with the glass aesthetic. | Solid bars (flat), Gradient bars (too busy), Outlined bars (too thin) |
| 2026-03-28 | Text opacity hierarchy (0.95/0.7/0.5/0.4) | Pure white (#fff) is too harsh on glass. Slightly reduced opacity creates softer reading experience while maintaining WCAG contrast on dark glass. | Pure white (harsh), Fixed grey values (less flexible), HSL hierarchy (more complex) |
| 2026-03-28 | Scrollbar: thin glass style (4px, transparent track) | Default scrollbar breaks immersion. Thin glass scrollbar is consistent with the UI language. | Default (breaks aesthetic), Hidden (accessibility issue), Custom thick (too prominent) |
| 2026-03-15 | JetBrains Mono for numbers | Monospace alignment for financial data. JetBrains Mono is modern + readable at small sizes. | Fira Code, Source Code Pro |
| 2026-03-15 | Noto Sans Thai as default | Full Thai character support. Clean, modern. | Sarabun, IBM Plex Thai |
| 2026-03-15 | 800px max-width | Mobile-first single column. 800px prevents over-stretching on desktop while staying comfortable on tablet. | 600px, 100% |
| 2026-03-15 | Bottom navigation (3 items) | Mobile-native pattern. Thumb-reachable. Clear navigation. | Hamburger menu, Top tabs |
| 2026-03-15 | Card-per-position (not table) | Table unusable on 375px. Card enables proper visual hierarchy. | v-data-table |
| 2026-03-15 | Card-per-trade for Trade History | Consistent with Open Positions. Card-per-item enables proper hierarchy. | v-data-table |
| 2026-03-15 | CSS bars for Monthly Performance chart | 6-12 bars max. CSS is lighter, fully themeable, no dependency. | Chart.js |
| 2026-03-17 | Unified page header pattern | All pages share same header structure. | Per-page custom headers |
