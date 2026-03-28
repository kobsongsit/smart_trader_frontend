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
// Computed date range (month -> from/to)
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
  if (!ts) return '---'
  return dayjs.unix(ts).format('D MMM HH:mm')
}

function formatPrice(price: number | null): string {
  if (price === null) return '---'
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 5 })
}

/** Duration from UNIX timestamps */
function calcDuration(entryTs: number, exitTs: number | null): string {
  if (!exitTs) return '---'
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
    default:                 return reason ?? '---'
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
        <v-icon icon="mdi-history" size="22" color="#4ADE80" />
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

    <!-- ── Zone B: Filters — Glass Card ── -->
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

          <!-- Row 2: Entry -> Exit -->
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

          <!-- Row 3: Footer -- Exit reason | P&L -->
          <div class="d-flex align-center justify-space-between pt-2 card-footer">
            <span class="exit-badge" :class="exitBadgeClass(trade.exitReason)">
              {{ exitReasonLabel(trade.exitReason) }}
            </span>
            <span class="pips-hero font-mono" :class="plColorClass(trade.profitPips)">
              {{ trade.profitPips !== null ? formatPips(trade.profitPips) : '---' }} pips
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
/* ── Dividers — Glass ── */
.section-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

/* ── Filter Labels ── */
.filter-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.6);
}

/* ── Filter Pills — Glass ── */
.filter-pill {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(203, 213, 225, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  padding: 3px 12px;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.filter-pill:hover {
  border-color: rgba(74, 222, 128, 0.25);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(226, 232, 240, 0.95);
}
.filter-pill--active {
  background: rgba(74, 222, 128, 0.15) !important;
  color: #4ADE80 !important;
  border-color: rgba(74, 222, 128, 0.3) !important;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.15);
}

/* ── Month Navigator ── */
.month-label-text {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(226, 232, 240, 0.9);
  min-width: 90px;
  text-align: center;
}

.nav-arrow-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(203, 213, 225, 0.8);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;
  display: flex;
  align-items: center;
}
.nav-arrow-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
.nav-arrow-btn--disabled { color: rgba(100, 116, 139, 0.3) !important; cursor: not-allowed; background: transparent !important; }

/* ── More Filters ── */
.more-filters-btn {
  background: transparent;
  border: none;
  color: rgba(148, 163, 184, 0.5);
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
.more-filters-btn:hover { color: rgba(203, 213, 225, 0.8); }

.extra-filter-badge {
  background: rgba(74, 222, 128, 0.2);
  color: #4ADE80;
  font-size: 0.55rem;
  font-weight: 700;
  border-radius: 9999px;
  padding: 0 5px;
  line-height: 1.5;
}

/* ── Sort Button ── */
.sort-btn {
  background: transparent;
  border: none;
  color: rgba(203, 213, 225, 0.7);
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

/* ── Stat Cells — Tier 3 Glass ── */
.stat-cell {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: background 0.2s ease;
}
.stat-cell:hover {
  background: rgba(255, 255, 255, 0.05);
}
.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(226, 232, 240, 0.95);
  line-height: 1.2;
}
.stat-label {
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(148, 163, 184, 0.5);
  letter-spacing: 0.04em;
  margin-top: 2px;
}

/* ── Direction Badge — Glass ── */
.direction-badge {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1.5;
}
.direction-badge--buy {
  background: rgba(16, 185, 129, 0.1);
  color: rgb(52 211 153);
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.direction-badge--sell {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(252 165 165);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* ── Trade Card Content ── */
.trade-symbol {
  font-size: 0.875rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.95);
}

.trade-strategy {
  font-size: 0.6rem;
  font-weight: 600;
  color: rgba(148, 163, 184, 0.5);
  background: rgba(255, 255, 255, 0.04);
  padding: 1px 5px;
  border-radius: 4px;
}

.trade-tf {
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(148, 163, 184, 0.7);
}
.trade-duration {
  font-size: 0.68rem;
  color: rgba(148, 163, 184, 0.5);
}

/* ── Price Display ── */
.price-label {
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.5);
}
.price-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(226, 232, 240, 0.95);
}
.price-date {
  font-size: 0.6rem;
  color: rgba(148, 163, 184, 0.4);
  margin-top: 2px;
}

/* ── Card Footer ── */
.card-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* ── Exit Badges — Glass ── */
.exit-badge {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 5px;
  line-height: 1.6;
}
.exit-badge--tp     { background: rgba(16, 185, 129, 0.1);  color: rgb(52 211 153);  border: 1px solid rgba(16, 185, 129, 0.15); }
.exit-badge--sl     { background: rgba(239, 68, 68, 0.1);   color: rgb(252 165 165); border: 1px solid rgba(239, 68, 68, 0.15); }
.exit-badge--signal { background: rgba(59, 130, 246, 0.1);  color: rgb(147 197 253); border: 1px solid rgba(59, 130, 246, 0.15); }
.exit-badge--manual { background: rgba(251, 140, 0, 0.1);   color: rgb(251 191 36);  border: 1px solid rgba(251, 140, 0, 0.15); }
.exit-badge--default{ background: rgba(255, 255, 255, 0.04); color: rgba(148, 163, 184, 0.7); }

/* ── Pips Hero ── */
.pips-hero {
  font-size: 1rem;
  font-weight: 700;
}
</style>
