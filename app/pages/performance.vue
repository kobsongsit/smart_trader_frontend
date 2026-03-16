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
  return months.value[0].cumulativePips
})

/** First month label (oldest) */
const firstMonthLabel = computed(() => {
  if (months.value.length === 0) return ''
  const oldest = months.value[months.value.length - 1]
  return dayjs(oldest.month, 'YYYY-MM').format('MMM YYYY')
})

/** Max absolute pips for bar width calculation */
const maxAbsPips = computed(() => {
  return Math.max(...months.value.map(m => Math.abs(m.totalPips)), 1)
})

/** Selected month data */
const selectedMonthData = computed<MonthlyData | null>(() => {
  if (!selectedMonthKey.value && months.value.length > 0) {
    return months.value[0] // default to newest
  }
  return months.value.find(m => m.month === selectedMonthKey.value) ?? null
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

/**
 * Format pips with sign + comma separator
 */
function formatPips(pips: number): string {
  const prefix = pips > 0 ? '+' : ''
  return `${prefix}${pips.toLocaleString('en-US')}`
}

/**
 * Short label from month string: "2026-03" -> "Mar"
 */
function shortLabel(monthStr: string): string {
  return dayjs(monthStr, 'YYYY-MM').format('MMM')
}

/**
 * Format date: "2026-03-03" -> "Mar 3"
 */
function formatDate(dateStr: string): string {
  return dayjs(dateStr, 'YYYY-MM-DD').format('MMM D')
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

/** Cumulative pips color */
const cumulativePipsColorClass = computed(() => {
  return plColorClass(latestCumulativePips.value)
})

/**
 * Win Rate color
 */
function winRateColorClass(wr: number): string {
  if (wr >= 60) return 'text-success'
  if (wr >= 50) return 'text-primary'
  return 'text-warning'
}

/**
 * Profit Factor color thresholds
 */
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
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- Zone A: Page Header -->
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

    <!-- Loading State -->
    <template v-if="loading && !data">
      <!-- Hero skeleton -->
      <v-card elevation="0" rounded="lg" class="glass-card mb-3">
        <v-card-text class="pa-4">
          <div class="glass-sheet rounded-lg pa-4">
            <v-skeleton-loader type="text" width="120" class="mb-2" />
            <v-skeleton-loader type="heading" width="200" class="mb-3" />
            <v-skeleton-loader type="text" width="150" />
          </div>
        </v-card-text>
      </v-card>

      <!-- Bar chart skeleton -->
      <v-card elevation="0" rounded="lg" class="glass-card mb-3">
        <v-card-text class="pa-4">
          <v-skeleton-loader type="text" width="120" class="mb-3" />
          <div v-for="i in 4" :key="'bar-' + i" class="d-flex align-center ga-2 mb-2">
            <v-skeleton-loader type="text" width="32" />
            <v-skeleton-loader type="text" class="flex-grow-1" />
            <v-skeleton-loader type="text" width="50" />
          </div>
        </v-card-text>
      </v-card>

      <!-- Detail skeleton -->
      <v-card elevation="0" rounded="lg" class="glass-card mb-3">
        <v-card-text class="pa-4">
          <div class="d-flex justify-space-between mb-3">
            <v-skeleton-loader type="text" width="100" />
            <v-skeleton-loader type="text" width="80" />
          </div>
          <v-row dense class="mb-4">
            <v-col v-for="i in 3" :key="i" cols="4">
              <div class="glass-sheet rounded-lg pa-3 text-center">
                <v-skeleton-loader type="text" width="40" class="mx-auto mb-1" />
                <v-skeleton-loader type="text" width="50" class="mx-auto" />
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>

    <!-- Error State -->
    <template v-else-if="error">
      <v-card elevation="0" rounded="lg" class="glass-card">
        <v-card-text class="pa-4">
          <v-alert type="error" variant="tonal" class="mb-0">
            Failed to load monthly performance
            <template #append>
              <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
            </template>
          </v-alert>
        </v-card-text>
      </v-card>
    </template>

    <!-- Empty State -->
    <template v-else-if="data && months.length === 0">
      <v-card elevation="0" rounded="lg" class="glass-card">
        <v-card-text class="pa-4 text-center">
          <v-icon icon="mdi-chart-box-outline" size="48" class="text-medium-emphasis mb-2" />
          <div class="text-body-2 text-medium-emphasis">No performance data yet</div>
          <div class="text-caption text-label-muted mt-1">
            Complete some trades to see monthly performance
          </div>
        </v-card-text>
      </v-card>
    </template>

    <!-- Data State -->
    <template v-else-if="data && months.length > 0">

      <!-- Zone B: Cumulative Hero -->
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

      <!-- Zone C: Monthly Bar Chart -->
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

          <!-- Bar rows -->
          <div
            v-for="month in monthsChronological"
            :key="month.month"
            class="d-flex align-center ga-2 mb-2 cursor-pointer"
            :class="{ 'opacity-80': selectedMonthData && selectedMonthData.month !== month.month }"
            @click="selectMonth(month.month)"
          >
            <!-- Month label -->
            <span
              class="text-caption font-weight-medium"
              :class="selectedMonthData?.month === month.month ? 'text-primary' : 'text-label-muted'"
              style="min-width: 32px;"
            >
              {{ shortLabel(month.month) }}
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
                  opacity: selectedMonthData?.month === month.month ? 1 : 0.7,
                  transition: 'opacity 0.2s ease',
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

      <!-- Zone D: Month Detail Card -->
      <v-card
        v-if="selectedMonthData"
        elevation="0"
        rounded="lg"
        class="glass-card mb-3"
      >
        <v-card-text class="pa-4">
          <!-- Month header -->
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="text-subtitle-1 font-weight-bold">{{ selectedMonthData.label }}</div>
            <span
              class="text-h6 font-weight-bold font-mono"
              :class="plColorClass(selectedMonthData.totalPips)"
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

          <!-- Best / Worst Trade -->
          <div class="glass-sheet rounded-lg pa-3 mb-4">
            <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-2">
              BEST / WORST TRADE
            </div>

            <!-- Best Trade -->
            <div class="d-flex align-center ga-2 mb-2">
              <v-icon icon="mdi-trophy" size="16" color="success" />
              <v-chip
                :color="selectedMonthData.bestTrade.action === 'BUY' ? 'success' : 'error'"
                size="x-small"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ selectedMonthData.bestTrade.action }}
              </v-chip>
              <span class="text-caption font-weight-bold">
                {{ selectedMonthData.bestTrade.symbol }}
              </span>
              <v-spacer />
              <span class="text-caption font-weight-bold font-mono text-success">
                {{ formatPips(selectedMonthData.bestTrade.pips) }}
              </span>
              <span class="text-caption text-medium-emphasis font-mono" style="font-size: 10px;">
                {{ formatDate(selectedMonthData.bestTrade.date) }}, {{ selectedMonthData.bestTrade.interval }}
              </span>
            </div>

            <!-- Worst Trade -->
            <div class="d-flex align-center ga-2">
              <v-icon icon="mdi-alert-circle-outline" size="16" color="error" />
              <v-chip
                :color="selectedMonthData.worstTrade.action === 'BUY' ? 'success' : 'error'"
                size="x-small"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ selectedMonthData.worstTrade.action }}
              </v-chip>
              <span class="text-caption font-weight-bold">
                {{ selectedMonthData.worstTrade.symbol }}
              </span>
              <v-spacer />
              <span class="text-caption font-weight-bold font-mono text-error">
                {{ formatPips(selectedMonthData.worstTrade.pips) }}
              </span>
              <span class="text-caption text-medium-emphasis font-mono" style="font-size: 10px;">
                {{ formatDate(selectedMonthData.worstTrade.date) }}, {{ selectedMonthData.worstTrade.interval }}
              </span>
            </div>
          </div>

          <!-- Symbol Breakdown -->
          <div class="glass-sheet rounded-lg pa-3 mb-4">
            <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-2">
              SYMBOL BREAKDOWN
            </div>
            <div
              v-for="sym in sortedSymbols"
              :key="sym.symbol"
              class="d-flex align-center ga-2 mb-2"
            >
              <span class="text-caption font-weight-bold" style="min-width: 64px;">
                {{ sym.symbol }}
              </span>
              <span class="text-caption text-medium-emphasis font-mono" style="min-width: 48px;">
                {{ sym.wins }}W {{ sym.losses }}L
              </span>
              <div class="flex-grow-1" style="height: 12px;">
                <div
                  class="rounded"
                  :class="sym.totalPips >= 0 ? 'bg-success' : 'bg-error'"
                  :style="{
                    width: symbolBarWidth(sym.totalPips) + '%',
                    height: '100%',
                    minWidth: '4px',
                  }"
                />
              </div>
              <span
                class="text-caption font-weight-bold font-mono"
                :class="plColorClass(sym.totalPips)"
                style="min-width: 48px; text-align: right;"
              >
                {{ formatPips(sym.totalPips) }}
              </span>
            </div>
          </div>

          <!-- Timeframe Breakdown -->
          <div class="glass-sheet rounded-lg pa-3">
            <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-2">
              TIMEFRAME BREAKDOWN
            </div>
            <div
              v-for="tf in sortedIntervals"
              :key="tf.interval"
              class="d-flex align-center ga-2 mb-2"
            >
              <span class="text-caption font-weight-bold" style="min-width: 32px;">
                {{ tf.interval }}
              </span>
              <span class="text-caption text-medium-emphasis font-mono" style="min-width: 48px;">
                {{ tf.wins }}W {{ tf.losses }}L
              </span>
              <div class="flex-grow-1" style="height: 12px;">
                <div
                  class="rounded"
                  :class="tf.totalPips >= 0 ? 'bg-success' : 'bg-error'"
                  :style="{
                    width: intervalBarWidth(tf.totalPips) + '%',
                    height: '100%',
                    minWidth: '4px',
                  }"
                />
              </div>
              <span
                class="text-caption font-weight-bold font-mono"
                :class="plColorClass(tf.totalPips)"
                style="min-width: 48px; text-align: right;"
              >
                {{ formatPips(tf.totalPips) }}
              </span>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Zone E: Compact Month List -->
      <div v-if="otherMonths.length > 0">
        <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-2">
          ALL MONTHS
        </div>

        <v-card
          v-for="month in otherMonths"
          :key="month.month"
          elevation="0"
          rounded="lg"
          class="glass-card mb-2 cursor-pointer"
          :class="{ 'border-primary': selectedMonthData?.month === month.month }"
          @click="selectMonth(month.month)"
        >
          <v-card-text class="pa-3">
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
              <span class="text-caption text-medium-emphasis font-mono">
                {{ month.totalTrades }} trades
              </span>
              <span class="text-caption text-medium-emphasis">|</span>
              <span class="text-caption font-mono" :class="winRateColorClass(month.winRate)">
                {{ month.winRate }}% WR
              </span>
              <span class="text-caption text-medium-emphasis">|</span>
              <span class="text-caption font-mono" :class="pfColorClass(month.profitFactor)">
                PF {{ month.profitFactor.toFixed(2) }}
              </span>
              <v-spacer />
              <span class="text-caption text-medium-emphasis font-mono" style="font-size: 10px;">
                cum: {{ formatPips(month.cumulativePips) }}
              </span>
            </div>
          </v-card-text>
        </v-card>
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
