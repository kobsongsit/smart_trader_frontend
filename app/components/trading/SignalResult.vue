<script setup lang="ts">
import type { Signal, SignalStrategy } from '../../../types/trading'
import { formatPrice } from '../../../types/trading'

interface Props {
  signal: Signal
}

const props = defineProps<Props>()

// Computed
const strategyColor = computed(() => {
  switch (props.signal.strategy) {
    case 'BUY': return 'success'
    case 'SELL': return 'error'
    case 'WAIT': return 'warning'
    default: return 'grey'
  }
})

const strategyIcon = computed(() => {
  switch (props.signal.strategy) {
    case 'BUY': return 'mdi-arrow-up-bold-circle'
    case 'SELL': return 'mdi-arrow-down-bold-circle'
    case 'WAIT': return 'mdi-pause-circle'
    default: return 'mdi-help-circle'
  }
})

const confidenceColor = computed(() => {
  if (props.signal.confidence >= 80) return 'success'
  if (props.signal.confidence >= 60) return 'info'
  if (props.signal.confidence >= 40) return 'warning'
  return 'error'
})

const formattedDate = computed(() => {
  if (!props.signal.createdAt) return ''
  const date = new Date(props.signal.createdAt)
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>

<template>
  <v-card class="signal-result" variant="outlined">
    <!-- Header - Strategy & Confidence -->
    <v-card-text class="pb-2">
      <div class="d-flex align-center justify-space-between mb-3">
        <v-chip
          :color="strategyColor"
          size="large"
          variant="elevated"
        >
          <v-icon :icon="strategyIcon" start size="20" />
          <span class="text-h6 font-weight-bold">{{ props.signal.strategy }}</span>
        </v-chip>

        <div class="text-right">
          <div class="text-caption text-medium-emphasis">Confidence</div>
          <v-progress-circular
            :model-value="props.signal.confidence"
            :color="confidenceColor"
            :size="50"
            :width="5"
          >
            <span class="text-caption font-weight-bold">{{ props.signal.confidence }}%</span>
          </v-progress-circular>
        </div>
      </div>

      <!-- Price Levels -->
      <v-divider class="mb-3" />
      <div class="text-overline text-primary mb-2">
        <v-icon icon="mdi-target" size="16" class="mr-1" />
        Price Levels
      </div>
      <v-row dense>
        <v-col cols="4">
          <div class="text-center">
            <div class="text-caption text-medium-emphasis">Entry</div>
            <div class="text-subtitle-2 font-weight-bold">
              {{ formatPrice(props.signal.entryPrice) }}
            </div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="text-center">
            <div class="text-caption text-success">Take Profit</div>
            <div class="text-subtitle-2 font-weight-bold text-success">
              {{ formatPrice(props.signal.takeProfit) }}
            </div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="text-center">
            <div class="text-caption text-error">Stop Loss</div>
            <div class="text-subtitle-2 font-weight-bold text-error">
              {{ formatPrice(props.signal.stopLoss) }}
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Risk/Reward -->
      <div class="mt-3 text-center">
        <v-chip size="small" variant="tonal" color="info">
          <v-icon icon="mdi-scale-balance" start size="14" />
          Risk/Reward: {{ props.signal.riskRewardRatio }}
        </v-chip>
      </div>

      <!-- Support & Resistance -->
      <v-divider class="my-3" />
      <v-row dense>
        <v-col cols="6">
          <div class="text-caption text-success mb-1">
            <v-icon icon="mdi-arrow-up" size="14" />
            Support Levels
          </div>
          <div v-if="props.signal.supportLevels?.length > 0">
            <v-chip
              v-for="(level, idx) in props.signal.supportLevels"
              :key="'s-' + idx"
              size="x-small"
              variant="tonal"
              color="success"
              class="mr-1 mb-1"
            >
              {{ formatPrice(level) }}
            </v-chip>
          </div>
          <div v-else class="text-caption text-medium-emphasis">N/A</div>
        </v-col>
        <v-col cols="6">
          <div class="text-caption text-error mb-1">
            <v-icon icon="mdi-arrow-down" size="14" />
            Resistance Levels
          </div>
          <div v-if="props.signal.resistanceLevels?.length > 0">
            <v-chip
              v-for="(level, idx) in props.signal.resistanceLevels"
              :key="'r-' + idx"
              size="x-small"
              variant="tonal"
              color="error"
              class="mr-1 mb-1"
            >
              {{ formatPrice(level) }}
            </v-chip>
          </div>
          <div v-else class="text-caption text-medium-emphasis">N/A</div>
        </v-col>
      </v-row>

      <!-- Analysis Summary -->
      <v-divider class="my-3" />
      <div class="text-overline text-primary mb-2">
        <v-icon icon="mdi-text-box-outline" size="16" class="mr-1" />
        Analysis Summary
      </div>
      <p class="text-body-2 mb-2">
        {{ props.signal.analysisSummary }}
      </p>

      <!-- Key Factors -->
      <div v-if="props.signal.keyFactors?.length > 0" class="mt-3">
        <div class="text-caption text-medium-emphasis mb-1">Key Factors:</div>
        <ul class="text-body-2 pl-4">
          <li v-for="(factor, idx) in props.signal.keyFactors" :key="'f-' + idx">
            {{ factor }}
          </li>
        </ul>
      </div>

      <!-- Warnings -->
      <template v-if="props.signal.warnings?.length > 0">
        <v-divider class="my-3" />
        <v-alert
          v-for="(warning, idx) in props.signal.warnings"
          :key="'w-' + idx"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-1"
        >
          {{ warning }}
        </v-alert>
      </template>

      <!-- Timestamp -->
      <div class="text-caption text-medium-emphasis text-right mt-3">
        <v-icon icon="mdi-clock-outline" size="12" />
        {{ formattedDate }}
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.signal-result {
  border-radius: 12px;
}
</style>
