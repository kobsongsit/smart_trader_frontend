# Monthly Performance Section -- Design Spec

> **Designer:** Espresso (Design Guardian)
> **Date:** 2026-03-15
> **Status:** Ready for Implementation (v1.1 -- Lungo review applied)
> **Reference:** `docs/design/design-system.md` v1.0.0
> **Page:** `/performance` (Bottom Navigation tab 3)
> **Dependencies:** Follows patterns from Portfolio Overview, Open Positions, Trade History specs
> **Data Source:** Same as Trade History -- aggregated from StrategyPosition (CLOSED)

---

## 1. Overview

Monthly Performance คือหน้าสรุป performance รายเดือน
ให้ trader เห็น trend ว่าแต่ละเดือนกำไร/ขาดทุนเท่าไหร่ ทั้ง overall และ per-symbol

### Design Goals
- **Monthly trend at a glance** -- bar chart แสดง P&L แต่ละเดือน เห็น trend ทันที
- **Cumulative tracking** -- running total สะสมให้รู้ว่า overall กำไรมาเท่าไหร่แล้ว
- **Symbol-level insight** -- breakdown per symbol ในแต่ละเดือน ดูว่าตัวไหนทำกำไร/ขาดทุน
- **Timeframe-level insight** -- breakdown per timeframe ในแต่ละเดือน ดูว่า TF ไหนทำกำไร/ขาดทุน
- **Best/Worst trade** -- highlight เทรดที่ดีที่สุด/แย่ที่สุดในแต่ละเดือน
- **Mobile-first 375px** -- single column layout, no horizontal scroll
- **Consistent** -- glass-card, font-mono, color mapping เดียวกับทั้งระบบ

### API Source
```
GET /api/strategy/performance/monthly
```
```json
{
  "success": true,
  "data": {
    "months": [
      {
        "month": "2026-03",
        "label": "Mar 2026",
        "totalPips": 483,
        "wins": 18,
        "losses": 7,
        "totalTrades": 25,
        "winRate": 72.0,
        "profitFactor": 2.85,
        "cumulativePips": 6492,
        "bestTrade": {
          "symbol": "USD-JPY",
          "action": "BUY",
          "pips": 87,
          "date": "2026-03-03",
          "interval": "4h"
        },
        "worstTrade": {
          "symbol": "GBP-JPY",
          "action": "SELL",
          "pips": -45,
          "date": "2026-03-08",
          "interval": "1h"
        },
        "symbols": [
          {
            "symbol": "USD-JPY",
            "totalPips": 245,
            "wins": 8,
            "losses": 3,
            "totalTrades": 11
          },
          {
            "symbol": "EUR-USD",
            "totalPips": 120,
            "wins": 5,
            "losses": 2,
            "totalTrades": 7
          },
          {
            "symbol": "GBP-JPY",
            "totalPips": -32,
            "wins": 2,
            "losses": 1,
            "totalTrades": 3
          },
          {
            "symbol": "XAU-USD",
            "totalPips": 150,
            "wins": 3,
            "losses": 1,
            "totalTrades": 4
          }
        ],
        "intervals": [
          {
            "interval": "1h",
            "wins": 12,
            "losses": 4,
            "totalPips": 320
          },
          {
            "interval": "4h",
            "wins": 5,
            "losses": 2,
            "totalPips": 190
          },
          {
            "interval": "15m",
            "wins": 1,
            "losses": 1,
            "totalPips": -27
          }
        ]
      }
    ]
  }
}
```

> **Note:** `months` array is sorted newest-first. `cumulativePips` is running total up to and including that month. `symbols` breakdown within each month.

---

## 2. Layout Design (Mobile ~375px)

### 2.1 Full Page Layout

```
+-----------------------------------------------+
|  PAGE HEADER                                   |
|  [Chart Icon]  PERFORMANCE                     |
|                Monthly summary                 |
+-----------------------------------------------+

+-----------------------------------------------+
|  CUMULATIVE HERO  (glass-card)                 |
|                                                |
|  CUMULATIVE P&L                                |
|       +6,492 pips                              |
|  Since Oct 2025  |  6 months                   |
+-----------------------------------------------+
                 mb-3
+-----------------------------------------------+
|  MONTHLY BAR CHART  (glass-card)               |
|                                                |
|  MONTHLY P&L              oldest -> newest     |
|                                                |
|  Oct  [===========] +980                       |
|  Nov  [========] +720                          |
|  Dec  [=============] +1,150                   |
|  Jan  [===] +310                               |
|  Feb  [=========] +849                         |
|  Mar  [=====] +483                             |
|                                                |
+-----------------------------------------------+
                 mb-3
+-----------------------------------------------+
|  MONTH DETAIL CARD  (glass-card)               |
|  (tappable month from chart selects this)      |
|                                                |
|  MAR 2026                         +483 pips    |
|                                                |
|  25 trades  |  72% WR  |  PF 2.85             |
|                                                |
|  --- Best / Worst Trade ---                    |
|  BEST:  BUY USD-JPY  +87 pips  (Mar 3, 4h)    |
|  WORST: SELL GBP-JPY -45 pips  (Mar 8, 1h)    |
|                                                |
|  --- Symbol Breakdown ---                      |
|                                                |
|  USD-JPY    8W 3L    [========] +245           |
|  XAU-USD    3W 1L    [======]  +150            |
|  EUR-USD    5W 2L    [=====]   +120            |
|  GBP-JPY    2W 1L    [==]     -32              |
|                                                |
|  --- Timeframe Breakdown ---                   |
|                                                |
|  1h     12W 4L    [========] +320              |
|  4h      5W 2L    [======]  +190               |
|  15m     1W 1L    [==]      -27                |
|                                                |
+-----------------------------------------------+
                 mb-3
+-----------------------------------------------+
|  PREVIOUS MONTHS  (collapsed cards)            |
|                                                |
|  +------------------------------------------+ |
|  | Feb 2026  25 trades | 72% WR | PF 2.85   | |
|  |                              +849 pips    | |
|  +------------------------------------------+ |
|  | Jan 2026  20 trades | 65% WR | PF 1.80   | |
|  |                              +310 pips    | |
|  +------------------------------------------+ |
|  | Dec 2025  28 trades | 75% WR | PF 3.10   | |
|  |                            +1,150 pips    | |
|  +------------------------------------------+ |
|  | Nov 2025  22 trades | 68% WR | PF 2.20   | |
|  |                              +720 pips    | |
|  +------------------------------------------+ |
|  | Oct 2025  18 trades | 70% WR | PF 2.50   | |
|  |                              +980 pips    | |
|  +------------------------------------------+ |
|                                                |
+-----------------------------------------------+

+-----------------------------------------------+
| [Dashboard] [History] [Performance]            |
+-----------------------------------------------+
```

