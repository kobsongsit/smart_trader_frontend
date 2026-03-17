# Design System -- Smart Trader Frontend

> **Owner:** Espresso (Design Guardian)
> **Last Updated:** 2026-03-15
> **Version:** 1.0.0

---

## 1. Design Philosophy & Principles

### Core Philosophy
Smart Trader is a **mobile-first dark trading dashboard** -- designed for traders who glance at their phone to check market status. Every pixel serves a purpose: data clarity, fast scanning, and visual hierarchy that lets you read the most important number in under 1 second.

### Design Principles
1. **Data Density with Clarity** -- Pack information tight but never sacrifice readability
2. **Numbers First** -- Financial data gets monospace font, high contrast, large size
3. **Color = Meaning** -- Green is bullish/profit, Red is bearish/loss, Grey is neutral. No decorative colors.
4. **Mobile-First** -- 375px viewport is the primary design target. Desktop is a bonus.
5. **Glass Morphism Dark** -- Semi-transparent cards with subtle borders create depth without distraction
6. **Consistency Over Creativity** -- Every component follows the system. No one-off designs.

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
| **background** | `#121212` | `bg-color="background"` | App background |
| **surface** | `#1E1E1E` | `bg-color="surface"` | Bottom nav, standard card bg |

### 2.2 Semantic Colors

| Token | Hex | Vuetify Variable | Usage |
|-------|-----|------------------|-------|
| **success** | `#4CAF50` | `color="success"` | Bullish trend, validation pass, UP direction |
| **error** | `#FF5252` | `color="error"` | Bearish trend, validation fail, DOWN direction, loss |
| **warning** | `#FB8C00` | `color="warning"` | Caution states, moderate consensus, WAIT signal |
| **info** | `#2196F3` | `color="info"` | Informational chips, secondary stats, strong consensus |

### 2.3 Surface Colors (Blue-Tinted Dark Scale)

All surfaces use a **blue-tinted dark** tone for cohesive depth. Neutral grays (`rgb(24 24 27)`) are NOT used.

| Level | Name | Value | Usage |
|-------|------|-------|-------|
| 0 | Deepest | `rgb(11 15 25)` | Price boxes, inner recessed areas |
| 1 | Card base | `rgb(17 22 32)` | Outer cards (`.dark-card`, `.portfolio-card`, `.position-card`), trade cards, month rows |
| 2 | Inner surface | `rgb(23 30 45)` | Stat cells, hero cards, filter pills, nested inner cards |
| 3 | Subtle surface | `rgb(30 41 59 / 0.6-0.8)` | Badges, time chips, toolbar buttons |

**Card Borders & Shadows:**

| Property | Value | Usage |
|----------|-------|-------|
| Card border | `1px solid rgb(51 65 85 / 0.7)` | All Level 1 cards |
| Inner border | `1px solid rgb(51 65 85 / 0.5)` | Level 2 surfaces (stat cells, hero card) |
| Card shadow | `0 2px 16px rgb(0 0 0 / 0.25)` | Standard cards (`.dark-card`) |
| Portfolio shadow | `0 4px 24px rgb(0 0 0 / 0.35)` | Portfolio overview (heavier) |

**Glass Morphism (legacy, used in empty/error states):**

| Name | Value | Usage |
|------|-------|-------|
| Glass card bg | `rgba(30, 30, 30, 0.4)` | `.glass-card` -- empty state cards |
| Glass card border | `rgba(255, 255, 255, 0.06)` | `.glass-card` border |
| Glass card hover border | `rgba(0, 220, 130, 0.12)` | `.glass-card:hover` border |
| Glass sheet bg | `rgba(255, 255, 255, 0.04)` | `.glass-sheet` -- inner nested surfaces |

### 2.4 Text Colors

| Name | Vuetify Class / CSS | Usage |
|------|---------------------|-------|
| Primary text | (default white) | Main content, numbers, titles |
| Label muted | `.text-label-muted` = `rgb(100, 116, 139)` | Section headers, subtitles, secondary info |
| Medium emphasis | `.text-medium-emphasis` (Vuetify built-in) | Timestamps, metadata, tertiary info |
| Disabled | Vuetify disabled state | Non-interactive elements |

