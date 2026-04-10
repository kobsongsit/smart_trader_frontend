<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Position } from '../../../types/trading'
import { useOpenPositions } from '../../composables/useOpenPositions'

// ============================================================
// Composable
// ============================================================

const { positions, loading, error, fetchPositions } = useOpenPositions()

// Fetch on mount
onMounted(() => {
  fetchPositions()
})

// ============================================================
// Formatting helpers
// ============================================================

/**
 * Format pips for header total (same logic)
 */
function formatPips(pips: number): string {
  const prefix = pips > 0 ? '+' : ''
  return `${prefix}${pips.toLocaleString('en-US')}`
}

// ============================================================
// Computed
// ============================================================

/** Total floating P&L across all positions */
const totalFloatingPips = computed(() => {
  return positions.value.reduce((sum: number, p: Position) => {
    return sum + (p.floatingPips ?? 0)
  }, 0)
})

/** Total P&L color class */
const totalPlColorClass = computed(() => {
  if (totalFloatingPips.value > 0) return 'text-success'
  if (totalFloatingPips.value < 0) return 'text-error'
  return 'text-medium-emphasis'
})

// ============================================================
// Retry
// ============================================================

function retry() {
  fetchPositions()
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" id="open-positions-section">

    <!-- Section header — title คงจริง, badge/pips skeleton -->
    <div class="d-flex align-center ga-3 mb-4">
      <div class="ping-dot-wrap">
        <span class="ping-ring" />
        <span class="ping-dot" />
      </div>
      <span class="section-title flex-grow-1">OPEN POSITIONS</span>
      <!-- pips + count badge — skeleton (dynamic) -->
      <div class="sk-bar" style="height: 11px; width: 52px;" />
      <div class="sk-bar" style="height: 20px; width: 28px; border-radius: 6px;" />
    </div>

    <!-- Position card skeletons — 2 cards -->
    <div v-for="i in 2" :key="i" class="position-card mb-3">
      <div class="pa-3 pl-4">

        <!-- Row 1: badge/symbol/duration/TF — ทั้งหมด dynamic -->
        <div class="d-flex align-center ga-2 mb-3">
          <div class="sk-bar" style="width: 36px; height: 18px; border-radius: 4px;" />
          <div class="sk-bar" style="width: 80px; height: 13px;" />
          <div class="flex-grow-1" />
          <div class="sk-bar" style="width: 56px; height: 18px; border-radius: 6px;" />
          <div class="sk-bar" style="width: 28px; height: 18px; border-radius: 6px;" />
        </div>

        <!-- Row 2: Price box — Entry / SL / TP skeleton -->
        <div class="price-box">
          <div class="d-flex">
            <!-- Entry -->
            <div class="flex-1 pa-2 px-3">
              <div class="price-label mb-1">Entry</div>
              <div class="sk-bar" style="width: 64px; height: 13px;" />
            </div>
            <div class="price-divider" />
            <!-- SL -->
            <div class="flex-1 pa-2 px-3">
              <div class="price-label mb-1">SL</div>
              <div class="sk-bar" style="width: 64px; height: 13px;" />
            </div>
            <div class="price-divider" />
            <!-- TP -->
            <div class="flex-1 pa-2 px-3">
              <div class="price-label mb-1">TP</div>
              <div class="sk-bar" style="width: 64px; height: 13px;" />
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- Error State -->
  <div v-else-if="error" id="open-positions-section">
    <div class="section-header d-flex align-center ga-3 mb-4">
      <div class="ping-dot-wrap">
        <span class="ping-ring" />
        <span class="ping-dot" />
      </div>
      <span class="section-title">OPEN POSITIONS</span>
    </div>
    <v-card elevation="0" rounded="lg" class="glass-card">
      <v-card-text class="pa-4">
        <v-alert type="error" variant="tonal" class="mb-0">
          Failed to load open positions
          <template #append>
            <v-btn variant="text" size="small" @click="retry">Retry</v-btn>
          </template>
        </v-alert>
      </v-card-text>
    </v-card>
  </div>

  <!-- Data State -->
  <div v-else id="open-positions-section">

    <!-- ── Section Header ── -->
    <div class="d-flex align-center ga-3 mb-4">
      <!-- Animated ping dot -->
      <div class="ping-dot-wrap">
        <span class="ping-ring" />
        <span class="ping-dot" />
      </div>

      <!-- Title -->
      <span class="section-title flex-grow-1">OPEN POSITIONS</span>

      <!-- Badges (only when positions exist) -->
      <div v-if="positions.length > 0" class="d-flex align-center ga-2">
        <span
          class="text-caption font-weight-bold font-mono"
          :class="totalPlColorClass"
        >
          {{ formatPips(totalFloatingPips) }} pips
        </span>
        <span class="count-badge font-mono font-weight-bold">
          {{ positions.length }}
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <v-card v-if="positions.length === 0" elevation="0" rounded="lg" class="glass-card">
      <v-card-text class="pa-6 text-center">
        <v-icon
          icon="mdi-radar"
          size="48"
          class="text-medium-emphasis mb-2"
        />
        <div class="text-body-2 text-medium-emphasis">No open positions</div>
        <div class="text-caption text-label-muted mt-1">Bot is scanning for optimal setups</div>
      </v-card-text>
    </v-card>

    <!-- ── Position Cards ── -->
    <div
      v-for="position in positions"
      :key="position.symbol + position.entryTime"
      class="position-card mb-3"
      :class="position.action === 'BUY' ? 'position-card--buy' : 'position-card--sell'"
    >
      <div class="pa-3 pl-4">

        <!-- Row 1: Header -->
        <div class="d-flex align-center ga-2 mb-3">
          <!-- Direction badge -->
          <span
            class="direction-badge font-weight-black"
            :class="position.action === 'BUY' ? 'direction-badge--buy' : 'direction-badge--sell'"
          >
            {{ position.action }}
          </span>

          <!-- Symbol -->
          <span class="text-subtitle-2 font-weight-bold text-slate-100">
            {{ position.symbol }}
          </span>

          <v-spacer />

          <!-- Max hold bars -->
          <span v-if="position.maxHoldBars != null" class="time-badge font-mono">
            <v-icon icon="mdi-timer-outline" size="11" class="mr-1 text-label-muted" />
            Max {{ position.maxHoldBars }}b
          </span>

          <!-- Duration -->
          <span v-if="position.duration" class="time-badge font-mono">
            <v-icon icon="mdi-clock-outline" size="11" class="mr-1 text-label-muted" />
            {{ position.duration }}
          </span>

          <!-- Timeframe -->
          <span class="tf-badge font-weight-medium font-mono">{{ position.interval }}</span>
        </div>

        <!-- Row 2: Entry / SL / TP -->
        <div class="price-box">
          <div class="d-flex">

            <!-- Entry -->
            <div class="flex-1 pa-2 px-3">
              <div class="price-label mb-1">Entry</div>
              <div class="price-value font-mono">{{ position.entryPrice }}</div>
            </div>

            <!-- Vertical divider -->
            <div class="price-divider" />

            <!-- SL -->
            <div class="flex-1 pa-2 px-3">
              <div class="price-label mb-1">SL</div>
              <div class="price-value font-mono text-error">{{ position.slPrice }}</div>
            </div>

            <!-- TP — always shown, "-" if null -->
            <div class="price-divider" />
            <div class="flex-1 pa-2 px-3">
              <div class="price-label mb-1">TP</div>
              <div
                class="price-value font-mono"
                :class="position.tpPrice ? 'text-success' : 'text-medium-emphasis'"
              >
                {{ position.tpPrice ?? '-' }}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Skeleton ── */
@keyframes sk-shimmer {
  0%, 100% { opacity: 0.35; }
  50%       { opacity: 0.65; }
}

.sk-bar {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  animation: sk-shimmer 1.4s ease-in-out infinite;
  flex-shrink: 0;
}

.sk-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  animation: sk-shimmer 1.4s ease-in-out infinite;
  flex-shrink: 0;
}

