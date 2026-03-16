# Portfolio Overview Section -- Design Spec

> **Designer:** Espresso (Design Guardian)
> **Date:** 2026-03-15
> **Updated:** 2026-03-15 (Lungo trading analyst review — P0/P1 changes)
> **Status:** Ready for Implementation (v2)
> **Reference:** `docs/design/design-system.md` v1.0.0

---

## 1. Overview

Portfolio Overview คือ section แรกสุดของหน้า Dashboard (index.vue)
แสดงภาพรวมผลงาน trading ทั้งระบบในพริบตาเดียว

### Design Goals
- **1-second scan:** Total P&L ต้องอ่านได้ทันทีที่เปิดแอป
- **Information density:** 10 data points ใน card เดียว ไม่รกตา (added: Max DD, today/week delta)
- **Emotional clarity:** กำไร = เขียวชัด, ขาดทุน = แดงชัด
- **Mobile-first:** ออกแบบสำหรับ 375px เป็นหลัก

### API Source
```
GET /api/strategy/portfolio
```
```json
{
  "success": true,
  "data": {
    "totalPips": 6492,
    "wins": 85,
    "losses": 32,
    "totalTrades": 117,
    "winRate": 73,
    "profitFactor": 2.45,
    "streak": 3,
    "streakType": "W",
    "openPositions": 4,
    "since": "Oct 1, 2025",
    "maxDrawdown": -842,
    "todayPips": 127,
    "weekPips": 483
  }
}
```
> **v2 changes:** Added `maxDrawdown` (P0), `todayPips` and `weekPips` (P1) per Lungo's trading analyst review.

---

## 2. Layout Design (Mobile ~375px)

### 2.1 Visual Layout (ASCII Wireframe)

```
+-----------------------------------------------+
|  glass-card, rounded-lg, pa-4                  |
|                                                |
|  [Trophy Icon]  PORTFOLIO OVERVIEW             |
|                 Since Oct 1, 2025              |
|                                                |
|  +-------------------------------------------+|
|  |          TOTAL PIPS                        ||
|  |      +6,492 pips                           ||
|  |   +127 today  |  +483 week                 ||  <-- P1: today/week delta
|  |  [==============--------] 73% WR           ||
|  +-------------------------------------------+|
|                                                |
|  +----------+  +----------+  +----------+     |
|  | 85       |  | 32       |  | 117      |     |
|  | Wins     |  | Losses   |  | Total    |     |
|  +----------+  +----------+  +----------+     |
|                                                |
|  +----------+  +----------+  +----------+     |  <-- P0: changed to 3 columns
|  | PF       |  | Max DD   |  | Streak   |     |  <-- P0: added Max Drawdown
|  | 2.45     |  | -842p    |  | 3W (fire)|     |
|  +----------+  +----------+  +----------+     |
|                                                |
|  [ 4 Open Positions  > ]  chip (clickable)     |  <-- P0: clickable with chevron
|                                                |
+-----------------------------------------------+
```

### 2.2 Layout Breakdown (3 Zones)

**Zone A: Header** (top section)
- Icon + Title + Since date
- Simple, establishes context

**Zone B: Hero Stat** (center, visually dominant)
- Total Pips -- largest font, boldest color
- Today/Week delta -- small text below hero number (P1)
- Win Rate progress bar -- visual reinforcement
- This is the "1-second glance" zone

**Zone C: Detail Grid** (bottom section)
- Row 1: 3-column stat boxes: Wins / Losses / Total
- Row 2: 3-column stat boxes: Profit Factor / Max Drawdown / Streak (P0: changed from 2-col to 3-col)
- Row 3: Open Positions chip (P0: clickable with chevron icon)

---

## 3. Component Structure

### 3.1 Outer Container
```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4">
    <!-- Zone A: Header -->
    <!-- Zone B: Hero Stat -->
    <!-- Zone C: Detail Grid -->
  </v-card-text>
</v-card>
```
**Rationale:** glass-card consistent กับทุก card ในระบบ (SymbolCard pattern)

