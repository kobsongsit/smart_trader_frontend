<script setup lang="ts">
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { MonthlyPerformanceData, MonthlyData } from '../../types/trading'

dayjs.extend(customParseFormat)

// ============================================================
// Composable
// ============================================================

const { data, loading, error, fetchMonthly, refresh } = useMonthlyPerformance()

// ============================================================
// Fetch on mount
// ============================================================

onMounted(() => {
  fetchMonthly()
})

// ============================================================
// Selected month state
// ============================================================

const selectedMonthKey = ref<string | null>(null)

// ============================================================
// Computed
// ============================================================

const months = computed(() => data.value?.months ?? [])

/** Chronological order (oldest first) for bar chart */
const monthsChronological = computed(() => {
  return [...months.value].reverse()
})

/** Latest cumulative pips (from newest month) */
const latestCumulativePips = computed(() => {
  if (months.value.length === 0) return 0
  return months.value[0]?.cumulativePips ?? 0
})

/** First month label (oldest) */
const firstMonthLabel = computed(() => {
  if (months.value.length === 0) return ''
  const oldest = months.value[months.value.length - 1]
  if (!oldest) return ''
  return dayjs(oldest.month, 'YYYY-MM').format('MMM YYYY')
})

/** Max absolute pips for bar width calculation */
const maxAbsPips = computed(() => {
  return Math.max(...months.value.map(m => Math.abs(m.totalPips)), 1)
})

/** Selected month data */
const selectedMonthData = computed(() => {
  const raw = !selectedMonthKey.value
    ? (months.value[0] ?? null)
    : (months.value.find(m => m.month === selectedMonthKey.value) ?? null)
  return raw as MonthlyData | null
})

/** Other months (not selected) for Zone E */
const otherMonths = computed(() => {
  const selected = selectedMonthData.value?.month
  return months.value.filter(m => m.month !== selected)
})

/** Max absolute pips for symbol breakdown bar width */
const selectedMaxSymbolPips = computed(() => {
  if (!selectedMonthData.value) return 1
  return Math.max(...selectedMonthData.value.symbols.map(s => Math.abs(s.totalPips)), 1)
})

/** Max absolute pips for interval breakdown bar width */
const selectedMaxIntervalPips = computed(() => {
  if (!selectedMonthData.value) return 1
  return Math.max(...selectedMonthData.value.intervals.map(i => Math.abs(i.totalPips)), 1)
})

/** Sorted symbols by pips (descending) */
const sortedSymbols = computed(() => {
  if (!selectedMonthData.value) return []
  return [...selectedMonthData.value.symbols].sort((a, b) => b.totalPips - a.totalPips)
})

/** Sorted intervals by pips (descending) */
const sortedIntervals = computed(() => {
  if (!selectedMonthData.value) return []
  return [...selectedMonthData.value.intervals].sort((a, b) => b.totalPips - a.totalPips)
})

// ============================================================
// Formatting helpers
// ============================================================

function formatPips(pips: number): string {
  const prefix = pips > 0 ? '+' : ''
  return `${prefix}${pips.toLocaleString('en-US')}`
}

function shortLabel(monthStr: string): string {
  return dayjs(monthStr, 'YYYY-MM').format('MMM')
}

function formatDate(dateStr: string): string {
  return dayjs(dateStr, 'YYYY-MM-DD').format('MMM D')
}

// ============================================================
// Color logic
// ============================================================

function plColorClass(pips: number): string {
  if (pips > 0) return 'text-success'
  if (pips < 0) return 'text-error'
  return 'text-medium-emphasis'
}

const cumulativePipsColorClass = computed(() => {
  return plColorClass(latestCumulativePips.value)
})

function winRateColorClass(wr: number): string {
  if (wr >= 60) return 'text-success'
  if (wr >= 50) return 'text-primary'
  return 'text-warning'
}

function pfColorClass(pf: number): string {
  if (pf >= 2.0) return 'text-success'
  if (pf >= 1.5) return 'text-primary'
  if (pf >= 1.2) return 'text-warning'
  return 'text-error'
}

