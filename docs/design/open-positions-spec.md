# Open Positions Section -- Design Spec

> **Designer:** Espresso (Design Guardian)
> **Date:** 2026-03-15
> **Status:** Ready for Implementation (v1)
> **Reference:** `docs/design/design-system.md` v1.0.0
> **Dependency:** Portfolio Overview spec (`portfolio-overview-spec.md`)
> **Trading Analyst Review:** Lungo (P0/P1/P2 priorities applied)

---

## 1. Overview

Open Positions คือ section ที่ 2 ของหน้า Dashboard -- อยู่ใต้ Portfolio Overview
แสดงทุก position ที่เปิดอยู่ในรูปแบบ card-per-position (ไม่ใช่ table)

### Design Goals
- **Floating P&L อ่านได้ทันที** -- ตัวใหญ่สุดใน card, สีชัด (P0)
- **รู้ทันทีว่าถือตัวไหน ฝั่งไหน** -- Symbol + BUY/SELL เด่นชัด (P0)
- **เห็น risk proximity แบบ visual** -- SL Distance Bar บอกว่าใกล้ SL แค่ไหน (P1)
- **Mobile-first 375px** -- Card layout ไม่ใช่ table
- **ไม่สร้าง FOMO** -- Empty state สื่อว่า bot กำลังทำงาน ไม่ใช่ "ไม่มีอะไรเกิดขึ้น"

### API Source
```
GET /api/strategy/positions
```
```json
{
  "success": true,
  "data": [
    {
      "symbol": "USD-JPY",
      "interval": "1h",
      "action": "BUY",
      "entryPrice": "149.250",
      "currentPrice": "149.580",
      "slPrice": "148.950",
      "slLabel": "Fixed 30p",
      "entryTime": "Mar 15 10:00",
      "floatingPips": 33,
      "slDistancePercent": 78,
      "duration": "5h 20m"
    }
  ]
}
```

> **Note:** `currentPrice`, `floatingPips`, `slDistancePercent`, `duration` จะถูกเพิ่มโดย Latte
> Component ต้องรองรับ fields เหล่านี้เป็น `null` ได้ทั้งหมด

---

## 2. Layout Design (Mobile ~375px)

### 2.1 Full Section Layout

```
+-----------------------------------------------+
|  SECTION HEADER                                |
|  [Pulse Icon] OPEN POSITIONS    [2] +85 pips   |
+-----------------------------------------------+

+-----------------------------------------------+
|  POSITION CARD 1  (glass-card)                 |
|                                                |
|  BUY  USD-JPY                    1h   5h 20m   |
|                                                |
|  Entry 149.250       Now 149.580               |
|                                                |
|  [============================--] SL 148.950   |
|   Safe zone (78%)                              |
|                                                |
|            +33 pips                            |
+-----------------------------------------------+
                  mb-3
+-----------------------------------------------+
|  POSITION CARD 2  (glass-card)                 |
|                                                |
|  SELL  XAU-USD                   4h   18h 45m  |
|                                                |
|  Entry 2,985.50      Now 2,995.30              |
|                                                |
|  [========================------] SL 2,995.30  |
|   Danger zone (82%)                            |
|                                                |
|            -98 pips                            |
+-----------------------------------------------+
```

### 2.2 Section Header (Aggregate Summary)

```
+-----------------------------------------------+
|  [Pulse] OPEN POSITIONS       [2]  +85 pips   |
+-----------------------------------------------+

 ^avatar    ^title              ^count ^total P&L
```

- **Left:** Avatar + title (same pattern as Portfolio Overview header)
- **Right:** Position count chip + total floating P&L

### 2.3 Position Card Layout (Detailed)

```
+-----------------------------------------------+  <- glass-card rounded-lg
|  pa-4                                          |
|                                                |
|  [BUY]  USD-JPY               1h    5h 20m    |  <- Row 1: Header
|   chip   symbol(bold)         tf    duration   |
|                                                |
|  glass-sheet rounded-lg pa-3                   |
|  +-------------------------------------------+|
|  | Entry    149.250     Now    149.580        ||  <- Row 2: Prices
|  | (muted)  (mono)      (muted) (mono,white) ||
|  +-------------------------------------------+|
|                                                |
|  glass-sheet rounded-lg pa-3                   |
|  +-------------------------------------------+|
|  | [=============================---]         ||  <- Row 3: SL Bar
|  |  SL 148.950 (Fixed 30p)         78%       ||
|  +-------------------------------------------+|
|                                                |
|         +33 pips                               |  <- Row 4: P&L Hero
|         (text-h5, bold, green, mono)           |
|                                                |
+-----------------------------------------------+
```