### 3.2 Zone A: Header
```vue
<!-- Header -->
<div class="d-flex align-center ga-3 mb-4">
  <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
    <v-icon icon="mdi-trophy" size="22" />
  </v-avatar>
  <div>
    <div class="text-subtitle-1 font-weight-bold">PORTFOLIO OVERVIEW</div>
    <div class="text-caption text-label-muted">Since Oct 1, 2025</div>
  </div>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Avatar | `size="40" rounded="lg" color="primary" variant="tonal"` | Match header avatar pattern from index.vue |
| Icon | `mdi-trophy size="22"` | Trophy = achievement/portfolio |
| Title | `text-subtitle-1 font-weight-bold` | Slightly smaller than page title (text-h5), this is section-level |
| Since | `text-caption text-label-muted` | Secondary info, don't compete with stats |
| Gap | `ga-3` (12px) | Standard header gap |
| Bottom margin | `mb-4` (16px) | Separation before hero zone |

### 3.3 Zone B: Hero Stat (Total Pips + Win Rate)
```vue
<!-- Hero: Total Pips -->
<div class="glass-sheet rounded-lg pa-4 mb-4">
  <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-1">
    TOTAL PIPS
  </div>
  <div class="d-flex align-end ga-2 mb-1">
    <span class="text-h4 font-weight-black font-mono" :class="pipsColorClass">
      +6,492
    </span>
    <span class="text-caption font-weight-medium text-label-muted pb-1">pips</span>
  </div>

  <!-- P1: Today/Week Delta -->
  <div class="text-caption font-mono mb-3">
    <span :class="todayPipsColorClass">+127 today</span>
    <span class="text-label-muted mx-1">|</span>
    <span :class="weekPipsColorClass">+483 week</span>
  </div>

  <!-- Win Rate Bar -->
  <div class="d-flex align-center justify-space-between mb-1">
    <span class="text-caption font-weight-medium text-label-muted">WIN RATE</span>
    <span class="text-caption font-weight-bold font-mono text-primary">73%</span>
  </div>
  <v-progress-linear
    :model-value="73"
    color="primary"
    bg-color="#2A2A2A"
    rounded
    height="6"
  />
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Container | `glass-sheet rounded-lg pa-4` | Inner surface pattern, visual grouping |
| "TOTAL PIPS" label | `text-caption font-weight-bold text-label-muted text-uppercase` | Standard section label pattern (from SymbolCard) |
| Pips value | `text-h4 font-weight-black font-mono` | Largest text in card. Must be scannable in 1 second. |
| Pips color | Dynamic: `text-primary` if positive, `text-error` if negative | Color = meaning. Green = profit, Red = loss. |
| "pips" unit | `text-caption text-label-muted pb-1` | Small, aligned to bottom of number. Don't compete. |
| Today/Week delta | `text-caption font-mono` + dynamic color | P1: Quick glance at recent performance without leaving hero zone. Small enough to not compete with main number. |
| Delta separator | `text-label-muted mx-1` | Visual separator "|" between today and week |
| Win Rate bar | `v-progress-linear height="6" rounded bg-color="#2A2A2A"` | Exact same pattern as SymbolCard strength bar |
| Win Rate label | Same pattern as SymbolCard strength header | Consistency with existing component |
| Bottom margin | `mb-4` | Standard section gap |

**Color Logic:**
```typescript
const pipsColorClass = computed(() => {
  if (data.totalPips > 0) return 'text-primary'   // green
  if (data.totalPips < 0) return 'text-error'      // red
  return 'text-medium-emphasis'                     // grey (zero)
})
```

**Number Formatting:**
```typescript
// Total pips: always show sign, comma-separated
function formatPips(pips: number): string {
  const prefix = pips > 0 ? '+' : ''
  return `${prefix}${pips.toLocaleString('en-US')}`
}
// +6,492 / -1,230 / 0
```

**P1: Today/Week Delta Color Logic:**
```typescript
// Shared helper for delta color
function deltaColorClass(value: number | null | undefined): string {
  if (value == null) return 'text-medium-emphasis'  // no data = grey dash
  if (value > 0) return 'text-success'               // green
  if (value < 0) return 'text-error'                  // red
  return 'text-medium-emphasis'                        // zero = grey
}

const todayPipsColorClass = computed(() => deltaColorClass(data.todayPips))
const weekPipsColorClass = computed(() => deltaColorClass(data.weekPips))

// Display: "+127 today" / "-42 today" / "-- today" (if null)
function formatDelta(value: number | null | undefined, label: string): string {
  if (value == null) return `— ${label}`
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString('en-US')} ${label}`
}
```

### 3.4 Zone C: Stats Grid

#### Row 1: Wins / Losses / Total (3 columns)
```vue
<v-row dense class="mb-3">
  <v-col cols="4">
    <div class="glass-sheet rounded-lg pa-3 text-center">
      <div class="text-h6 font-weight-bold font-mono text-success">85</div>
      <div class="text-caption text-label-muted font-weight-medium">Wins</div>
    </div>
  </v-col>
  <v-col cols="4">
    <div class="glass-sheet rounded-lg pa-3 text-center">
      <div class="text-h6 font-weight-bold font-mono text-error">32</div>
      <div class="text-caption text-label-muted font-weight-medium">Losses</div>
    </div>
  </v-col>
  <v-col cols="4">
    <div class="glass-sheet rounded-lg pa-3 text-center">
      <div class="text-h6 font-weight-bold font-mono">117</div>
      <div class="text-caption text-label-muted font-weight-medium">Total</div>
    </div>
  </v-col>
