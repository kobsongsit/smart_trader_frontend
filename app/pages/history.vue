<script setup lang="ts">
import dayjs from 'dayjs'
import type { TradeHistoryData, ClosedTrade, TradeHistorySummary } from '../../types/trading'

// ============================================================
// Composable
// ============================================================

const { data, loading, error, filters, fetchHistory, loadMore, reset } = useTradeHistory()

// ============================================================
// Filter Options
// ============================================================

const symbolOptions = ['All', 'USD-JPY', 'EUR-USD', 'GBP-JPY', 'XAU-USD']
const resultOptions = ['All', 'Win', 'Loss']
const tfOptions = ['All', '15m', '1h', '4h']
const exitOptions = ['All', 'TP', 'SL', 'Signal', 'Manual']

// Exit reason mapping: display label -> API value
const exitReasonMap: Record<string, string> = {
  'All': '',
  'TP': 'TP',
  'SL': 'SL',
  'Signal': 'OPPOSITE_SIGNAL',
  'Manual': 'MANUAL',
}

// ============================================================
// Local filter state (UI)
// ============================================================

const selectedSymbol = ref('All')
const selectedResult = ref('All')
const selectedTF = ref('All')
const selectedExit = ref('All')
const showMoreFilters = ref(false)
const selectedSort = ref('newest')

// Month navigator
const selectedMonthNum = ref(dayjs().month()) // 0-11
const selectedYearNum = ref(dayjs().year())

const currentMonthLabel = computed(() => {
  return dayjs().month(selectedMonthNum.value).year(selectedYearNum.value).format('MMM YYYY')
})

const isCurrentMonth = computed(() => {
  return selectedMonthNum.value === dayjs().month() && selectedYearNum.value === dayjs().year()
})

function prevMonth() {
  if (selectedMonthNum.value === 0) {
    selectedMonthNum.value = 11
    selectedYearNum.value--
  } else {
    selectedMonthNum.value--
  }
  applyFilters()
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (selectedMonthNum.value === 11) {
    selectedMonthNum.value = 0
    selectedYearNum.value++
  } else {
    selectedMonthNum.value++
  }
  applyFilters()
}

// ============================================================
// Active extra filter count (for badge)
// ============================================================

const activeExtraFilterCount = computed(() => {
  let count = 0
  if (selectedResult.value !== 'All') count++
  if (selectedTF.value !== 'All') count++
  if (selectedExit.value !== 'All') count++
  return count
})

// ============================================================
// Filter Actions
// ============================================================

function selectSymbol(sym: string) {
  selectedSymbol.value = sym
  applyFilters()
}

function selectResult(r: string) {
  selectedResult.value = r
  applyFilters()
}

function selectTF(tf: string) {
  selectedTF.value = tf
  applyFilters()
}

function selectExit(ex: string) {
  selectedExit.value = ex
  applyFilters()
}

function selectSort(sort: string) {
  selectedSort.value = sort
  applyFilters()
}

function applyFilters() {
  fetchHistory({
    symbol: selectedSymbol.value === 'All' ? '' : selectedSymbol.value,
    interval: selectedTF.value === 'All' ? '' : selectedTF.value,
    month: String(selectedMonthNum.value + 1),
    year: String(selectedYearNum.value),
    result: selectedResult.value === 'All' ? '' : selectedResult.value.toLowerCase(),
    exitReason: exitReasonMap[selectedExit.value] || '',
    sort: selectedSort.value,
    page: 1,
  })
}

// ============================================================
// Fetch on mount
// ============================================================

onMounted(() => {
  applyFilters()
})

// ============================================================
// Formatting helpers
// ============================================================

function formatPips(pips: number): string {
  const prefix = pips > 0 ? '+' : ''
  return `${prefix}${pips.toLocaleString('en-US')}`
}

function formatTime(timeStr: string): string {
  return dayjs(timeStr).format('D MMM HH:mm')
}

// ============================================================
// Color logic
// ============================================================

