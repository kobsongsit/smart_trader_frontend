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

/**
 * Format pips with sign + comma separator
 */
function formatPips(pips: number): string {
  const prefix = pips > 0 ? '+' : ''
  return `${prefix}${pips.toLocaleString('en-US')}`
}

/**
 * Format entry/exit time
 * "2026-03-14T10:00:00Z" -> "Mar 14 10:00"
 */
function formatTime(timeStr: string): string {
  return dayjs(timeStr).format('MMM D HH:mm')
}

// ============================================================
// Color logic
// ============================================================

/**
 * P&L color class
 */
function plColorClass(pips: number): string {
  if (pips > 0) return 'text-success'
  if (pips < 0) return 'text-error'
  return 'text-medium-emphasis'
}

/**
 * Profit Factor color thresholds
 * >= 2.0 success, >= 1.5 primary, >= 1.2 warning, < 1.2 error
 */
function pfColorClass(pf: number): string {
  if (pf >= 2.0) return 'text-success'
  if (pf >= 1.5) return 'text-primary'
  if (pf >= 1.2) return 'text-warning'
  return 'text-error'
}

/**
 * Exit reason color
 * TP = success, SL = error, OPPOSITE_SIGNAL = info, MANUAL = warning
 */
function exitReasonColor(reason: string): string {
  switch (reason) {
    case 'TP': return 'success'
    case 'SL': return 'error'
    case 'OPPOSITE_SIGNAL': return 'info'
    case 'MANUAL': return 'warning'
    default: return 'grey'
  }
}

/**
 * Exit reason display label
 */