// ============================================================
// Bar chart helpers
// ============================================================

function barWidth(pips: number): number {
  return (Math.abs(pips) / maxAbsPips.value) * 100
}

function symbolBarWidth(pips: number): number {
  return (Math.abs(pips) / selectedMaxSymbolPips.value) * 100
}

function intervalBarWidth(pips: number): number {
  return (Math.abs(pips) / selectedMaxIntervalPips.value) * 100
}

// ============================================================
// Actions
// ============================================================

function selectMonth(monthKey: string) {
  selectedMonthKey.value = monthKey
}

function retry() {
  fetchMonthly()
}

async function handleRefresh() {
  await fetchMonthly()
}
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- ── Zone A: Page Header ── -->
    <div class="d-flex align-center ga-3 mb-5 mt-1">
      <div class="page-header-icon">
        <v-icon icon="mdi-chart-bar" size="22" color="#4ADE80" />
      </div>

      <div class="flex-grow-1">
        <div class="text-h5 font-weight-bold">Performance</div>
        <div class="text-caption text-label-muted mt-1">Monthly summary</div>
      </div>

      <button class="refresh-btn" :class="{ 'refresh-btn--spinning': loading }" @click="handleRefresh">
        <v-icon icon="mdi-refresh" size="20" />
      </button>
    </div>

    <div class="page-header-divider mb-5" />

    <!-- ── Loading State ── -->
    <template v-if="loading && !data">
      <div class="dark-card pa-4 mb-3">
        <v-skeleton-loader type="text" width="120" class="mb-2" />
        <v-skeleton-loader type="heading" width="200" class="mb-2" />
        <v-skeleton-loader type="text" width="150" />
      </div>
      <div class="dark-card pa-4 mb-3">
        <v-skeleton-loader type="text" width="120" class="mb-3" />
        <div v-for="i in 3" :key="'bar-' + i" class="d-flex align-center ga-2 mb-2">
          <v-skeleton-loader type="text" width="32" />
          <v-skeleton-loader type="text" class="flex-grow-1" />
          <v-skeleton-loader type="text" width="50" />
        </div>
      </div>
      <div class="dark-card pa-4 mb-3">
        <div class="d-flex justify-space-between mb-3">
          <v-skeleton-loader type="text" width="100" />
          <v-skeleton-loader type="text" width="80" />
        </div>
        <v-row dense class="mb-4">
          <v-col v-for="i in 3" :key="i" cols="4">
            <div class="stat-mini-cell text-center pa-3">
              <v-skeleton-loader type="text" width="40" class="mx-auto mb-1" />
              <v-skeleton-loader type="text" width="50" class="mx-auto" />
            </div>
          </v-col>
        </v-row>
      </div>
    </template>

    <!-- ── Error State ── -->
    <template v-else-if="error">
      <div class="dark-card pa-4">
        <v-alert type="error" variant="tonal" class="mb-0">
          Failed to load monthly performance
          <template #append>
            <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
          </template>
        </v-alert>
      </div>
    </template>

    <!-- ── Empty State ── -->
    <template v-else-if="data && months.length === 0">
      <div class="dark-card pa-6 text-center">
        <v-icon icon="mdi-chart-box-outline" size="48" class="text-medium-emphasis mb-2" />
        <div class="text-body-2 text-medium-emphasis">No performance data yet</div>
        <div class="text-caption text-label-muted mt-1">
          Complete some trades to see monthly performance
        </div>
      </div>
    </template>

    <!-- ── Data State ── -->
    <template v-else-if="data && months.length > 0">

      <!-- Zone B: Cumulative P&L -->
      <div class="dark-card pa-4 mb-3">
        <div class="section-label mb-2">CUMULATIVE P&L</div>
        <div class="d-flex align-end ga-2 mb-2">
          <span
            class="cumulative-number font-mono"
            :class="cumulativePipsColorClass"
          >
            {{ formatPips(latestCumulativePips) }}
          </span>
          <span class="unit-label pb-1">pips</span>
        </div>
        <div class="text-caption text-medium-emphasis">
          Since {{ firstMonthLabel }}
          <span class="text-label-muted mx-1">|</span>
          {{ months.length }} months
        </div>
      </div>

      <!-- Zone C: Monthly Bar Chart -->
      <div class="dark-card pa-4 mb-3">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="section-label">MONTHLY P&L</div>
          <div class="oldest-label">oldest -> newest</div>
        </div>

        <div
          v-for="month in monthsChronological"
          :key="month.month"
          class="d-flex align-center ga-2 mb-2 cursor-pointer"
          :class="{ 'row-dimmed': selectedMonthData && selectedMonthData.month !== month.month }"
          @click="selectMonth(month.month)"
        >
          <!-- Month label -->
          <span
            class="month-label"
            :class="selectedMonthData?.month === month.month ? 'text-primary' : 'text-label-muted'"
          >
            {{ shortLabel(month.month) }}
          </span>

          <!-- Bar track -->
          <div class="flex-grow-1 bar-track">
            <div
              class="bar-fill rounded"
              :class="month.totalPips >= 0 ? 'bar-positive' : 'bar-negative'"
              :style="{
                width: barWidth(month.totalPips) + '%',
                opacity: selectedMonthData?.month === month.month ? 1 : 0.7,
              }"
            />
          </div>

          <!-- Value -->
          <span
            class="bar-value font-mono"
            :class="month.totalPips >= 0 ? 'text-success' : 'text-error'"
          >
            {{ formatPips(month.totalPips) }}
          </span>
        </div>
      </div>

      <!-- Zone D: Selected Month Detail -->
      <div v-if="selectedMonthData" class="dark-card pa-4 mb-3">

        <!-- Month header -->
        <div class="d-flex align-center justify-space-between mb-4">
          <span class="month-detail-title">{{ selectedMonthData.label }}</span>
          <div class="d-flex align-baseline ga-1">
            <span
              class="month-detail-pips font-mono"
              :class="plColorClass(selectedMonthData.totalPips)"
            >
              {{ formatPips(selectedMonthData.totalPips) }}
            </span>
            <span class="unit-label" :class="plColorClass(selectedMonthData.totalPips)">pips</span>
          </div>
        </div>

        <!-- Stats 3-cell grid: Trades / Win Rate / PF -->
        <v-row dense class="mb-5">
          <v-col cols="4">
            <div class="stat-mini-cell d-flex flex-column align-center pa-3">
              <div class="stat-mini-value mb-1 font-mono">{{ selectedMonthData.totalTrades }}</div>
              <div class="stat-mini-label">Trades</div>
            </div>
          </v-col>
          <v-col cols="4">
            <div class="stat-mini-cell d-flex flex-column align-center pa-3">
              <div class="stat-mini-value mb-1 font-mono" :class="winRateColorClass(selectedMonthData.winRate)">
                {{ selectedMonthData.winRate }}%
              </div>
              <div class="stat-mini-label">Win Rate</div>
            </div>
          </v-col>
          <v-col cols="4">
            <div class="stat-mini-cell d-flex flex-column align-center pa-3">
              <div class="stat-mini-value mb-1 font-mono" :class="pfColorClass(selectedMonthData.profitFactor)">
                {{ selectedMonthData.profitFactor.toFixed(2) }}
              </div>
              <div class="stat-mini-label">PF</div>
            </div>
          </v-col>
        </v-row>

        <!-- Best / Worst Trade -->
        <div class="subsection-label mb-3">BEST / WORST TRADE</div>
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon icon="mdi-trophy" size="15" color="success" />
          <span
            class="direction-badge"
            :class="selectedMonthData.bestTrade.action === 'BUY' ? 'direction-badge--buy' : 'direction-badge--sell'"
          >
            {{ selectedMonthData.bestTrade.action }}
          </span>
          <span class="trade-symbol">{{ selectedMonthData.bestTrade.symbol }}</span>
          <v-spacer />
          <span class="trade-pips text-success font-mono">{{ formatPips(selectedMonthData.bestTrade.pips) }}</span>
          <span class="trade-meta font-mono">{{ formatDate(selectedMonthData.bestTrade.date) }}, {{ selectedMonthData.bestTrade.interval }}</span>
        </div>
        <div class="d-flex align-center ga-2 mb-5">
          <v-icon icon="mdi-alert-circle-outline" size="15" color="error" />
          <span
            class="direction-badge direction-badge--sell"
          >
            {{ selectedMonthData.worstTrade.action }}
          </span>
          <span class="trade-symbol">{{ selectedMonthData.worstTrade.symbol }}</span>
          <v-spacer />
          <span class="trade-pips text-error font-mono">{{ formatPips(selectedMonthData.worstTrade.pips) }}</span>
          <span class="trade-meta font-mono">{{ formatDate(selectedMonthData.worstTrade.date) }}, {{ selectedMonthData.worstTrade.interval }}</span>
        </div>

        <div class="inner-divider mb-4" />

        <!-- Symbol Breakdown -->
        <div class="subsection-label mb-3">SYMBOL BREAKDOWN</div>
        <div
          v-for="sym in sortedSymbols"
          :key="sym.symbol"
          class="d-flex align-center ga-2 mb-3"
        >
          <span class="breakdown-name">{{ sym.symbol }}</span>
          <span class="breakdown-wl font-mono">{{ sym.wins }}W {{ sym.losses }}L</span>
          <div class="flex-grow-1 bar-track">
            <div
              class="bar-fill rounded"
              :class="sym.totalPips >= 0 ? 'bar-positive' : 'bar-negative'"
              :style="{ width: symbolBarWidth(sym.totalPips) + '%' }"
            />
          </div>
          <span
            class="breakdown-pips font-mono"
            :class="plColorClass(sym.totalPips)"
          >
            {{ formatPips(sym.totalPips) }}
          </span>
        </div>

        <div class="inner-divider mb-4" />

        <!-- Timeframe Breakdown -->
        <div class="subsection-label mb-3">TIMEFRAME BREAKDOWN</div>
        <div
          v-for="tf in sortedIntervals"
          :key="tf.interval"
          class="d-flex align-center ga-2 mb-3"
        >
          <span class="breakdown-name">{{ tf.interval }}</span>
          <span class="breakdown-wl font-mono">{{ tf.wins }}W {{ tf.losses }}L</span>
          <div class="flex-grow-1 bar-track">
            <div
              class="bar-fill rounded"
              :class="tf.totalPips >= 0 ? 'bar-positive' : 'bar-negative'"
              :style="{ width: intervalBarWidth(tf.totalPips) + '%' }"
            />
          </div>
          <span
            class="breakdown-pips font-mono"
            :class="plColorClass(tf.totalPips)"
          >
            {{ formatPips(tf.totalPips) }}
          </span>
        </div>

      </div>

      <!-- Zone E: Compact Month List (other months) -->
      <div v-if="otherMonths.length > 0">
        <div class="subsection-label mb-3">ALL MONTHS</div>

        <div
          v-for="month in otherMonths"
          :key="month.month"
          class="dark-card pa-3 mb-2 cursor-pointer month-row"
          :class="{ 'month-row--active': selectedMonthData?.month === month.month }"
          @click="selectMonth(month.month)"
        >
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2 font-weight-bold">{{ month.label }}</span>
            <span
              class="text-body-2 font-weight-bold font-mono"
              :class="plColorClass(month.totalPips)"
            >
              {{ formatPips(month.totalPips) }} pips
            </span>
          </div>
          <div class="d-flex align-center ga-2">
            <span class="text-caption text-medium-emphasis font-mono">{{ month.totalTrades }} trades</span>
            <span class="text-caption text-label-muted">|</span>
            <span class="text-caption font-mono" :class="winRateColorClass(month.winRate)">{{ month.winRate }}% WR</span>
            <span class="text-caption text-label-muted">|</span>
            <span class="text-caption font-mono" :class="pfColorClass(month.profitFactor)">PF {{ month.profitFactor.toFixed(2) }}</span>
            <v-spacer />
            <span class="text-caption text-label-muted font-mono" style="font-size: 10px;">
              cum: {{ formatPips(month.cumulativePips) }}
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

