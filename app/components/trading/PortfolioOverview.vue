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

/** Total Pips color class */
const pipsColorClass = computed(() => {
  if (!portfolio.value) return 'text-medium-emphasis'
  if (portfolio.value.totalPips > 0) return 'text-success'
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
 * Profit Factor color thresholds
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
// Retry
// ============================================================

function retry() {
  fetchPortfolio()
}
</script>

<template>

  <!-- ── Loading State ── -->
  <div v-if="loading" class="portfolio-card">
    <div class="pa-4">
      <!-- Header skeleton -->
      <div class="d-flex align-center ga-3 mb-4">
        <v-skeleton-loader type="avatar" width="40" height="40" />
        <div class="flex-grow-1">
          <v-skeleton-loader type="text" width="180" class="mb-1" />
          <v-skeleton-loader type="text" width="100" />
        </div>
      </div>

      <!-- Hero skeleton -->
      <div class="hero-card pa-4 mb-4">
        <v-skeleton-loader type="text" width="80" class="mb-2" />
        <v-skeleton-loader type="heading" width="160" class="mb-2" />
        <v-skeleton-loader type="text" width="120" class="mb-4" />
        <v-skeleton-loader type="text" width="100%" />
      </div>

      <!-- Stats grid skeleton -->
      <v-row dense>
        <v-col v-for="i in 6" :key="i" cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <v-skeleton-loader type="text" width="36" class="mb-1" />
            <v-skeleton-loader type="text" width="50" />
          </div>
        </v-col>
      </v-row>
    </div>
  </div>

  <!-- ── Error State ── -->
  <div v-else-if="error" class="portfolio-card pa-4">
    <v-alert type="error" variant="tonal" class="mb-0">
      Failed to load portfolio data
      <template #append>
        <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
      </template>
    </v-alert>
  </div>

  <!-- ── Empty State ── -->
  <div v-else-if="!portfolio" class="portfolio-card pa-6 text-center">
    <v-icon icon="mdi-chart-box-plus-outline" size="48" class="text-medium-emphasis mb-2" />
    <div class="text-body-2 text-medium-emphasis">No trading data yet</div>
    <div class="text-caption text-label-muted mt-1">Start trading to see your portfolio stats</div>
  </div>

  <!-- ── Data State ── -->
  <div v-else class="portfolio-card">
    <div class="pa-4">

      <!-- Zone A: Section Header -->
      <div class="d-flex align-center ga-3 mb-4">
        <div class="portfolio-icon-box">
          <v-icon icon="mdi-trophy" size="18" color="success" />
        </div>
        <div>
          <div class="portfolio-title">PORTFOLIO OVERVIEW</div>
          <div class="portfolio-since">Since {{ portfolio.since }}</div>
        </div>
      </div>

      <!-- Zone B: Hero Stats Card -->
      <div class="hero-card pa-4 mb-4">

        <!-- TOTAL PIPS label -->
        <div class="hero-label mb-1">TOTAL PIPS</div>

        <!-- Hero number (large) -->
        <div class="d-flex align-end ga-2 mb-1">
          <span class="hero-number font-mono" :class="pipsColorClass">
            {{ formatPips(portfolio.totalPips) }}
          </span>
          <span class="hero-unit pb-1">pips</span>
        </div>

        <!-- Today / Week delta -->
        <div class="delta-line mb-5">
          <span :class="todayPipsColorClass">{{ formatDelta(portfolio.todayPips, 'today') }}</span>
          <span class="delta-divider">|</span>
          <span :class="weekPipsColorClass">{{ formatDelta(portfolio.weekPips, 'week') }}</span>
        </div>

        <!-- Win Rate bar -->
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="winrate-label">WIN RATE</span>
          <span class="winrate-value font-mono text-success">{{ portfolio.winRate }}%</span>
        </div>
        <v-progress-linear
          :model-value="portfolio.winRate"
          color="success"
          bg-color="#0B0F19"
          rounded
          height="6"
          class="winrate-bar"
        />
      </div>

      <!-- Zone C: Stats Grid 3×2 -->
      <v-row dense>

        <!-- Wins -->
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="stat-value text-success mb-1 font-mono">{{ portfolio.wins }}</div>
            <div class="stat-label">Wins</div>
          </div>
        </v-col>

        <!-- Losses -->
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="stat-value text-error mb-1 font-mono">{{ portfolio.losses }}</div>
            <div class="stat-label">Losses</div>
          </div>
        </v-col>

        <!-- Total -->
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="stat-value mb-1 font-mono">{{ portfolio.totalTrades }}</div>
            <div class="stat-label">Total</div>
          </div>
        </v-col>

        <!-- Profit Factor -->
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="d-flex align-center ga-1 mb-1">
              <v-icon icon="mdi-scale-balance" size="13" color="info" />
              <span class="stat-value font-mono" :class="pfColorClass">
                {{ portfolio.profitFactor.toFixed(2) }}
              </span>
            </div>
            <div class="stat-label">Profit Factor</div>
          </div>
        </v-col>

        <!-- Max DD -->
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="d-flex align-center ga-1 mb-1">
              <v-icon icon="mdi-trending-down" size="13" color="error" />
              <span class="stat-value text-error font-mono">
                {{ formatMaxDrawdown(portfolio.maxDrawdown) }}
              </span>
            </div>
            <div class="stat-label">Max DD</div>
          </div>
        </v-col>

        <!-- Streak -->
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="d-flex align-center ga-1 mb-1">
              <v-icon :icon="streakIcon" size="13" :color="streakColor" />
              <span class="stat-value font-mono" :class="streakColorClass">
                {{ streakText }}
              </span>
            </div>
            <div class="stat-label">Streak</div>
          </div>
        </v-col>

      </v-row>

    </div>
  </div>

</template>

<style scoped>
/* ── Outer portfolio card ── */
.portfolio-card {
  background: rgb(17 22 32);
  border: 1px solid rgb(51 65 85 / 0.7);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgb(0 0 0 / 0.35);
}

/* ── Section Header: icon box ── */
.portfolio-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(16 185 129 / 0.1);
  border-radius: 10px;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
}

.portfolio-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgb(226 232 240);
}

.portfolio-since {
  font-size: 0.68rem;
  color: rgb(100 116 139);
  margin-top: 1px;
}

/* ── Hero Card (inner) ── */
.hero-card {
  background: rgb(23 30 45);
  border: 1px solid rgb(51 65 85 / 0.5);
  border-radius: 16px;
}

.hero-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgb(100 116 139);
  text-transform: uppercase;
}

.hero-number {
  font-size: 2.6rem;
  line-height: 1;
  font-weight: 700;
}

.hero-unit {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgb(100 116 139);
}

/* ── Delta line ── */
.delta-line {
  font-size: 0.68rem;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}

.delta-divider {
  color: rgb(51 65 85);
  margin: 0 6px;
}

/* ── Win Rate ── */
.winrate-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgb(100 116 139);
}

.winrate-value {
  font-size: 0.65rem;
  font-weight: 700;
}

/* Win Rate bar glow */
.winrate-bar :deep(.v-progress-linear__determinate) {
  box-shadow: 0 0 10px rgba(52, 211, 153, 0.45);
}

/* ── Stats Grid cells ── */
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
}
</style>