### 2.5 Color Mapping Rules (Trading Specific)

| Concept | Color | Notes |
|---------|-------|-------|
| Profit / Bullish / UP / BUY | `success` (green) | Always green for positive |
| Loss / Bearish / DOWN / SELL | `error` (red) | Always red for negative |
| Neutral / WAIT / Sideways | `grey` or `warning` | Grey for neutral, warning for caution |
| Active/Live indicator | `success` (small dot) | WebSocket connected status |
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
| Section gap (between cards) | 12px | `mb-3` | SymbolCard stack |
| Row internal gap | 12px | `mb-3` | Within card sections |
| Chip gap | 4px | `ga-1` | Chip groups |
| Item gap | 8px | `ga-2` | Flex item groups |
| General gap | 12px | `ga-3` | Header layout |
| Divider margin | 16px bottom | `mb-4` on `v-divider` | Section separators |
| Page container max-width | 800px | `.page-container` | All pages |
| Page container top padding | 16px (1rem) | `.page-container` | All pages |

### 4.3 Grid System
- `v-container fluid` with `.page-container` (max-width: 800px, centered)
- `v-row dense` for tight grid layouts (price boxes in SignalResult)
- `v-col` with `cols` prop for column layouts
- No sidebar -- single column mobile layout with bottom navigation

---

## 5. Layout Patterns

### 5.1 App Shell
```
+---------------------------+
|                           |
|     <NuxtPage />          |  <- v-main with pb-14
|     (max-width: 800px)    |
|     (centered)            |
|                           |
+---------------------------+
| [Markets] [Calendar] [Analysis] |  <- v-bottom-navigation, grow, color=primary, bg=#1E1E1E
+---------------------------+
```

### 5.2 Standard Page Layout
```
v-container.fluid.page-container.pa-3.pa-sm-4
  +-- Header row (d-flex align-center ga-3 mb-5 mt-1)
  |   +-- .page-header-icon (44×44 solid #4ade80, rounded-12px, green glow)
  |   |   +-- v-icon size="22" color="#050505"
  |   +-- .flex-grow-1
  |   |   +-- Title (text-h5 font-weight-bold)
  |   |   +-- Subtitle (text-caption text-label-muted mt-1)
  |   +-- .refresh-btn (global CSS)
  +-- .page-header-divider.mb-5
  +-- Content (component slot)
  +-- Footer (text-center, disclaimer text)
```

**Header Pattern (ทุกหน้าต้องใช้ pattern นี้เหมือนกัน):**
- Icon box: `.page-header-icon` — solid `#4ade80` bg, dark icon `color="#050505"`, icon size `22`
- Title: `text-h5 font-weight-bold` — Title Case (ไม่ใช่ UPPERCASE)
- Subtitle: `text-caption text-label-muted mt-1`
- Refresh: `.refresh-btn` + `.refresh-btn--spinning`
- Divider: `.page-header-divider mb-5`
- Spacing: `mb-5 mt-1` on header row

### 5.3 Card Stack Pattern (Primary mobile layout)
- Cards stacked vertically with `mb-3` gap
- Each card: `v-card elevation="0" rounded="lg" class="glass-card"`
- Card content via `v-card-text`

### 5.4 Responsive Behavior
- **Mobile (< 600px):** Single column, `pa-3`, full-width cards
- **sm+ (>= 600px):** `pa-sm-4`, same single column (800px max)
- **No multi-column layout** -- mobile-first single column throughout

---

## 6. Component Catalog

### 6.1 Cards

| Variant | Classes | Usage |
|---------|---------|-------|
| Glass Card | `v-card elevation="0" rounded="lg" class="glass-card"` | Primary card (SymbolCard, all content cards) |
| Glass Sheet (inner) | `v-sheet rounded="xl" class="glass-card pa-4"` | SignalResult wrapper |
| Inner Sheet | `v-sheet rounded="lg" class="glass-sheet pa-3"` | Nested content within cards |
| Entry Box | `v-sheet rounded="lg" class="pa-3"` + custom border | Price level boxes (entry, TP, SL) |

### 6.2 Chips