</v-row>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Layout | `v-row dense` with 3x `v-col cols="4"` | Equal 3-column grid. `dense` reduces gutter for tighter mobile layout. |
| Stat box | `glass-sheet rounded-lg pa-3 text-center` | Same inner surface as SignalResult entry boxes |
| Number | `text-h6 font-weight-bold font-mono` | Secondary prominence. Monospace for numbers. |
| Wins color | `text-success` | Green = wins |
| Losses color | `text-error` | Red = losses |
| Total color | default (white) | Neutral - not good or bad |
| Label | `text-caption text-label-muted font-weight-medium` | Standard muted label |
| Row margin | `mb-3` (12px) | Standard row gap |

#### Row 2: Profit Factor / Max Drawdown / Streak (3 columns)

> **P0 change:** Expanded from 2 columns to 3 columns to include Max Drawdown (Lungo's review).

```vue
<v-row dense class="mb-3">
  <v-col cols="4">
    <div class="glass-sheet rounded-lg pa-3">
      <div class="text-caption text-label-muted font-weight-medium mb-1">Profit Factor</div>
      <div class="d-flex align-center ga-1">
        <v-icon icon="mdi-scale-balance" size="16" color="info" />
        <span class="text-h6 font-weight-bold font-mono" :class="pfColorClass">2.45</span>
      </div>
    </div>
  </v-col>
  <v-col cols="4">
    <div class="glass-sheet rounded-lg pa-3">
      <div class="text-caption text-label-muted font-weight-medium mb-1">Max DD</div>
      <div class="d-flex align-center ga-1">
        <v-icon icon="mdi-trending-down" size="16" color="error" />
        <span class="text-h6 font-weight-bold font-mono text-error">-842</span>
      </div>
    </div>
  </v-col>
  <v-col cols="4">
    <div class="glass-sheet rounded-lg pa-3">
      <div class="text-caption text-label-muted font-weight-medium mb-1">Streak</div>
      <div class="d-flex align-center ga-1">
        <v-icon :icon="streakIcon" size="16" :color="streakColor" />
        <span class="text-h6 font-weight-bold font-mono" :class="streakColorClass">3W</span>
      </div>
    </div>
  </v-col>
</v-row>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Layout | `v-row dense` with 3x `v-col cols="4"` | P0: Changed from 2-col to 3-col to accommodate Max Drawdown. Matches Row 1 grid rhythm. |
| Stat box | `glass-sheet rounded-lg pa-3` | Consistent with row above |
| Label | `text-caption text-label-muted font-weight-medium mb-1` | Top-aligned label |
| Value | `text-h6 font-weight-bold font-mono` + dynamic color | Same prominence as row 1 numbers |
| Icon | `size="16"` with semantic color | Reduced from 18 to 16 to fit tighter 3-col layout. Visual anchor + meaning reinforcement. |
| Gap | `ga-1` (4px) | Tighter gap than 2-col layout (was ga-2) to fit content in narrower columns |
| Max DD value | `text-h6 font-weight-bold font-mono text-error` | Always red — drawdown is always a risk metric to be aware of |
| Max DD icon | `mdi-trending-down size="16" color="error"` | Down trend icon reinforces "drawdown" meaning. Always red. |
| Max DD label | "Max DD" (abbreviated) | Short label fits 4-col width on mobile. Full "Max Drawdown" too long. |

**P0: Max Drawdown Display Logic:**
```typescript
// Max Drawdown: always negative pips, always red
// Display: "-842" (no "pips" suffix to save space in 3-col layout)
function formatMaxDrawdown(dd: number): string {
  return dd.toLocaleString('en-US')  // -842 → "-842"
}
// Color: always text-error — drawdown is never "good"
// Icon: always mdi-trending-down color="error"
```

**Profit Factor Color Logic:**

> **P1 change:** Adjusted thresholds per Lungo's review. PF 1.0-1.2 is effectively losing after spread/commission costs.

```typescript
const pfColorClass = computed(() => {
  if (data.profitFactor >= 2.0) return 'text-success'   // great
  if (data.profitFactor >= 1.5) return 'text-primary'   // good
  if (data.profitFactor >= 1.2) return 'text-warning'   // marginal (P1: was 1.0)
  return 'text-error'                                     // losing (P1: covers < 1.2 now)
})
// Rationale (Lungo): PF 1.0-1.2 looks break-even on paper but loses money
// after spread + commission costs. Showing it as warning/green is misleading.
```

**Streak Display Logic:**
```typescript
const streakIcon = computed(() => {
  if (data.streakType === 'W') return 'mdi-fire'
  return 'mdi-snowflake'  // losing streak = cold
})
const streakColor = computed(() => {
  return data.streakType === 'W' ? 'success' : 'error'
})
const streakColorClass = computed(() => {
  return data.streakType === 'W' ? 'text-success' : 'text-error'
})
// Display: "3W" or "5L"
const streakText = computed(() => {
  return `${data.streak}${data.streakType}`
})
```

#### Row 3: Open Positions (clickable chip)

> **P0 change:** Chip is now clickable with chevron icon to navigate to open positions detail.

```vue
<!-- Open Positions (clickable) -->
<div class="d-flex align-center justify-center">
  <v-chip
    size="small"
    variant="tonal"
    color="info"
    class="font-mono font-weight-bold cursor-pointer"
    @click="navigateToOpenPositions"
  >
    <v-icon icon="mdi-chart-timeline-variant-shimmer" start size="16" />
    {{ data.openPositions }} Open Positions
    <v-icon icon="mdi-chevron-right" end size="16" />
  </v-chip>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Chip | `size="small" variant="tonal" color="info"` | Info color = informational. Now also actionable (P0). |
| Font | `font-mono font-weight-bold` | Number in chip = monospace |
| Left icon | `mdi-chart-timeline-variant-shimmer size="16"` | Represents active/live trades |
| Right icon | `mdi-chevron-right size="16"` | P0: Indicates chip is clickable/navigable. Standard "go forward" affordance. |
| Cursor | `cursor-pointer` class | P0: Visual feedback that chip is interactive |
| Click handler | `@click="navigateToOpenPositions"` | P0: Navigation to open positions detail page (route TBD) |
| Hover | Vuetify chip default hover effect | Tonal chip already has subtle hover state built-in |
| Alignment | `d-flex justify-center` | Centered as footer of card |

**Navigation Logic:**
```typescript
// Route TBD — will be defined when open positions page is designed
function navigateToOpenPositions() {
  // navigateTo('/positions') or emit event for parent to handle
  // For now, the design shows it's clickable. Route to be determined.
}
```

---

## 4. Color Mapping Summary

| Data Point | Condition | Color Class | Vuetify Color |
|-----------|-----------|-------------|---------------|
| Total Pips | > 0 | `text-primary` | `#4ADE80` (green) |
| Total Pips | < 0 | `text-error` | `#FF5252` (red) |
| Total Pips | = 0 | `text-medium-emphasis` | grey |
| Today/Week delta | > 0 | `text-success` | `#4CAF50` (green) |
| Today/Week delta | < 0 | `text-error` | `#FF5252` (red) |
| Today/Week delta | = 0 or null | `text-medium-emphasis` | grey |
| Wins | always | `text-success` | `#4CAF50` |
| Losses | always | `text-error` | `#FF5252` |
| Total Trades | always | default (white) | -- |
| Win Rate | always | `color="primary"` | `#4ADE80` |
| Profit Factor | >= 2.0 | `text-success` | `#4CAF50` |
| Profit Factor | >= 1.5 | `text-primary` | `#4ADE80` |
| Profit Factor | >= 1.2 | `text-warning` | `#FB8C00` |
| Profit Factor | < 1.2 | `text-error` | `#FF5252` |
| Max Drawdown | always | `text-error` | `#FF5252` (red) |
| Streak (win) | streakType = W | `text-success` | `#4CAF50` |
| Streak (lose) | streakType = L | `text-error` | `#FF5252` |
| Open Positions | always | `color="info"` | `#2196F3` |

> **v2 changes:** Added Today/Week delta (P1), Max Drawdown always-red (P0), adjusted PF thresholds 1.0->1.2 (P1).

---

## 5. Typography Spec

| Element | Classes | Font | Size | Weight |
|---------|---------|------|------|--------|
| Section title | `text-subtitle-1 font-weight-bold` | Noto Sans Thai | 16px | 700 |
| Since date | `text-caption text-label-muted` | Noto Sans Thai | 12px | 400 |
| "TOTAL PIPS" label | `text-caption font-weight-bold text-uppercase` | Noto Sans Thai | 12px | 700 |
| Pips value | `text-h4 font-weight-black font-mono` | JetBrains Mono | 34px | 900 |
| "pips" unit | `text-caption text-label-muted` | Noto Sans Thai | 12px | 400 |
| Today/Week delta | `text-caption font-mono` + dynamic color | JetBrains Mono | 12px | 400 |
| Delta separator | `text-label-muted mx-1` | Noto Sans Thai | 12px | 400 |
| Win Rate label | `text-caption font-weight-medium` | Noto Sans Thai | 12px | 500 |
| Win Rate value | `text-caption font-weight-bold font-mono` | JetBrains Mono | 12px | 700 |
| Stat number | `text-h6 font-weight-bold font-mono` | JetBrains Mono | 20px | 700 |
| Stat label | `text-caption text-label-muted font-weight-medium` | Noto Sans Thai | 12px | 500 |
| Max DD value | `text-h6 font-weight-bold font-mono text-error` | JetBrains Mono | 20px | 700 |
| Chip text | `font-mono font-weight-bold` | JetBrains Mono | 14px | 700 |

---

## 6. Spacing Spec

| Gap | Value | Vuetify | Between |
|-----|-------|---------|---------|
| Header to hero | 16px | `mb-4` | Zone A to Zone B |
| Hero internal label-to-number | 4px | `mb-1` | "TOTAL PIPS" label to value |
| Pips value to delta | 4px | `mb-1` | Hero number to today/week delta line |
| Delta to win rate | 12px | `mb-3` | Today/week delta to win rate bar |
| Win rate label gap | 4px | `mb-1` | Label row to progress bar |
| Hero to stats grid | 16px | `mb-4` | Zone B to Zone C |
| Stats row gap | 12px | `mb-3` | Between stat rows |
| Stat box padding | 12px | `pa-3` | Inside each stat box |
| Card padding | 16px | `pa-4` | Card outer padding |
| Hero zone padding | 16px | `pa-4` | Hero inner padding |

---

## 7. States

### 7.1 Loading State
```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4">
    <!-- Header skeleton -->
    <div class="d-flex align-center ga-3 mb-4">
      <v-skeleton-loader type="avatar" width="40" height="40" />
      <div>
        <v-skeleton-loader type="text" width="180" class="mb-1" />
        <v-skeleton-loader type="text" width="100" />
      </div>
    </div>

    <!-- Hero skeleton -->
    <v-sheet rounded="lg" class="glass-sheet pa-4 mb-4">
      <v-skeleton-loader type="text" width="80" class="mb-2" />
      <v-skeleton-loader type="heading" width="200" class="mb-3" />
      <v-skeleton-loader type="text" width="100%" />
    </v-sheet>

    <!-- Stats grid skeleton -->
    <v-row dense class="mb-3">
      <v-col v-for="i in 3" :key="i" cols="4">
        <v-sheet rounded="lg" class="glass-sheet pa-3 text-center">
          <v-skeleton-loader type="text" width="40" class="mx-auto mb-1" />
          <v-skeleton-loader type="text" width="50" class="mx-auto" />
        </v-sheet>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col v-for="i in 3" :key="i" cols="4">
        <v-sheet rounded="lg" class="glass-sheet pa-3">
          <v-skeleton-loader type="text" width="60" class="mb-1" />
          <v-skeleton-loader type="text" width="50" />
        </v-sheet>
      </v-col>
    </v-row>
  </v-card-text>
</v-card>
```
**Pattern:** Skeleton matches exact layout structure. User sees the shape of content before data arrives.

### 7.2 Error State
```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4">
    <v-alert type="error" variant="tonal" class="mb-0">
      Failed to load portfolio data
      <template #append>
        <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
      </template>
    </v-alert>
  </v-card-text>
</v-card>
```
**Pattern:** Same as SymbolList error pattern. Tonal alert with retry action.

### 7.3 Empty/No Data State
```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4 text-center">
    <v-icon icon="mdi-chart-box-plus-outline" size="48" class="text-medium-emphasis mb-2" />
    <div class="text-body-2 text-medium-emphasis">No trading data yet</div>
    <div class="text-caption text-label-muted mt-1">Start trading to see your portfolio stats</div>
  </v-card-text>
</v-card>
```
**Pattern:** Same as SymbolList empty pattern. Icon + message, centered.

### 7.4 Negative P&L State (Visual difference)
When totalPips < 0:
- Pips number turns `text-error` (red)
- Sign prefix: `-` (e.g., "-1,230")
- Win rate bar remains `color="primary"` (green) -- it's still a percentage, not sentiment
- Everything else stays the same

### 7.5 Zero Streak
When streak = 0:
- Display: "0" with `text-medium-emphasis`
- Icon: `mdi-minus` (neutral)
- No W/L suffix

---

## 8. Responsive Behavior

| Breakpoint | Behavior | Changes |
|-----------|----------|---------|
| xs (< 600px) | Primary target | Layout as designed above. `pa-4` card padding. |
| sm (>= 600px) | Slightly more room | No layout change. Contained by 800px max-width. |
| md+ (>= 960px) | Desktop view | Same layout. Card centered in 800px container. Comfortable reading. |

**No layout breakpoint changes needed.** Both Row 1 and Row 2 are now 3-column grids (`v-col cols="4"`) which work at 375px minimum. Vuetify `v-row dense` handles the tight spacing. Icon sizes reduced to 16px in Row 2 to fit narrower columns.

---

## 9. Component File Location

```
app/components/trading/PortfolioOverview.vue
```

### Props Interface
```typescript
// No props needed -- component fetches its own data
// Uses a composable: usePortfolio()
```

### Composable
```typescript
// app/composables/usePortfolio.ts
// GET /api/strategy/portfolio
// Returns: { data, loading, error, fetch }
```

### Integration Point
```vue
<!-- In pages/index.vue, above TradingSymbolList -->
<TradingPortfolioOverview />
```

---

## 10. Placement in Page

```
pages/index.vue layout:

v-container.fluid.page-container.pa-3.pa-sm-4
  +-- Header (avatar + title + refresh)
  +-- Subtitle
  +-- v-divider.mb-4
  +-- [NEW] TradingPortfolioOverview     <-- HERE
  +-- [NEW] v-divider.my-4              <-- Separator
  +-- TradingSymbolList                  <-- Existing
  +-- Footer
  +-- FAB
```

---

## 11. Design Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Single card with zones (not separate cards) | Portfolio is one cohesive dataset. Splitting into multiple cards creates visual fragmentation on mobile. | Multiple small cards, Dashboard grid |
| Total Pips as hero stat (text-h4) | Most important number. Trader opens app to see "am I profitable?" Must be scannable in 1 second. | All stats equal size, Win rate as hero |
| Win Rate bar inside hero zone | Reinforces the hero stat. "How much did I make?" + "How consistent am I?" in one glance. | Separate card for win rate, Circular progress |
| 3-column grid for W/L/Total | These 3 numbers are always read together. Side-by-side comparison is faster than vertical list. | Vertical list, 2+1 layout |
| glass-sheet for stat boxes (not bordered boxes) | Consistent with existing design system. No new border patterns needed. | Bordered boxes like SignalResult entry boxes |
| Open Positions as chip (not stat box) | It's metadata, not a primary stat. Chip communicates "informational tag" not "key metric." | Full stat box, Badge on header |
| Profit Factor threshold colors | PF >= 2.0 is excellent (green), >= 1.5 is good (primary), >= 1.0 is break-even (warning), < 1.0 is losing (red). Industry standard thresholds. | Single color, Binary good/bad |
| Fire icon for winning streak | Universally understood "hot streak" metaphor. Snowflake for losing = "cold." | Arrow icons, Number only |
| No animation on numbers | This section loads once and shows static data. Animation adds latency to "1-second scan" goal. | Count-up animation like SymbolCard strength |
| Max Drawdown always red (P0) | Drawdown is a risk metric — it's never "good." Always displaying in red keeps traders aware of their worst-case scenario. Lungo review: traders must never become complacent about DD. | Dynamic color based on severity, Neutral color |
| Max Drawdown in Row 2 as 3-col (P0) | PF, MaxDD, and Streak are all secondary metrics of equal importance. 3-col matches Row 1 grid rhythm and avoids visual imbalance. | Keep 2-col + add new row, Separate card for MaxDD |
| Open Positions clickable (P0) | Open positions are actionable info — trader wants to see what's open. Chevron icon is universal "navigate forward" affordance. | Keep as static chip, Link text instead of chip |
| Icon size 16px in Row 2 (P0) | 3-col layout is tighter than 2-col. Reducing icon from 18px to 16px + gap from ga-2 to ga-1 ensures content fits on 375px without wrapping. | Keep 18px and accept overflow, Remove icons entirely |
| Today/Week delta below hero (P1) | Recent performance context without leaving the hero zone. Traders want to know "how's today going?" immediately after seeing total. Small text doesn't compete with hero number. | Separate section, Tooltip on hover |
| PF threshold 1.2 instead of 1.0 (P1) | Lungo's insight: PF 1.0-1.2 is technically positive but loses money after spread + commission. Warning at 1.2 is more honest and actionable for real trading. | Keep 1.0 (textbook threshold), Use 1.1 as compromise |
| Delta dash (—) for null data (P1) | API may not have today/week data initially. Dash is universal "no data" symbol. Better than showing 0 (which implies actual zero pips). | Hide delta line entirely, Show "N/A" |

---

## 12. Checklist for Implementation (Cappu)

- [ ] Create `app/composables/usePortfolio.ts`
- [ ] Create `app/components/trading/PortfolioOverview.vue`
- [ ] Add skeleton loading state (updated: Row 2 skeleton is now 3-col)
- [ ] Add error state with retry
- [ ] Add empty state
- [ ] Integrate into `pages/index.vue` above SymbolList
- [ ] Verify all colors match spec (especially dynamic P&L coloring)
- [ ] Verify `font-mono` on all numbers
- [ ] Verify spacing matches spec (`pa-4`, `mb-4`, `mb-3`, `pa-3`)
- [ ] **P0: Max Drawdown** — display in Row 2 col 2, always red, `mdi-trending-down` icon
- [ ] **P0: Open Positions clickable** — `@click` handler, `mdi-chevron-right` end icon, `cursor-pointer`
- [ ] **P1: Today/Week delta** — below hero number, dynamic color, dash for null
- [ ] **P1: PF threshold** — warning at >= 1.2 (not 1.0), error at < 1.2
- [ ] Test on 375px viewport (verify 3-col Row 2 doesn't overflow)
- [ ] Test negative P&L display
- [ ] Test zero streak display
- [ ] Test null todayPips / weekPips (should show dash)
- [ ] Espresso design review before merge

---

## 13. Future Enhancements (P2 — Backlog)

> Items from Lungo's review that are approved in concept but deferred. Add these when the core portfolio section is stable.

### 13.1 Streak Highlight Threshold
- **Current:** Streak always gets color (green for W, red for L)
- **Proposed:** Only highlight streak >= 5 with color. Streak < 5 uses neutral/muted color (`text-medium-emphasis`)
- **Rationale (Lungo):** Short streaks (1-4) are statistically insignificant. Only highlight when the streak is meaningful enough to affect trading psychology.
- **Impact:** Streak color logic needs threshold check

### 13.2 Win Rate Color Thresholds
- **Current:** Win Rate bar is always `color="primary"` (green)
- **Proposed:** Dynamic color based on win rate value:
  - >= 60%: `text-success` (green)
  - >= 50%: `text-primary` (green-ish)
  - >= 40%: `text-warning` (amber)
  - < 40%: `text-error` (red)
- **Rationale:** Win rate below 50% is concerning and should be visually flagged
- **Impact:** Win Rate bar color + percentage text color become dynamic

### 13.3 Average Pips per Trade
- **Current:** Not displayed
- **Proposed:** Add to hero zone or as a new stat box. Shows average pips per closed trade.
- **Calculation:** `totalPips / totalTrades`
- **Rationale:** Avg pips/trade is a key efficiency metric. Helps trader understand if they're making small consistent gains or large volatile swings.
- **Impact:** New API field or client-side calculation. Need to decide placement (hero subtitle vs stat box).