### 2.4 Layout Breakdown (4 Rows per Card)

**Row 1: Header** -- Symbol identity + context
- BUY/SELL chip (color-coded) + Symbol name (bold) + TF chip (muted) + Duration

**Row 2: Price Context** -- Entry vs Current (inside glass-sheet)
- Two-column layout: Entry price | Current price
- Provides context for the P&L number

**Row 3: SL Distance Bar** -- Risk visual (inside glass-sheet)
- Progress bar showing how far price has moved toward SL
- Color changes based on proximity (green > yellow > red)
- SL price + SL label + percentage

**Row 4: P&L Hero** -- The most important number
- Floating P&L in pips, largest font in card
- Green for profit, red for loss
- Centered, visually dominant

---

## 3. Component Structure

### 3.1 Section Wrapper

```vue
<!-- In pages/index.vue, below PortfolioOverview -->
<TradingOpenPositions />
```

### 3.2 Section Header

```vue
<div class="d-flex align-center ga-3 mb-3">
  <!-- Left: Icon + Title -->
  <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
    <v-icon icon="mdi-chart-timeline-variant-shimmer" size="22" />
  </v-avatar>
  <div class="flex-grow-1">
    <div class="text-subtitle-1 font-weight-bold">OPEN POSITIONS</div>
  </div>
  <!-- Right: Count + Total P&L -->
  <div class="d-flex align-center ga-2">
    <v-chip size="x-small" variant="tonal" color="info" class="font-mono font-weight-bold">
      {{ positions.length }}
    </v-chip>
    <span
      class="text-caption font-weight-bold font-mono"
      :class="totalPlColorClass"
    >
      {{ formatPips(totalFloatingPips) }} pips
    </span>
  </div>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Avatar | `size="40" rounded="lg" color="primary" variant="tonal"` | Match Portfolio Overview header pattern |
| Icon | `mdi-chart-timeline-variant-shimmer size="22"` | Same icon as Portfolio Overview's "Open Positions" chip -- consistency |
| Title | `text-subtitle-1 font-weight-bold` | Section-level title, same as Portfolio Overview |
| Count chip | `size="x-small" variant="tonal" color="info" font-mono font-weight-bold` | Shows position count. Info color = informational. |
| Total P&L | `text-caption font-weight-bold font-mono` + dynamic color | Aggregate floating P&L. Green/red based on sign. |
| Gap | `ga-3` (12px) | Standard header gap |
| Bottom margin | `mb-3` (12px) | Tighter than Portfolio Overview's mb-4 -- cards follow immediately |

**Total Floating P&L Logic:**
```typescript
const totalFloatingPips = computed(() => {
  return positions.value.reduce((sum, p) => {
    return sum + (p.floatingPips ?? 0)
  }, 0)
})

const totalPlColorClass = computed(() => {
  if (totalFloatingPips.value > 0) return 'text-success'
  if (totalFloatingPips.value < 0) return 'text-error'
  return 'text-medium-emphasis'
})
```

### 3.3 Position Card -- Outer Container

```vue
<v-card
  v-for="position in positions"
  :key="position.symbol + position.entryTime"
  elevation="0"
  rounded="lg"
  class="glass-card mb-3"
>
  <v-card-text class="pa-4">
    <!-- Row 1: Header -->
    <!-- Row 2: Prices -->
    <!-- Row 3: SL Distance Bar -->
    <!-- Row 4: P&L Hero -->
  </v-card-text>
</v-card>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Card | `v-card elevation="0" rounded="lg" class="glass-card"` | Standard glass-card pattern |
| Gap between cards | `mb-3` (12px) | Standard card stack gap |
| Padding | `pa-4` (16px) | Standard card content padding |

### 3.4 Row 1: Card Header (Symbol + Direction + TF + Duration)