### 2.2 Layout Breakdown (5 Zones)

**Zone A: Page Header** (top, scrolls away)
- Avatar + Title + Subtitle

**Zone B: Cumulative Hero** (page-level hero stat)
- Total pips across all months -- biggest number on page
- Since date + month count

**Zone C: Monthly Bar Chart** (visual trend)
- Horizontal CSS bars showing each month's P&L
- Green bars = profit months, red bars = loss months
- Provides immediate visual pattern recognition

**Zone D: Month Detail** (expanded view of selected/current month)
- Full stats for selected month
- Symbol-level breakdown with mini bars

**Zone E: Previous Months** (compact list)
- Collapsed cards for other months -- tappable to expand into Zone D

---

## 3. Component Structure

### 3.1 Page Container

```vue
<!-- pages/performance.vue -->
<v-container fluid class="page-container pa-3 pa-sm-4">
  <!-- Zone A: Header -->
  <!-- Zone B: Cumulative Hero -->
  <!-- Zone C: Monthly Bar Chart -->
  <!-- Zone D: Month Detail -->
  <!-- Zone E: Previous Months -->
</v-container>
```

### 3.2 Zone A: Page Header

```vue
<div class="d-flex align-center ga-3 mb-1">
  <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
    <v-icon icon="mdi-chart-bar" size="22" />
  </v-avatar>
  <div>
    <div class="text-h5 font-weight-bold">PERFORMANCE</div>
  </div>
</div>
<div class="text-caption text-label-muted mb-4">Monthly summary</div>
<v-divider class="mb-4" />
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Avatar | `size="40" rounded="lg" color="primary" variant="tonal"` | Standard page header pattern |
| Icon | `mdi-chart-bar size="22"` | Bar chart icon -- matches page content (monthly bars) |
| Title | `text-h5 font-weight-bold` | Page-level title |
| Subtitle | `text-caption text-label-muted mb-4` | Standard page subtitle |

### 3.3 Zone B: Cumulative Hero

```vue
<v-card elevation="0" rounded="lg" class="glass-card mb-3">
  <v-card-text class="pa-4">
    <div class="glass-sheet rounded-lg pa-4">
      <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-1">
        CUMULATIVE P&L
      </div>
      <div class="d-flex align-end ga-2 mb-2">
        <span
          class="text-h4 font-weight-black font-mono"
          :class="cumulativePipsColorClass"
        >
          {{ formatPips(latestCumulativePips) }}
        </span>
        <span class="text-caption font-weight-medium text-label-muted pb-1">pips</span>
      </div>
      <div class="text-caption text-medium-emphasis">
        Since {{ firstMonthLabel }}
        <span class="text-label-muted mx-1">|</span>
        {{ months.length }} months
      </div>
    </div>
  </v-card-text>
</v-card>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Container | `glass-card` > `glass-sheet rounded-lg pa-4` | Card with inner surface -- same as Portfolio Overview hero zone |
| Label | `text-caption font-weight-bold text-label-muted text-uppercase` | Standard section label |
| Pips value | `text-h4 font-weight-black font-mono` | **Page-level hero** -- same as Portfolio Overview's Total Pips. This is THE number for this page. |
| Color | Dynamic: `text-success` if positive, `text-error` if negative, `text-medium-emphasis` if zero | Dynamic P&L color -- consistent with all other P&L displays in the system |
| "pips" unit | `text-caption text-label-muted pb-1` | Aligned to bottom of number |
| Context line | `text-caption text-medium-emphasis` | "Since Oct 2025 | 6 months" -- temporal context |

**Why text-h4 here:** This page's hero stat is the cumulative total -- it's equivalent in importance to Portfolio Overview's Total Pips. Same visual treatment.

### 3.4 Zone C: Monthly Bar Chart

```vue
<v-card elevation="0" rounded="lg" class="glass-card mb-3">
  <v-card-text class="pa-4">
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-caption font-weight-bold text-label-muted text-uppercase">
        MONTHLY P&L
      </div>
      <div class="text-caption text-label-muted" style="font-size: 10px;">
        oldest -> newest
      </div>
    </div>

    <!-- Bar rows (newest at bottom for natural time flow) -->
    <div
      v-for="month in monthsChronological"
      :key="month.month"
      class="d-flex align-center ga-2 mb-2 cursor-pointer"
      :class="{ 'opacity-80': selectedMonth && selectedMonth !== month.month }"
      @click="selectMonth(month.month)"
    >
      <!-- Month label -->
      <span
        class="text-caption font-weight-medium"
        :class="selectedMonth === month.month ? 'text-primary' : 'text-label-muted'"
        style="min-width: 32px;"
      >
        {{ month.shortLabel }}
      </span>

      <!-- Bar -->
      <div class="flex-grow-1" style="height: 20px;">
        <div
          class="rounded"
          :class="month.totalPips >= 0 ? 'bg-success' : 'bg-error'"
          :style="{
            width: barWidth(month.totalPips) + '%',
            height: '100%',
            minWidth: '4px',
            opacity: selectedMonth === month.month ? 1 : 0.7,
            transition: 'opacity 0.2s ease'
          }"
        />
      </div>

      <!-- Value -->
      <span
        class="text-caption font-weight-bold font-mono"
        :class="month.totalPips >= 0 ? 'text-success' : 'text-error'"
        style="min-width: 64px; text-align: right;"
      >
        {{ formatPips(month.totalPips) }}
      </span>
    </div>
  </v-card-text>
</v-card>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Section header | `d-flex align-center justify-space-between mb-3` | Label left, order hint right |
| Section label | `text-caption font-weight-bold text-label-muted text-uppercase` | Standard section label |
| Order hint | `text-caption text-label-muted` 10px | "oldest -> newest" -- subtle hint for reading direction (Lungo review #9) |
| Month label | `text-caption font-weight-medium` min-width 32px | Fixed width prevents layout shift. "Oct", "Nov", "Dec" format. |
| Bar container | `flex-grow-1` height 20px | Takes remaining space between label and value |
| Bar fill | `rounded` + `bg-success` or `bg-error` | Green for profit months, red for loss months. Simple, clear. |
| Bar width | Proportional to max value (see logic below) | Largest month = 100% width. Others proportional. |
| Bar min-width | 4px | Even months with very small P&L show a visible bar |
| Value | `text-caption font-weight-bold font-mono` + dynamic color | Right-aligned, fixed width. Monospace for alignment. |
| Interactivity | `cursor-pointer` + `@click` | Tap a month to see detail in Zone D |
| Selected state | `text-primary` on month label, full opacity on bar | Visual feedback for selected month |
| Unselected state | `opacity-80` on row, `opacity: 0.7` on bar | Subtle dimming of non-selected months |
| Row gap | `mb-2` (8px) | Tight spacing for compact chart feel |

**Bar Width Calculation:**
```typescript
const maxPips = computed(() => {
  return Math.max(...months.value.map(m => Math.abs(m.totalPips)), 1)
})