| Variant | Props | Usage |
|---------|-------|-------|
| Status chip (small) | `size="x-small" variant="tonal" rounded="lg" class="font-weight-bold"` | Type badge, trend status |
| Data chip | `size="small" variant="tonal" class="font-mono font-weight-bold"` | R:R ratio, profit %, loss % |
| Price change | `size="x-small" variant="tonal" :color="dynamic" class="font-mono font-weight-bold text-caption"` | +0.52%, -1.20% |
| Trend badge | `v-chip :color="dynamic" :size="small" variant="flat" class="font-weight-bold"` | UP, DOWN, NEUTRAL |

### 6.3 Buttons

| Variant | Props | Usage |
|---------|-------|-------|
| FAB | `v-btn icon color="primary" size="large" elevation="8" position="fixed"` | Create symbol (bottom-right) |
| Icon button | `v-btn icon variant="text" size="small/x-small"` | Refresh, edit, navigation |
| Strategy button | `v-btn :color="dynamic" variant="elevated" size="large" rounded="lg" class="font-weight-black text-h6 px-6"` | BUY/SELL signal display |
| Text action | `v-btn variant="text" size="small"` | Retry, inline actions |
| Bottom nav btn | `v-btn to="..." :active="..."` | Navigation items |

### 6.4 Progress Indicators

| Variant | Props | Usage |
|---------|-------|-------|
| Linear progress | `v-progress-linear :color="dynamic" rounded height="6" bg-color="#2A2A2A"` | Strength bars, Win rate bar |
| SL Distance Bar | `v-progress-linear :color="dynamic 3-tier" rounded height="6" bg-color="#2A2A2A"` | Risk proximity indicator in Open Positions. Color: <50% green, 50-74% amber, 75%+ red |
| Circular progress | `v-progress-circular :color="dynamic" :size="70" :width="6"` | Confidence display |
| Loading spinner | `v-progress-circular indeterminate color="primary"` | Loading states |
| Small spinner | `v-progress-circular indeterminate color="primary" size="20" width="2"` | Inline loading |

### 6.5 Alerts

| Variant | Props | Usage |
|---------|-------|-------|
| Error alert | `v-alert type="error" variant="tonal"` | API error messages |
| Warning sheet | `v-sheet rounded="lg"` + custom warning bg/border | Signal warnings |

### 6.6 Skeleton Loaders

| Variant | Usage |
|---------|-------|
| `v-skeleton-loader type="button"` | Button placeholder |
| `v-skeleton-loader type="text"` | Text line placeholder |
| `v-skeleton-loader type="paragraph"` | Multi-line text |
| `v-skeleton-loader type="chip"` | Chip placeholder |
| `v-skeleton-loader type="avatar"` | Avatar/circle placeholder |
| `v-skeleton-loader type="text@2"` | Two text lines |

### 6.7 Avatars

| Variant | Props | Usage |
|---------|-------|-------|
| Symbol avatar | `v-avatar :color="dynamic" variant="tonal" size="46" rounded="lg"` + border | Symbol first letter |
| Header avatar | `v-avatar color="primary" size="40" rounded="lg"` | Page header icon |

### 6.8 Navigation

| Component | Details |
|-----------|---------|
| Bottom Navigation | `v-bottom-navigation grow color="primary" bg-color="#1E1E1E"` with 3 items |
| Items | Dashboard (mdi-view-dashboard-outline), History (mdi-history), Performance (mdi-chart-line-variant) |
| Routes | `/` (Dashboard), `/history` (Trade History), `/performance` (Monthly Performance) |
| Label style | `text-uppercase text-caption` |

### 6.9 Empty / Error / Loading States

| State | Pattern |
|-------|---------|
| **Loading (initial)** | `v-progress-circular indeterminate color="primary"` centered + "Loading..." text |
| **Error** | `v-alert type="error" variant="tonal"` with retry button in #append slot |
| **Empty** | Large mdi icon (size 48) + descriptive text, centered, `text-medium-emphasis` |
| **Skeleton (progressive)** | Partial card with avatar + name + `v-skeleton-loader type="text@2"` |

---

## 7. Interactive States