```vue
<!-- Row 1: Header -->
<div class="d-flex align-center ga-2 mb-3">
  <!-- Direction chip -->
  <v-chip
    :color="position.action === 'BUY' ? 'success' : 'error'"
    size="x-small"
    variant="flat"
    class="font-weight-black"
  >
    {{ position.action }}
  </v-chip>

  <!-- Symbol -->
  <span class="text-subtitle-1 font-weight-bold">{{ position.symbol }}</span>

  <v-spacer />

  <!-- Timeframe -->
  <span class="text-caption text-label-muted font-weight-medium">
    {{ position.interval }}
  </span>

  <!-- Duration (P2, shown if available) -->
  <span
    v-if="position.duration"
    class="text-caption text-medium-emphasis font-mono"
  >
    <v-icon icon="mdi-clock-outline" size="12" class="mr-1" />{{ position.duration }}
  </span>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Direction chip | `size="x-small" variant="flat" font-weight-black` | BUY = `color="success"` (green), SELL = `color="error"` (red). Flat variant for strong visual. |
| Symbol | `text-subtitle-1 font-weight-bold` | Second most prominent after P&L. Bold for quick scanning. |
| TF | `text-caption text-label-muted font-weight-medium` | Secondary context, muted. |
| Duration | `text-caption text-medium-emphasis font-mono` | P2 data, shown when available. Clock icon for clarity. |
| Gap | `ga-2` (8px) | Tighter than section header -- items are related |
| Bottom margin | `mb-3` (12px) | Standard row gap |

### 3.5 Row 2: Price Context (Entry vs Current)

```vue
<!-- Row 2: Prices -->
<div class="glass-sheet rounded-lg pa-3 mb-3">
  <div class="d-flex justify-space-between">
    <!-- Entry Price -->
    <div>
      <div class="text-caption text-label-muted font-weight-medium mb-1">Entry</div>
      <div class="text-body-2 font-weight-bold font-mono">
        {{ position.entryPrice }}
      </div>
    </div>

    <!-- Arrow -->
    <div class="d-flex align-center">
      <v-icon
        icon="mdi-arrow-right"
        size="16"
        class="text-label-muted"
      />
    </div>

    <!-- Current Price -->
    <div class="text-right">
      <div class="text-caption text-label-muted font-weight-medium mb-1">Now</div>
      <div class="text-body-2 font-weight-bold font-mono" :class="plColorClass(position)">
        {{ position.currentPrice ?? '---' }}
      </div>
    </div>
  </div>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Container | `glass-sheet rounded-lg pa-3` | Inner surface pattern, groups related price data |
| Layout | `d-flex justify-space-between` | Entry left, arrow center, current right |
| Label | `text-caption text-label-muted font-weight-medium mb-1` | Standard muted label above value |
| Entry price | `text-body-2 font-weight-bold font-mono` | Monospace for number alignment. Default white -- entry is neutral. |
| Arrow | `mdi-arrow-right size="16" text-label-muted` | Visual "from entry to now" flow. Muted so it doesn't compete. |
| Current price | `text-body-2 font-weight-bold font-mono` + dynamic color | Same size as entry but color-coded: green if profitable direction, red if losing. |
| Null handling | `'---'` when currentPrice is null | Three dashes = "awaiting data". Short, doesn't look broken. |
| Bottom margin | `mb-3` (12px) | Standard row gap |

**Current Price Color Logic:**
```typescript
function plColorClass(position: Position): string {
  if (position.floatingPips == null) return ''  // no color = white (no data yet)
  if (position.floatingPips > 0) return 'text-success'
  if (position.floatingPips < 0) return 'text-error'
  return 'text-medium-emphasis'  // exactly 0
}
```

### 3.6 Row 3: SL Distance Bar (Risk Visual)