function barWidth(pips: number): number {
  return (Math.abs(pips) / maxPips.value) * 100
}
```

**Short Month Label:**
```typescript
// "2026-03" -> "Mar"
function shortLabel(monthStr: string): string {
  return moment(monthStr, 'YYYY-MM').format('MMM')
}
```

**Month ordering:** `monthsChronological` is oldest-first (bottom = newest would be confusing in a top-down layout). So oldest month at top, newest at bottom. Natural time flow: reading down = moving forward in time.

### 3.5 Zone D: Month Detail Card

```vue
<v-card elevation="0" rounded="lg" class="glass-card mb-3">
  <v-card-text class="pa-4">
    <!-- Month header -->
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-subtitle-1 font-weight-bold">{{ selectedMonthData.label }}</div>
      <span
        class="text-h6 font-weight-bold font-mono"
        :class="monthPipsColorClass(selectedMonthData.totalPips)"
      >
        {{ formatPips(selectedMonthData.totalPips) }} pips
      </span>
    </div>

    <!-- Stats row: Trades / Win Rate / PF -->
    <v-row dense class="mb-4">
      <v-col cols="4">
        <div class="glass-sheet rounded-lg pa-3 text-center">
          <div class="text-h6 font-weight-bold font-mono">
            {{ selectedMonthData.totalTrades }}
          </div>
          <div class="text-caption text-label-muted font-weight-medium">Trades</div>
        </div>
      </v-col>
      <v-col cols="4">
        <div class="glass-sheet rounded-lg pa-3 text-center">
          <div
            class="text-h6 font-weight-bold font-mono"
            :class="winRateColorClass(selectedMonthData.winRate)"
          >
            {{ selectedMonthData.winRate }}%
          </div>
          <div class="text-caption text-label-muted font-weight-medium">Win Rate</div>
        </div>
      </v-col>
      <v-col cols="4">
        <div class="glass-sheet rounded-lg pa-3 text-center">
          <div
            class="text-h6 font-weight-bold font-mono"
            :class="pfColorClass(selectedMonthData.profitFactor)"
          >
            {{ selectedMonthData.profitFactor.toFixed(2) }}
          </div>
          <div class="text-caption text-label-muted font-weight-medium">PF</div>
        </div>
      </v-col>
    </v-row>

    <!-- [P1] Best/Worst Trade — Lungo review item #6 -->
    <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-2">
      BEST / WORST TRADE
    </div>

    <div class="glass-sheet rounded-lg pa-3 mb-4">
      <!-- Best Trade -->
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-trophy" size="14" class="text-success" />
          <span class="text-caption font-weight-bold text-success">BEST</span>
          <span class="text-caption font-weight-medium">
            {{ selectedMonthData.bestTrade.action }}
            {{ selectedMonthData.bestTrade.symbol }}
          </span>
        </div>
        <span class="text-body-2 font-weight-bold font-mono text-success">
          {{ formatPips(selectedMonthData.bestTrade.pips) }} pips
        </span>
      </div>
      <div class="text-caption text-medium-emphasis ml-6">
        {{ formatDate(selectedMonthData.bestTrade.date) }},
        {{ selectedMonthData.bestTrade.interval }}
      </div>

      <v-divider class="my-2" />

      <!-- Worst Trade -->
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-alert-circle" size="14" class="text-error" />
          <span class="text-caption font-weight-bold text-error">WORST</span>
          <span class="text-caption font-weight-medium">
            {{ selectedMonthData.worstTrade.action }}
            {{ selectedMonthData.worstTrade.symbol }}
          </span>
        </div>
        <span class="text-body-2 font-weight-bold font-mono text-error">
          {{ formatPips(selectedMonthData.worstTrade.pips) }} pips
        </span>
      </div>
      <div class="text-caption text-medium-emphasis ml-6">
        {{ formatDate(selectedMonthData.worstTrade.date) }},
        {{ selectedMonthData.worstTrade.interval }}
      </div>
    </div>

    <!-- Symbol Breakdown -->
    <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-3">
      SYMBOL BREAKDOWN
    </div>

    <div
      v-for="sym in sortedSymbols"
      :key="sym.symbol"
      class="glass-sheet rounded-lg pa-3 mb-2"
    >
      <div class="d-flex align-center justify-space-between mb-2">
        <!-- Symbol + W/L -->
        <div class="d-flex align-center ga-2">
          <span class="text-body-2 font-weight-bold">{{ sym.symbol }}</span>
          <span class="text-caption text-medium-emphasis">
            <span class="text-success font-mono">{{ sym.wins }}W</span>
            <span class="text-label-muted mx-1">/</span>
            <span class="text-error font-mono">{{ sym.losses }}L</span>
          </span>
        </div>

        <!-- Pips -->
        <span
          class="text-body-2 font-weight-bold font-mono"
          :class="sym.totalPips >= 0 ? 'text-success' : 'text-error'"
        >
          {{ formatPips(sym.totalPips) }}
        </span>
      </div>

      <!-- Mini bar -->
      <v-progress-linear
        :model-value="symBarPercent(sym.totalPips)"
        :color="sym.totalPips >= 0 ? 'success' : 'error'"
        bg-color="#2A2A2A"
        rounded
        height="4"
      />
    </div>

    <!-- [P1] Timeframe Breakdown — Lungo review item #7 -->
    <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-3 mt-4">
      TIMEFRAME BREAKDOWN
    </div>

    <div
      v-for="tf in sortedIntervals"
      :key="tf.interval"
      class="glass-sheet rounded-lg pa-3 mb-2"
    >
      <div class="d-flex align-center justify-space-between mb-2">
        <!-- Timeframe + W/L -->
        <div class="d-flex align-center ga-2">
          <span class="text-body-2 font-weight-bold font-mono">{{ tf.interval }}</span>
          <span class="text-caption text-medium-emphasis">
            <span class="text-success font-mono">{{ tf.wins }}W</span>
            <span class="text-label-muted mx-1">/</span>
            <span class="text-error font-mono">{{ tf.losses }}L</span>
          </span>
        </div>

        <!-- Pips -->
        <span
          class="text-body-2 font-weight-bold font-mono"
          :class="tf.totalPips >= 0 ? 'text-success' : 'text-error'"
        >
          {{ formatPips(tf.totalPips) }}
        </span>
      </div>

      <!-- Mini bar (reuse same pattern as Symbol Breakdown) -->
      <v-progress-linear
        :model-value="tfBarPercent(tf.totalPips)"
        :color="tf.totalPips >= 0 ? 'success' : 'error'"
        bg-color="#2A2A2A"
        rounded
        height="4"
      />
    </div>
  </v-card-text>