| State | Behavior |
|-------|----------|
| **Hover (card)** | Border color shift to `rgba(0, 220, 130, 0.12)`, enhanced shadow |
| **Active/Pressed** | Default Vuetify ripple effect |
| **Focus** | Default Vuetify focus ring |
| **Disabled** | Vuetify default (reduced opacity) |
| **Transition** | `box-shadow 0.25s ease, border-color 0.25s ease` on glass-card |

---

## 8. Elevation & Shadows

| Level | Value | Usage |
|-------|-------|-------|
| No elevation | `elevation="0"` | Vuetify cards with custom shadow |
| Standard card | `0 2px 16px rgb(0 0 0 / 0.25)` | `.dark-card` (all content cards) |
| Portfolio card | `0 4px 24px rgb(0 0 0 / 0.35)` | `.portfolio-card` (heavier depth) |
| Glass shadow | `0 2px 12px rgba(0, 0, 0, 0.4)` | `.glass-card` (legacy/empty states) |
| Glass hover | `0 4px 20px rgba(0, 0, 0, 0.5), 0 0 32px rgba(0, 220, 130, 0.04)` | `.glass-card:hover` |
| Green glow | `0 0 16px rgba(74, 222, 128, 0.25)` | `.page-header-icon` |
| Win rate glow | `0 0 10px rgba(52, 211, 153, 0.45)` | Progress bar determinate |

---

## 9. Border & Border Radius

### 9.1 Border Radius Scale (actual production values)

| Value | Token | Usage |
|-------|-------|-------|
| `4px` | badge-sm | Direction badges, small badges, progress bars |
| `5-6px` | badge-md | Exit badges, nav arrow buttons, filter toggle |
| `8px` | radius-sm | Price boxes, glass-card (Vuetify `rounded="lg"`) |
| `12px` | radius-md | Stat cells, page-header-icon, position cards, stat-mini-cell |
| `16px` | radius-lg | Dark cards (`.dark-card`), hero cards, inner content cards |
| `24px` | radius-xl | Portfolio overview outer card |
| `9999px` | pill | Filter pills, extra-filter badge |

### 9.2 Border Styles

| Border Style | Usage |
|-------------|-------|
| `1px solid rgb(51 65 85 / 0.7)` | Level 1 cards (dark-card, portfolio-card, position-card) |
| `1px solid rgb(51 65 85 / 0.5)` | Level 2 surfaces (stat cells, hero card, price box) |
| `1px solid rgba(255,255,255,0.06)` | Glass card/sheet border (legacy) |
| `1px solid rgb(16 185 129 / 0.2)` | BUY direction badge border (tonal) |
| `1px solid rgb(239 68 68 / 0.2)` | SELL direction badge border (tonal) |

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
- FAB: `size="large"` (56px)
- Bottom nav items: full-width with `grow`

---

## 11. Accessibility Standards

- WCAG AA target
- Vuetify built-in aria attributes on components
- `NuxtRouteAnnouncer` for route change announcements
- Color alone never conveys meaning -- always paired with text/icons
- Semantic heading hierarchy maintained

---

## 12. Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Base content | 0 | Page content |
| Bottom navigation | Vuetify default | `v-bottom-navigation` |
| FAB | Vuetify default | Fixed position button |
| Tooltips | Vuetify default | `v-tooltip` |
| Dialogs | Vuetify default | (not yet used) |

---

## 13. Motion & Animation

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Card hover | 250ms | ease | Glass card border/shadow transition |
| Score count-up | 600ms | ease-out cubic | Strength score animation |
| Loading appear | instant | -- | Skeleton to content swap |

---

## 14. Dark Mode Policy

- **Dark mode is the default and only supported theme**
- Light theme colors are defined in config but not used
- All design decisions are made for dark backgrounds
- Glass morphism effects depend on dark mode

---

## 15. Custom CSS Classes