```vue
<!-- Row 3: SL Distance -->
<div class="glass-sheet rounded-lg pa-3 mb-3">
  <!-- Progress bar -->
  <v-progress-linear
    :model-value="position.slDistancePercent ?? 0"
    :color="slBarColor(position.slDistancePercent)"
    bg-color="#2A2A2A"
    rounded
    height="6"
    class="mb-2"
  />

  <!-- SL info row -->
  <div class="d-flex justify-space-between align-center">
    <div class="text-caption text-label-muted">
      SL
      <span class="font-mono font-weight-medium text-medium-emphasis">
        {{ position.slPrice }}
      </span>
      <span class="text-medium-emphasis ml-1">({{ position.slLabel }})</span>
    </div>
    <span
      class="text-caption font-weight-bold font-mono"
      :class="slPercentColorClass(position.slDistancePercent)"
    >
      {{ position.slDistancePercent != null ? position.slDistancePercent + '%' : '--' }}
    </span>
  </div>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Container | `glass-sheet rounded-lg pa-3` | Same inner surface as price row |
| Progress bar | `v-progress-linear height="6" rounded bg-color="#2A2A2A"` | Exact same spec as Portfolio Overview win rate bar |
| Bar color | Dynamic based on slDistancePercent (see color logic below) | Core risk visual -- color = urgency |
| SL price | `text-caption font-mono font-weight-medium text-medium-emphasis` | Secondary info, monospace |
| SL label | `text-caption text-medium-emphasis` | Context for SL type (Fixed, ATR, etc.) |
| Percentage | `text-caption font-weight-bold font-mono` + dynamic color | Matches bar color for reinforcement |
| Bar margin | `mb-2` (8px) | Small gap between bar and info text |
| Bottom margin | `mb-3` (12px) | Standard row gap before P&L hero |

**SL Distance Bar -- Color Logic (Lungo's P1 requirement):**

> `slDistancePercent` = 0% means price is at entry, 100% means price is at SL.
> This measures how much of the distance to SL has been consumed.
> **Higher % = more risk = closer to SL.**

```typescript
function slBarColor(percent: number | null): string {
  if (percent == null) return '#2A2A2A'     // no data = dark (invisible bar)
  if (percent < 50) return '#4CAF50'        // success green -- safe zone
  if (percent < 75) return '#FB8C00'        // warning amber -- caution
  return '#FF5252'                           // error red -- danger zone
}

function slPercentColorClass(percent: number | null): string {
  if (percent == null) return 'text-medium-emphasis'
  if (percent < 50) return 'text-success'
  if (percent < 75) return 'text-warning'
  return 'text-error'
}
```

| Threshold | Bar Color | Meaning | Rationale |
|-----------|-----------|---------|-----------|
| 0-49% | `#4CAF50` (success green) | Safe zone -- price far from SL | Trader can relax. Position has room to breathe. |
| 50-74% | `#FB8C00` (warning amber) | Caution -- price moving toward SL | Trader should pay attention. Not critical yet. |
| 75-100% | `#FF5252` (error red) | Danger zone -- price near SL | Position is at high risk of being stopped out. Immediate awareness needed. |

**SL Bar Direction Note:**
- Bar fills from **left to right**
- 0% = empty (at entry) to 100% = full (at SL)
- This is **inverted** from a typical "progress" bar -- here, more fill = more risk
- The color shift reinforces this: green (safe) transitions to red (danger)

**Null slDistancePercent:**
- Bar shows 0 fill with `#2A2A2A` bg (effectively invisible)
- Percentage shows `--`
- SL price still shows (it comes from existing API)

### 3.7 Row 4: Floating P&L Hero

```vue
<!-- Row 4: Floating P&L (Hero) -->
<div class="text-center">
  <span
    v-if="position.floatingPips != null"
    class="text-h5 font-weight-black font-mono"
    :class="plColorClass(position)"
  >
    {{ formatFloatingPips(position.floatingPips) }} pips
  </span>
  <span
    v-else
    class="text-h5 font-weight-black font-mono text-medium-emphasis"
  >
    --- pips
  </span>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Size | `text-h5 font-weight-black font-mono` | Largest element in card. Hero stat per Lungo's P0. `text-h5` (~24px) not `text-h4` (~34px) because this is card-level hero, not page-level hero like Portfolio's Total Pips. |
| Color | Dynamic: `text-success` (positive), `text-error` (negative), `text-medium-emphasis` (zero/null) | P0 requirement: profit green, loss red. |
| Alignment | `text-center` | Centered for visual impact. Draws eye to the middle of card. |
| Format | `+33 pips` / `-98 pips` / `0 pips` / `--- pips` | Always show sign prefix. Include "pips" unit for context. |
| Null handling | `--- pips` in `text-medium-emphasis` | Awaiting data state. Three dashes consistent with current price null state. |

**Floating P&L Formatting:**
```typescript
function formatFloatingPips(pips: number): string {
  const prefix = pips > 0 ? '+' : ''
  return `${prefix}${pips.toLocaleString('en-US')}`
}
// +33 / -98 / 0 / +1,250
```

---

## 4. Empty State

> Lungo: "อย่า induce FOMO" -- ข้อความต้องสื่อว่า bot กำลังทำงาน ไม่ใช่ว่า "ไม่มีอะไรทำ"

```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4 text-center">
    <v-icon
      icon="mdi-radar"
      size="48"
      class="text-medium-emphasis mb-2"
    />
    <div class="text-body-2 text-medium-emphasis">
      No open positions
    </div>
    <div class="text-caption text-label-muted mt-1">
      Bot is scanning for optimal setups
    </div>
  </v-card-text>
