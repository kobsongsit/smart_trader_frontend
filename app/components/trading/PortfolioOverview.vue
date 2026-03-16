<script setup lang="ts">
import type { PortfolioData } from '../../../types/trading'

// ============================================================
// Composable
// ============================================================

const { data, loading, error, fetchPortfolio, refresh } = usePortfolio()

// Fetch on mount
onMounted(() => {
  fetchPortfolio()
})

// ============================================================
// Formatting helpers
// ============================================================

/**
 * Format pips with sign + comma separator
 * +6,492 / -1,230 / 0
 */
function formatPips(pips: number): string {
  const prefix = pips > 0 ? '+' : ''
  return `${prefix}${pips.toLocaleString('en-US')}`
}

/**
 * Format delta value with label
 * "+127 today" / "-42 today" / "— today" (if null/undefined)
 */
function formatDelta(value: number | null | undefined, label: string): string {
  if (value == null) return `\u2014 ${label}`
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString('en-US')} ${label}`
}

/**
 * Format max drawdown — always negative
 */
function formatMaxDrawdown(dd: number): string {
  return dd.toLocaleString('en-US')
}

// ============================================================
// Color logic (computed)
// ============================================================

const portfolio = computed(() => data.value)

/** Total Pips color: positive = primary (green), negative = error (red), zero = grey */
const pipsColorClass = computed(() => {
  if (!portfolio.value) return 'text-medium-emphasis'
  if (portfolio.value.totalPips > 0) return 'text-primary'
  if (portfolio.value.totalPips < 0) return 'text-error'
  return 'text-medium-emphasis'
})

/** Shared helper for delta color */
function deltaColorClass(value: number | null | undefined): string {
  if (value == null) return 'text-medium-emphasis'
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-error'
  return 'text-medium-emphasis'
}

const todayPipsColorClass = computed(() =>
  deltaColorClass(portfolio.value?.todayPips)
)

const weekPipsColorClass = computed(() =>
  deltaColorClass(portfolio.value?.weekPips)
)

/**
 * Profit Factor color thresholds (P1: adjusted per Lungo's review)
 * >= 2.0 success, >= 1.5 primary, >= 1.2 warning, < 1.2 error
 */
const pfColorClass = computed(() => {
  if (!portfolio.value) return ''
  const pf = portfolio.value.profitFactor
  if (pf >= 2.0) return 'text-success'
  if (pf >= 1.5) return 'text-primary'
  if (pf >= 1.2) return 'text-warning'
  return 'text-error'
})

/** Streak icon: fire for W, snowflake for L, minus for 0 */
const streakIcon = computed(() => {
  if (!portfolio.value || portfolio.value.streak === 0) return 'mdi-minus'
  return portfolio.value.streakType === 'W' ? 'mdi-fire' : 'mdi-snowflake'
})

/** Streak color */
const streakColor = computed(() => {
  if (!portfolio.value || portfolio.value.streak === 0) return undefined
  return portfolio.value.streakType === 'W' ? 'success' : 'error'
})

const streakColorClass = computed(() => {
  if (!portfolio.value || portfolio.value.streak === 0) return 'text-medium-emphasis'
  return portfolio.value.streakType === 'W' ? 'text-success' : 'text-error'
})

/** Streak text: "3W" / "5L" / "0" */
const streakText = computed(() => {
  if (!portfolio.value) return '0'
  if (portfolio.value.streak === 0) return '0'
  return `${portfolio.value.streak}${portfolio.value.streakType}`
})

// ============================================================
// Navigation
// ============================================================

function navigateToOpenPositions() {
  const el = document.getElementById('open-positions-section')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ============================================================
// Retry
// ============================================================

function retry() {
  fetchPortfolio()
}
</script>

<template>
  <!-- Loading State -->
  <v-card v-if="loading" elevation="0" rounded="lg" class="glass-card">
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

      <!-- Stats grid skeleton — Row 1 -->
      <v-row dense class="mb-3">
        <v-col v-for="i in 3" :key="i" cols="4">
          <v-sheet rounded="lg" class="glass-sheet pa-3 text-center">
            <v-skeleton-loader type="text" width="40" class="mx-auto mb-1" />
            <v-skeleton-loader type="text" width="50" class="mx-auto" />
          </v-sheet>
        </v-col>
      </v-row>

      <!-- Stats grid skeleton — Row 2 -->
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

  <!-- Error State -->
  <v-card v-else-if="error" elevation="0" rounded="lg" class="glass-card">
    <v-card-text class="pa-4">
      <v-alert type="error" variant="tonal" class="mb-0">
        Failed to load portfolio data
        <template #append>
          <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
        </template>
      </v-alert>
    </v-card-text>
  </v-card>

  <!-- Empty State -->
  <v-card v-else-if="!portfolio" elevation="0" rounded="lg" class="glass-card">
    <v-card-text class="pa-4 text-center">
      <v-icon icon="mdi-chart-box-plus-outline" size="48" class="text-medium-emphasis mb-2" />
      <div class="text-body-2 text-medium-emphasis">No trading data yet</div>
      <div class="text-caption text-label-muted mt-1">Start trading to see your portfolio stats</div>
    </v-card-text>
  </v-card>

  <!-- Data State -->
  <v-card v-else elevation="0" rounded="lg" class="glass-card">
    <v-card-text class="pa-4">

      <!-- Zone A: Header -->
      <div class="d-flex align-center ga-3 mb-4">
        <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
          <v-icon icon="mdi-trophy" size="22" />
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">PORTFOLIO OVERVIEW</div>
          <div class="text-caption text-label-muted">Since {{ portfolio.since }}</div>
        </div>
      </div>

      <!-- Zone B: Hero Stat (Total Pips + Win Rate) -->
      <div class="glass-sheet rounded-lg pa-4 mb-4">
        <!-- TOTAL PIPS label -->
        <div class="text-caption font-weight-bold text-label-muted text-uppercase mb-1">
          TOTAL PIPS
        </div>

        <!-- Hero number -->
        <div class="d-flex align-end ga-2 mb-1">
          <span class="text-h4 font-weight-black font-mono" :class="pipsColorClass">
            {{ formatPips(portfolio.totalPips) }}
          </span>
          <span class="text-caption font-weight-medium text-label-muted pb-1">pips</span>
        </div>

        <!-- Today/Week Delta (P1) -->
        <div class="text-caption font-mono mb-3">
          <span :class="todayPipsColorClass">{{ formatDelta(portfolio.todayPips, 'today') }}</span>
          <span class="text-label-muted mx-1">|</span>
          <span :class="weekPipsColorClass">{{ formatDelta(portfolio.weekPips, 'week') }}</span>
        </div>

        <!-- Win Rate Bar -->
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption font-weight-medium text-label-muted">WIN RATE</span>
          <span class="text-caption font-weight-bold font-mono text-primary">{{ portfolio.winRate }}%</span>
        </div>
        <v-progress-linear
          :model-value="portfolio.winRate"
          color="primary"
          bg-color="#2A2A2A"
          rounded
          height="6"
        />
      </div>

      <!-- Zone C: Detail Grid -->

      <!-- Row 1: Wins / Losses / Total -->
      <v-row dense class="mb-3">
        <v-col cols="4">
          <div class="glass-sheet rounded-lg pa-3 text-center">
            <div class="text-h6 font-weight-bold font-mono text-success">{{ portfolio.wins }}</div>
            <div class="text-caption text-label-muted font-weight-medium">Wins</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="glass-sheet rounded-lg pa-3 text-center">
            <div class="text-h6 font-weight-bold font-mono text-error">{{ portfolio.losses }}</div>
            <div class="text-caption text-label-muted font-weight-medium">Losses</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="glass-sheet rounded-lg pa-3 text-center">
            <div class="text-h6 font-weight-bold font-mono">{{ portfolio.totalTrades }}</div>
            <div class="text-caption text-label-muted font-weight-medium">Total</div>
          </div>
        </v-col>
      </v-row>

      <!-- Row 2: Profit Factor / Max DD / Streak -->
      <v-row dense class="mb-3">
        <v-col cols="4">
          <div class="glass-sheet rounded-lg pa-3">
            <div class="text-caption text-label-muted font-weight-medium mb-1">Profit Factor</div>
            <div class="d-flex align-center ga-1">
              <v-icon icon="mdi-scale-balance" size="16" color="info" />
              <span class="text-h6 font-weight-bold font-mono" :class="pfColorClass">
                {{ portfolio.profitFactor.toFixed(2) }}
              </span>
            </div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="glass-sheet rounded-lg pa-3">
            <div class="text-caption text-label-muted font-weight-medium mb-1">Max DD</div>
            <div class="d-flex align-center ga-1">
              <v-icon icon="mdi-trending-down" size="16" color="error" />
              <span class="text-h6 font-weight-bold font-mono text-error">
                {{ formatMaxDrawdown(portfolio.maxDrawdown) }}
              </span>
            </div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="glass-sheet rounded-lg pa-3">
            <div class="text-caption text-label-muted font-weight-medium mb-1">Streak</div>
            <div class="d-flex align-center ga-1">
              <v-icon :icon="streakIcon" size="16" :color="streakColor" />
              <span class="text-h6 font-weight-bold font-mono" :class="streakColorClass">
                {{ streakText }}
              </span>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Row 3: Open Positions (clickable chip) -->
      <div class="d-flex align-center justify-center">
        <v-chip
          size="small"
          variant="tonal"
          color="info"
          class="font-mono font-weight-bold cursor-pointer"
          @click="navigateToOpenPositions"
        >
          <v-icon icon="mdi-chart-timeline-variant-shimmer" start size="16" />
          {{ portfolio.openPositions }} Open Positions
          <v-icon icon="mdi-chevron-right" end size="16" />
        </v-chip>
      </div>

    </v-card-text>
  </v-card>
</template>