/* ── Labels ── */
.section-label {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-bold);
  letter-spacing: var(--ds-ls-caps-wide);
  text-transform: uppercase;
  color: var(--ds-text-muted);
}

.subsection-label {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-bold);
  letter-spacing: var(--ds-ls-caps);
  text-transform: uppercase;
  color: var(--ds-text-muted);
}

.oldest-label {
  font-size: var(--ds-text-micro);
  color: rgba(100, 116, 139, 0.4);
  font-weight: var(--ds-fw-medium);
}

/* ── Cumulative ── */
.cumulative-number {
  font-size: 2.2rem;
  line-height: 1;
  font-weight: var(--ds-fw-bold);
}

.unit-label {
  font-size: var(--ds-text-label);
  font-weight: var(--ds-fw-medium);
  color: var(--ds-text-muted);
}

/* ── Bar chart ── */
.month-label {
  font-size: var(--ds-text-caption);
  font-weight: var(--ds-fw-semibold);
  min-width: 28px;
}

.bar-track {
  height: 14px;
  display: flex;
  align-items: center;
}

.bar-fill {
  height: 100%;
  min-width: 4px;
  transition: width 0.3s ease, opacity 0.2s ease;
}

.bar-positive {
  background: rgba(16, 185, 129, 0.8);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
}

