<script setup lang="ts">
import type { SignalData } from '../../../types/trading'
import {
  formatPrice,
  formatThaiDate,
  getStrategyColor,
  getStrategyIcon,
  getConfidenceColor,
  getPerformanceStatusColor
} from '../../../types/trading'

interface Props {
  signal: SignalData
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  if (!props.signal.timestamp) return ''
  return formatThaiDate(props.signal.timestamp)
})
</script>

<template>
  <v-card variant="outlined" rounded="lg">
    <v-card-text class="pb-2">

      <!-- Header - Strategy & Confidence -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div>
          <v-chip :color="getStrategyColor(signal.strategy)" size="large" variant="elevated">
            <v-icon :icon="getStrategyIcon(signal.strategy)" start size="20" />
            <span class="text-h6 font-weight-bold">{{ signal.strategy }}</span>
          </v-chip>
          <div class="text-caption text-medium-emphasis mt-1">{{ signal.strategyLabel }}</div>
        </div>

        <div class="text-right">
          <div class="text-caption text-medium-emphasis">Confidence</div>
          <v-progress-circular
            :model-value="signal.confidence"
            :color="getConfidenceColor(signal.confidence)"
            :size="50"
            :width="5"
          >
            <span class="text-caption font-weight-bold">{{ signal.confidence }}%</span>
          </v-progress-circular>
          <div class="text-caption text-medium-emphasis">{{ signal.confidenceLabel }}</div>
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
              {{ formatPrice(signal.prices.entry) }}
            </div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="text-center">
            <div class="text-caption text-success">Take Profit</div>
            <div class="text-subtitle-2 font-weight-bold text-success">
              {{ formatPrice(signal.prices.takeProfit) }}
            </div>
            <div class="text-caption text-success">+{{ signal.prices.profitPips }} pips</div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="text-center">
            <div class="text-caption text-error">Stop Loss</div>
            <div class="text-subtitle-2 font-weight-bold text-error">
              {{ formatPrice(signal.prices.stopLoss) }}
            </div>
            <div class="text-caption text-error">-{{ signal.prices.lossPips }} pips</div>
          </div>
        </v-col>
      </v-row>

      <!-- Risk/Reward + Potential -->
      <div class="d-flex justify-center ga-2 mt-3">
        <v-chip size="small" variant="tonal" color="info">
          <v-icon icon="mdi-scale-balance" start size="14" />
          R:R {{ signal.prices.riskRewardRatio }}
        </v-chip>
        <v-chip size="small" variant="tonal" color="success">
          +{{ signal.prices.potentialProfit }}%
        </v-chip>
        <v-chip size="small" variant="tonal" color="error">
          -{{ signal.prices.potentialLoss }}%
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
          <div v-if="signal.levels.support?.length > 0">
            <v-chip
              v-for="(level, idx) in signal.levels.support"
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
          <div v-if="signal.levels.resistance?.length > 0">
            <v-chip
              v-for="(level, idx) in signal.levels.resistance"
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
      <p class="text-body-2 mb-2">{{ signal.analysis.summary }}</p>

      <!-- Key Factors -->
      <div v-if="signal.analysis.keyFactors?.length > 0" class="mt-3">
        <div class="text-caption text-medium-emphasis mb-1">Key Factors:</div>
        <ul class="text-body-2 pl-4">
          <li v-for="(factor, idx) in signal.analysis.keyFactors" :key="'f-' + idx">
            {{ factor }}
          </li>
        </ul>
      </div>

      <!-- Warnings -->
      <template v-if="signal.analysis.warnings?.length > 0">
        <v-divider class="my-3" />
        <v-alert
          v-for="(warning, idx) in signal.analysis.warnings"
          :key="'w-' + idx"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-1"
        >
          {{ warning }}
        </v-alert>
      </template>

      <!-- Performance (if active signal) -->
      <template v-if="signal.performance">
        <v-divider class="my-3" />
        <div class="text-overline text-primary mb-2">
          <v-icon icon="mdi-chart-timeline-variant" size="16" class="mr-1" />
          Performance
        </div>
        <div class="d-flex align-center justify-space-between">
          <v-chip :color="getPerformanceStatusColor(signal.performance.status)" size="small" variant="flat">
            {{ signal.performance.statusLabel }}
          </v-chip>
          <v-chip
            :color="signal.performance.profitLossPercent >= 0 ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            {{ signal.performance.profitLossPercent >= 0 ? '+' : '' }}{{ signal.performance.profitLossPercent.toFixed(3) }}%
          </v-chip>
        </div>
        <v-row dense class="mt-2">
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis">Max Profit</div>
            <div class="text-body-2 text-success">+{{ signal.performance.maxProfit }}%</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis">Max Drawdown</div>
            <div class="text-body-2 text-error">{{ signal.performance.maxDrawdown }}%</div>
          </v-col>
        </v-row>
      </template>

      <!-- Timestamp -->
      <div class="text-caption text-medium-emphasis text-right mt-3">
        <v-icon icon="mdi-clock-outline" size="12" />
        {{ formattedDate }}
      </div>
    </v-card-text>
  </v-card>
</template>