| Class | What It Does | Usage | File |
|-------|-------------|-------|------|
| `.glass-card` | Semi-transparent card with border + shadow + hover effect | All content cards | `global.css` |
| `.glass-sheet` | Very subtle inner surface | Nested content areas | `global.css` |
| `.font-mono` | JetBrains Mono with tight letter-spacing | All numbers | `global.css` |
| `.page-container` | Max-width 800px, centered, top padding | Every page wrapper | `global.css` |
| `.text-label-muted` | Muted slate text color | Section labels, subtitles | `global.css` |
| `.page-header-icon` | Solid green 44×44 icon box with glow | Every page header icon | `global.css` |
| `.page-header-divider` | 1px divider below page header | Every page, below header | `global.css` |
| `.refresh-btn` | Transparent icon button with hover/spin states | Every page header refresh | `global.css` |
| `.border-primary` | Green border for selected state | Selected month card in Performance | `global.css` |

---

## 16. Icon System

### Library
- Material Design Icons (`@mdi/font`)
- Used via Vuetify `v-icon` component

### Common Icons (used in production)

| Icon | MDI Name | Usage |
|------|----------|-------|
| Flash | `mdi-flash` | App logo/header |
| Sync | `mdi-sync` | Refresh action |
| Plus | `mdi-plus` | Create/add |
| Pencil | `mdi-pencil` | Edit |
| Chevron right | `mdi-chevron-right` | Navigate forward |
| Trending up | `mdi-trending-up` | Uptrend |
| Trending down | `mdi-trending-down` | Downtrend |
| Trending neutral | `mdi-trending-neutral` | Sideways/neutral |
| Circle (filled) | `mdi-circle` | Live status dot |
| Circle (outline) | `mdi-circle-outline` | Offline status dot |
| Clock outline | `mdi-clock-outline` | Timestamps |
| Alert circle | `mdi-alert-circle-outline` | Warnings |
| Shield check | `mdi-shield-check` | Footer trust indicator |
| Chart box outline | `mdi-chart-box-outline` | Empty state |
| View grid | `mdi-view-grid-outline` | Markets nav |
| Calendar | `mdi-calendar-blank` | Calendar nav |
| Chart line | `mdi-chart-line-variant` | Performance nav |
| History | `mdi-history` | History nav |
| Dashboard | `mdi-view-dashboard-outline` | Dashboard nav |
| Chart bar | `mdi-chart-bar` | Performance page header |
| File search | `mdi-file-search-outline` | Empty state (filtered results) |
| Chevron left | `mdi-chevron-left` | Month navigator prev |
| Arrow right | `mdi-arrow-right` | Price flow (entry -> exit/current) |

### Icon Sizes (from production code)
| Size | Pixels | Usage |
|------|--------|-------|
| 10 | 10px | Status dots |
| 12 | 12px | Inline with caption text |
| 14 | 14px | Inline with small labels |
| 16 | 16px | Small action icons |
| 18 | 18px | Warning icons |
| 20 | 20px | Default inline |
| 22 | 22px | Header avatar icon |
| 24 | 24px | Strategy button icon |
| 26 | 26px | Refresh icon |
| 28 | 28px | FAB icon |
| 48 | 48px | Empty state icon |

---

