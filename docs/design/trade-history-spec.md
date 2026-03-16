# Trade History Section -- Design Spec

> **Designer:** Espresso (Design Guardian)
> **Date:** 2026-03-15
> **Status:** Ready for Implementation (v1.1 -- Lungo review applied)
> **Reference:** `docs/design/design-system.md` v1.0.0
> **Page:** `/history` (Bottom Navigation tab 2)
> **Dependencies:** Follows patterns from Portfolio Overview + Open Positions specs

---

## 1. Overview

Trade History คือหน้าแสดง closed trades ทั้งหมด เรียงจากล่าสุด
เป็น tab ที่ 2 ใน bottom navigation -- แยกหน้าจาก Dashboard

### Design Goals
- **Quick scan ผลลัพธ์** -- P&L pips ของแต่ละ trade อ่านได้ทันที (hero number per card)
- **Filter ง่าย** -- chip group สำหรับ symbol/TF/result/exit reason, month picker สำหรับช่วงเวลา + expandable filter สำหรับ mobile
- **Summary at a glance** -- aggregate stats bar (total trades, win rate, total pips, avg win/loss, PF) ตาม filter ปัจจุบัน
- **Mobile-first 375px** -- card-per-trade pattern เหมือน Open Positions
- **Consistent with system** -- glass-card, font-mono, color mapping เดียวกับ Dashboard

### API Source
```
GET /api/strategy/history?symbol=&interval=&month=&year=&result=&exitReason=&sort=newest&page=1&limit=20
```
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTrades": 42,
      "wins": 30,
      "losses": 12,
      "winRate": 71.4,
      "totalPips": 1847,
      "profitFactor": 2.31,
      "avgWinPips": 62,
      "avgLossPips": -31
    },
    "trades": [
      {
        "id": "pos_123",
        "symbol": "USD-JPY",
        "interval": "1h",
        "strategyName": "ICHI_TK_CLOUD",
        "action": "BUY",
        "entryPrice": "149.250",
        "entryTime": "2026-03-14T10:00:00Z",
        "exitPrice": "149.780",
        "exitTime": "2026-03-14T18:30:00Z",
        "exitReason": "TP",
        "profitPips": 53,
        "profitPercent": "0.35",
        "duration": "8h 30m"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "hasMore": true
    }
  }
}
```

> **Note:** `duration` is computed server-side from entryTime/exitTime.
> `summary` is computed from all trades matching the current filter (not just the current page).

---

## 2. Layout Design (Mobile ~375px)

### 2.1 Full Page Layout

```
+-----------------------------------------------+
|  PAGE HEADER                                   |
|  [Clock Icon]  TRADE HISTORY                   |
|                Closed trades log                |
+-----------------------------------------------+

+-----------------------------------------------+
|  FILTER BAR  (glass-card)                      |
|                                                |
|  Symbol:                                       |
|  [All] [USD-JPY] [EUR-USD] [GBP-JPY] [XAU..]  |
|                                                |
|  Period:  [< Mar 2026 >]                       |
|                                                |
|  [v More Filters]  (expandable — P1 filters)   |
|  ┌─────────────────────────────────────────┐   |
|  │ Result:                                 │   |
|  │ [All] [Win] [Loss]                      │   |
|  │                                         │   |
|  │ Timeframe:                              │   |
|  │ [All] [15m] [1h] [4h]                   │   |
|  │                                         │   |
|  │ Exit:                                   │   |
|  │ [All] [TP] [SL] [Signal] [Manual]       │   |
|  └─────────────────────────────────────────┘   |
+-----------------------------------------------+
                 mb-2
+-----------------------------------------------+
|  SORT TOGGLE                                   |
|               Sort: [Latest First v]           |
+-----------------------------------------------+
                 mb-3
+-----------------------------------------------+
|  SUMMARY STATS BAR  (glass-card)               |
|                                                |
|  42 trades   |   71.4% WR   |   +1,847 pips   |
|  Avg W: +62  |  Avg L: -31  |   PF: 2.31      |
+-----------------------------------------------+
                 mb-3
+-----------------------------------------------+
|  TRADE CARD 1  (glass-card)                    |
|                                                |
|  BUY  USD-JPY              1h   ICHI_TK_CLOUD  |
|                                                |
|  Entry 149.250  -->  Exit 149.780              |
|  Mar 14 10:00        Mar 14 18:30              |
|                                                |
|  [TP]  8h 30m                                  |
|                                                |
|           +53 pips                             |
+-----------------------------------------------+
                 mb-3
+-----------------------------------------------+
|  TRADE CARD 2  (glass-card)                    |
|                                                |
|  SELL  EUR-USD             4h   EMABB_FILTERED  |
|                                                |
|  Entry 1.08520  -->  Exit 1.08190              |
|  Mar 13 14:00        Mar 14 06:00              |
|                                                |
|  [OPPOSITE_SIGNAL]  16h 00m                    |
|                                                |
|           +33 pips                             |
+-----------------------------------------------+
                 mb-3
+-----------------------------------------------+
|           [ Load More ]                        |
|           12 of 42 shown                       |
+-----------------------------------------------+

+-----------------------------------------------+
| [Dashboard] [History] [Performance]            |  <- Bottom nav
+-----------------------------------------------+
```

### 2.2 Layout Breakdown (5 Zones)

**Zone A: Page Header** (top, scrolls away)
- Avatar + Title + Subtitle
- Same pattern as Dashboard header

**Zone B: Filter Bar** (scrolls with content)
- Default (compact): Symbol chips + Period navigator
- Expandable "More Filters": Result (Win/Loss) + Timeframe + Exit Reason chips
- Rationale: 375px จอไม่พอแสดง filter ทั้งหมดพร้อมกัน — compact mode แสดงเฉพาะ Symbol + Period ที่ใช้บ่อยสุด

**Zone B2: Sort Toggle** (below filter)
- Sort order selector: Latest First (default) / Oldest First

**Zone C: Summary Stats** (below sort, scrolls with content)
- Row 1: total trades, win rate, total pips
- Row 2: avg win pips, avg loss pips, profit factor
- Updates when filter changes

**Zone D: Trade Cards** (main content)
- Card-per-trade, stacked with mb-3 gap
- Same glass-card pattern as Open Positions

**Zone E: Load More** (bottom of list)
- Load more button + count indicator

---

## 3. Component Structure

### 3.1 Page Container

```vue
<!-- pages/history.vue -->
<v-container fluid class="page-container pa-3 pa-sm-4">
  <!-- Zone A: Header -->
  <!-- Zone B: Filter Bar -->
  <!-- Zone C: Summary Stats -->
  <!-- Zone D: Trade Cards (or Loading/Empty/Error) -->
  <!-- Zone E: Load More -->
