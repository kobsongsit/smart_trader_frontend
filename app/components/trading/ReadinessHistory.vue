<script setup lang="ts">
import type { ReadinessHistoryItem } from '../../../types/trading'

interface Props {
  history: ReadinessHistoryItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// ─── Chart dimensions ───
const CHART_W = 320
const CHART_H = 80
const PADDING_X = 4
const PADDING_Y = 8

// ─── Y range: -10 to +10 ───
const Y_MIN = -10
const Y_MAX = 10

function yToPixel(val: number): number {
  const ratio = (val - Y_MIN) / (Y_MAX - Y_MIN)
  return CHART_H - PADDING_Y - ratio * (CHART_H - 2 * PADDING_Y)
}

function xToPixel(idx: number, total: number): number {
  if (total <= 1) return CHART_W / 2
  return PADDING_X + (idx / (total - 1)) * (CHART_W - 2 * PADDING_X)
}

// ─── SVG Path ───
const pathData = computed(() => {
  if (props.history.length === 0) return ''
  // history comes newest-first, reverse for left-to-right chronological
  const sorted = [...props.history].reverse()
  const total = sorted.length

  const points = sorted.map((item, idx) => {
    const x = xToPixel(idx, total)
    const y = yToPixel(item.directionScore)
    return `${x},${y}`
  })

  return `M ${points.join(' L ')}`
})

// ─── Gradient segments: determine color at each point ───
const gradientStops = computed(() => {
  if (props.history.length === 0) return []
  const sorted = [...props.history].reverse()
  return sorted.map((item, idx) => {
    const offset = sorted.length <= 1 ? 50 : (idx / (sorted.length - 1)) * 100
    let color = '#F59E0B' // yellow
    if (item.directionScore >= 4) color = '#10B981' // green
    else if (item.directionScore <= -4) color = '#EF4444' // red
    return { offset: `${offset}%`, color }
  })
})

// ─── Area fill path (same as line but closes to bottom) ───
const areaPath = computed(() => {
  if (props.history.length === 0) return ''
  const sorted = [...props.history].reverse()
  const total = sorted.length

  const points = sorted.map((item, idx) => {
    const x = xToPixel(idx, total)
    const y = yToPixel(item.directionScore)
    return `${x},${y}`
  })

  const firstX = xToPixel(0, total)
  const lastX = xToPixel(total - 1, total)
  const zeroY = yToPixel(0)

  return `M ${firstX},${zeroY} L ${points.join(' L ')} L ${lastX},${zeroY} Z`
})

// ─── Zero line Y position ───
const zeroLineY = computed(() => yToPixel(0))

// ─── Latest value ───
const latestScore = computed(() => {
  if (props.history.length === 0) return null
  return props.history[0]
})
</script>

<template>
  <v-card class="glass-card" rounded="lg">
    <v-card-text class="pa-3 pa-sm-4">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-caption font-weight-bold text-uppercase text-label-muted">
          <v-icon icon="mdi-chart-timeline-variant" size="16" color="primary" class="mr-1" />
          Direction Score History
        </div>
        <div v-if="latestScore" class="text-caption text-label-muted">
          {{ history.length }} points
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading && history.length === 0" class="text-center py-3">
        <v-progress-circular indeterminate size="24" width="2" color="primary" />
      </div>

      <!-- Sparkline Chart -->
      <div v-else-if="history.length > 1" class="sparkline-container">
        <svg
          :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
          preserveAspectRatio="none"
          class="sparkline-svg"
        >
          <defs>
            <linearGradient id="readinessLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                v-for="(stop, idx) in gradientStops"
                :key="idx"
                :offset="stop.offset"
                :stop-color="stop.color"
              />
            </linearGradient>
            <linearGradient id="readinessAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.15" />
              <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- Area fill -->
          <path
            :d="areaPath"
            fill="url(#readinessLineGrad)"
            opacity="0.12"
          />

          <!-- Zero line -->
          <line
            :x1="PADDING_X"
            :y1="zeroLineY"
            :x2="CHART_W - PADDING_X"
            :y2="zeroLineY"
            stroke="rgba(255,255,255,0.15)"
            stroke-width="1"
            stroke-dasharray="4,4"
          />

          <!-- Score line -->
          <path
            :d="pathData"
            fill="none"
            stroke="url(#readinessLineGrad)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <!-- Y-axis labels -->
        <div class="sparkline-labels">
          <span class="text-success">+10</span>
          <span class="text-label-muted">0</span>
          <span class="text-error">-10</span>
        </div>
      </div>

      <!-- Not enough data -->
      <div v-else class="text-center py-3">
        <div class="text-caption text-label-muted">
          {{ history.length === 1 ? 'Need at least 2 data points for chart' : 'No history data available' }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.sparkline-container {
  position: relative;
}

.sparkline-svg {
  width: 100%;
  height: 80px;
}

.sparkline-labels {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 4px 2px;
  pointer-events: none;
}

.sparkline-labels span {
  font-size: 8px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1;
}
</style>