</v-card>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Icon | `mdi-radar size="48" text-medium-emphasis` | Radar = actively scanning. Communicates "working, not idle." |
| Main text | `text-body-2 text-medium-emphasis` | "No open positions" -- factual, neutral |
| Sub text | `text-caption text-label-muted` | "Bot is scanning for optimal setups" -- reassuring, no FOMO |
| Pattern | Same as Portfolio Overview empty state | Centered icon + text, consistent |

**Why not "Waiting for setup":** "Waiting" sounds passive. "Scanning" sounds active. Lungo's directive: don't make the user feel like they're missing out.

---

## 5. Loading State

```vue
<!-- Section header skeleton -->
<div class="d-flex align-center ga-3 mb-3">
  <v-skeleton-loader type="avatar" width="40" height="40" />
  <v-skeleton-loader type="text" width="160" class="flex-grow-1" />
  <v-skeleton-loader type="chip" width="80" />
</div>

<!-- Position card skeletons (show 2 placeholder cards) -->
<v-card
  v-for="i in 2"
  :key="i"
  elevation="0"
  rounded="lg"
  class="glass-card mb-3"
>
  <v-card-text class="pa-4">
    <!-- Row 1: Header skeleton -->
    <div class="d-flex align-center ga-2 mb-3">
      <v-skeleton-loader type="chip" width="50" />
      <v-skeleton-loader type="text" width="100" />
      <v-spacer />
      <v-skeleton-loader type="text" width="60" />
    </div>

    <!-- Row 2: Prices skeleton -->
    <v-sheet rounded="lg" class="glass-sheet pa-3 mb-3">
      <div class="d-flex justify-space-between">
        <v-skeleton-loader type="text@2" width="80" />
        <v-skeleton-loader type="text@2" width="80" />
      </div>
    </v-sheet>

    <!-- Row 3: SL bar skeleton -->
    <v-sheet rounded="lg" class="glass-sheet pa-3 mb-3">
      <v-skeleton-loader type="text" width="100%" class="mb-1" />
      <v-skeleton-loader type="text" width="60%" />
    </v-sheet>

    <!-- Row 4: P&L skeleton -->
    <div class="text-center">
      <v-skeleton-loader type="heading" width="120" class="mx-auto" />
    </div>
  </v-card-text>
</v-card>
```

**Pattern:** 2 skeleton cards shown during loading. Matches exact card structure so the transition to data is seamless.

---

## 6. Error State

```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4">
    <v-alert type="error" variant="tonal" class="mb-0">
      Failed to load open positions
      <template #append>
        <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
      </template>
    </v-alert>
  </v-card-text>
</v-card>
```

**Pattern:** Same as Portfolio Overview error state. Tonal alert with retry action.

---

## 7. Color Mapping Summary

| Data Point | Condition | Color Class | Hex |
|-----------|-----------|-------------|-----|
| BUY chip | action = BUY | `color="success"` | `#4CAF50` |
| SELL chip | action = SELL | `color="error"` | `#FF5252` |
| Floating P&L | > 0 | `text-success` | `#4CAF50` |
| Floating P&L | < 0 | `text-error` | `#FF5252` |
| Floating P&L | = 0 or null | `text-medium-emphasis` | grey |
| Current price | profit direction | `text-success` | `#4CAF50` |
| Current price | loss direction | `text-error` | `#FF5252` |
| Current price | null | default (white) | -- |
| SL bar | 0-49% | `#4CAF50` | success green |
| SL bar | 50-74% | `#FB8C00` | warning amber |
| SL bar | 75-100% | `#FF5252` | error red |
| SL bar | null | `#2A2A2A` | dark (no bar visible) |
| SL percentage text | 0-49% | `text-success` | green |
| SL percentage text | 50-74% | `text-warning` | amber |
| SL percentage text | 75-100% | `text-error` | red |
| SL percentage text | null | `text-medium-emphasis` | grey |
| Total P&L (header) | > 0 | `text-success` | `#4CAF50` |
| Total P&L (header) | < 0 | `text-error` | `#FF5252` |
| Total P&L (header) | = 0 | `text-medium-emphasis` | grey |
| Position count chip | always | `color="info"` | `#2196F3` |

---

## 8. Typography Spec