</v-container>
```

### 3.2 Zone A: Page Header

```vue
<div class="d-flex align-center ga-3 mb-1">
  <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
    <v-icon icon="mdi-history" size="22" />
  </v-avatar>
  <div>
    <div class="text-h5 font-weight-bold">TRADE HISTORY</div>
  </div>
</div>
<div class="text-caption text-label-muted mb-4">Closed trades log</div>
<v-divider class="mb-4" />
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Avatar | `size="40" rounded="lg" color="primary" variant="tonal"` | Match Dashboard header pattern |
| Icon | `mdi-history size="22"` | History/clock icon for trade history |
| Title | `text-h5 font-weight-bold` | Page-level title, same hierarchy as Dashboard |
| Subtitle | `text-caption text-label-muted mb-4` | Standard page subtitle |
| Divider | `v-divider mb-4` | Standard page section separator |

### 3.3 Zone B: Filter Bar (Expandable)

> **[P0] Filter by Win/Loss** + **[P1] Filter by Exit Reason** — Lungo review items #1, #3
> Filter bar ใช้ expandable pattern เพราะ 375px ไม่พอแสดง filter ทั้งหมดพร้อมกัน
> Default compact: Symbol + Period (ใช้บ่อยสุด)
> Expand: Result + Timeframe + Exit Reason

```vue
<v-card elevation="0" rounded="lg" class="glass-card mb-2">
  <v-card-text class="pa-3">
    <!-- Symbol filter (always visible) -->
    <div class="mb-3">
      <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-2">
        Symbol
      </div>
      <div class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="sym in symbolOptions"
          :key="sym"
          :color="selectedSymbol === sym ? 'primary' : undefined"
          :variant="selectedSymbol === sym ? 'flat' : 'outlined'"
          size="small"
          class="font-weight-bold"
          @click="selectSymbol(sym)"
        >
          {{ sym }}
        </v-chip>
      </div>
    </div>

    <!-- Month/Year navigator (always visible) -->
    <div class="mb-2">
      <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-2">
        Period
      </div>
      <div class="d-flex align-center justify-center ga-2">
        <v-btn
          icon
          variant="text"
          size="x-small"
          @click="prevMonth"
        >
          <v-icon icon="mdi-chevron-left" size="20" />
        </v-btn>
        <span class="text-body-2 font-weight-bold" style="min-width: 120px; text-align: center;">
          {{ currentMonthLabel }}
        </span>
        <v-btn
          icon
          variant="text"
          size="x-small"
          :disabled="isCurrentMonth"
          @click="nextMonth"
        >
          <v-icon icon="mdi-chevron-right" size="20" />
        </v-btn>
      </div>
    </div>

    <!-- Expandable "More Filters" toggle -->
    <v-btn
      variant="text"
      size="small"
      class="text-caption text-label-muted w-100"
      @click="showMoreFilters = !showMoreFilters"
    >
      <v-icon
        :icon="showMoreFilters ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="16"
        start
      />
      {{ showMoreFilters ? 'Less Filters' : 'More Filters' }}
      <v-badge
        v-if="!showMoreFilters && activeExtraFilterCount > 0"
        :content="activeExtraFilterCount"
        color="primary"
        inline
        class="ml-1"
      />
    </v-btn>

    <!-- Expandable filter section -->
    <v-expand-transition>
      <div v-show="showMoreFilters">
        <v-divider class="my-2" />

        <!-- [P0] Result filter (Win/Loss) -->
        <div class="mb-3">
          <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-2">
            Result
          </div>
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="r in resultOptions"
              :key="r"
              :color="selectedResult === r ? 'primary' : undefined"
              :variant="selectedResult === r ? 'flat' : 'outlined'"
              size="small"
              class="font-weight-bold"
              @click="selectResult(r)"
            >
              {{ r }}
            </v-chip>
          </div>
        </div>

        <!-- Timeframe filter -->
        <div class="mb-3">
          <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-2">
            Timeframe
          </div>
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="tf in tfOptions"
              :key="tf"
              :color="selectedTF === tf ? 'primary' : undefined"
              :variant="selectedTF === tf ? 'flat' : 'outlined'"
              size="small"
              class="font-weight-bold"
              @click="selectTF(tf)"
            >
              {{ tf }}
            </v-chip>
          </div>
        </div>

        <!-- [P1] Exit Reason filter -->
        <div>
          <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-2">
            Exit
          </div>
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="ex in exitOptions"
              :key="ex"
              :color="selectedExit === ex ? 'primary' : undefined"
              :variant="selectedExit === ex ? 'flat' : 'outlined'"
              size="small"
              class="font-weight-bold"
              @click="selectExit(ex)"
            >
              {{ ex }}
            </v-chip>
          </div>
        </div>
      </div>
    </v-expand-transition>
  </v-card-text>
</v-card>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Container | `glass-card rounded-lg mb-2` | Standard card wrapper. `mb-2` because sort toggle follows. |
| Padding | `pa-3` | Slightly tighter than content cards -- filter bar is a tool, not content |
| Section labels | `text-caption font-weight-bold text-label-muted text-uppercase mb-2` | Standard section label pattern from design system |
| Active chip | `color="primary" variant="flat" size="small" font-weight-bold` | Primary color = selected. Flat variant = strong visual. |
| Inactive chip | `variant="outlined" size="small" font-weight-bold` | Outlined = unselected but available. Border visible on dark bg. |
| Chip gap | `ga-1` (4px) | Standard chip gap from design system |
| Month nav buttons | `v-btn icon variant="text" size="x-small"` | Minimal chrome. Chevron icons for prev/next. |
| Month label | `text-body-2 font-weight-bold` min-width 120px centered | Fixed width prevents layout shift when month name changes. |
| "All" option | First chip in each group | Resets filter for that dimension |
| More Filters btn | `variant="text" size="small" text-caption text-label-muted w-100` | Full-width text button. Low prominence -- secondary action. |
| Badge on toggle | `v-badge color="primary" inline` | Shows count of active extra filters when collapsed -- so user knows filters are active even when hidden. |
| Expand transition | `v-expand-transition` | Smooth expand/collapse. Vuetify built-in. |
| Divider | `v-divider my-2` | Visual separator between compact and expanded filters |

**Expandable Filter Rationale (Lungo recommendation):**
- 375px screen cannot comfortably show Symbol + Period + Result + TF + Exit Reason all at once
- Symbol + Period are the most frequently used filters -- always visible
- Result, Timeframe, Exit Reason are secondary -- hidden behind "More Filters"
- Badge indicator tells user when extra filters are active (even when collapsed)
- `v-expand-transition` provides smooth, native Vuetify animation

**Symbol Options:**
```typescript
const symbolOptions = ['All', 'USD-JPY', 'EUR-USD', 'GBP-JPY', 'XAU-USD']
// Derived from available symbols in the system
```

**Result Options (P0):**
```typescript
const resultOptions = ['All', 'Win', 'Loss']
// Win = profitPips > 0, Loss = profitPips <= 0
```

**Timeframe Options:**
```typescript
const tfOptions = ['All', '15m', '1h', '4h']
```

**Exit Reason Options (P1):**
```typescript
const exitOptions = ['All', 'TP', 'SL', 'Signal', 'Manual']
// Maps to API: TP, SL, OPPOSITE_SIGNAL, MANUAL
```

**Expandable State & Active Filter Count:**
```typescript
const showMoreFilters = ref(false)

