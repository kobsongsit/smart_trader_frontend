<script setup lang="ts">
import type { ReadinessData } from '../../../types/trading'
import {
  getReadinessActionColor,
  getReadinessActionIcon,
  getDirectionScoreColor,
  getMarketConditionColor,
} from '../../../types/trading'

interface Props {
  readiness: ReadinessData | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// ─── Null-safe helpers ───
const NULL_COLOR = '#6B7280'

// ─── Direction Score gauge position (map -10..+10 to 0..100) ───
const gaugePercent = computed(() => {
  if (!props.readiness || props.readiness.directionScore === null) return 50
  return ((props.readiness.directionScore + 10) / 20) * 100
})

// ─── Entry timing color ───
const entryTimingColor = computed(() => {
  if (!props.readiness || props.readiness.entryTimingScore === null) return NULL_COLOR
  const score = props.readiness.entryTimingScore
  if (score >= 70) return '#10B981'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
})

// ─── Has valid entry timing score ───
const hasEntryTiming = computed(() => {
  return props.readiness?.entryTimingScore !== null && props.readiness?.entryTimingScore !== undefined
})

// ─── Has valid direction score ───
const hasDirectionScore = computed(() => {
  return props.readiness?.directionScore !== null && props.readiness?.directionScore !== undefined
})

// ─── Sub-scores (normalized to 0-100 for progress bars) ───
const subScores = computed(() => {
  if (!props.readiness) return []

  const trend = props.readiness.trendScore
  const momentum = props.readiness.momentumScore
  const mtf = props.readiness.mtfScore

  return [
    {
      label: 'Trend',
      weight: '35%',
      score: trend,
      percent: trend !== null ? ((trend + 10) / 20) * 100 : 0,
    },
    {
      label: 'Momentum',
      weight: '25%',
      score: momentum,
      percent: momentum !== null ? ((momentum + 10) / 20) * 100 : 0,
    },
    {
      label: 'MTF Alignment',
      weight: '40%',
      score: mtf,
      percent: mtf !== null ? ((mtf + 10) / 20) * 100 : 0,
    },
  ]
})

function getSubScoreColor(score: number | null): string {
  if (score === null) return NULL_COLOR
  if (score >= 4) return '#10B981'
  if (score <= -4) return '#EF4444'
  return '#F59E0B'
}

function formatScore(score: number | null): string {
  if (score === null) return 'N/A'
  return score >= 0 ? `+${score.toFixed(1)}` : score.toFixed(1)
}
</script>

<template>
  <v-card class="glass-card" rounded="lg">
    <v-card-text class="pa-3 pa-sm-4">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="text-caption font-weight-bold text-uppercase text-label-muted">
          <v-icon icon="mdi-speedometer" size="16" color="primary" class="mr-1" />
          Signal Readiness
        </div>

        <!-- Final Action Badge -->
        <v-chip
          v-if="readiness"
          size="default"
          variant="elevated"
          class="font-weight-black text-white final-action-chip"
          :style="{ backgroundColor: getReadinessActionColor(readiness.finalAction) }"
        >
          <v-icon :icon="getReadinessActionIcon(readiness.finalAction)" size="18" class="mr-1" />
          {{ readiness.finalAction }}
        </v-chip>
        <v-chip v-else size="small" variant="tonal" color="grey" class="font-weight-bold">
          --
        </v-chip>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading && !readiness" class="py-4">
        <v-skeleton-loader type="text, text, text" />
      </div>

      <!-- Content -->
      <template v-else-if="readiness">

        <!-- 3 Gate Status Row -->
        <div class="d-flex ga-2 ga-sm-3 mb-4 flex-wrap">

          <!-- Gate 1: Market Condition -->
          <v-sheet class="glass-sheet rounded-lg pa-2 pa-sm-3 flex-grow-1 gate-box" style="min-width: 90px;">
            <div class="text-label-muted gate-label">Market</div>
            <v-chip
              :color="getMarketConditionColor(readiness.marketCondition)"
              size="small"
              variant="tonal"
              class="font-weight-bold mt-1"
            >
              <v-icon
                :icon="readiness.marketCondition === 'PASS' ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline'"
                size="14"
                class="mr-1"
              />
              {{ readiness.marketCondition }}
            </v-chip>
          </v-sheet>

          <!-- Gate 2: Direction Score -->
          <v-sheet class="glass-sheet rounded-lg pa-2 pa-sm-3 flex-grow-1 gate-box" style="min-width: 120px;">
            <div class="text-label-muted gate-label">Direction</div>
            <div
              class="font-mono font-weight-black text-body-1 mt-1"
              :style="{ color: hasDirectionScore ? getDirectionScoreColor(readiness.directionScore!) : NULL_COLOR }"
            >
              {{ formatScore(readiness.directionScore) }}
            </div>
          </v-sheet>