| Element | Classes | Font | Size | Weight |
|---------|---------|------|------|--------|
| Section title | `text-subtitle-1 font-weight-bold` | Noto Sans Thai | 16px | 700 |
| Position count chip | `font-mono font-weight-bold` | JetBrains Mono | ~12px | 700 |
| Total P&L (header) | `text-caption font-weight-bold font-mono` | JetBrains Mono | 12px | 700 |
| Direction chip (BUY/SELL) | `font-weight-black` (chip default size) | Noto Sans Thai | ~10px | 900 |
| Symbol name | `text-subtitle-1 font-weight-bold` | Noto Sans Thai | 16px | 700 |
| TF label | `text-caption text-label-muted font-weight-medium` | Noto Sans Thai | 12px | 500 |
| Duration | `text-caption text-medium-emphasis font-mono` | JetBrains Mono | 12px | 400 |
| Price label (Entry/Now) | `text-caption text-label-muted font-weight-medium` | Noto Sans Thai | 12px | 500 |
| Price value | `text-body-2 font-weight-bold font-mono` | JetBrains Mono | 14px | 700 |
| SL price | `text-caption font-mono font-weight-medium` | JetBrains Mono | 12px | 500 |
| SL label | `text-caption text-medium-emphasis` | Noto Sans Thai | 12px | 400 |
| SL percentage | `text-caption font-weight-bold font-mono` | JetBrains Mono | 12px | 700 |
| Floating P&L | `text-h5 font-weight-black font-mono` | JetBrains Mono | 24px | 900 |
| "pips" unit (in P&L) | included in same span | JetBrains Mono | 24px | 900 |
| Empty state main | `text-body-2 text-medium-emphasis` | Noto Sans Thai | 14px | 400 |
| Empty state sub | `text-caption text-label-muted` | Noto Sans Thai | 12px | 400 |

---

## 9. Spacing Spec

| Gap | Value | Vuetify | Between |
|-----|-------|---------|---------|
| Section header to first card | 12px | `mb-3` | Header row to card stack |
| Between position cards | 12px | `mb-3` | Card to card |
| Card internal padding | 16px | `pa-4` | Card outer padding |
| Header row items | 8px | `ga-2` | Within card header |
| Header to prices | 12px | `mb-3` | Row 1 to Row 2 |
| Price box padding | 12px | `pa-3` | Inside glass-sheet |
| Prices to SL bar | 12px | `mb-3` | Row 2 to Row 3 |
| SL bar box padding | 12px | `pa-3` | Inside glass-sheet |
| SL bar to P&L | 12px | `mb-3` | Row 3 to Row 4 |
| Price label to value | 4px | `mb-1` | "Entry" label to price number |
| Progress bar to SL info | 8px | `mb-2` | Bar to text below |
| Section header icon gap | 12px | `ga-3` | Avatar to title |
| Header right items gap | 8px | `ga-2` | Count chip to total P&L |

---

## 10. SL Distance Bar -- Detailed Specification

### 10.1 Concept
The SL Distance Bar is a **risk proximity indicator**. It shows visually how much of the distance between entry price and stop-loss price has been consumed by the current price movement.

### 10.2 Data Mapping
```
slDistancePercent: 0%   = price at entry (no risk consumed)
slDistancePercent: 50%  = price halfway to SL
slDistancePercent: 100% = price at SL (about to be stopped out)
```

### 10.3 Visual Design
- Uses `v-progress-linear` -- same component as Portfolio Overview win rate bar
- Height: 6px (standard)
- Border radius: `rounded`
- Background: `#2A2A2A` (standard dark fill)
- Fill direction: left to right (0% to 100%)

### 10.4 Color Zones (3-tier)

```
|  GREEN (0-49%)  |  AMBER (50-74%)  |  RED (75-100%)  |
|  #4CAF50        |  #FB8C00         |  #FF5252        |
|  Safe zone      |  Caution         |  Danger zone    |
```

### 10.5 Semantic Meaning
- The bar is **not** a "progress toward goal" -- it's a "progress toward loss"
- Color reinforces urgency: the trader doesn't need to read the number to feel the risk
- Combined with the P&L number below, this gives a complete picture:
  - Green bar + positive P&L = position is healthy
  - Red bar + negative P&L = position is in trouble
  - Green bar + negative P&L = price moved against entry but SL is far (wide SL)
  - Red bar + positive P&L = (unusual, would mean SL was placed very tight)