.bar-negative {
  background: rgba(239, 68, 68, 0.8);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

.bar-value {
  font-size: var(--ds-text-caption);
  font-weight: var(--ds-fw-bold);
  min-width: 56px;
  text-align: right;
}

.row-dimmed {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

/* ── Month detail ── */
.month-detail-title {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(248, 250, 252, 0.95);
}

.month-detail-pips {
  font-size: 1rem;
  font-weight: 700;
}

/* ── Stats mini grid — Tier 3 Glass ── */
.stat-mini-cell {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: background 0.2s ease;
}

.stat-mini-cell:hover {
  background: rgba(255, 255, 255, 0.05);
}

.stat-mini-value {
  font-size: var(--ds-text-stat);
  font-weight: var(--ds-fw-bold);
  color: var(--ds-text-primary);
  line-height: var(--ds-lh-snug);
}

.stat-mini-label {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-medium);
  color: var(--ds-text-ghost);
}

/* ── Best/Worst trade ── */
.direction-badge {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-bold);
  letter-spacing: 0.06em;
  padding: 2px 5px;
  border-radius: var(--ds-radius-2xs);
  line-height: var(--ds-lh-normal);
}

.direction-badge--buy {
  background: var(--ds-success-bg);
  color: var(--ds-success-text);
  border: 1px solid var(--ds-success-border);
}