</v-card>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Month title | `text-subtitle-1 font-weight-bold` | Section-level heading |
| Month P&L | `text-h6 font-weight-bold font-mono` + dynamic color | Right-aligned, secondary prominence (hero is in Zone B) |
| Stats row | 3-column `v-row dense` in `glass-sheet` | Same pattern as Portfolio Overview stat boxes |
| Stats numbers | `text-h6 font-weight-bold font-mono` | Same as Portfolio Overview |
| Stats labels | `text-caption text-label-muted font-weight-medium` | Standard muted label |
| "BEST / WORST TRADE" | Standard section label | Separator before best/worst display |
| Best/Worst container | `glass-sheet rounded-lg pa-3 mb-4` | Single card with divider between best and worst. `mb-4` for space before Symbol Breakdown. |
| Best trade icon | `mdi-trophy size="14" text-success` | Trophy = achievement. Green for best. |
| Worst trade icon | `mdi-alert-circle size="14" text-error` | Alert = caution. Red for worst. |
| Best/Worst label | `text-caption font-weight-bold` + `text-success` / `text-error` | Bold label with semantic color |
| Best/Worst trade info | `text-caption font-weight-medium` | Action + Symbol inline |
| Best/Worst pips | `text-body-2 font-weight-bold font-mono` + semantic color | Right-aligned P&L |
| Best/Worst context | `text-caption text-medium-emphasis ml-6` | Date + interval below, indented past icon |
| "SYMBOL BREAKDOWN" | Standard section label | Separator before breakdown list |
| Symbol row | `glass-sheet rounded-lg pa-3 mb-2` | Each symbol in its own inner surface. `mb-2` for tighter list spacing. |
| Symbol name | `text-body-2 font-weight-bold` | Clear identification |
| W/L counts | `text-caption text-medium-emphasis` with green W, red L | Compact win/loss display. Color-coded for instant reading. |
| Symbol pips | `text-body-2 font-weight-bold font-mono` + dynamic color | Right-aligned, P&L color mapping |
| Mini bar | `v-progress-linear height="4" rounded bg-color="#2A2A2A"` | Smaller than standard 6px bar -- it's supplementary, not primary. |
| Bar color | `success` for positive pips, `error` for negative | Standard color mapping |

| "TIMEFRAME BREAKDOWN" | Standard section label + `mt-4` | Separator before TF breakdown. `mt-4` for space after Symbol Breakdown. |
| TF row | `glass-sheet rounded-lg pa-3 mb-2` | Same pattern as Symbol Breakdown -- reuse component pattern. |
| TF name | `text-body-2 font-weight-bold font-mono` | Monospace for TF labels (1h, 4h, 15m) |
| TF W/L counts | Same as Symbol W/L | Green W, red L. Consistent. |
| TF pips | Same as Symbol pips | Right-aligned, P&L color. |
| TF mini bar | Same as Symbol mini bar | `v-progress-linear height="4"`. Reuse component. |

**Symbol Sort Order:**
```typescript
const sortedSymbols = computed(() => {
  return [...selectedMonthData.value.symbols].sort(
    (a, b) => b.totalPips - a.totalPips  // highest pips first
  )
})
```

**Symbol Bar Percentage:**
```typescript
function symBarPercent(pips: number): number {
  const maxSymPips = Math.max(
    ...selectedMonthData.value.symbols.map(s => Math.abs(s.totalPips)),
    1
  )
  return (Math.abs(pips) / maxSymPips) * 100
}
```

**Timeframe Sort Order (same logic as symbols -- by totalPips descending):**
```typescript
const sortedIntervals = computed(() => {
  return [...(selectedMonthData.value.intervals ?? [])].sort(
    (a, b) => b.totalPips - a.totalPips  // highest pips first
  )
})
```

**Timeframe Bar Percentage:**
```typescript
function tfBarPercent(pips: number): number {
  const maxTfPips = Math.max(
    ...(selectedMonthData.value.intervals ?? []).map(t => Math.abs(t.totalPips)),
    1
  )
  return (Math.abs(pips) / maxTfPips) * 100
}
```

**Best/Worst Trade Date Formatting:**
```typescript
function formatDate(dateStr: string): string {
  return moment(dateStr).format('MMM D')
  // "Mar 3"
}
```

**Win Rate Color (shared):**
```typescript
function winRateColorClass(rate: number): string {
  if (rate >= 60) return 'text-success'
  if (rate >= 50) return 'text-warning'
  return 'text-error'
}
```

**Profit Factor Color (shared from Portfolio Overview):**
```typescript
function pfColorClass(pf: number): string {
  if (pf >= 2.0) return 'text-success'
  if (pf >= 1.5) return 'text-primary'
  if (pf >= 1.2) return 'text-warning'
  return 'text-error'
}
```

### 3.6 Zone E: Previous Months (Compact List)

