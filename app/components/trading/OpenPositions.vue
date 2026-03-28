<script setup lang="ts">
import type { Position } from '../../../types/trading'

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
  return positions.value.reduce((sum, p) => {
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
    <!-- Section header skeleton -->
    <div class="d-flex align-center ga-3 mb-4">
      <v-skeleton-loader type="avatar" width="12" height="12" />
      <v-skeleton-loader type="text" width="160" class="flex-grow-1" />
      <v-skeleton-loader type="chip" width="80" />
    </div>

    <!-- Position card skeletons -->
    <div
      v-for="i in 2"
      :key="i"
      class="position-card mb-3"
    >
      <div class="pa-3">
        <!-- Row 1: Header skeleton -->
        <div class="d-flex align-center ga-2 mb-3">
          <v-skeleton-loader type="chip" width="44" />
          <v-skeleton-loader type="text" width="90" />
          <v-spacer />
          <v-skeleton-loader type="text" width="60" />
        </div>
        <!-- Row 2: Entry & SL skeleton -->
        <div class="price-box pa-3">
          <div class="d-flex justify-space-between">
            <v-skeleton-loader type="text@2" width="80" />
            <v-skeleton-loader type="text@2" width="80" />
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
        <span class="count-badge font-mono font-weight-bold">
          {{ positions.length }}
        </span>
        <span
          class="text-caption font-weight-bold font-mono"
          :class="totalPlColorClass"
        >
          {{ formatPips(totalFloatingPips) }} pips
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

          <!-- Duration -->
          <span v-if="position.duration" class="time-badge font-mono">
            <v-icon icon="mdi-clock-outline" size="11" class="mr-1 text-label-muted" />
            {{ position.duration }}
          </span>

          <!-- Timeframe -->
          <span class="tf-badge font-weight-medium font-mono">{{ position.interval }}</span>
        </div>

        <!-- Row 2: Entry & SL -->
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
              <div class="price-label mb-1 d-flex align-center justify-space-between">
                <span>SL</span>
                <span class="sl-type-badge">{{ position.slLabel }}</span>
              </div>
              <div class="price-value font-mono text-error">{{ position.slPrice }}</div>
            </div>

          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Section Header ── */
.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.9);
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
  background: rgb(52 211 153 / 0.7);
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.ping-dot {
  position: relative;
  display: inline-flex;
  border-radius: 50%;
  width: 10px;
  height: 10px;
  background: rgb(16 185 129);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* ── Count Badge — Glass ── */
.count-badge {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.15);
  color: rgb(96 165 250);
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
}

/* ── Position Card — Tier 1 Glass ── */
.position-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.position-card:hover {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.4),
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
  background: rgb(16 185 129);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.position-card--sell::before {
  background: rgb(239 68 68);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}

/* ── Direction Badge — Glass ── */
.direction-badge {
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1.4;
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

/* ── Time & TF badges — Glass ── */
.time-badge {
  display: flex;
  align-items: center;
  font-size: 0.68rem;
  color: rgba(148, 163, 184, 0.7);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: 6px;
}

.tf-badge {
  font-size: 0.68rem;
  color: rgba(203, 213, 225, 0.8);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 2px 6px;
  border-radius: 6px;
}

/* ── Price Box — Deep Glass ── */
.price-box {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  overflow: hidden;
}

.price-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 6px 0;
}

.price-label {
  font-size: 0.65rem;
  font-weight: 500;
  color: rgba(148, 163, 184, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.price-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(226, 232, 240, 0.95);
}

/* ── SL type badge ── */
.sl-type-badge {
  font-size: 0.55rem;
  color: rgba(100, 116, 139, 0.6);
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