.direction-badge--sell {
  background: var(--ds-error-bg);
  color: var(--ds-error-bright);
  border: 1px solid var(--ds-error-border);
}

.trade-symbol {
  font-size: var(--ds-text-label);
  font-weight: var(--ds-fw-bold);
  color: var(--ds-text-primary);
}

.trade-pips {
  font-size: var(--ds-text-label);
  font-weight: var(--ds-fw-bold);
}

.trade-meta {
  font-size: var(--ds-text-micro);
  color: var(--ds-text-ghost);
  letter-spacing: -0.01em;
}

/* ── Inner divider — Glass ── */
.inner-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

/* ── Breakdown rows ── */
.breakdown-name {
  font-size: var(--ds-text-label);
  font-weight: var(--ds-fw-bold);
  color: var(--ds-text-secondary);
  min-width: 56px;
}

.breakdown-wl {
  font-size: var(--ds-text-micro);
  color: var(--ds-text-ghost);
  min-width: 44px;
}

.breakdown-pips {
  font-size: var(--ds-text-label);
  font-weight: var(--ds-fw-bold);
  min-width: 44px;
  text-align: right;
}

/* ── Month row (Zone E) — Glass ── */
.month-row {
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.month-row--active {
  border-color: rgba(74, 222, 128, 0.3) !important;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.3),
    0 0 12px rgba(74, 222, 128, 0.08) !important;
}
</style>