```vue
<div class="text-caption font-weight-bold text-label-muted text-uppercase mb-3">
  ALL MONTHS
</div>

<v-card
  v-for="month in monthsChronologicalDesc"
  :key="month.month"
  elevation="0"
  rounded="lg"
  class="glass-card mb-2 cursor-pointer"
  :class="{ 'border-primary': selectedMonth === month.month }"
  @click="selectMonth(month.month)"
>
  <v-card-text class="pa-3">
    <div class="d-flex align-center justify-space-between">
      <!-- Month label -->
      <div>
        <div class="text-body-2 font-weight-bold">{{ month.label }}</div>
        <div class="text-caption text-medium-emphasis">
          {{ month.totalTrades }} trades
          <span class="text-label-muted mx-1">|</span>
          <span class="font-mono">{{ month.winRate }}% WR</span>
          <span class="text-label-muted mx-1">|</span>
          <span class="font-mono" :class="pfColorClass(month.profitFactor)">
            PF {{ month.profitFactor.toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- Pips -->
      <div class="text-right">
        <div
          class="text-body-2 font-weight-bold font-mono"
          :class="month.totalPips >= 0 ? 'text-success' : 'text-error'"
        >
          {{ formatPips(month.totalPips) }} pips
        </div>
        <div class="text-caption text-medium-emphasis font-mono">
          cum: {{ formatPips(month.cumulativePips) }}
        </div>
      </div>
    </div>
  </v-card-text>
</v-card>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Section label | Standard section label | "ALL MONTHS" header |
| Card | `glass-card rounded-lg mb-2` | Compact card per month. `mb-2` for tighter spacing. |
| Selected state | `border-primary` class (custom: `border: 1px solid rgba(74, 222, 128, 0.3)`) | Green border on selected month matches primary accent |
| Month name | `text-body-2 font-weight-bold` | Clear heading |
| Trades + WR + PF | `text-caption text-medium-emphasis` | Secondary stats inline. PF uses `pfColorClass` for dynamic color (Lungo review #5). |
| P&L pips | `text-body-2 font-weight-bold font-mono` + dynamic color | Right-aligned, clear P&L |
| Cumulative | `text-caption text-medium-emphasis font-mono` | "cum: +6,492" -- running total context |
| Interactivity | `cursor-pointer` + `@click` | Tap to expand in Zone D |
| Ordering | Newest first | Most relevant month at top |
| Card padding | `pa-3` | Compact -- these are list items, not content cards |

**Selected Month Border (custom CSS needed):**
```css
.border-primary {
  border: 1px solid rgba(74, 222, 128, 0.3) !important;
}
```

**Rationale for custom class:** Vuetify doesn't have a utility class for colored borders on dark theme. This is a minimal addition that follows the existing border pattern (glass-card hover uses similar rgba green border).

---

## 4. Interaction Flow

### Default State (Page Load)
1. Fetch all monthly performance data
2. Select current/latest month as default
3. Zone C highlights current month bar
4. Zone D shows current month detail
5. Zone E lists all months with current highlighted

### Month Selection
1. User taps a bar in Zone C OR a card in Zone E
2. Zone C: tapped month gets full opacity, others dim
3. Zone D: updates to show selected month's detail + symbol breakdown
4. Zone E: selected month gets border highlight
5. Smooth transition (no page reload -- just reactive state change)

```typescript
const selectedMonth = ref<string>(months.value[0]?.month ?? '')

function selectMonth(monthStr: string) {
  selectedMonth.value = monthStr
}

const selectedMonthData = computed(() => {
  return months.value.find(m => m.month === selectedMonth.value) ?? months.value[0]
})
```

---

## 5. States

### 5.1 Loading State

```vue
<!-- Cumulative hero skeleton -->
<v-card elevation="0" rounded="lg" class="glass-card mb-3">
  <v-card-text class="pa-4">
    <v-sheet rounded="lg" class="glass-sheet pa-4">
      <v-skeleton-loader type="text" width="100" class="mb-2" />
      <v-skeleton-loader type="heading" width="200" class="mb-2" />
      <v-skeleton-loader type="text" width="160" />
    </v-sheet>
  </v-card-text>
</v-card>

<!-- Bar chart skeleton -->
<v-card elevation="0" rounded="lg" class="glass-card mb-3">
  <v-card-text class="pa-4">
    <v-skeleton-loader type="text" width="100" class="mb-3" />
    <div v-for="i in 6" :key="i" class="d-flex align-center ga-2 mb-2">
      <v-skeleton-loader type="text" width="32" />
      <v-skeleton-loader type="text" class="flex-grow-1" />
      <v-skeleton-loader type="text" width="64" />
    </div>
  </v-card-text>
</v-card>

<!-- Month detail skeleton -->
<v-card elevation="0" rounded="lg" class="glass-card mb-3">
  <v-card-text class="pa-4">
    <div class="d-flex justify-space-between mb-3">
      <v-skeleton-loader type="text" width="100" />
      <v-skeleton-loader type="text" width="80" />
    </div>
    <v-row dense class="mb-4">
      <v-col v-for="i in 3" :key="i" cols="4">
        <v-sheet rounded="lg" class="glass-sheet pa-3 text-center">
          <v-skeleton-loader type="text" width="40" class="mx-auto mb-1" />
          <v-skeleton-loader type="text" width="50" class="mx-auto" />
        </v-sheet>
      </v-col>
    </v-row>
    <v-skeleton-loader type="text" width="120" class="mb-3" />
    <v-sheet v-for="i in 3" :key="i" rounded="lg" class="glass-sheet pa-3 mb-2">
      <div class="d-flex justify-space-between mb-2">
        <v-skeleton-loader type="text" width="120" />
        <v-skeleton-loader type="text" width="60" />
      </div>
      <v-skeleton-loader type="text" width="100%" />
    </v-sheet>
  </v-card-text>
</v-card>
```

**Pattern:** Skeleton matches all 3 zones. 6 bar rows in chart skeleton (reasonable default). 3 symbol rows in detail skeleton.

### 5.2 Error State

```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4">
    <v-alert type="error" variant="tonal" class="mb-0">
      Failed to load performance data
      <template #append>
        <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
      </template>
    </v-alert>
  </v-card-text>
</v-card>
```

**Pattern:** Same error state pattern as all other sections.

### 5.3 Empty State (No Closed Trades)

```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4 text-center">
    <v-icon icon="mdi-chart-box-outline" size="48" class="text-medium-emphasis mb-2" />
    <div class="text-body-2 text-medium-emphasis">No performance data yet</div>
    <div class="text-caption text-label-muted mt-1">
      Monthly stats will appear after your first closed trade
    </div>
  </v-card-text>
</v-card>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Icon | `mdi-chart-box-outline size="48" text-medium-emphasis` | Chart box = performance/stats |
| Main text | `text-body-2 text-medium-emphasis` | Factual, neutral |
| Sub text | `text-caption text-label-muted` | Explains when data will appear |

---

## 6. Color Mapping Summary

