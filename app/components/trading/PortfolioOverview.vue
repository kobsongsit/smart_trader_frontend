<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { usePortfolio } from '../../composables/usePortfolio'
import type { PortfolioData } from '../../../types/trading'

// ============================================================
// Composable
// ============================================================

const { data, loading, error, fetchPortfolio } = usePortfolio()

// ============================================================
// Skeleton — minimum display time
// ============================================================

/** แสดง skeleton อย่างน้อย MIN_SKELETON_MS แม้ data load เร็ว */
const MIN_SKELETON_MS = 600
const showSkeleton = ref(true)
let skeletonTimer: ReturnType<typeof setTimeout> | null = null

watch(loading, (isLoading) => {
  if (isLoading) {
    showSkeleton.value = true
    if (skeletonTimer) clearTimeout(skeletonTimer)
  } else {
    skeletonTimer = setTimeout(() => {
      showSkeleton.value = false
    }, MIN_SKELETON_MS)
  }
})

onUnmounted(() => {
  if (skeletonTimer) clearTimeout(skeletonTimer)
})

// ============================================================
// Date Range — Month Navigator
// ============================================================

/** 'month' = filter by selected month | 'all' = no date filter */
const rangeMode = ref<'month' | 'all'>('month')

const selectedMonth = ref(dayjs().month())  // 0–11
const selectedYear  = ref(dayjs().year())

/** Label แสดงบน navigator เช่น "Apr 2026" */
const monthLabel = computed(() =>
  dayjs().year(selectedYear.value).month(selectedMonth.value).format('MMM YYYY')
)

/** ห้าม next เมื่ออยู่ที่เดือนปัจจุบัน */
const isCurrentMonth = computed(() =>
  selectedMonth.value === dayjs().month() && selectedYear.value === dayjs().year()
)

/** คำนวณ from/to จาก selectedMonth/Year */
function getMonthRange() {
  const d = dayjs().year(selectedYear.value).month(selectedMonth.value)
  return {
    from: d.startOf('month').format('YYYY-MM-DD'),
    to:   d.endOf('month').format('YYYY-MM-DD'),
  }
}

/** fetch ใหม่ตาม rangeMode ปัจจุบัน */
function applyRange() {
  if (rangeMode.value === 'all') {
    fetchPortfolio()   // ไม่ส่ง params = backend ใช้ default (ตั้งแต่ต้น)
  } else {
    fetchPortfolio(getMonthRange())
  }
}

function prevMonth() {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
  rangeMode.value = 'month'
  applyRange()
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
  rangeMode.value = 'month'
  applyRange()
}

function setMonth() {
  rangeMode.value = 'month'
  applyRange()
}

function setAll() {
  rangeMode.value = 'all'
  applyRange()
}