function exitReasonLabel(reason: string): string {
  switch (reason) {
    case 'TP': return 'TP'
    case 'SL': return 'SL'
    case 'OPPOSITE_SIGNAL': return 'SIGNAL EXIT'
    case 'MANUAL': return 'MANUAL'
    default: return reason
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

async function handleLoadMore() {
  await loadMore()
}
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- Zone A: Page Header -->
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

    <!-- Zone B: Filter Bar -->
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

            <!-- Result filter (Win/Loss) -->
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

            <!-- Exit Reason filter -->
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

    <!-- Zone B2: Sort Toggle -->
    <div class="d-flex justify-end mb-3">
      <v-select
        v-model="selectedSort"
        :items="[
          { title: 'Latest First', value: 'newest' },
          { title: 'Oldest First', value: 'oldest' },
        ]"
        density="compact"
        variant="plain"
        hide-details
        class="text-caption"
        style="max-width: 150px;"
        @update:model-value="selectSort"
      />
    </div>

    <!-- Loading State -->
    <template v-if="loading && !data">
      <!-- Summary skeleton -->
      <v-card elevation="0" rounded="lg" class="glass-card mb-3">
        <v-card-text class="pa-4">
          <v-row dense class="mb-3">
            <v-col v-for="i in 3" :key="'r1-' + i" cols="4">
              <div class="glass-sheet rounded-lg pa-3 text-center">
                <v-skeleton-loader type="text" width="40" class="mx-auto mb-1" />
                <v-skeleton-loader type="text" width="50" class="mx-auto" />
              </div>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col v-for="i in 3" :key="'r2-' + i" cols="4">
              <div class="glass-sheet rounded-lg pa-3 text-center">
                <v-skeleton-loader type="text" width="40" class="mx-auto mb-1" />
                <v-skeleton-loader type="text" width="50" class="mx-auto" />
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Trade card skeletons -->
      <v-card
        v-for="i in 3"
        :key="'skel-' + i"
        elevation="0"
        rounded="lg"
        class="glass-card mb-3"
      >
        <v-card-text class="pa-4">
          <div class="d-flex align-center ga-2 mb-3">
            <v-skeleton-loader type="chip" width="50" />
            <v-skeleton-loader type="text" width="100" />
            <v-spacer />
            <v-skeleton-loader type="text" width="60" />
          </div>
          <v-sheet rounded="lg" class="glass-sheet pa-3 mb-3">
            <div class="d-flex justify-space-between">
              <v-skeleton-loader type="text@2" width="80" />
              <v-skeleton-loader type="text@2" width="80" />
            </div>
          </v-sheet>
          <div class="d-flex align-center ga-2 mb-3">
            <v-skeleton-loader type="chip" width="60" />
            <v-skeleton-loader type="text" width="80" />
          </div>
          <div class="text-center">
            <v-skeleton-loader type="heading" width="120" class="mx-auto" />
          </div>
        </v-card-text>
      </v-card>
    </template>

    <!-- Error State -->
    <template v-else-if="error">
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
    </template>

    <!-- Data State -->
    <template v-else-if="data">

      <!-- Zone C: Summary Stats Bar -->
      <v-card v-if="summary" elevation="0" rounded="lg" class="glass-card mb-3">
        <v-card-text class="pa-4">
          <!-- Row 1: Trades / Win Rate / Total Pips -->
          <v-row dense class="mb-3">
            <v-col cols="4">
              <div class="glass-sheet rounded-lg pa-3 text-center">
                <div class="text-h6 font-weight-bold font-mono">
                  {{ summary.totalTrades }}
                </div>
                <div class="text-caption text-label-muted font-weight-medium">Trades</div>
              </div>
            </v-col>
            <v-col cols="4">
              <div class="glass-sheet rounded-lg pa-3 text-center">
                <div class="text-h6 font-weight-bold font-mono text-primary">
                  {{ summary.winRate }}%
                </div>
                <div class="text-caption text-label-muted font-weight-medium">Win Rate</div>
              </div>
            </v-col>
            <v-col cols="4">
              <div class="glass-sheet rounded-lg pa-3 text-center">
                <div
                  class="text-h6 font-weight-bold font-mono"
                  :class="plColorClass(summary.totalPips)"
                >
                  {{ formatPips(summary.totalPips) }}
                </div>
                <div class="text-caption text-label-muted font-weight-medium">Pips</div>
              </div>
            </v-col>
          </v-row>

          <!-- Row 2: Avg Win / Avg Loss / PF -->
          <v-row dense>
            <v-col cols="4">
              <div class="glass-sheet rounded-lg pa-3 text-center">
                <div class="text-h6 font-weight-bold font-mono text-success">
                  {{ formatPips(summary.avgWinPips) }}
                </div>
                <div class="text-caption text-label-muted font-weight-medium">Avg Win</div>
              </div>
            </v-col>
            <v-col cols="4">
              <div class="glass-sheet rounded-lg pa-3 text-center">
                <div class="text-h6 font-weight-bold font-mono text-error">
                  {{ summary.avgLossPips.toLocaleString('en-US') }}
                </div>
                <div class="text-caption text-label-muted font-weight-medium">Avg Loss</div>
              </div>
            </v-col>
            <v-col cols="4">
              <div class="glass-sheet rounded-lg pa-3 text-center">
                <div
                  class="text-h6 font-weight-bold font-mono"
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

      <!-- Empty State -->
      <v-card
        v-if="trades.length === 0 && !loading"
        elevation="0"
        rounded="lg"
        class="glass-card"
      >
        <v-card-text class="pa-4 text-center">
          <v-icon icon="mdi-file-search-outline" size="48" class="text-medium-emphasis mb-2" />
          <div class="text-body-2 text-medium-emphasis">No trades found</div>
          <div class="text-caption text-label-muted mt-1">
            Try adjusting your filters or selecting a different period
          </div>
        </v-card-text>
      </v-card>

      <!-- Zone D: Trade Cards -->
      <v-card
        v-for="trade in trades"
        :key="trade.id"
        elevation="0"
        rounded="lg"
        class="glass-card mb-3"
      >
        <v-card-text class="pa-4">
          <!-- Row 1: Action chip + Symbol + Interval + Duration -->
          <div class="d-flex align-center ga-2 mb-3">
            <v-chip
              :color="trade.action === 'BUY' ? 'success' : 'error'"
              size="x-small"
              variant="tonal"
              class="font-weight-black"
            >
              {{ trade.action }}
            </v-chip>
            <span class="text-subtitle-1 font-weight-bold">{{ trade.symbol }}</span>
            <v-spacer />
            <span class="text-caption text-label-muted font-weight-medium">
              {{ trade.interval }}
            </span>
            <span class="text-caption text-medium-emphasis font-mono">
              <v-icon icon="mdi-clock-outline" size="12" class="mr-1" />{{ trade.duration }}
            </span>
          </div>

          <!-- Row 2: Entry -> Exit Price -->
          <div class="glass-sheet rounded-lg pa-3 mb-3">
            <div class="d-flex justify-space-between">
              <!-- Entry -->
              <div>
                <div class="text-caption text-label-muted font-weight-medium mb-1">Entry</div>
                <div class="text-body-2 font-weight-bold font-mono">
                  {{ trade.entryPrice }}
                </div>
                <div class="text-caption text-medium-emphasis font-mono" style="font-size: 10px;">
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
                <div class="text-body-2 font-weight-bold font-mono">
                  {{ trade.exitPrice }}
                </div>
                <div class="text-caption text-medium-emphasis font-mono" style="font-size: 10px;">
                  {{ formatTime(trade.exitTime) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Row 3: Exit Reason Badge -->
          <div class="d-flex align-center ga-2 mb-3">
            <v-chip
              :color="exitReasonColor(trade.exitReason)"
              size="x-small"
              variant="tonal"
              class="font-weight-bold"
            >
              {{ exitReasonLabel(trade.exitReason) }}
            </v-chip>
          </div>

          <!-- Row 4: P&L Hero -->
          <div class="text-center">
            <span
              class="text-h5 font-weight-black font-mono"
              :class="plColorClass(trade.profitPips)"
            >
              {{ formatPips(trade.profitPips) }} pips
            </span>
          </div>
        </v-card-text>
      </v-card>

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