| Data Point | Condition | Color Class | Hex |
|-----------|-----------|-------------|-----|
| Cumulative P&L | > 0 | `text-success` | `#4CAF50` |
| Cumulative P&L | < 0 | `text-error` | `#FF5252` |
| Cumulative P&L | = 0 | `text-medium-emphasis` | grey |
| Compact card PF | >= 2.0 | `text-success` | `#4CAF50` |
| Compact card PF | >= 1.5 | `text-primary` | `#4ADE80` |
| Compact card PF | >= 1.2 | `text-warning` | `#FB8C00` |
| Compact card PF | < 1.2 | `text-error` | `#FF5252` |
| Best trade pips | always | `text-success` | `#4CAF50` |
| Worst trade pips | always | `text-error` | `#FF5252` |
| TF pips (breakdown) | >= 0 | `text-success` | `#4CAF50` |
| TF pips (breakdown) | < 0 | `text-error` | `#FF5252` |
| TF mini bar | >= 0 pips | `color="success"` | `#4CAF50` |
| TF mini bar | < 0 pips | `color="error"` | `#FF5252` |
| Monthly bar (chart) | >= 0 pips | `bg-success` | `#4CAF50` |
| Monthly bar (chart) | < 0 pips | `bg-error` | `#FF5252` |
| Monthly pips text | >= 0 | `text-success` | `#4CAF50` |
| Monthly pips text | < 0 | `text-error` | `#FF5252` |
| Win Rate | >= 60% | `text-success` | `#4CAF50` |
| Win Rate | >= 50% | `text-warning` | `#FB8C00` |
| Win Rate | < 50% | `text-error` | `#FF5252` |
| Profit Factor | >= 2.0 | `text-success` | `#4CAF50` |
| Profit Factor | >= 1.5 | `text-primary` | `#4ADE80` |
| Profit Factor | >= 1.2 | `text-warning` | `#FB8C00` |
| Profit Factor | < 1.2 | `text-error` | `#FF5252` |
| Symbol pips | >= 0 | `text-success` | `#4CAF50` |
| Symbol pips | < 0 | `text-error` | `#FF5252` |
| Symbol mini bar | >= 0 pips | `color="success"` | `#4CAF50` |
| Symbol mini bar | < 0 pips | `color="error"` | `#FF5252` |
| W count | always | `text-success` | `#4CAF50` |
| L count | always | `text-error` | `#FF5252` |
| Selected month border | selected | `border-primary` | `rgba(74,222,128,0.3)` |
| Selected month label | selected | `text-primary` | `#4ADE80` |
| Cumulative label | always | `text-medium-emphasis` | grey |

---

## 7. Typography Spec

| Element | Classes | Font | Size | Weight |
|---------|---------|------|------|--------|
| Page title | `text-h5 font-weight-bold` | Noto Sans Thai | 24px | 700 |
| Page subtitle | `text-caption text-label-muted` | Noto Sans Thai | 12px | 400 |
| "CUMULATIVE P&L" label | `text-caption font-weight-bold text-label-muted text-uppercase` | Noto Sans Thai | 12px | 700 |
| Cumulative pips | `text-h4 font-weight-black font-mono` | JetBrains Mono | 34px | 900 |
| "pips" unit | `text-caption text-label-muted` | Noto Sans Thai | 12px | 400 |
| Context line | `text-caption text-medium-emphasis` | Noto Sans Thai | 12px | 400 |
| "MONTHLY P&L" label | `text-caption font-weight-bold text-label-muted text-uppercase` | Noto Sans Thai | 12px | 700 |
| Bar chart order hint | `text-caption text-label-muted` (10px) | Noto Sans Thai | 10px | 400 |
| Bar month label | `text-caption font-weight-medium` | Noto Sans Thai | 12px | 500 |
| Bar value | `text-caption font-weight-bold font-mono` | JetBrains Mono | 12px | 700 |
| Month detail title | `text-subtitle-1 font-weight-bold` | Noto Sans Thai | 16px | 700 |
| Month detail pips | `text-h6 font-weight-bold font-mono` | JetBrains Mono | 20px | 700 |
| Stat number | `text-h6 font-weight-bold font-mono` | JetBrains Mono | 20px | 700 |
| Stat label | `text-caption text-label-muted font-weight-medium` | Noto Sans Thai | 12px | 500 |
| "SYMBOL BREAKDOWN" | `text-caption font-weight-bold text-label-muted text-uppercase` | Noto Sans Thai | 12px | 700 |
| Symbol name | `text-body-2 font-weight-bold` | Noto Sans Thai | 14px | 700 |
| W/L count | `text-caption text-medium-emphasis font-mono` | JetBrains Mono | 12px | 400 |
| Symbol pips | `text-body-2 font-weight-bold font-mono` | JetBrains Mono | 14px | 700 |
| "BEST / WORST TRADE" | `text-caption font-weight-bold text-label-muted text-uppercase` | Noto Sans Thai | 12px | 700 |
| Best/Worst label | `text-caption font-weight-bold` | Noto Sans Thai | 12px | 700 |
| Best/Worst trade info | `text-caption font-weight-medium` | Noto Sans Thai | 12px | 500 |
| Best/Worst pips | `text-body-2 font-weight-bold font-mono` | JetBrains Mono | 14px | 700 |
| Best/Worst context | `text-caption text-medium-emphasis` | Noto Sans Thai | 12px | 400 |
| "TIMEFRAME BREAKDOWN" | `text-caption font-weight-bold text-label-muted text-uppercase` | Noto Sans Thai | 12px | 700 |
| TF name | `text-body-2 font-weight-bold font-mono` | JetBrains Mono | 14px | 700 |
| TF W/L count | `text-caption text-medium-emphasis font-mono` | JetBrains Mono | 12px | 400 |
| TF pips | `text-body-2 font-weight-bold font-mono` | JetBrains Mono | 14px | 700 |
| Compact PF | `text-caption font-mono` + dynamic color | JetBrains Mono | 12px | 400 |
| "ALL MONTHS" label | `text-caption font-weight-bold text-label-muted text-uppercase` | Noto Sans Thai | 12px | 700 |
| Compact month name | `text-body-2 font-weight-bold` | Noto Sans Thai | 14px | 700 |
| Compact stats | `text-caption text-medium-emphasis` | Noto Sans Thai | 12px | 400 |
| Compact pips | `text-body-2 font-weight-bold font-mono` | JetBrains Mono | 14px | 700 |
| Compact cumulative | `text-caption text-medium-emphasis font-mono` | JetBrains Mono | 12px | 400 |

---

## 8. Spacing Spec