// Fetch on mount — default: current month
onMounted(() => {
  applyRange()
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
 * "+127 today" / "-42 today" / "--- today" (if null/undefined)
 */
function formatDelta(value: number | null | undefined, label: string): string {
  if (value == null) return `\u2014 ${label}`
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString('en-US')} ${label}`
}

/**
 * Format max drawdown -- always negative
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
  applyRange()
}
</script>

<template>

  <!-- ── Loading State ── -->
  <div v-if="showSkeleton" class="portfolio-card">
    <div class="pa-4">

      <!-- Zone A: Section Header — title คงจริง, since skeleton -->
      <div class="d-flex align-center ga-3 mb-3">
        <div class="portfolio-icon-box">
          <v-icon icon="mdi-trophy" size="18" color="success" />
        </div>
        <div class="flex-grow-1">
          <div class="portfolio-title">PORTFOLIO OVERVIEW</div>
          <div class="skeleton-bar mt-1" style="width: 80px; height: 9px;" />
        </div>
      </div>

      <!-- Zone A2: Month Navigator — แสดงจริง (functional UI ไม่ขึ้นกับ data) -->
      <div class="month-nav mb-4">
        <button class="month-nav__arrow" @click="prevMonth">
          <v-icon icon="mdi-chevron-left" size="16" />
        </button>
        <div class="month-nav__center">
          <button
            class="month-nav__label"
            :class="{ 'month-nav__label--active': rangeMode === 'month' }"
            @click="setMonth"
          >
            {{ monthLabel }}
          </button>
        </div>
        <button
          class="month-nav__arrow"
          :class="{ 'month-nav__arrow--disabled': isCurrentMonth && rangeMode === 'month' }"
          :disabled="isCurrentMonth && rangeMode === 'month'"
          @click="nextMonth"
        >
          <v-icon icon="mdi-chevron-right" size="16" />
        </button>
        <div class="month-nav__divider" />
        <button
          class="month-nav__all"
          :class="{ 'month-nav__all--active': rangeMode === 'all' }"
          @click="setAll"
        >
          ALL
        </button>
      </div>

      <!-- Zone B: Hero Card — label คงจริง, ค่า skeleton -->
      <div class="hero-card pa-4 mb-4">
        <div class="hero-label mb-1">TOTAL PIPS</div>
        <!-- Hero number skeleton -->
        <div class="d-flex align-end ga-2 mb-1">
          <div class="skeleton-bar" style="width: 160px; height: 42px; border-radius: 6px;" />
          <span class="hero-unit pb-1">pips</span>
        </div>
        <!-- Delta skeleton -->
        <div class="d-flex align-center ga-2 mb-5">
          <div class="skeleton-bar" style="width: 72px; height: 9px;" />
          <span class="delta-divider">|</span>
          <div class="skeleton-bar" style="width: 64px; height: 9px;" />
        </div>
        <!-- Win rate -->
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="winrate-label">WIN RATE</span>
          <div class="skeleton-bar" style="width: 32px; height: 9px;" />
        </div>
        <div class="skeleton-bar" style="width: 100%; height: 6px; border-radius: 4px;" />
      </div>

      <!-- Zone C: Stats Grid 3×2 — label คงจริง, ค่า skeleton -->
      <v-row dense>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="skeleton-bar mb-2" style="width: 40px; height: 18px; border-radius: 4px;" />
            <div class="stat-label">Wins</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="skeleton-bar mb-2" style="width: 40px; height: 18px; border-radius: 4px;" />
            <div class="stat-label">Losses</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="skeleton-bar mb-2" style="width: 40px; height: 18px; border-radius: 4px;" />
            <div class="stat-label">Total</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="skeleton-bar mb-2" style="width: 40px; height: 18px; border-radius: 4px;" />
            <div class="stat-label">Profit Factor</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="skeleton-bar mb-2" style="width: 40px; height: 18px; border-radius: 4px;" />
            <div class="stat-label">Max DD</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-cell d-flex flex-column align-center pa-3">
            <div class="skeleton-bar mb-2" style="width: 40px; height: 18px; border-radius: 4px;" />
            <div class="stat-label">Streak</div>
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
      <div class="d-flex align-center ga-3 mb-3">
        <div class="portfolio-icon-box">
          <v-icon icon="mdi-trophy" size="18" color="success" />
        </div>
        <div class="flex-grow-1">
          <div class="portfolio-title">PORTFOLIO OVERVIEW</div>
          <div class="portfolio-since">Since {{ portfolio.since }}</div>
        </div>
      </div>

      <!-- Zone A2: Month Navigator -->
      <div class="month-nav mb-4">
        <!-- Prev arrow -->
        <button class="month-nav__arrow" @click="prevMonth">
          <v-icon icon="mdi-chevron-left" size="16" />
        </button>

        <!-- Month label — คลิกเพื่อ select monthly period -->
        <div class="month-nav__center">
          <button
            class="month-nav__label"
            :class="{ 'month-nav__label--active': rangeMode === 'month' }"
            @click="setMonth"
          >
            {{ monthLabel }}
          </button>
        </div>

        <!-- Next arrow -->
        <button
          class="month-nav__arrow"
          :class="{ 'month-nav__arrow--disabled': isCurrentMonth && rangeMode === 'month' }"
          :disabled="isCurrentMonth && rangeMode === 'month'"
          @click="nextMonth"
        >
          <v-icon icon="mdi-chevron-right" size="16" />
        </button>

        <!-- Divider -->
        <div class="month-nav__divider" />

        <!-- All button -->
        <button
          class="month-nav__all"
          :class="{ 'month-nav__all--active': rangeMode === 'all' }"
          @click="setAll"
        >
          ALL
        </button>
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
          bg-color="rgba(255,255,255,0.04)"
          rounded
          height="6"
          class="winrate-bar"
        />
      </div>

      <!-- Zone C: Stats Grid 3x2 -->
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
/* ── Skeleton base elements ── */
@keyframes skeleton-shimmer {
  0%   { opacity: 0.4; }
  50%  { opacity: 0.7; }
  100% { opacity: 0.4; }
}

.skeleton-bar {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-month-nav {
  width: 100%;
}

/* ── Outer portfolio card — Tier 1 Glass ── */
.portfolio-card {
  background: var(--ds-glass-1-bg);
  backdrop-filter: blur(24px) saturate(1.3);
  -webkit-backdrop-filter: blur(24px) saturate(1.3);
  border: 1px solid var(--ds-glass-1-border);
  border-radius: var(--ds-radius-xl);
  overflow: hidden;
  box-shadow:
    var(--ds-shadow-card-deep),
    var(--ds-glass-inset);
}

/* ── Section Header: icon box — glass with glow ── */
.portfolio-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-success-bg);
  border: 1px solid var(--ds-success-border);
  border-radius: 10px;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  box-shadow: var(--ds-shadow-green);
}

.portfolio-title {
  font-size: var(--ds-text-label);
  font-weight: var(--ds-fw-bold);
  letter-spacing: var(--ds-ls-caps);
  color: var(--ds-text-primary);
  text-transform: uppercase;
}

.portfolio-since {
  font-size: var(--ds-text-caption);
  color: var(--ds-text-faint);
  margin-top: 1px;
}

/* ── Hero Card — Tier 2 Glass (inner) ── */
.hero-card {
  background: var(--ds-glass-2-bg);
  backdrop-filter: blur(var(--ds-glass-2-blur));
  -webkit-backdrop-filter: blur(var(--ds-glass-2-blur));
  border: 1px solid var(--ds-glass-2-border);
  border-radius: var(--ds-radius-lg);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.hero-label {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-bold);
  letter-spacing: var(--ds-ls-caps-wide);
  color: var(--ds-text-muted);
  text-transform: uppercase;
}

.hero-number {
  font-size: var(--ds-text-hero);
  line-height: var(--ds-lh-tight);
  font-weight: var(--ds-fw-bold);
}

.hero-unit {
  font-size: var(--ds-text-body);
  font-weight: var(--ds-fw-medium);
  color: var(--ds-text-muted);
}

/* ── Delta line ── */
.delta-line {
  font-size: var(--ds-text-caption);
  font-family: 'JetBrains Mono', monospace;
  font-weight: var(--ds-fw-medium);
}

.delta-divider {
  color: rgba(255, 255, 255, 0.1);
  margin: 0 6px;
}

/* ── Win Rate ── */
.winrate-label {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-bold);
  letter-spacing: var(--ds-ls-caps);
  color: var(--ds-text-muted);
  text-transform: uppercase;
}

.winrate-value {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-bold);
}

/* Win Rate bar glow */
.winrate-bar :deep(.v-progress-linear__determinate) {
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.5);
}

/* ── Stats Grid — Tier 3 Glass Surface ── */
.stat-cell {
  background: var(--ds-glass-3-bg);
  border: 1px solid var(--ds-glass-3-border);
  border-radius: var(--ds-radius-md);
  transition:
    background var(--ds-transition-normal),
    border-color var(--ds-transition-normal);
}

.stat-cell:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
}

.stat-value {
  font-size: var(--ds-text-stat);
  font-weight: var(--ds-fw-bold);
  color: var(--ds-text-primary);
  line-height: var(--ds-lh-snug);
}

.stat-label {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-medium);
  color: var(--ds-text-ghost);
  letter-spacing: 0.04em;
}

/* ── Month Navigator ── */
.month-nav {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  background: var(--ds-glass-3-bg);
  border: 1px solid var(--ds-glass-3-border);
  border-radius: var(--ds-radius-sm);
  padding: 4px 6px;
}

.month-nav__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--ds-text-muted);
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: var(--ds-radius-2xs);
  flex-shrink: 0;
  transition: color var(--ds-transition-fast), background var(--ds-transition-fast);
}

.month-nav__arrow:hover {
  color: var(--ds-text-primary);
  background: rgba(255, 255, 255, 0.06);
}

.month-nav__arrow--disabled {
  color: rgba(100, 116, 139, 0.3) !important;
  cursor: not-allowed;
  background: transparent !important;
}

.month-nav__center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-nav__label {
  font-size: var(--ds-text-caption);
  font-weight: var(--ds-fw-bold);
  color: var(--ds-text-muted);
  letter-spacing: 0.02em;
  transition: color var(--ds-transition-fast), background var(--ds-transition-fast);
  min-width: 72px;
  text-align: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--ds-radius-2xs);
}

.month-nav__label:hover {
  color: var(--ds-text-primary);
  background: rgba(255, 255, 255, 0.06);
}

.month-nav__label--active {
  color: var(--ds-text-primary);
}

.month-nav__divider {
  width: 1px;
  height: 16px;
  background: var(--ds-glass-2-border);
  flex-shrink: 0;
}

.month-nav__all {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-bold);
  letter-spacing: var(--ds-ls-caps);
  color: var(--ds-text-faint);
  padding: 2px 8px;
  border-radius: var(--ds-radius-2xs);
  transition: color var(--ds-transition-fast), background var(--ds-transition-fast);
}

.month-nav__all:hover {
  color: var(--ds-text-primary);
  background: rgba(255, 255, 255, 0.06);
}

.month-nav__all--active {
  color: var(--ds-success) !important;
  background: var(--ds-success-bg) !important;
}
</style>
