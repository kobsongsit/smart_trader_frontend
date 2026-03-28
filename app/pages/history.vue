<script setup lang="ts">
import dayjs from 'dayjs'
import type { ChartTrade } from '../../types/trading'

// ============================================================
// Composable
// ============================================================

const { allTrades, loading, error, fetchTrades } = useTradesList()

// ============================================================
// Filter Options
// ============================================================

const symbolOptions = ['XAU-USD', 'USD-JPY', 'EUR-USD', 'GBP-JPY']
const resultOptions = ['All', 'Win', 'Loss']
const tfOptions     = ['All', '15m', '1h', '4h']
const exitOptions   = ['All', 'TP', 'SL', 'Signal', 'Manual']

const exitReasonMap: Record<string, string> = {
  'All': '', 'TP': 'TP', 'SL': 'SL', 'Signal': 'OPPOSITE_SIGNAL', 'Manual': 'MANUAL',
}

// ============================================================
// Local filter state (UI)
// ============================================================

const selectedSymbol = ref('XAU-USD')
const selectedResult = ref('All')
const selectedTF     = ref('All')
const selectedExit   = ref('All')
const selectedSort   = ref('newest')
const showMoreFilters = ref(false)

// Month navigator
const selectedMonthNum = ref(dayjs().month())   // 0-11
const selectedYearNum  = ref(dayjs().year())

const currentMonthLabel = computed(() =>
  dayjs().month(selectedMonthNum.value).year(selectedYearNum.value).format('MMM YYYY')
)

const isCurrentMonth = computed(() =>
  selectedMonthNum.value === dayjs().month() && selectedYearNum.value === dayjs().year()
)

function prevMonth() {
  if (selectedMonthNum.value === 0) { selectedMonthNum.value = 11; selectedYearNum.value-- }
  else selectedMonthNum.value--
  applyFilters()
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (selectedMonthNum.value === 11) { selectedMonthNum.value = 0; selectedYearNum.value++ }
  else selectedMonthNum.value++
  applyFilters()
}

// ============================================================
// Computed date range (month → from/to)
// ============================================================

const fromDate = computed(() =>
  dayjs().month(selectedMonthNum.value).year(selectedYearNum.value).startOf('month').format('YYYY-MM-DD')
)
const toDate = computed(() =>
  dayjs().month(selectedMonthNum.value).year(selectedYearNum.value).endOf('month').format('YYYY-MM-DD')
)

// ============================================================
// Active extra filter count (badge)
// ============================================================

const activeExtraFilterCount = computed(() => {
  let count = 0
  if (selectedResult.value !== 'All') count++
  if (selectedTF.value !== 'All') count++
  if (selectedExit.value !== 'All') count++
  return count
})

// ============================================================
// API fetch
// ============================================================

function applyFilters() {
  fetchTrades({
    symbol: selectedSymbol.value,
    interval: selectedTF.value !== 'All' ? selectedTF.value : undefined,
    from: fromDate.value,
    to: toDate.value,
  })
}

onMounted(() => applyFilters())

// ============================================================
// Client-side filtering + sort
// ============================================================

const filteredTrades = computed<ChartTrade[]>(() => {
  let list = [...allTrades.value]

  // Result filter
  if (selectedResult.value === 'Win')  list = list.filter(t => (t.profitPips ?? 0) > 0)
  if (selectedResult.value === 'Loss') list = list.filter(t => (t.profitPips ?? 0) < 0)

  // Exit reason filter
  const exitVal = exitReasonMap[selectedExit.value]
  if (exitVal) list = list.filter(t => t.exitReason === exitVal)

  // Sort
  list.sort((a, b) =>
    selectedSort.value === 'newest'
      ? b.entryTimestamp - a.entryTimestamp
      : a.entryTimestamp - b.entryTimestamp
  )

  return list
})

// ============================================================
// Summary stats (computed client-side)
// ============================================================