const activeExtraFilterCount = computed(() => {
  let count = 0
  if (selectedResult.value !== 'All') count++
  if (selectedTF.value !== 'All') count++
  if (selectedExit.value !== 'All') count++
  return count
})
```

**Month Navigation Logic:**
```typescript
const selectedMonth = ref(moment().month())  // 0-11
const selectedYear = ref(moment().year())

const currentMonthLabel = computed(() => {
  return moment().month(selectedMonth.value).year(selectedYear.value).format('MMM YYYY')
})

const isCurrentMonth = computed(() => {
  return selectedMonth.value === moment().month() && selectedYear.value === moment().year()
})

function prevMonth() {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

function nextMonth() {
  if (!isCurrentMonth.value) {
    if (selectedMonth.value === 11) {
      selectedMonth.value = 0
      selectedYear.value++
    } else {
      selectedMonth.value++
    }
  }
}
```

### 3.3.1 Zone B2: Sort Toggle

> **[P0] Sort Toggle** — Lungo review item #2

```vue
<div class="d-flex justify-end mb-3">
  <v-btn
    variant="text"
    size="small"
    class="text-caption text-medium-emphasis"
    @click="toggleSort"
  >
    <v-icon icon="mdi-sort-calendar-descending" size="16" start />
    {{ sortLabel }}
    <v-icon
      :icon="sortOrder === 'newest' ? 'mdi-arrow-down' : 'mdi-arrow-up'"
      size="14"
      end
    />
  </v-btn>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Container | `d-flex justify-end mb-3` | Right-aligned. Gap before summary stats. |
| Button | `variant="text" size="small" text-caption text-medium-emphasis` | Low-prominence toggle. Not a primary action. |
| Icon | `mdi-sort-calendar-descending size="16"` | Calendar sort icon -- conveys date-based sorting |
| Arrow | `mdi-arrow-down` (newest) / `mdi-arrow-up` (oldest) | Visual cue for current sort direction |

**Sort Logic:**
```typescript
const sortOrder = ref<'newest' | 'oldest'>('newest')

const sortLabel = computed(() => {
  return sortOrder.value === 'newest' ? 'Latest First' : 'Oldest First'
})

function toggleSort() {
  sortOrder.value = sortOrder.value === 'newest' ? 'oldest' : 'newest'
  // Triggers API refetch with sort parameter
}
```

**API Parameter:** `sort=newest` (default) or `sort=oldest`

### 3.4 Zone C: Summary Stats Bar (2 Rows)

> **[P1] Avg Win / Avg Loss / PF** — Lungo review item #4

```vue
<v-card elevation="0" rounded="lg" class="glass-card mb-3">
  <v-card-text class="pa-3">
    <!-- Row 1: Core stats (existing) -->
    <v-row dense class="mb-2">
      <v-col cols="4">
        <div class="text-center">
          <div class="text-h6 font-weight-bold font-mono">
            {{ summary.totalTrades }}
          </div>
          <div class="text-caption text-label-muted font-weight-medium">Trades</div>
        </div>
      </v-col>
      <v-col cols="4">
        <div class="text-center">
          <div class="text-h6 font-weight-bold font-mono" :class="winRateColorClass">
            {{ summary.winRate }}%
          </div>
          <div class="text-caption text-label-muted font-weight-medium">Win Rate</div>
        </div>
      </v-col>
      <v-col cols="4">
        <div class="text-center">
          <div class="text-h6 font-weight-bold font-mono" :class="totalPipsColorClass">
            {{ formatPips(summary.totalPips) }}
          </div>
          <div class="text-caption text-label-muted font-weight-medium">Total Pips</div>
        </div>
      </v-col>
    </v-row>

    <v-divider class="mb-2" />

    <!-- Row 2: Advanced stats (new -- Lungo review) -->
    <v-row dense>
      <v-col cols="4">
        <div class="text-center">
          <div class="text-body-2 font-weight-bold font-mono text-success">
            {{ formatPips(summary.avgWinPips) }}
          </div>
          <div class="text-caption text-label-muted font-weight-medium">Avg Win</div>
        </div>
      </v-col>
      <v-col cols="4">
        <div class="text-center">
          <div class="text-body-2 font-weight-bold font-mono text-error">
            {{ formatPips(summary.avgLossPips) }}
          </div>
          <div class="text-caption text-label-muted font-weight-medium">Avg Loss</div>
        </div>
      </v-col>
      <v-col cols="4">
        <div class="text-center">
          <div
            class="text-body-2 font-weight-bold font-mono"
            :class="pfColorClass(summary.profitFactor)"
          >
            {{ summary.profitFactor.toFixed(2) }}
          </div>
          <div class="text-caption text-label-muted font-weight-medium">PF</div>
        </div>
      </v-col>
    </v-row>
  </v-card-text>
</v-card>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Layout Row 1 | `v-row dense` 3x `v-col cols="4"` | Same 3-column grid as Portfolio Overview stats |
| Layout Row 2 | `v-row dense` 3x `v-col cols="4"` | Secondary stats row -- same grid rhythm |
| Divider | `v-divider mb-2` | Visual separator between primary and secondary stats |
| Row 1 Numbers | `text-h6 font-weight-bold font-mono` | Primary stat level, monospace |
| Row 2 Numbers | `text-body-2 font-weight-bold font-mono` | Secondary stat level -- slightly smaller than Row 1 to maintain hierarchy |
| Labels | `text-caption text-label-muted font-weight-medium` | Standard muted label |
| Win Rate color | Dynamic (see color logic) | Green if >= 60%, warning if >= 50%, red if < 50% |
| Total Pips color | Dynamic: green positive, red negative | Standard P&L color mapping |
| Avg Win color | Always `text-success` | Avg win is always positive -- green reinforces "this is how much you win" |
| Avg Loss color | Always `text-error` | Avg loss is always negative -- red reinforces "this is how much you lose" |
| PF color | Dynamic 4-tier (same as Portfolio Overview) | >= 2.0 success, >= 1.5 primary, >= 1.2 warning, < 1.2 error |
| Card padding | `pa-3` | Compact -- summary bar is supplementary, not primary content |

**Win Rate Color Logic:**
```typescript
const winRateColorClass = computed(() => {
  if (summary.value.winRate >= 60) return 'text-success'
  if (summary.value.winRate >= 50) return 'text-warning'
  return 'text-error'
})
```

**Total Pips Color Logic:**
```typescript
const totalPipsColorClass = computed(() => {
  if (summary.value.totalPips > 0) return 'text-success'
  if (summary.value.totalPips < 0) return 'text-error'
  return 'text-medium-emphasis'
})
```

**Profit Factor Color Logic (shared with Portfolio Overview):**
```typescript
function pfColorClass(pf: number): string {
  if (pf >= 2.0) return 'text-success'
  if (pf >= 1.5) return 'text-primary'
  if (pf >= 1.2) return 'text-warning'
  return 'text-error'
}
```

### 3.5 Zone D: Trade Card

```vue
<v-card
  v-for="trade in trades"
  :key="trade.id"
  elevation="0"
  rounded="lg"
  class="glass-card mb-3"
>
  <v-card-text class="pa-4">
    <!-- Row 1: Header (Symbol + Direction + TF + Strategy) -->
    <!-- Row 2: Prices + Times -->
    <!-- Row 3: Exit Reason + Duration -->
    <!-- Row 4: P&L Hero -->
  </v-card-text>
</v-card>
```

#### Row 1: Card Header (Symbol + Direction + TF + Strategy)

```vue
<div class="d-flex align-center ga-2 mb-3">
  <!-- Direction chip -->
  <v-chip
    :color="trade.action === 'BUY' ? 'success' : 'error'"
    size="x-small"
    variant="flat"
    class="font-weight-black"
  >
    {{ trade.action }}
  </v-chip>

  <!-- Symbol -->
  <span class="text-subtitle-1 font-weight-bold">{{ trade.symbol }}</span>

  <v-spacer />

  <!-- Timeframe -->
  <span class="text-caption text-label-muted font-weight-medium">
    {{ trade.interval }}
  </span>

  <!-- Strategy (truncated) -->
  <v-chip
    size="x-small"
    variant="tonal"
    class="text-label-muted font-weight-medium"
  >
    {{ formatStrategy(trade.strategyName) }}
  </v-chip>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Direction chip | Same as Open Positions: `size="x-small" variant="flat" font-weight-black` | BUY = success, SELL = error. Consistent. |
| Symbol | `text-subtitle-1 font-weight-bold` | Same as Open Positions |
| TF | `text-caption text-label-muted font-weight-medium` | Same as Open Positions |
| Strategy chip | `size="x-small" variant="tonal" text-label-muted font-weight-medium` | Muted tonal chip -- strategy name is context, not primary info. |

**Strategy Name Formatting:**
```typescript
function formatStrategy(name: string): string {
  // "ICHI_TK_CLOUD" -> "ICHI TK"
  // "EMABB_FILTERED" -> "EMABB"
  // Show shortened form to fit mobile
  const parts = name.split('_')
  return parts.slice(0, 2).join(' ')
}
```

#### Row 2: Entry --> Exit Prices + Times

```vue
<div class="glass-sheet rounded-lg pa-3 mb-3">
  <div class="d-flex justify-space-between">
    <!-- Entry -->
    <div>
      <div class="text-caption text-label-muted font-weight-medium mb-1">Entry</div>
      <div class="text-body-2 font-weight-bold font-mono">{{ trade.entryPrice }}</div>
      <div class="text-caption text-medium-emphasis font-mono mt-1">
        {{ formatTime(trade.entryTime) }}
      </div>
    </div>

    <!-- Arrow -->
    <div class="d-flex align-center">
      <v-icon icon="mdi-arrow-right" size="16" class="text-label-muted" />
    </div>

    <!-- Exit -->
    <div class="text-right">
      <div class="text-caption text-label-muted font-weight-medium mb-1">Exit</div>
      <div class="text-body-2 font-weight-bold font-mono">{{ trade.exitPrice }}</div>
      <div class="text-caption text-medium-emphasis font-mono mt-1">
        {{ formatTime(trade.exitTime) }}
      </div>
    </div>
  </div>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Container | `glass-sheet rounded-lg pa-3` | Same inner surface as Open Positions price row |
| Layout | `d-flex justify-space-between` | Entry left, arrow center, exit right |
| Price labels | `text-caption text-label-muted font-weight-medium mb-1` | Standard muted label |
| Price values | `text-body-2 font-weight-bold font-mono` | Same as Open Positions |
| Timestamps | `text-caption text-medium-emphasis font-mono mt-1` | Below price, smaller, muted. Monospace for alignment. |
| Arrow | `mdi-arrow-right size="16" text-label-muted` | Same as Open Positions |

**Time Formatting:**
```typescript
function formatTime(isoString: string): string {
  return moment(isoString).format('MMM D HH:mm')
  // "Mar 14 10:00"
}
```

#### Row 3: Exit Reason + Duration

```vue
<div class="d-flex align-center justify-space-between mb-3">
  <v-chip
    :color="exitReasonColor(trade.exitReason)"
    size="x-small"
    variant="tonal"
    class="font-weight-bold"
  >
    {{ exitReasonLabel(trade.exitReason) }}
  </v-chip>

  <span class="text-caption text-medium-emphasis font-mono">
    <v-icon icon="mdi-clock-outline" size="12" class="mr-1" />{{ trade.duration }}
  </span>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Exit reason chip | `size="x-small" variant="tonal" font-weight-bold` + dynamic color | Color-coded by exit type for quick identification |
| Duration | `text-caption text-medium-emphasis font-mono` | Secondary context, same pattern as Open Positions duration |

**Exit Reason Color & Label:**
```typescript
function exitReasonColor(reason: string): string {
  switch (reason) {
    case 'TP': return 'success'              // Take Profit = good outcome
    case 'SL': return 'error'                // Stop Loss = loss
    case 'OPPOSITE_SIGNAL': return 'info'    // Signal-based exit = neutral/informational
    case 'MANUAL': return 'warning'          // Manual intervention = caution
    default: return 'grey'
  }
}

function exitReasonLabel(reason: string): string {
  switch (reason) {
    case 'TP': return 'Take Profit'
    case 'SL': return 'Stop Loss'
    case 'OPPOSITE_SIGNAL': return 'Signal Exit'
    case 'MANUAL': return 'Manual'
    default: return reason
  }
}
```

| Exit Reason | Color | Label | Rationale |
|-------------|-------|-------|-----------|
| TP | `success` (green) | Take Profit | Positive outcome -- reached profit target |
| SL | `error` (red) | Stop Loss | Negative outcome -- hit stop loss |
| OPPOSITE_SIGNAL | `info` (blue) | Signal Exit | Neutral -- system decided to exit based on new signal |
| MANUAL | `warning` (amber) | Manual | Caution -- human intervention, could be either |

#### Row 4: P&L Hero

```vue
<div class="text-center">
  <span
    class="text-h5 font-weight-black font-mono"
    :class="plColorClass(trade.profitPips)"
  >
    {{ formatPips(trade.profitPips) }} pips
  </span>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Size | `text-h5 font-weight-black font-mono` | Same card-level hero as Open Positions floating P&L |
| Color | Dynamic: `text-success` (positive), `text-error` (negative), `text-medium-emphasis` (zero) | Standard P&L color mapping |
| Alignment | `text-center` | Centered for visual impact, same as Open Positions |
| Format | `+53 pips` / `-27 pips` / `0 pips` | Always show sign prefix |

**P&L Color Logic:**
```typescript
function plColorClass(pips: number): string {
  if (pips > 0) return 'text-success'
  if (pips < 0) return 'text-error'
  return 'text-medium-emphasis'
}
```

### 3.6 Zone E: Load More

```vue
<div v-if="pagination.hasMore" class="text-center mt-4 mb-2">
  <v-btn
    variant="tonal"
    color="primary"
    size="small"
    rounded="lg"
    :loading="loadingMore"
    @click="loadMore"
  >
    <v-icon icon="mdi-chevron-down" start size="16" />
    Load More
  </v-btn>
  <div class="text-caption text-label-muted mt-2">
    {{ trades.length }} of {{ pagination.total }} shown
  </div>
</div>

<div v-else-if="trades.length > 0" class="text-center mt-4 mb-2">
  <div class="text-caption text-label-muted">
    All {{ pagination.total }} trades shown
  </div>
</div>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Button | `variant="tonal" color="primary" size="small" rounded="lg"` | Tonal primary = secondary action. Not a CTA, just "show more." |
| Loading | `:loading="loadingMore"` | Vuetify built-in loading state on button |
| Count | `text-caption text-label-muted` | "12 of 42 shown" -- informational context |
| End state | "All 42 trades shown" | Confirms user has seen everything. No more button. |

**Why Load More (not infinite scroll):**
- Infinite scroll can cause performance issues on mobile with many cards
- Load More gives user control over data fetching
- Easier to implement and test
- User can see "12 of 42" and decide if they want more

---

## 4. Bottom Navigation Update

```vue
<!-- In app.vue or layouts/default.vue -->
<v-bottom-navigation grow color="primary" bg-color="#1E1E1E">
  <v-btn to="/" :active="route.path === '/'">
    <v-icon icon="mdi-view-dashboard-outline" />
    <span class="text-uppercase text-caption">Dashboard</span>
  </v-btn>
  <v-btn to="/history" :active="route.path === '/history'">
    <v-icon icon="mdi-history" />
    <span class="text-uppercase text-caption">History</span>
  </v-btn>
  <v-btn to="/performance" :active="route.path === '/performance'">
    <v-icon icon="mdi-chart-line-variant" />
    <span class="text-uppercase text-caption">Performance</span>
  </v-btn>
</v-bottom-navigation>
```

| Tab | Icon | Label | Route |
|-----|------|-------|-------|
| Dashboard | `mdi-view-dashboard-outline` | DASHBOARD | `/` |
| History | `mdi-history` | HISTORY | `/history` |
| Performance | `mdi-chart-line-variant` | PERFORMANCE | `/performance` |

> **Note:** Bottom nav icons updated to be more descriptive. `mdi-view-dashboard-outline` for dashboard (was `mdi-view-grid-outline`), `mdi-history` for trade history, `mdi-chart-line-variant` for performance (same as current Analysis nav).

---

## 5. States

### 5.1 Loading State (Initial Page Load)

```vue
<!-- Filter skeleton -->
<v-card elevation="0" rounded="lg" class="glass-card mb-3">
  <v-card-text class="pa-3">
    <v-skeleton-loader type="text" width="60" class="mb-2" />
    <div class="d-flex ga-1 mb-3">
      <v-skeleton-loader v-for="i in 4" :key="i" type="chip" width="70" />
    </div>
    <v-skeleton-loader type="text" width="60" class="mb-2" />
    <div class="d-flex ga-1 mb-3">
      <v-skeleton-loader v-for="i in 3" :key="i" type="chip" width="50" />
    </div>
    <v-skeleton-loader type="text" width="60" class="mb-2" />
    <v-skeleton-loader type="text" width="160" class="mx-auto" />
  </v-card-text>
</v-card>

<!-- Summary skeleton -->
<v-card elevation="0" rounded="lg" class="glass-card mb-3">
  <v-card-text class="pa-3">
    <v-row dense>
      <v-col v-for="i in 3" :key="i" cols="4">
        <div class="text-center">
          <v-skeleton-loader type="text" width="40" class="mx-auto mb-1" />
          <v-skeleton-loader type="text" width="50" class="mx-auto" />
        </div>
      </v-col>
    </v-row>
  </v-card-text>
</v-card>

<!-- Trade card skeletons (show 3) -->
<v-card
  v-for="i in 3"
  :key="i"
  elevation="0"
  rounded="lg"
  class="glass-card mb-3"
>
  <v-card-text class="pa-4">
    <div class="d-flex align-center ga-2 mb-3">
      <v-skeleton-loader type="chip" width="50" />
      <v-skeleton-loader type="text" width="100" />
      <v-spacer />
      <v-skeleton-loader type="chip" width="70" />
    </div>
    <v-sheet rounded="lg" class="glass-sheet pa-3 mb-3">
      <div class="d-flex justify-space-between">
        <v-skeleton-loader type="text@3" width="80" />
        <v-skeleton-loader type="text@3" width="80" />
      </div>
    </v-sheet>
    <div class="d-flex justify-space-between mb-3">
      <v-skeleton-loader type="chip" width="80" />
      <v-skeleton-loader type="text" width="60" />
    </div>
    <div class="text-center">
      <v-skeleton-loader type="heading" width="120" class="mx-auto" />
    </div>
  </v-card-text>
</v-card>
```

**Pattern:** 3 skeleton cards -- enough to communicate "this is a list" without over-promising. Skeletons match exact card structure.

### 5.2 Error State

```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4">
    <v-alert type="error" variant="tonal" class="mb-0">
      Failed to load trade history
      <template #append>
        <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
      </template>
    </v-alert>
  </v-card-text>
</v-card>
```

**Pattern:** Same as Portfolio Overview / Open Positions error state.

### 5.3 Empty State (No Trades Match Filter)

```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4 text-center">
    <v-icon icon="mdi-file-search-outline" size="48" class="text-medium-emphasis mb-2" />
    <div class="text-body-2 text-medium-emphasis">No trades found</div>
    <div class="text-caption text-label-muted mt-1">
      Try adjusting your filters or selecting a different month
    </div>
  </v-card-text>
</v-card>
```

| Element | Spec | Rationale |
|---------|------|-----------|
| Icon | `mdi-file-search-outline size="48" text-medium-emphasis` | File search = looking for records. Appropriate for filtered empty state. |
| Main text | `text-body-2 text-medium-emphasis` | "No trades found" -- factual |
| Sub text | `text-caption text-label-muted` | Actionable hint to adjust filters |

### 5.4 Empty State (No Trades at All -- First Time)

```vue
<v-card elevation="0" rounded="lg" class="glass-card">
  <v-card-text class="pa-4 text-center">
    <v-icon icon="mdi-chart-box-outline" size="48" class="text-medium-emphasis mb-2" />
    <div class="text-body-2 text-medium-emphasis">No closed trades yet</div>
    <div class="text-caption text-label-muted mt-1">
      Trades will appear here once positions are closed
    </div>
  </v-card-text>
</v-card>
```

### 5.5 Loading More State (Pagination)

- "Load More" button shows built-in `loading` spinner via `:loading="loadingMore"`
- Existing cards remain visible while loading more
- New cards append below existing ones

---

## 6. Color Mapping Summary

| Data Point | Condition | Color Class | Hex |
|-----------|-----------|-------------|-----|
| BUY chip | action = BUY | `color="success"` | `#4CAF50` |
| SELL chip | action = SELL | `color="error"` | `#FF5252` |
| P&L pips | > 0 | `text-success` | `#4CAF50` |
| P&L pips | < 0 | `text-error` | `#FF5252` |
| P&L pips | = 0 | `text-medium-emphasis` | grey |
| Win Rate (summary) | >= 60% | `text-success` | `#4CAF50` |
| Win Rate (summary) | >= 50% | `text-warning` | `#FB8C00` |
| Win Rate (summary) | < 50% | `text-error` | `#FF5252` |
| Total Pips (summary) | > 0 | `text-success` | `#4CAF50` |
| Total Pips (summary) | < 0 | `text-error` | `#FF5252` |
| Total Pips (summary) | = 0 | `text-medium-emphasis` | grey |
| Exit: TP | always | `color="success"` | `#4CAF50` |
| Exit: SL | always | `color="error"` | `#FF5252` |
| Exit: OPPOSITE_SIGNAL | always | `color="info"` | `#2196F3` |
| Exit: MANUAL | always | `color="warning"` | `#FB8C00` |
| Avg Win Pips (summary) | always | `text-success` | `#4CAF50` |
| Avg Loss Pips (summary) | always | `text-error` | `#FF5252` |
| Profit Factor (summary) | >= 2.0 | `text-success` | `#4CAF50` |
| Profit Factor (summary) | >= 1.5 | `text-primary` | `#4ADE80` |
| Profit Factor (summary) | >= 1.2 | `text-warning` | `#FB8C00` |
| Profit Factor (summary) | < 1.2 | `text-error` | `#FF5252` |
| Active filter chip | selected | `color="primary"` | `#4ADE80` |
| Inactive filter chip | unselected | `variant="outlined"` | border only |
| Load More button | always | `color="primary"` tonal | `#4ADE80` |

---

## 7. Typography Spec

| Element | Classes | Font | Size | Weight |
|---------|---------|------|------|--------|
| Page title | `text-h5 font-weight-bold` | Noto Sans Thai | 24px | 700 |
| Page subtitle | `text-caption text-label-muted` | Noto Sans Thai | 12px | 400 |
| Filter label | `text-caption font-weight-bold text-label-muted text-uppercase` | Noto Sans Thai | 12px | 700 |
| Filter chip | `font-weight-bold` | Noto Sans Thai | ~14px | 700 |
| Month label | `text-body-2 font-weight-bold` | Noto Sans Thai | 14px | 700 |
| Summary number (row 1) | `text-h6 font-weight-bold font-mono` | JetBrains Mono | 20px | 700 |
| Summary number (row 2) | `text-body-2 font-weight-bold font-mono` | JetBrains Mono | 14px | 700 |
| Summary label | `text-caption text-label-muted font-weight-medium` | Noto Sans Thai | 12px | 500 |
| Sort toggle text | `text-caption text-medium-emphasis` | Noto Sans Thai | 12px | 400 |
| More Filters btn | `text-caption text-label-muted` | Noto Sans Thai | 12px | 400 |
| BUY/SELL chip | `font-weight-black` | Noto Sans Thai | ~10px | 900 |
| Symbol name | `text-subtitle-1 font-weight-bold` | Noto Sans Thai | 16px | 700 |
| TF label | `text-caption text-label-muted font-weight-medium` | Noto Sans Thai | 12px | 500 |
| Strategy chip | `font-weight-medium` | Noto Sans Thai | ~10px | 500 |
| Price label | `text-caption text-label-muted font-weight-medium` | Noto Sans Thai | 12px | 500 |
| Price value | `text-body-2 font-weight-bold font-mono` | JetBrains Mono | 14px | 700 |
| Timestamp | `text-caption text-medium-emphasis font-mono` | JetBrains Mono | 12px | 400 |
| Exit reason chip | `font-weight-bold` | Noto Sans Thai | ~10px | 700 |
| Duration | `text-caption text-medium-emphasis font-mono` | JetBrains Mono | 12px | 400 |
| P&L hero | `text-h5 font-weight-black font-mono` | JetBrains Mono | 24px | 900 |
| Load More btn | default button text | Noto Sans Thai | 14px | 500 |
| Count text | `text-caption text-label-muted` | Noto Sans Thai | 12px | 400 |

---

## 8. Spacing Spec

| Gap | Value | Vuetify | Between |
|-----|-------|---------|---------|
| Page header gap | 12px | `ga-3` | Avatar to title |
| Subtitle to divider | 16px | `mb-4` | Subtitle to divider |
| Divider to filter | 16px | `mb-4` on divider | Divider to filter bar |
| Filter card padding | 12px | `pa-3` | Inside filter card |
| Filter section gap | 12px | `mb-3` | Between filter sections (symbol, tf, period) |
| Filter label to chips | 8px | `mb-2` | Label to chip row |
| Filter to sort toggle | 8px | `mb-2` on filter card | Filter bar to sort toggle |
| Sort toggle to summary | 12px | `mb-3` on sort container | Sort toggle to summary |
| Summary card padding | 12px | `pa-3` | Inside summary card |
| Summary to first trade | 12px | `mb-3` on summary card | Summary to trade cards |
| Between trade cards | 12px | `mb-3` | Card to card |
| Card internal padding | 16px | `pa-4` | Trade card outer padding |
| Header to prices | 12px | `mb-3` | Row 1 to Row 2 |
| Price box padding | 12px | `pa-3` | Inside glass-sheet |
| Prices to exit row | 12px | `mb-3` | Row 2 to Row 3 |
| Exit row to P&L | 12px | `mb-3` | Row 3 to Row 4 |
| Load More to count | 8px | `mt-2` | Button to count text |

---

## 9. Responsive Behavior

| Breakpoint | Behavior | Changes |
|-----------|----------|---------|
| xs (< 600px) | Primary target | Layout as designed. Full-width cards. `pa-3` page padding. |
| sm (>= 600px) | Same layout | `pa-sm-4` page padding. Contained by 800px max-width. |
| md+ (>= 960px) | Same layout | Cards centered in 800px container. |

**No breakpoint layout changes needed.** Single column card layout works from 375px up. Filter chips wrap naturally with `flex-wrap`.

---

## 10. Component File Structure

```
app/
  pages/
    history.vue                  <-- Page component
  components/trading/
    TradeHistoryFilter.vue       <-- Filter bar (optional extraction)
    TradeHistoryCard.vue         <-- Single trade card (optional extraction)
  composables/
    useTradeHistory.ts           <-- Data fetching + filtering composable
```

### Composable Interface
```typescript
// app/composables/useTradeHistory.ts

interface TradeHistorySummary {
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalPips: number
  profitFactor: number
  avgWinPips: number       // [P1] Lungo review — average pips per winning trade
  avgLossPips: number      // [P1] Lungo review — average pips per losing trade (negative)
}

interface ClosedTrade {
  id: string
  symbol: string
  interval: string
  strategyName: string
  action: 'BUY' | 'SELL'
  entryPrice: string
  entryTime: string
  exitPrice: string
  exitTime: string
  exitReason: 'TP' | 'SL' | 'OPPOSITE_SIGNAL' | 'MANUAL'
  profitPips: number
  profitPercent: string
  duration: string
}

interface TradeHistoryPagination {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

// Returns:
// { summary, trades, pagination, loading, loadingMore, error, fetch, loadMore }
// + filter state: selectedSymbol, selectedTF, selectedMonth, selectedYear,
//                 selectedResult, selectedExit, sortOrder, showMoreFilters
// + computed: activeExtraFilterCount
```

---

## 11. Design Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Card-per-trade (not table) | Consistent with Open Positions pattern. Table unusable on 375px with 8+ columns. Card enables proper hierarchy with P&L as hero. | v-data-table, Compact rows |
| Load More (not infinite scroll) | Gives user control. Prevents perf issues with many cards. Shows progress ("12 of 42"). Easier to implement. | Infinite scroll, Full pagination (1/2/3...) |
| Filter in glass-card (not sticky header) | Filter bar is a tool panel. Glass-card groups it visually. At 375px, sticky filter would consume too much screen space. | Sticky top, Bottom sheet filter |
| Expandable filter (compact + expand) | 375px cannot show Symbol + Period + Result + TF + Exit all at once (Lungo review). Compact shows Symbol + Period (most used). "More Filters" expands to show Result, TF, Exit Reason. Badge shows active extra filter count when collapsed. | Show all filters always (too tall on mobile), Bottom sheet filter, Separate filter page |
| Chip group for filters (not dropdowns) | Chips show all options at once -- no extra tap needed. Options are few (4-5 symbols, 3 TFs, 3 results, 5 exits). Mobile-friendly touch targets. | v-select dropdown, Bottom sheet picker |
| Sort toggle (newest/oldest) | Traders need to find specific old trades or review recent performance. Simple binary toggle is sufficient -- no need for multi-sort. Lungo review item. | Multi-column sort, Dropdown with many options |
| Summary Row 2 (Avg W/L + PF) | Lungo review: Avg Win, Avg Loss, and Profit Factor are essential trading metrics. Row 2 uses smaller font (text-body-2) to maintain hierarchy below Row 1. | Single row (too crowded), Separate card, No PF in summary |
| Month navigator (not date range picker) | Trades are naturally grouped by month. Prev/next is simpler than date picker. Matches Performance page's monthly grouping. | Date range picker, Calendar popup |
| Summary updates with filter | Summary shows "what am I looking at" context. If filter shows USD-JPY March, summary should reflect USD-JPY March stats, not all-time. | Fixed summary (always all-time), No summary |
| Exit reason as chip with color | Color-coded chips enable instant identification of why a trade closed. TP=green (good), SL=red (bad), Signal=blue (neutral), Manual=amber (caution). | Text only, Icon only, No exit reason display |
| Strategy name shortened | Full names like "ICHI_TK_CLOUD" too long for mobile header row. Shortened "ICHI TK" conveys enough context. Full name available in detail view (future). | Full name (overflow), Hide entirely |
| Timestamps below prices (not in header) | Entry/exit times are contextual to their prices. Placing below the price value creates a natural reading flow: "Entry at 149.250 on Mar 14 10:00." | Timestamps in header row, Separate row |
| text-h5 for P&L (not text-h4) | Same rationale as Open Positions: text-h4 reserved for page-level hero. Card-level hero uses text-h5 to maintain hierarchy. | text-h4 (breaks hierarchy), text-h6 (too small) |
| mdi-file-search-outline for empty filtered | File search = "looking through records." Appropriate when filters return no results. Different icon from Open Positions empty (mdi-radar) because the context is different. | mdi-magnify, mdi-filter-off |
| Win Rate color thresholds in summary | 60%+ = success, 50%+ = warning, <50% = error. These are meaningful trading thresholds. Below 50% means more losses than wins. | Always green, Binary good/bad |
| 3 skeleton cards for loading | History page likely has many trades. 3 skeletons communicate "this is a long list" better than 2 (used in Open Positions for its smaller scope). | 2 skeletons, 5 skeletons, Spinner only |

---

## 12. Checklist for Implementation (Cappu)

### Setup
- [ ] Create `app/pages/history.vue`
- [ ] Create `app/composables/useTradeHistory.ts`
- [ ] Add TypeScript interfaces `ClosedTrade`, `TradeHistorySummary`, `TradeHistoryPagination` in `types/trading.ts`
- [ ] Update bottom navigation in layout (3 tabs)

### Page Header
- [ ] Avatar + title + subtitle matching Dashboard pattern
- [ ] Divider below subtitle

### Filter Bar (Expandable)
- [ ] Glass-card wrapper
- [ ] **Compact (always visible):** Symbol chip group + Month/year navigator
- [ ] **"More Filters" toggle button** with badge showing active extra filter count
- [ ] **Expandable section** (v-expand-transition):
  - [ ] [P0] Result chip group: All / Win / Loss
  - [ ] Timeframe chip group: All / 15m / 1h / 4h
  - [ ] [P1] Exit Reason chip group: All / TP / SL / Signal / Manual
- [ ] Active chip: `color="primary" variant="flat"`
- [ ] Inactive chip: `variant="outlined"`
- [ ] Trigger API refetch on filter change

### Sort Toggle
- [ ] [P0] Right-aligned sort button below filter bar
- [ ] Toggle between "Latest First" and "Oldest First"
- [ ] Visual arrow indicator for current direction
- [ ] Trigger API refetch on sort change

### Summary Stats (2 Rows)
- [ ] Row 1: Trades / Win Rate / Total Pips (`text-h6`)
- [ ] Row 2: Avg Win / Avg Loss / PF (`text-body-2`)
- [ ] Divider between rows
- [ ] Dynamic colors on all values
- [ ] PF color thresholds (4-tier: success/primary/warning/error)
- [ ] Updates when filter changes

### Trade Cards
- [ ] Glass-card outer container
- [ ] Row 1: BUY/SELL chip + symbol + TF + strategy chip
- [ ] Row 2: Entry/Exit prices + timestamps in glass-sheet
- [ ] Row 3: Exit reason chip + duration
- [ ] Row 4: P&L hero (text-h5, centered)

### Load More
- [ ] "Load More" button with loading state
- [ ] "X of Y shown" count text
- [ ] "All X trades shown" end state
- [ ] Append new trades below existing

### States
- [ ] Loading: filter skeleton + summary skeleton + 3 card skeletons
- [ ] Error: tonal alert with retry
- [ ] Empty (filtered): file-search icon + "No trades found" + filter hint
- [ ] Empty (no data): chart-box icon + "No closed trades yet"
- [ ] Loading more: button loading state

### Colors & Typography
- [ ] All numbers use `font-mono`
- [ ] BUY = success, SELL = error
- [ ] P&L dynamic colors
- [ ] Exit reason chip colors
- [ ] Win rate color thresholds
- [ ] Filter chip active/inactive states

### Integration
- [ ] Verify on 375px viewport
- [ ] Test with empty trades (both filtered and no-data)
- [ ] Test filter combinations (including expandable filters)
- [ ] Test month navigation bounds
- [ ] Test Load More pagination
- [ ] Test sort toggle (newest/oldest)
- [ ] Test "More Filters" expand/collapse + badge count
- [ ] Espresso design review before merge

---

## 13. Future Enhancements

> Noted from Lungo review -- items to consider for future versions.

| Enhancement | Priority | Notes |
|-------------|----------|-------|
| Sort by profit pips | Low | Sort trades by P&L instead of date |
| Filter by direction (BUY/SELL) | Low | Add direction chip group to expandable filters |
| Monthly PF trend line chart | Medium | Small sparkline showing PF trend across months |
| Consecutive months indicator | Low | Show win/loss streaks across months |