function plColorClass(pips: number): string {
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

function exitReasonColor(reason: string): string {
  switch (reason) {
    case 'TP': return 'success'
    case 'SL': return 'error'
    case 'OPPOSITE_SIGNAL': return 'info'
    case 'MANUAL': return 'warning'
    default: return 'grey'
  }
}

function exitReasonLabel(reason: string): string {
  switch (reason) {
    case 'TP': return 'TP'
    case 'SL': return 'SL'
    case 'OPPOSITE_SIGNAL': return 'SIGNAL EXIT'
    case 'MANUAL': return 'MANUAL'
    default: return reason
  }
}

/** CSS class for exit reason badge */
function exitBadgeClass(reason: string): string {
  switch (reason) {
    case 'TP': return 'exit-badge--tp'
    case 'SL': return 'exit-badge--sl'
    case 'OPPOSITE_SIGNAL': return 'exit-badge--signal'
    case 'MANUAL': return 'exit-badge--manual'
    default: return 'exit-badge--default'
  }
}

// ============================================================
// Computed
// ============================================================

const summary = computed(() => data.value?.summary ?? null)
const trades = computed(() => data.value?.trades ?? [])
const pagination = computed(() => data.value?.pagination ?? null)

// ============================================================
// Retry / Load More
// ============================================================

function retry() {
  applyFilters()
}

async function handleRefresh() {
  await applyFilters()
}

async function handleLoadMore() {
  await loadMore()
}
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

      <button class="refresh-btn" :class="{ 'refresh-btn--spinning': loading }" @click="handleRefresh">
        <v-icon icon="mdi-refresh" size="20" />
      </button>
    </div>

    <div class="page-header-divider mb-5" />

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
            @click="selectSymbol(sym)"
          >
            {{ sym }}
          </button>
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
            <v-icon
              :icon="showMoreFilters ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              size="14"
            />
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
                v-for="r in resultOptions"
                :key="r"
                class="filter-pill"
                :class="{ 'filter-pill--active': selectedResult === r }"
                @click="selectResult(r)"
              >
                {{ r }}
              </button>
            </div>
          </div>

          <!-- Timeframe -->
          <div class="mb-3">
            <div class="filter-label mb-2">TIMEFRAME</div>
            <div class="d-flex flex-wrap ga-2">
              <button
                v-for="tf in tfOptions"
                :key="tf"
                class="filter-pill"
                :class="{ 'filter-pill--active': selectedTF === tf }"
                @click="selectTF(tf)"
              >
                {{ tf }}
              </button>
            </div>
          </div>

          <!-- Exit Reason -->
          <div class="mb-1">
            <div class="filter-label mb-2">EXIT</div>
            <div class="d-flex flex-wrap ga-2">
              <button
                v-for="ex in exitOptions"
                :key="ex"
                class="filter-pill"
                :class="{ 'filter-pill--active': selectedExit === ex }"
                @click="selectExit(ex)"
              >
                {{ ex }}
              </button>
            </div>
          </div>
        </div>
      </v-expand-transition>

      <!-- Sort toggle (inside card) -->
      <div class="section-divider mt-3 mb-3" />
      <div class="d-flex justify-end">
        <button class="sort-btn" @click="selectSort(selectedSort === 'newest' ? 'oldest' : 'newest')">
          {{ selectedSort === 'newest' ? 'Latest First' : 'Oldest First' }}
          <v-icon icon="mdi-chevron-down" size="15" class="ml-1" />
        </button>
      </div>
    </div>

    <!-- ── Loading State ── -->
    <template v-if="loading && !data">
      <!-- Summary grid skeleton -->
      <v-row dense class="mb-3">
        <v-col v-for="i in 6" :key="'skel-stat-' + i" cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-2">
            <v-skeleton-loader type="text" width="36" class="mb-1" />
            <v-skeleton-loader type="text" width="44" />
          </div>
        </v-col>
      </v-row>

      <!-- Trade card skeletons -->
      <div v-for="i in 3" :key="'skel-card-' + i" class="dark-card pa-3 mb-3">
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
          Failed to load trade history
          <template #append>
            <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
          </template>
        </v-alert>
      </div>
    </template>

    <!-- ── Data State ── -->
    <template v-else-if="data">

      <!-- Zone C: Summary Stats 3×2 Grid -->
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
      <div v-if="trades.length === 0 && !loading" class="dark-card pa-6 text-center">
        <v-icon icon="mdi-file-search-outline" size="48" class="text-medium-emphasis mb-2" />
        <div class="text-body-2 text-medium-emphasis">No trades found</div>
        <div class="text-caption text-label-muted mt-1">
          Try adjusting your filters or selecting a different period
        </div>
      </div>

      <!-- Zone D: Trade Cards -->
      <div
        v-for="trade in trades"
        :key="trade.id"
        class="dark-card mb-3"
      >
        <div class="pa-3">

          <!-- Row 1: Direction + Symbol | Interval + Duration -->
          <div class="d-flex align-center ga-2 mb-3">
            <span
              class="direction-badge"
              :class="trade.action === 'BUY' ? 'direction-badge--buy' : 'direction-badge--sell'"
            >
              {{ trade.action }}
            </span>
            <span class="trade-symbol">{{ trade.symbol }}</span>
            <v-spacer />
            <span class="trade-tf font-mono">{{ trade.interval }}</span>
            <v-icon icon="mdi-clock-outline" size="11" class="text-label-muted ml-1" />
            <span class="trade-duration font-mono">{{ trade.duration }}</span>
          </div>

          <!-- Row 2: Entry → Exit -->
          <div class="d-flex align-center justify-space-between px-1 mb-3">
            <!-- Entry -->
            <div>
              <div class="price-label mb-1">Entry</div>
              <div class="price-value font-mono">{{ trade.entryPrice }}</div>
              <div class="price-date font-mono">{{ formatTime(trade.entryTime) }}</div>
            </div>

            <!-- Arrow -->
            <v-icon icon="mdi-arrow-right" size="14" class="text-label-muted mt-1" />

            <!-- Exit -->
            <div class="text-right">
              <div class="price-label mb-1">Exit</div>
              <div class="price-value font-mono">{{ trade.exitPrice }}</div>
              <div class="price-date font-mono">{{ formatTime(trade.exitTime) }}</div>
            </div>
          </div>

          <!-- Row 3: Footer — Exit reason | P&L -->
          <div class="d-flex align-center justify-space-between pt-2 card-footer">
            <span class="exit-badge" :class="exitBadgeClass(trade.exitReason)">
              {{ exitReasonLabel(trade.exitReason) }}
            </span>
            <span
              class="pips-hero font-mono"
              :class="plColorClass(trade.profitPips)"
            >
              {{ formatPips(trade.profitPips) }} pips
            </span>
          </div>

        </div>
      </div>

      <!-- Zone E: Load More -->
      <div
        v-if="pagination && pagination.hasMore"
        class="text-center mt-2 mb-4"
      >
        <v-btn
          variant="outlined"
          color="primary"
          size="small"
          :loading="loading"
          @click="handleLoadMore"
        >
          Load More
        </v-btn>
        <div class="text-caption text-medium-emphasis mt-1 font-mono">
          {{ trades.length }} of {{ pagination.total }} shown
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
/* ── Page Header ── */
.section-divider {
  height: 1px;
  background: rgb(30 41 59 / 0.8);
}

/* ── Filter section ── */
.filter-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}