| Gap | Value | Vuetify | Between |
|-----|-------|---------|---------|
| Page header gap | 12px | `ga-3` | Avatar to title |
| Subtitle to divider | 16px | `mb-4` | Subtitle to divider |
| Divider to cumulative | 16px | `mb-4` on divider | Divider to Zone B |
| Cumulative card padding | 16px | `pa-4` | Outer card padding |
| Cumulative inner padding | 16px | `pa-4` | glass-sheet inner padding |
| Cumulative to bar chart | 12px | `mb-3` | Zone B to Zone C |
| Bar chart card padding | 16px | `pa-4` | Chart card padding |
| Bar chart label to bars | 12px | `mb-3` | "MONTHLY P&L" to first bar |
| Bar row gap | 8px | `mb-2` | Between bar rows |
| Bar chart to detail | 12px | `mb-3` | Zone C to Zone D |
| Month detail padding | 16px | `pa-4` | Detail card padding |
| Detail header to stats | 12px | `mb-3` | Month title to stat row |
| Stats row to best/worst | 16px | `mb-4` | Stat boxes to best/worst section |
| Best/Worst section to symbols | 16px | `mb-4` | Best/worst card to symbol breakdown label |
| Breakdown label to items | 12px | `mb-3` | Label to first symbol row |
| Symbol row gap | 8px | `mb-2` | Between symbol rows |
| Symbol to TF breakdown | 16px | `mt-4` | Last symbol row to TF breakdown label |
| TF breakdown label to items | 12px | `mb-3` | Label to first TF row |
| TF row gap | 8px | `mb-2` | Between TF rows |
| Symbol row padding | 12px | `pa-3` | Inside glass-sheet per symbol |
| Detail to compact list | 12px | `mb-3` | Zone D to Zone E |
| Compact list label to cards | 12px | `mb-3` | "ALL MONTHS" to first card |
| Compact card gap | 8px | `mb-2` | Between compact cards |
| Compact card padding | 12px | `pa-3` | Inside compact card |

---

## 9. Responsive Behavior

| Breakpoint | Behavior | Changes |
|-----------|----------|---------|
| xs (< 600px) | Primary target | Layout as designed. Full-width. `pa-3` page padding. |
| sm (>= 600px) | Same layout | `pa-sm-4` page padding. 800px max-width. |
| md+ (>= 960px) | Same layout | Centered in 800px container. |

**No breakpoint changes.** Single column with card stack. Bar chart uses percentage-based widths. All components are fluid.

---

## 10. Component File Structure

```
app/
  pages/
    performance.vue                   <-- Page component
  components/trading/
    MonthlyBarChart.vue               <-- Bar chart (optional extraction)
    MonthDetail.vue                   <-- Month detail + symbol breakdown (optional extraction)
  composables/
    useMonthlyPerformance.ts          <-- Data fetching composable
```

### Composable Interface
```typescript
// app/composables/useMonthlyPerformance.ts

interface MonthlySymbolBreakdown {
  symbol: string
  totalPips: number
  wins: number
  losses: number
  totalTrades: number
}

interface MonthlyTradeHighlight {
  symbol: string
  action: 'BUY' | 'SELL'
  pips: number
  date: string               // "2026-03-03"
  interval: string            // "4h"
}

interface MonthlyIntervalBreakdown {
  interval: string             // "1h", "4h", "15m"
  wins: number
  losses: number
  totalPips: number
}

interface MonthlyPerformance {
  month: string               // "2026-03"
  label: string               // "Mar 2026"
  shortLabel: string           // "Mar"
  totalPips: number
  wins: number
  losses: number
  totalTrades: number
  winRate: number
  profitFactor: number         // [P0] Now also displayed in compact cards (Zone E)
  cumulativePips: number
  bestTrade: MonthlyTradeHighlight   // [P1] Lungo review — best trade of the month
  worstTrade: MonthlyTradeHighlight  // [P1] Lungo review — worst trade of the month
  symbols: MonthlySymbolBreakdown[]
  intervals: MonthlyIntervalBreakdown[]  // [P1] Lungo review — TF breakdown per month
}

// Returns:
// { months, loading, error, fetch, selectedMonth, selectMonth, selectedMonthData }
```

---

## 11. CSS Bar Chart vs Library Chart

### Decision: CSS Bars (not lightweight-charts or chart.js)

| Consideration | CSS Bars | Chart Library |
|---------------|----------|---------------|
| Bundle size | 0 KB extra | 30-100 KB |
| Customization | Full control, matches design system | Need to override library styles |
| Interactivity | Click/tap via Vue events | Library-specific event API |
| Accessibility | Native HTML, easy aria labels | Canvas-based, harder |
| Mobile performance | Excellent | Good but heavier |
| Complexity | Simple div + computed width | Config object, lifecycle management |

**Rationale:** We have 6-12 bars max. CSS divs with percentage widths are simpler, lighter, fully controllable, and perfectly sufficient. A charting library would be overkill for this use case.

**Future:** If we need more complex charts (line chart for cumulative trend, etc.), we already have `lightweight-charts` in the project and can use it then.

---