### 10.6 Edge Cases
| Case | Bar | Percentage | Color |
|------|-----|-----------|-------|
| `slDistancePercent = null` | Empty (0 fill) | `--` | `#2A2A2A` (invisible) |
| `slDistancePercent = 0` | Empty (0 fill) | `0%` | `#4CAF50` (green) |
| `slDistancePercent > 100` | Full (capped at 100) | `>100%` display as `100%` | `#FF5252` (red) |
| `slDistancePercent < 0` | Empty (capped at 0) | Display as `0%` | `#4CAF50` (green) |

---

## 11. Null / Partial Data Handling

Fields that may be null (API not yet updated by Latte):

| Field | If Null | Display |
|-------|---------|---------|
| `currentPrice` | No current price | `---` in default white |
| `floatingPips` | No P&L data | `--- pips` in `text-medium-emphasis` |
| `slDistancePercent` | No distance data | Bar invisible, percentage shows `--` |
| `duration` | No duration data | Duration element hidden entirely (`v-if`) |

**Principle:** Existing API fields (`symbol`, `action`, `entryPrice`, `slPrice`, `slLabel`, `interval`, `entryTime`) are always present. New fields may be null until Latte's API update is deployed.

**The card must look complete even with null new fields.** The SL bar simply won't show fill, the P&L shows dashes, and duration is hidden. No broken layouts.

---

## 12. Responsive Behavior

| Breakpoint | Behavior | Changes |
|-----------|----------|---------|
| xs (< 600px) | Primary target | Layout as designed above. Full-width cards. |
| sm (>= 600px) | Same layout | Contained by 800px max-width. No layout change. |
| md+ (>= 960px) | Same layout | Cards centered in 800px container. |

**No breakpoint layout changes needed.** Card layout is single-column and works from 375px up. All content within cards uses flexible layout (`d-flex`, `justify-space-between`) that adapts naturally.

---

## 13. Placement in Page

```
pages/index.vue layout:

v-container.fluid.page-container.pa-3.pa-sm-4
  +-- Header (avatar + title + refresh)
  +-- Subtitle
  +-- v-divider.mb-4
  +-- TradingPortfolioOverview          <-- Section 1
  +-- div.my-4                          <-- Spacer (16px top + bottom)
  +-- TradingOpenPositions              <-- Section 2 (THIS)
  +-- div.my-4                          <-- Spacer
  +-- TradingSymbolList                 <-- Existing
  +-- Footer
  +-- FAB
```

**Separator:** Use `div.my-4` (16px vertical margin) between sections instead of `v-divider` -- keeps the dark theme clean without hard lines between sections. Portfolio Overview card's glass-card border already provides visual boundary.

---

## 14. Component File Structure

```
app/components/trading/
  OpenPositions.vue          <-- Main section component

app/composables/
  useOpenPositions.ts        <-- Data fetching composable
```

### Props Interface
```typescript
// No props -- component fetches its own data
// Uses composable: useOpenPositions()
```

### Composable Interface
```typescript
// app/composables/useOpenPositions.ts
// GET /api/strategy/positions
// Returns: { positions, loading, error, fetch }

interface Position {
  symbol: string
  interval: string
  action: 'BUY' | 'SELL'
  entryPrice: string
  currentPrice: string | null
  slPrice: string
  slLabel: string
  entryTime: string
  floatingPips: number | null
  slDistancePercent: number | null
  duration: string | null
}
```

---