/* Filter pill buttons */
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

.filter-pill:hover {
  border-color: rgb(74 222 128 / 0.4);
  color: rgb(226 232 240);
}

.filter-pill--active {
  background: rgb(74 222 128) !important;
  color: #050505 !important;
  border-color: rgb(74 222 128) !important;
}

/* Month navigator */
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

.nav-arrow-btn:hover {
  color: #fff;
}

.nav-arrow-btn--disabled {
  color: rgb(71 85 105) !important;
  cursor: not-allowed;
}

/* More filters button */
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

.more-filters-btn:hover {
  color: rgb(203 213 225);
}

.extra-filter-badge {
  background: rgb(74 222 128);
  color: #050505;
  font-size: 0.55rem;
  font-weight: 700;
  border-radius: 9999px;
  padding: 0 5px;
  line-height: 1.5;
}

/* Sort button */
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

.sort-btn:hover {
  color: #fff;
}

/* ── Summary stats grid ── */
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

/* ── Dark card (trade cards) ── */
.dark-card {
  background: rgb(17 22 32);
  border: 1px solid rgb(51 65 85 / 0.7);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgb(0 0 0 / 0.25);
}

/* ── Trade card internals ── */
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

.trade-tf {
  font-size: 0.68rem;
  font-weight: 600;
  color: rgb(148 163 184);
}

.trade-duration {
  font-size: 0.68rem;
  color: rgb(100 116 139);
}

/* Prices */
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

/* Footer row */
.card-footer {
  border-top: 1px solid rgb(51 65 85 / 0.7);
}

/* Exit reason badges */
.exit-badge {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 5px;
  line-height: 1.6;
}

.exit-badge--tp {
  background: rgb(5 46 22 / 0.5);
  color: rgb(52 211 153);
}

.exit-badge--sl {
  background: rgb(69 10 10 / 0.5);
  color: rgb(252 165 165);
}

.exit-badge--signal {
  background: rgb(30 58 138 / 0.4);
  color: rgb(147 197 253);
}

.exit-badge--manual {
  background: rgb(92 45 5 / 0.4);
  color: rgb(251 191 36);
}

.exit-badge--default {
  background: rgb(51 65 85 / 0.3);
  color: rgb(148 163 184);
}

/* P&L hero in footer */
.pips-hero {
  font-size: 1rem;
  font-weight: 700;
}
</style>