const summary = computed(() => {
  const trades = filteredTrades.value
  if (!trades.length) return null

  const wins   = trades.filter(t => (t.profitPips ?? 0) > 0)
  const losses = trades.filter(t => (t.profitPips ?? 0) < 0)

  const totalPips = trades.reduce((s, t) => s + (t.profitPips ?? 0), 0)
  const winPips   = wins.reduce((s, t) => s + (t.profitPips ?? 0), 0)
  const lossPips  = losses.reduce((s, t) => s + (t.profitPips ?? 0), 0)

  const winRate      = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0
  const avgWinPips   = wins.length   > 0 ? Math.round(winPips / wins.length) : 0
  const avgLossPips  = losses.length > 0 ? Math.round(Math.abs(lossPips / losses.length)) : 0
  const profitFactor = Math.abs(lossPips) > 0
    ? parseFloat((winPips / Math.abs(lossPips)).toFixed(2))
    : winPips > 0 ? 99 : 0

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    totalPips,
    avgWinPips,
    avgLossPips,
    profitFactor,
  }
})

// ============================================================
// Formatting helpers
// ============================================================

function formatPips(pips: number): string {
  const prefix = pips > 0 ? '+' : ''
  return `${prefix}${pips.toLocaleString('en-US')}`
}

function formatTime(ts: number | null): string {
  if (!ts) return '—'
  return dayjs.unix(ts).format('D MMM HH:mm')
}

function formatPrice(price: number | null): string {
  if (price === null) return '—'
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })
}

/** คำนวณ duration จาก UNIX timestamps */
function calcDuration(entryTs: number, exitTs: number | null): string {
  if (!exitTs) return '—'
  const diff = exitTs - entryTs
  const totalMinutes = Math.floor(diff / 60)
  const hours   = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours >= 24) {
    const days  = Math.floor(hours / 24)
    const remH  = hours % 24
    return remH > 0 ? `${days}d ${remH}h` : `${days}d`
  }
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// ============================================================
// Color helpers
// ============================================================

function plColorClass(pips: number | null): string {
  if (!pips) return 'text-medium-emphasis'
  if (pips > 0) return 'text-success'
  if (pips < 0) return 'text-error'
  return 'text-medium-emphasis'
}

function pfColorClass(pf: number): string {
  if (pf >= 2.0) return 'text-success'
  if (pf >= 1.5) return 'text-primary'
  if (pf >= 1.2) return 'text-warning'
  return 'text-error'
}

function exitBadgeClass(reason: string | null): string {
  switch (reason) {
    case 'TP':               return 'exit-badge--tp'
    case 'SL':               return 'exit-badge--sl'
    case 'OPPOSITE_SIGNAL':  return 'exit-badge--signal'
    case 'MANUAL':           return 'exit-badge--manual'
    default:                 return 'exit-badge--default'
  }
}

function exitReasonLabel(reason: string | null): string {
  switch (reason) {
    case 'TP':               return 'TP'
    case 'SL':               return 'SL'
    case 'OPPOSITE_SIGNAL':  return 'SIGNAL EXIT'
    case 'MANUAL':           return 'MANUAL'
    default:                 return reason ?? '—'
  }
}

// ============================================================
// Actions
// ============================================================