          <!-- Gate 3: Entry Timing -->
          <v-sheet class="glass-sheet rounded-lg pa-2 pa-sm-3 flex-grow-1 gate-box" style="min-width: 120px;">
            <div class="text-label-muted gate-label">Entry Timing</div>
            <div
              class="font-mono font-weight-black text-body-1 mt-1"
              :style="{ color: entryTimingColor }"
            >
              {{ hasEntryTiming ? `${readiness.entryTimingScore}%` : 'N/A' }}
            </div>
          </v-sheet>
        </div>

        <!-- Direction Score Gauge Bar -->
        <div v-if="hasDirectionScore" class="mb-4">
          <div class="text-caption font-weight-bold text-label-muted mb-1">Direction Score Gauge</div>
          <div class="gauge-track">
            <div class="gauge-fill" :style="{ width: gaugePercent + '%' }" />
            <div class="gauge-center-line" />
            <div
              class="gauge-indicator"
              :style="{
                left: gaugePercent + '%',
                backgroundColor: getDirectionScoreColor(readiness.directionScore!),
              }"
            />
          </div>
          <div class="d-flex justify-space-between mt-1">
            <span class="gauge-label text-error">-10 SELL</span>
            <span class="gauge-label text-label-muted">0</span>
            <span class="gauge-label text-success">+10 BUY</span>
          </div>
        </div>

        <!-- Entry Timing Progress Bar -->
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption font-weight-bold text-label-muted">Entry Timing Score</span>
            <span class="font-mono text-caption font-weight-bold" :style="{ color: entryTimingColor }">
              {{ hasEntryTiming ? `${readiness.entryTimingScore}/100` : 'N/A' }}
            </span>
          </div>
          <v-progress-linear
            :model-value="readiness.entryTimingScore ?? 0"
            :color="entryTimingColor"
            height="6"
            rounded
            bg-color="rgba(255,255,255,0.06)"
          />
        </div>

        <!-- Sub-scores Breakdown -->
        <div class="mb-4">
          <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-2">Score Breakdown</div>
          <div
            v-for="sub in subScores"
            :key="sub.label"
            class="mb-2"
          >
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="sub-score-label">{{ sub.label }} <span class="text-label-muted">({{ sub.weight }})</span></span>
              <span class="font-mono sub-score-value" :style="{ color: getSubScoreColor(sub.score) }">
                {{ formatScore(sub.score) }}
              </span>
            </div>
            <v-progress-linear
              :model-value="sub.percent"
              :color="getSubScoreColor(sub.score)"
              height="4"
              rounded
              bg-color="rgba(255,255,255,0.06)"
            />
          </div>
        </div>

        <!-- Trigger Patterns -->
        <div v-if="readiness.triggerPatterns.length > 0" class="mb-3">
          <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-2">Trigger Patterns</div>
          <div class="d-flex ga-1 flex-wrap">
            <v-chip
              v-for="(pattern, idx) in readiness.triggerPatterns"
              :key="idx"
              size="x-small"
              :color="pattern.direction === 'BULLISH' ? 'success' : 'error'"
              variant="tonal"
              class="font-weight-bold"
            >
              {{ pattern.name }}
              <span class="ml-1 text-label-muted">w{{ pattern.weight }}</span>
            </v-chip>
          </div>
        </div>

        <!-- Market Fail Reasons -->
        <v-alert
          v-if="readiness.marketCondition === 'FAIL' && readiness.marketReasons.length > 0"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          <div class="text-caption font-weight-bold mb-1">Market Condition Failed</div>
          <div
            v-for="(reason, idx) in readiness.marketReasons"
            :key="idx"
            class="text-caption"
          >
            - {{ reason }}
          </div>
        </v-alert>

      </template>

      <!-- No data state -->
      <div v-else class="text-center py-4">
        <v-icon icon="mdi-speedometer" size="32" color="grey-darken-1" />
        <div class="text-caption text-label-muted mt-2">No readiness data available</div>
      </div>

    </v-card-text>
  </v-card>
</template>

<style scoped>
.final-action-chip {
  letter-spacing: 0.08em;
  font-size: 13px;
}

.gate-box {
  text-align: center;
}

.gate-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Direction Score Gauge */
.gauge-track {
  position: relative;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #EF4444 0%, #F59E0B 40%, #F59E0B 60%, #10B981 100%);
  opacity: 0.3;
}

.gauge-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(to right, #EF4444 0%, #F59E0B 40%, #F59E0B 60%, #10B981 100%);
  opacity: 1;
  transition: width 0.4s ease;
}

.gauge-center-line {
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
}

.gauge-indicator {
  position: absolute;
  top: -3px;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  transition: left 0.4s ease;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
}

.gauge-label {
  font-size: 9px;
  font-weight: 600;
}

/* Sub-scores */
.sub-score-label {
  font-size: 11px;
  font-weight: 600;
}

.sub-score-value {
  font-size: 12px;
  font-weight: 800;
}
</style>