## 12. Design Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Cumulative P&L as page hero (text-h4) | This is THE most important number on this page -- "how much have I made total?" Same prominence as Portfolio Overview's Total Pips. | Monthly P&L as hero, No hero number |
| CSS bars (not chart library) | 6-12 bars max. CSS is simpler, lighter, fully themeable. No external dependency needed. | lightweight-charts, Chart.js, Apex Charts |
| Horizontal bars (not vertical columns) | Horizontal bars work better on 375px mobile -- month labels on left, values on right, bars use remaining width. Vertical columns would need rotation or tiny labels. | Vertical bar chart, Line chart |
| Oldest-top chronological order in chart | Reading top-to-bottom = moving forward in time. Natural reading order. Newest at bottom is latest update. | Newest-first (confusing time flow), Random |
| Newest-first in compact list (Zone E) | Zone E is a navigation list -- most relevant (recent) months first. Different purpose than the chart (which shows trend). | Chronological (oldest first) |
| Month selection interaction | Tap bar or compact card to see detail. Single selection, not multi. Simple state management. No modal or page navigation. | Modal popup, Separate page per month, Accordion expand |
| Symbol breakdown sorted by pips | Most profitable symbol first. Trader wants to know "what's making me money?" Sorting by alpha is less useful. | Alphabetical, By trade count |
| Mini progress bar for symbols (height 4px) | Smaller than standard 6px -- it's supplementary visual. Adds data density without dominating the card. | No bar (text only), Standard 6px bar, Full-width bar |
| 3-column stats (not 2 or 4) | Trades/WR/PF are the three most important monthly metrics. Same grid rhythm as Portfolio Overview. 4 would be too crowded on mobile. | 2 columns + extra row, 4 columns (too tight), Single row text |
| Compact month cards in Zone E (not accordion) | Accordion expand/collapse adds complexity and can be janky on mobile. Compact cards + Zone D detail is simpler and shows all months at once. | Accordion per month, Tabbed months, Dropdown selector |
| border-primary for selected month | Subtle green border matches glass-card hover pattern. Not too loud but clearly indicates selection. | Background color change, Bold text only, Underline |
| "cum:" prefix for cumulative pips | Short, saves space, universally understood in trading/finance context. | "Total:", "Running:", Full "Cumulative:" |
| text-caption for bar values (not larger) | Chart area should be compact. Larger text would make bars too spaced out. Caption is sufficient for 3-5 digit numbers. | text-body-2 (too large), text-h6 (too prominent) |
| No date filter/picker | This page shows ALL months. Filtering defeats the purpose of seeing the trend. Trade History page handles date filtering. | Month range picker, Year filter |
| mdi-chart-bar for page icon | Directly represents the bar chart content of this page. | mdi-chart-line-variant, mdi-finance, mdi-trophy |
| Cumulative P&L uses `text-success` (not `text-primary`) | Lungo review #8: Cumulative P&L should use dynamic color consistent with all other P&L displays. `text-success` for positive (same as Total Pips everywhere else), `text-error` for negative. Using `text-primary` was inconsistent -- primary is accent color, not P&L color. Changed to `text-success`/`text-error` for consistency. | `text-primary` (inconsistent with other P&L), Always green (ignores negative case) |
| PF in compact month cards (Zone E) | Lungo review #5: PF is a critical metric for quick scanning. Adding PF inline with trades + WR makes compact cards more informative without needing to expand. Uses same 4-tier color thresholds as Portfolio Overview. | PF only in detail view (requires extra tap), Separate PF column (too wide on mobile) |
| Best/Worst trade per month | Lungo review #6: Highlights extremes for self-analysis. Compact 2-row display with icon + action + symbol + pips + date/interval. Not a full card -- just text rows in a glass-sheet. Placed before Symbol Breakdown for reading flow: summary -> extremes -> breakdown. | Full trade cards (too heavy), No extreme highlights, Modal popup |
| TF breakdown per month | Lungo review #7: Reuses exact same component pattern as Symbol Breakdown (sorted by pips, mini progress bar). Placed after Symbol Breakdown. Answers "which timeframe works best for me this month?" | Separate tab/page, Table format, No TF breakdown |
| Bar chart "oldest -> newest" hint | Lungo review #9: Small text label in header row clarifies reading direction. 10px font size to stay unobtrusive. | Arrow icon, No hint (users might read wrong direction), Full legend |

---

## 13. Checklist for Implementation (Cappu)

### Setup
- [ ] Create `app/pages/performance.vue`
- [ ] Create `app/composables/useMonthlyPerformance.ts`
- [ ] Add TypeScript interfaces `MonthlyPerformance`, `MonthlySymbolBreakdown` in `types/trading.ts`
- [ ] Update bottom navigation (if not already done in Trade History task)

### Page Header
- [ ] Avatar + title + subtitle matching standard pattern
- [ ] Divider below subtitle

### Zone B: Cumulative Hero
- [ ] glass-card > glass-sheet hero zone
- [ ] text-h4 font-weight-black font-mono for pips
- [ ] Dynamic color (primary positive, error negative)
- [ ] Context line: since date + month count

### Zone C: Monthly Bar Chart
- [ ] CSS horizontal bars (no chart library)
- [ ] Green bars for profit, red bars for loss
- [ ] Bar width proportional to max value
- [ ] Month labels (left), bars (center), values (right)
- [ ] "oldest -> newest" hint label in header (right-aligned, 10px)
- [ ] Clickable rows -> select month
- [ ] Selected month visual feedback (text-primary, full opacity)
- [ ] Unselected months dimmed

### Zone D: Month Detail
- [ ] Month name + total pips header
- [ ] 3-column stat grid: Trades / Win Rate / PF
- [ ] Win Rate color thresholds
- [ ] PF color thresholds (same as Portfolio Overview)
- [ ] [P1] **Best/Worst Trade section** (after stats, before Symbol Breakdown)
  - [ ] Best trade: trophy icon + action + symbol + pips + date/interval
  - [ ] Worst trade: alert icon + action + symbol + pips + date/interval
  - [ ] Divider between best and worst
- [ ] "SYMBOL BREAKDOWN" section label
- [ ] Symbol rows: name + W/L + pips + mini bar
- [ ] Symbols sorted by totalPips descending
- [ ] [P1] **Timeframe Breakdown section** (after Symbol Breakdown)
  - [ ] TF rows: interval + W/L + pips + mini bar (reuse Symbol Breakdown pattern)
  - [ ] TFs sorted by totalPips descending
- [ ] Updates reactively when selected month changes

### Zone E: Previous Months
- [ ] Compact glass-card per month
- [ ] Month name + trades + WR + **PF** (left), pips + cumulative (right)
- [ ] [P0] **PF with dynamic 4-tier color** in compact card
- [ ] Selected month border highlight
- [ ] Clickable -> updates Zone D
- [ ] Newest-first ordering

### States
- [ ] Loading: skeleton for cumulative + chart + detail
- [ ] Error: tonal alert with retry
- [ ] Empty: chart-box icon + "No performance data yet"

### Colors & Typography
- [ ] All numbers use `font-mono`
- [ ] Cumulative: text-success/text-error (changed from text-primary -- Lungo review #8)
- [ ] Bars: bg-success/bg-error
- [ ] Win Rate: 3-tier (success/warning/error)
- [ ] PF: 4-tier (success/primary/warning/error)
- [ ] W/L: green/red always
- [ ] Best trade pips: always text-success
- [ ] Worst trade pips: always text-error
- [ ] Compact card PF: 4-tier color (same as detail PF)

### Custom CSS
- [ ] `.border-primary` class for selected month card

### Integration
- [ ] Verify on 375px viewport
- [ ] Test with single month data
- [ ] Test with 12+ months data
- [ ] Test month selection interaction
- [ ] Test with all-negative months
- [ ] Test Best/Worst trade display
- [ ] Test TF Breakdown display
- [ ] Test PF color thresholds in compact cards
- [ ] Espresso design review before merge

---

## 14. Future Enhancements

> Noted from Lungo review -- items to consider for future versions.

| Enhancement | Priority | Notes |
|-------------|----------|-------|
| Monthly PF trend line chart | Medium | Sparkline showing PF trend across months |
| Consecutive months indicator | Low | Show positive/negative streaks across months |
| Monthly comparison view | Low | Side-by-side compare 2 months |
| Export monthly report | Low | PDF/CSV export of monthly performance |