function retry() { applyFilters() }
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- ── Zone A: Page Header ── -->
    <div class="d-flex align-center ga-3 mb-5 mt-1">
      <div class="page-header-icon">
        <v-icon icon="mdi-history" size="22" color="#050505" />
      </div>
      <div class="flex-grow-1">
        <div class="text-h5 font-weight-bold">Trade History</div>
        <div class="text-caption text-label-muted mt-1">Closed trades log</div>
      </div>
      <button class="refresh-btn" :class="{ 'refresh-btn--spinning': loading }" @click="retry">
        <v-icon icon="mdi-refresh" size="20" />
      </button>
    </div>

    <div class="page-header-divider mb-5" />

    <!-- ── SMC FVG Chart ── -->
    <SmcFvgSection />

    <div class="my-4" />

    <!-- ── Zone B: Filters ── -->
    <div class="dark-card pa-4 mb-4">

      <!-- Symbol filter -->
      <div class="mb-4">
        <div class="filter-label mb-2">SYMBOL</div>
        <div class="d-flex flex-wrap ga-2">
          <button
            v-for="sym in symbolOptions"
            :key="sym"
            class="filter-pill"
            :class="{ 'filter-pill--active': selectedSymbol === sym }"
            @click="selectedSymbol = sym; applyFilters()"
          >{{ sym }}</button>
        </div>
      </div>

      <!-- Period navigator -->
      <div class="mb-1">
        <div class="filter-label mb-2">PERIOD</div>
        <div class="d-flex flex-column align-center ga-2 mt-2">
          <div class="d-flex align-center ga-5">
            <button class="nav-arrow-btn" @click="prevMonth">
              <v-icon icon="mdi-chevron-left" size="18" />
            </button>
            <span class="month-label-text">{{ currentMonthLabel }}</span>
            <button
              class="nav-arrow-btn"
              :class="{ 'nav-arrow-btn--disabled': isCurrentMonth }"
              :disabled="isCurrentMonth"
              @click="nextMonth"
            >
              <v-icon icon="mdi-chevron-right" size="18" />
            </button>
          </div>

          <!-- More Filters toggle -->
          <button class="more-filters-btn" @click="showMoreFilters = !showMoreFilters">
            <v-icon :icon="showMoreFilters ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="14" />
            {{ showMoreFilters ? 'Less Filters' : 'More Filters' }}
            <span v-if="!showMoreFilters && activeExtraFilterCount > 0" class="extra-filter-badge">
              {{ activeExtraFilterCount }}
            </span>
          </button>
        </div>
      </div>

      <!-- Expandable extra filters -->
      <v-expand-transition>
        <div v-show="showMoreFilters">
          <div class="section-divider my-3" />

          <!-- Result -->
          <div class="mb-3">
            <div class="filter-label mb-2">RESULT</div>
            <div class="d-flex flex-wrap ga-2">
              <button
                v-for="r in resultOptions" :key="r"
                class="filter-pill"
                :class="{ 'filter-pill--active': selectedResult === r }"
                @click="selectedResult = r"
              >{{ r }}</button>
            </div>
          </div>

          <!-- Timeframe -->
          <div class="mb-3">
            <div class="filter-label mb-2">TIMEFRAME</div>
            <div class="d-flex flex-wrap ga-2">
              <button
                v-for="tf in tfOptions" :key="tf"
                class="filter-pill"
                :class="{ 'filter-pill--active': selectedTF === tf }"
                @click="selectedTF = tf; applyFilters()"
              >{{ tf }}</button>
            </div>
          </div>

          <!-- Exit Reason -->
          <div class="mb-1">
            <div class="filter-label mb-2">EXIT</div>
            <div class="d-flex flex-wrap ga-2">
              <button
                v-for="ex in exitOptions" :key="ex"
                class="filter-pill"
                :class="{ 'filter-pill--active': selectedExit === ex }"
                @click="selectedExit = ex"
              >{{ ex }}</button>
            </div>
          </div>
        </div>
      </v-expand-transition>

      <!-- Sort -->
      <div class="section-divider mt-3 mb-3" />
      <div class="d-flex align-center justify-space-between">
        <span class="filter-label">
          {{ filteredTrades.length }} trades
        </span>
        <button class="sort-btn" @click="selectedSort = selectedSort === 'newest' ? 'oldest' : 'newest'">
          {{ selectedSort === 'newest' ? 'Latest First' : 'Oldest First' }}
          <v-icon icon="mdi-chevron-down" size="15" class="ml-1" />
        </button>
      </div>
    </div>

    <!-- ── Loading State ── -->
    <template v-if="loading">
      <v-row dense class="mb-3">
        <v-col v-for="i in 6" :key="'sk-' + i" cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-2">
            <v-skeleton-loader type="text" width="36" class="mb-1" />
            <v-skeleton-loader type="text" width="44" />
          </div>
        </v-col>
      </v-row>
      <div v-for="i in 3" :key="'skc-' + i" class="dark-card pa-3 mb-3">
        <div class="d-flex align-center ga-2 mb-3">
          <v-skeleton-loader type="chip" width="44" />
          <v-skeleton-loader type="text" width="90" />
          <v-spacer />
          <v-skeleton-loader type="text" width="60" />
        </div>
        <div class="d-flex justify-space-between mb-3 px-1">
          <v-skeleton-loader type="text@3" width="80" />
          <v-skeleton-loader type="text@3" width="80" />
        </div>
        <div class="d-flex align-center justify-space-between pt-2">
          <v-skeleton-loader type="chip" width="70" />
          <v-skeleton-loader type="heading" width="80" />
        </div>
      </div>
    </template>

    <!-- ── Error State ── -->
    <template v-else-if="error">
      <div class="dark-card pa-4">
        <v-alert type="error" variant="tonal" class="mb-0">
          Failed to load trades
          <template #append>
            <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
          </template>
        </v-alert>
      </div>
    </template>

    <!-- ── Data State ── -->
    <template v-else>

      <!-- Zone C: Summary Stats -->
      <v-row v-if="summary" dense class="mb-4">
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-2">
            <div class="stat-value font-mono">{{ summary.totalTrades }}</div>
            <div class="stat-label">Trades</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-2">
            <div class="stat-value font-mono text-success">{{ summary.winRate }}%</div>
            <div class="stat-label">Win Rate</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-2">
            <div class="stat-value font-mono" :class="plColorClass(summary.totalPips)">
              {{ formatPips(summary.totalPips) }}
            </div>
            <div class="stat-label">Pips</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-2">
            <div class="stat-value font-mono text-success">{{ formatPips(summary.avgWinPips) }}</div>
            <div class="stat-label">Avg Win</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-2">
            <div class="stat-value font-mono text-error">
              {{ summary.avgLossPips.toLocaleString('en-US') }}
            </div>
            <div class="stat-label">Avg Loss</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-2">
            <div class="stat-value font-mono" :class="pfColorClass(summary.profitFactor)">
              {{ summary.profitFactor.toFixed(2) }}
            </div>
            <div class="stat-label">PF</div>
          </div>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <div v-if="filteredTrades.length === 0" class="dark-card pa-6 text-center">
        <v-icon icon="mdi-file-search-outline" size="48" class="text-medium-emphasis mb-2" />
        <div class="text-body-2 text-medium-emphasis">No trades found</div>
        <div class="text-caption text-label-muted mt-1">
          Try adjusting your filters or selecting a different period
        </div>
      </div>

      <!-- Zone D: Trade Cards -->
      <div
        v-for="trade in filteredTrades"
        :key="trade.id"
        class="dark-card mb-3"
      >
        <div class="pa-3">

          <!-- Row 1: Direction + Symbol | Strategy | Interval + Duration -->
          <div class="d-flex align-center ga-2 mb-3">
            <span
              class="direction-badge"
              :class="trade.action === 'BUY' ? 'direction-badge--buy' : 'direction-badge--sell'"
            >{{ trade.action }}</span>
            <span class="trade-symbol">{{ trade.symbolName }}</span>
            <span class="trade-strategy font-mono">{{ trade.strategyName }}</span>
            <v-spacer />
            <span class="trade-tf font-mono">{{ trade.interval }}</span>
            <v-icon icon="mdi-clock-outline" size="11" class="text-label-muted ml-1" />
            <span class="trade-duration font-mono">
              {{ calcDuration(trade.entryTimestamp, trade.exitTimestamp) }}
            </span>
          </div>

          <!-- Row 2: Entry → Exit -->
          <div class="d-flex align-center justify-space-between px-1 mb-3">
            <div>
              <div class="price-label mb-1">Entry</div>
              <div class="price-value font-mono">{{ formatPrice(trade.entryPrice) }}</div>
              <div class="price-date font-mono">{{ formatTime(trade.entryTimestamp) }}</div>
            </div>
            <v-icon icon="mdi-arrow-right" size="14" class="text-label-muted mt-1" />
            <div class="text-right">
              <div class="price-label mb-1">Exit</div>
              <div class="price-value font-mono">{{ formatPrice(trade.exitPrice) }}</div>
              <div class="price-date font-mono">{{ formatTime(trade.exitTimestamp) }}</div>
            </div>
          </div>

          <!-- Row 3: Footer — Exit reason | P&L -->
          <div class="d-flex align-center justify-space-between pt-2 card-footer">
            <span class="exit-badge" :class="exitBadgeClass(trade.exitReason)">
              {{ exitReasonLabel(trade.exitReason) }}
            </span>
            <span class="pips-hero font-mono" :class="plColorClass(trade.profitPips)">
              {{ trade.profitPips !== null ? formatPips(trade.profitPips) : '—' }} pips
            </span>
          </div>

        </div>
      </div>

    </template>

    <!-- Footer -->
    <div class="text-center mt-8">
      <div class="text-caption text-medium-emphasis">
        <v-icon icon="mdi-shield-check" size="12" class="mr-1" />
        KOB-Trade v2.0
      </div>
    </div>

  </v-container>
