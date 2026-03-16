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
    <div class="d-flex align-center ga-3 mb-3">
      <v-skeleton-loader type="avatar" width="40" height="40" />
      <v-skeleton-loader type="text" width="160" class="flex-grow-1" />
      <v-skeleton-loader type="chip" width="80" />
    </div>

    <!-- Position card skeletons (show 2 placeholder cards) -->
    <v-card
      v-for="i in 2"
      :key="i"
      elevation="0"
      rounded="lg"
      class="glass-card mb-3"
    >
      <v-card-text class="pa-4">
        <!-- Row 1: Header skeleton -->
        <div class="d-flex align-center ga-2 mb-3">
          <v-skeleton-loader type="chip" width="50" />
          <v-skeleton-loader type="text" width="100" />
          <v-spacer />
          <v-skeleton-loader type="text" width="60" />
        </div>

        <!-- Row 2: Entry & SL skeleton -->
        <v-sheet rounded="lg" class="glass-sheet pa-3">
          <div class="d-flex justify-space-between">
            <v-skeleton-loader type="text@2" width="80" />
            <v-skeleton-loader type="text@2" width="80" />
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </div>

  <!-- Error State -->
  <div v-else-if="error" id="open-positions-section">
    <div class="d-flex align-center ga-3 mb-3">
      <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
        <v-icon icon="mdi-chart-timeline-variant-shimmer" size="22" />
      </v-avatar>
      <div class="flex-grow-1">
        <div class="text-subtitle-1 font-weight-bold">OPEN POSITIONS</div>
      </div>
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
    <!-- Section Header -->
    <div class="d-flex align-center ga-3 mb-3">
      <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
        <v-icon icon="mdi-chart-timeline-variant-shimmer" size="22" />
      </v-avatar>
      <div class="flex-grow-1">
        <div class="text-subtitle-1 font-weight-bold">OPEN POSITIONS</div>
      </div>
      <div v-if="positions.length > 0" class="d-flex align-center ga-2">
        <v-chip size="x-small" variant="tonal" color="info" class="font-mono font-weight-bold">
          {{ positions.length }}
        </v-chip>
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
      <v-card-text class="pa-4 text-center">
        <v-icon
          icon="mdi-radar"
          size="48"
          class="text-medium-emphasis mb-2"
        />
        <div class="text-body-2 text-medium-emphasis">
          No open positions
        </div>
        <div class="text-caption text-label-muted mt-1">
          Bot is scanning for optimal setups
        </div>
      </v-card-text>
    </v-card>

    <!-- Position Cards -->
    <v-card
      v-for="position in positions"
      :key="position.symbol + position.entryTime"
      elevation="0"
      rounded="lg"
      class="glass-card mb-3"
    >
      <v-card-text class="pa-4">
        <!-- Row 1: Header -->
        <div class="d-flex align-center ga-2 mb-3">
          <!-- Direction chip -->
          <v-chip
            :color="position.action === 'BUY' ? 'success' : 'error'"
            size="x-small"
            variant="flat"
            class="font-weight-black"
          >
            {{ position.action }}
          </v-chip>

          <!-- Symbol -->
          <span class="text-subtitle-1 font-weight-bold">{{ position.symbol }}</span>

          <v-spacer />

          <!-- Timeframe -->
          <span class="text-caption text-label-muted font-weight-medium">
            {{ position.interval }}
          </span>

          <!-- Duration (shown if available) -->
          <span
            v-if="position.duration"
            class="text-caption text-medium-emphasis font-mono"
          >
            <v-icon icon="mdi-clock-outline" size="12" class="mr-1" />{{ position.duration }}
          </span>
        </div>

        <!-- Row 2: Entry & SL -->
        <div class="glass-sheet rounded-lg pa-3">
          <div class="d-flex justify-space-between">
            <!-- Entry Price -->
            <div>
              <div class="text-caption text-label-muted font-weight-medium mb-1">Entry</div>
              <div class="text-body-2 font-weight-bold font-mono">
                {{ position.entryPrice }}
              </div>
            </div>

            <!-- SL Price -->
            <div class="text-right">
              <div class="text-caption text-label-muted font-weight-medium mb-1">
                SL
                <span class="text-medium-emphasis ml-1">({{ position.slLabel }})</span>
              </div>
              <div class="text-body-2 font-weight-bold font-mono text-error">
                {{ position.slPrice }}
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>