## 15. Design Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Card-per-position (not table) | Table is unusable on 375px with 6+ columns. Card gives proper visual hierarchy and room for the SL distance bar. Lungo's explicit directive. | v-data-table with horizontal scroll, Compact row layout |
| P&L as card hero (bottom, centered, largest) | Lungo's P0: "Floating P&L must be the most prominent element." Centered at bottom creates a natural reading flow: identity -> context -> risk -> result. | P&L in header row, P&L inline with prices |
| text-h5 for P&L (not text-h4) | text-h4 (34px) is reserved for page-level hero (Portfolio Total Pips). Card-level hero uses text-h5 (24px) to maintain hierarchy. Multiple text-h4 on the same page would break visual hierarchy. | text-h4 (too large for card), text-h6 (too small for hero) |
| SL Distance Bar as v-progress-linear | Reuses exact same component and style as Portfolio Overview win rate bar. No new patterns. Traders already understand this visual from other trading platforms. | Custom SVG bar, Circular indicator, Text-only percentage |
| 3-tier color system for SL bar | Green/amber/red is universal traffic light system. Three tiers provide enough granularity without overwhelming. Lungo's requirement. | Binary green/red, 5-tier gradient, Single color with opacity |
| SL bar thresholds: 50% and 75% | 50% = half distance consumed is the natural "pay attention" point. 75% = three-quarters consumed is "critical." These are common risk management thresholds in trading. | 33%/66% (equal thirds), 40%/70%, 60%/80% |
| Entry vs Current side-by-side (not stacked) | Horizontal layout enables instant comparison. Trader sees the relationship between entry and current at a glance. Arrow reinforces the "from -> to" direction. | Stacked vertically, Inline with labels |
| Duration shown but P2 priority | Duration is context, not actionable data. Trader rarely makes decisions based on "how long open." Hiding when null keeps card clean. | Always show with fallback, Show in header as badge |
| Empty state: "Bot is scanning" | Lungo: "Don't induce FOMO." Empty state must communicate that the system is actively working, not that the user is missing trades. Radar icon reinforces "scanning." | "No positions yet", "Waiting for signal", "Nothing to show" |
| mdi-radar for empty state icon | Radar communicates active scanning/searching. More dynamic than a static chart icon. Matches the "bot is working" narrative. | mdi-chart-box-outline, mdi-clock-outline, mdi-sleep |
| Section spacer div.my-4 (not v-divider) | Dark theme with glass cards already has clear visual boundaries. Adding divider lines creates clutter. Vertical spacing alone is sufficient separation. | v-divider.my-4, No spacer (mb-4 on section only) |
| 2 skeleton cards in loading | Shows the user what shape the content will take. 2 cards is enough to communicate "this is a list" without over-promising. | 1 skeleton (too minimal), 3 skeletons (too many), Spinner only |
| Total floating P&L in section header | Aggregate summary gives quick overview without reading each card. Matches Lungo's "Aggregate Summary" requirement. Placed in header to avoid an extra card/element. | Separate summary card above, Inside first card |
| font-weight-black on BUY/SELL chip | Maximum contrast on the direction indicator. BUY/SELL is critical information that must never be ambiguous. Black weight on colored chip ensures readability. | font-weight-bold, Normal weight |

---

## 16. Checklist for Implementation (Cappu)

### Setup
- [ ] Create `app/composables/useOpenPositions.ts`
- [ ] Create `app/components/trading/OpenPositions.vue`
- [ ] Add TypeScript interface `Position` in `types/trading.ts`

### Section Header
- [ ] Avatar + title matching Portfolio Overview pattern
- [ ] Position count chip (info tonal, x-small)
- [ ] Total floating P&L with dynamic color

### Position Card
- [ ] Glass-card outer container
- [ ] Row 1: BUY/SELL chip + symbol + TF + duration
- [ ] Row 2: Entry vs Current price in glass-sheet
- [ ] Row 3: SL Distance Bar with 3-tier color
- [ ] Row 4: Floating P&L hero (text-h5, centered)

### SL Distance Bar
- [ ] v-progress-linear with dynamic color
- [ ] Color thresholds: <50% green, 50-74% amber, 75%+ red
- [ ] SL price + label + percentage display
- [ ] Percentage text color matches bar color
- [ ] Handle null slDistancePercent (invisible bar, `--` text)
- [ ] Cap at 0-100 range

### States
- [ ] Loading: 2 skeleton cards matching card structure
- [ ] Error: tonal alert with retry
- [ ] Empty: radar icon + "Bot is scanning" message
- [ ] Null currentPrice: `---`
- [ ] Null floatingPips: `--- pips` in grey
- [ ] Null duration: hidden (`v-if`)
- [ ] Null slDistancePercent: bar invisible, `--` text

### Colors & Typography
- [ ] All numbers use `font-mono` (JetBrains Mono)
- [ ] BUY = success, SELL = error
- [ ] P&L dynamic: green > 0, red < 0, grey = 0/null
- [ ] SL bar 3-tier color system
- [ ] Total P&L in header: dynamic color

### Integration
- [ ] Add to `pages/index.vue` below Portfolio Overview
- [ ] `div.my-4` spacer between sections
- [ ] Verify on 375px viewport
- [ ] Test with 0 positions (empty state)
- [ ] Test with null new API fields
- [ ] Test with negative floating P&L
- [ ] Espresso design review before merge