/* ── Section Header ── */
.section-title {
  font-size: var(--ds-text-label);
  font-weight: var(--ds-fw-bold);
  letter-spacing: var(--ds-ls-caps);
  text-transform: uppercase;
  color: var(--ds-text-primary);
}

/* ── Animated Ping Dot ── */
.ping-dot-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.ping-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--ds-success-text);
  opacity: 0.7;
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.ping-dot {
  position: relative;
  display: inline-flex;
  border-radius: 50%;
  width: 10px;
  height: 10px;
  background: var(--ds-success-dim);
  box-shadow: var(--ds-shadow-green-sm);
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* ── Count Badge — Glass ── */
.count-badge {
  background: var(--ds-info-bg);
  border: 1px solid var(--ds-info-border);
  color: var(--ds-info);
  padding: 1px 8px;
  border-radius: var(--ds-radius-xs);
  font-size: var(--ds-text-caption);
}

/* ── Position Card — Tier 1 Glass ── */
.position-card {
  position: relative;
  background: var(--ds-glass-1-bg);
  backdrop-filter: blur(var(--ds-glass-1-blur)) saturate(var(--ds-glass-1-sat));
  -webkit-backdrop-filter: blur(var(--ds-glass-1-blur)) saturate(var(--ds-glass-1-sat));
  border: 1px solid var(--ds-glass-2-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.30),
    var(--ds-glass-inset);
  transition:
    border-color var(--ds-transition-normal),
    box-shadow var(--ds-transition-normal);
}

.position-card:hover {
  border-color: rgba(255, 255, 255, 0.10);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.40),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

/* Left accent bar — glowing */
.position-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.position-card--buy::before {
  background: var(--ds-success-dim);
  box-shadow: var(--ds-shadow-green-sm);
}

.position-card--sell::before {
  background: var(--ds-error-dim);
  box-shadow: var(--ds-shadow-red-sm);
}

/* ── Direction Badge — Glass ── */
.direction-badge {
  font-size: var(--ds-text-micro);
  letter-spacing: var(--ds-ls-caps);
  padding: 2px 6px;
  border-radius: var(--ds-radius-2xs);
  line-height: var(--ds-lh-relaxed);
  text-transform: uppercase;
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

/* ── Strategy name badge ── */
.strategy-badge {
  font-size: var(--ds-text-micro);
  color: var(--ds-text-muted);
  background: var(--ds-neutral-bg);
  border: 1px solid var(--ds-neutral-border);
  padding: 2px 5px;
  border-radius: var(--ds-radius-xs);
  letter-spacing: 0;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Time & TF badges — Glass ── */
.time-badge {
  display: flex;
  align-items: center;
  font-size: var(--ds-text-caption);
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: var(--ds-radius-xs);
}

.tf-badge {
  font-size: var(--ds-text-caption);
  color: var(--ds-text-secondary);
  background: var(--ds-neutral-bg);
  border: 1px solid var(--ds-neutral-border);
  padding: 2px 6px;
  border-radius: var(--ds-radius-xs);
}

/* ── Price Box — Deep Glass ── */
.price-box {
  background: var(--ds-bg-deep);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--ds-radius-sm);
  overflow: hidden;
}

.price-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 6px 0;
}

.price-label {
  font-size: var(--ds-text-caption);
  font-weight: var(--ds-fw-medium);
  color: var(--ds-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.price-value {
  font-size: var(--ds-text-body);
  font-weight: var(--ds-fw-semibold);
  color: var(--ds-text-primary);
}

/* ── SL type badge ── */
.sl-type-badge {
  font-size: var(--ds-text-micro);
  color: var(--ds-text-faint);
  background: rgba(255, 255, 255, 0.04);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0;
}

/* ── Flex utils ── */
.flex-1 {
  flex: 1;
}
</style>