## 17. Design Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| 2026-03-15 | Glass morphism dark theme | Trading apps need dark mode. Glass effect adds depth without clutter. | Solid dark cards, Gradient backgrounds |
| 2026-03-15 | JetBrains Mono for numbers | Monospace alignment for financial data. JetBrains Mono is modern + readable at small sizes. | Fira Code, Source Code Pro |
| 2026-03-15 | Noto Sans Thai as default | Full Thai character support. Clean, modern. | Sarabun, IBM Plex Thai |
| 2026-03-15 | 800px max-width | Mobile-first single column. 800px prevents over-stretching on desktop while staying comfortable on tablet. | 600px (too narrow for tablet), 100% (too wide on desktop) |
| 2026-03-15 | Bottom navigation (3 items) | Mobile-native pattern. Thumb-reachable. Clear navigation. | Hamburger menu, Top tabs |
| 2026-03-15 | elevation="0" + glass-card CSS | Vuetify elevation doesn't support rgba backgrounds well. Custom CSS gives better glass effect. | Vuetify elevation levels |
| 2026-03-15 | Card-per-position (not table) for Open Positions | Table unusable on 375px with 6+ columns. Card enables proper visual hierarchy and SL distance bar. | v-data-table, Compact rows |
| 2026-03-15 | SL Distance Bar with 3-tier color (green/amber/red) | Universal traffic light system for risk proximity. Thresholds at 50% and 75% match common trading risk management levels. | Binary green/red, 5-tier gradient |
| 2026-03-15 | text-h5 for position P&L (not text-h4) | text-h4 reserved for page-level hero (Portfolio Total Pips). Card-level hero uses text-h5 to maintain hierarchy. | text-h4 (breaks hierarchy), text-h6 (too small) |
| 2026-03-15 | Empty state "Bot is scanning" (not "Waiting") | Lungo directive: don't induce FOMO. "Scanning" sounds active, "Waiting" sounds passive. mdi-radar icon reinforces. | "No positions yet", "Waiting for signal" |
| 2026-03-15 | Card-per-trade for Trade History (not table) | Consistent with Open Positions pattern. Card-per-item enables proper hierarchy with P&L as hero on 375px. | v-data-table, Compact rows |
| 2026-03-15 | Load More button (not infinite scroll) for Trade History | User control over data loading. Prevents perf issues. Shows progress ("12 of 42"). | Infinite scroll, Full pagination |
| 2026-03-15 | Chip group filters (not dropdowns) for Trade History | All options visible at once -- no extra tap. Few options (4-5 symbols, 3 TFs). Mobile-friendly. | v-select dropdown, Bottom sheet |
| 2026-03-15 | Exit reason chips with semantic colors | TP=success, SL=error, Signal Exit=info, Manual=warning. Instant identification of trade outcome. | Text only, Icon only |
| 2026-03-15 | CSS bars for Monthly Performance chart (not chart library) | 6-12 bars max. CSS is lighter, fully themeable, no dependency. | lightweight-charts, Chart.js |
| 2026-03-15 | Cumulative P&L as Performance page hero (text-h4) | Most important number: "how much total?" Same prominence as Portfolio Overview's Total Pips. | Monthly as hero, No hero |
| 2026-03-15 | Month selection interaction (tap bar or card) | Simple state change, no modal/navigation. Detail updates reactively. | Modal popup, Separate page per month |
| 2026-03-15 | Symbol breakdown sorted by pips (not alpha) | Trader asks "what's making me money?" Sort by profit answers directly. | Alphabetical, By trade count |
| 2026-03-15 | Bottom navigation updated: Dashboard/History/Performance | Three distinct views: overview, trade log, monthly trends. Clear separation of concerns. | Tabs within Dashboard, Drawer menu |
| 2026-03-17 | Unified page header pattern across all pages | Dashboard/History/Performance had 3 different header styles (solid vs tonal icon, text-h5 vs custom 1rem uppercase, different spacing). Unified to: solid green icon box + text-h5 title + text-caption subtitle + divider. CSS moved to global.css to prevent duplication. | Keep per-page custom headers (rejected: inconsistency is technical debt) |
| 2026-03-17 | Blue-tinted dark surface scale across all pages | History/Performance used neutral dark `rgb(24 24 27)` while Dashboard used blue-tinted `rgb(17 22 32)`. Unified to 4-level blue-tinted scale: L0 `rgb(11 15 25)`, L1 `rgb(17 22 32)`, L2 `rgb(23 30 45)`, L3 `rgb(30 41 59)`. Blue tint adds depth and premium feel vs flat neutral gray. | Neutral gray (rejected: feels flat), Pure dark (rejected: no depth) |
| 2026-03-17 | Tonal direction badges (not solid) across all pages | History/Performance used solid BUY/SELL badges (opaque green/red bg). Dashboard OpenPositions used tonal (transparent bg + colored border). Unified to tonal everywhere — subtler, works better on blue-tinted cards, consistent with position card left accent bar pattern. | Solid badges (rejected: too heavy on dark cards, inconsistent with Dashboard) |
| 2026-03-17 | Standardized stat-cell across pages | Portfolio stat-cell (bg: L2, radius: 12px, value: 1.1rem) and History stat-cell (bg: neutral, radius: 10px, value: 1rem) were different. Unified to Portfolio's values. Same component = same style. | Keep per-page variants (rejected: same component must look same) |