</template>

<style scoped>
.section-divider {
  height: 1px;
  background: rgb(30 41 59 / 0.8);
}

.filter-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}

.filter-pill {
  background: rgb(30 41 59 / 0.5);
  color: rgb(203 213 225);
  border: 1px solid rgb(51 65 85 / 0.7);
  border-radius: 9999px;
  padding: 3px 12px;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.filter-pill:hover { border-color: rgb(74 222 128 / 0.4); color: rgb(226 232 240); }
.filter-pill--active {
  background: rgb(74 222 128) !important;
  color: #050505 !important;
  border-color: rgb(74 222 128) !important;
}

.month-label-text {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgb(226 232 240);
  min-width: 90px;
  text-align: center;
}

.nav-arrow-btn {
  background: transparent;
  border: none;
  color: rgb(203 213 225);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.15s ease;
  display: flex;
  align-items: center;
}
.nav-arrow-btn:hover { color: #fff; }
.nav-arrow-btn--disabled { color: rgb(71 85 105) !important; cursor: not-allowed; }

.more-filters-btn {
  background: transparent;
  border: none;
  color: rgb(100 116 139);
  font-size: 0.65rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color 0.15s ease;
}
.more-filters-btn:hover { color: rgb(203 213 225); }

.extra-filter-badge {
  background: rgb(74 222 128);
  color: #050505;
  font-size: 0.55rem;
  font-weight: 700;
  border-radius: 9999px;
  padding: 0 5px;
  line-height: 1.5;
}

.sort-btn {
  background: transparent;
  border: none;
  color: rgb(203 213 225);
  font-size: 0.68rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color 0.15s ease;
}
.sort-btn:hover { color: #fff; }

.stat-cell {
  background: rgb(23 30 45);
  border: 1px solid rgb(51 65 85 / 0.5);
  border-radius: 12px;
}
.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgb(226 232 240);
  line-height: 1.2;
}
.stat-label {
  font-size: 0.6rem;
  font-weight: 500;
  color: rgb(100 116 139);
  letter-spacing: 0.04em;
  margin-top: 2px;
}

.dark-card {
  background: rgb(17 22 32);
  border: 1px solid rgb(51 65 85 / 0.7);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgb(0 0 0 / 0.25);
}

.direction-badge {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1.5;
}
.direction-badge--buy {
  background: rgb(16 185 129 / 0.1);
  color: rgb(52 211 153);
  border: 1px solid rgb(16 185 129 / 0.2);
}
.direction-badge--sell {
  background: rgb(239 68 68 / 0.1);
  color: rgb(252 165 165);
  border: 1px solid rgb(239 68 68 / 0.2);
}

.trade-symbol {
  font-size: 0.875rem;
  font-weight: 700;
  color: rgb(248 250 252);
}

.trade-strategy {
  font-size: 0.6rem;
  font-weight: 600;
  color: rgb(100 116 139);
  background: rgb(30 41 59 / 0.6);
  padding: 1px 5px;
  border-radius: 4px;
}

.trade-tf {
  font-size: 0.68rem;
  font-weight: 600;
  color: rgb(148 163 184);
}
.trade-duration {
  font-size: 0.68rem;
  color: rgb(100 116 139);
}

.price-label {
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}
.price-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(226 232 240);
}
.price-date {
  font-size: 0.6rem;
  color: rgb(100 116 139);
  margin-top: 2px;
}

.card-footer {
  border-top: 1px solid rgb(51 65 85 / 0.7);
}

.exit-badge {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 5px;
  line-height: 1.6;
}
.exit-badge--tp     { background: rgb(5 46 22 / 0.5);    color: rgb(52 211 153);  }
.exit-badge--sl     { background: rgb(69 10 10 / 0.5);   color: rgb(252 165 165); }
.exit-badge--signal { background: rgb(30 58 138 / 0.4);  color: rgb(147 197 253); }
.exit-badge--manual { background: rgb(92 45 5 / 0.4);    color: rgb(251 191 36);  }
.exit-badge--default{ background: rgb(51 65 85 / 0.3);   color: rgb(148 163 184); }

.pips-hero {
  font-size: 1rem;
  font-weight: 700;
}
</style>
