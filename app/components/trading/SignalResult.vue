<script setup lang="ts">
import type { SignalData } from '../../../types/trading'
import {
  formatPrice,
  formatThaiDate,
  getStrategyColor,
  getConfidenceColor,
} from '../../../types/trading'

interface Props {
  signal: SignalData
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  if (!props.signal.timestamp) return ''
  return formatThaiDate(props.signal.timestamp)
})

const strategyIcon = computed(() => {
  return props.signal.strategy === 'BUY' ? 'mdi-arrow-top-right' : 'mdi-arrow-bottom-right'
})
</script>

<template>
  <v-sheet rounded="xl" class="glass-card pa-4">

    <!-- Header - Strategy & Confidence -->
    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <v-btn
          :color="getStrategyColor(signal.strategy)"
          variant="elevated"
          size="large"
          rounded="lg"
          class="font-weight-black text-h6 px-6"
        >
          <v-icon :icon="strategyIcon" start size="24" />
          {{ signal.strategy }}
        </v-btn>
        <div class="text-caption text-label-muted font-weight-bold mt-2">{{ signal.strategyLabel }}</div>
      </div>

      <div class="text-center">
        <v-progress-circular
          :model-value="signal.confidence"
          :color="getConfidenceColor(signal.confidence)"
          :size="70"
          :width="6"
        >
          <div>
            <div class="font-weight-bold font-mono" style="font-size: 13px; line-height: 1.2;">{{ signal.confidence }}%</div>
            <div class="text-medium-emphasis" style="font-size: 7px; line-height: 1;">CONFIDENCE</div>
          </div>
        </v-progress-circular>
      </div>
    </div>

    <!-- Price Levels -->
    <v-row dense class="mb-3 mt-4">
      <v-col cols="4" class="d-flex">
        <v-sheet rounded="lg" variant="tonal" class="pa-3 flex-fill entry-box entry-box--default">
          <div class="text-caption text-label-muted font-weight-bold">ENTRY</div>
          <div class="text-subtitle-1 font-weight-bold font-mono">
            {{ formatPrice(signal.prices.entry) }}
          </div>
        </v-sheet>
      </v-col>
      <v-col cols="4" class="d-flex">
        <v-sheet rounded="lg" variant="tonal" class="pa-3 flex-fill entry-box entry-box--success">
          <div class="text-caption text-success font-weight-bold">TAKE PROFIT</div>
          <div class="text-subtitle-1 font-weight-bold text-success font-mono">
            {{ formatPrice(signal.prices.takeProfit) }}
          </div>
          <div class="text-caption text-success">+{{ signal.prices.profitPips }} pips</div>
        </v-sheet>
      </v-col>
      <v-col cols="4" class="d-flex">
        <v-sheet rounded="lg" variant="tonal" class="pa-3 flex-fill entry-box entry-box--error">
          <div class="text-caption text-error font-weight-bold">STOP LOSS</div>
          <div class="text-subtitle-1 font-weight-bold text-error font-mono">
            {{ formatPrice(signal.prices.stopLoss) }}
          </div>
          <div class="text-caption text-error">-{{ signal.prices.lossPips }} pips</div>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- Risk/Reward + Potential -->
    <div class="d-flex flex-wrap ga-2 mb-4">
      <v-chip size="small" variant="tonal" color="info" class="font-mono font-weight-bold">
        <v-icon icon="mdi-scale-balance" start size="14" />
        R:R {{ signal.prices.riskRewardRatio }}
      </v-chip>
      <v-chip size="small" variant="tonal" color="success" class="font-mono font-weight-bold">
        +{{ signal.prices.potentialProfit }}%
      </v-chip>
      <v-chip size="small" variant="tonal" color="error" class="font-mono font-weight-bold">
        -{{ signal.prices.potentialLoss }}%
      </v-chip>
    </div>

    <!-- Analysis Summary -->
    <v-sheet rounded="lg" class="glass-sheet pa-3 mb-3">
      <div class="text-caption font-weight-bold mb-2">
        <v-icon icon="mdi-text-box-outline" size="14" class="mr-1" />
        ANALYSIS SUMMARY
      </div>
      <p class="text-body-2 text-medium-emphasis mb-0">{{ signal.analysis.summary }}</p>

      <!-- Key Factors -->
      <div v-if="signal.analysis.keyFactors?.length > 0" class="mt-3">
        <ul class="text-body-2 pl-4 mb-0">
          <li v-for="(factor, idx) in signal.analysis.keyFactors" :key="'f-' + idx" class="text-medium-emphasis mb-1">
            {{ factor }}
          </li>
        </ul>
      </div>
    </v-sheet>

    <!-- Warnings -->
    <div v-if="signal.analysis.warnings?.length > 0">
      <v-sheet
        v-for="(warning, idx) in signal.analysis.warnings"
        :key="'w-' + idx"
        rounded="lg"
        class="pa-3 mb-2"
        style="background: rgba(251, 140, 0, 0.08); border: 1px solid rgba(251, 140, 0, 0.2);"
      >
        <div class="d-flex ga-2">
          <v-icon icon="mdi-alert-circle-outline" color="warning" size="18" class="flex-shrink-0 mt-1" />
          <span class="text-body-2" style="color: rgba(251, 192, 45, 0.9);">{{ warning }}</span>
        </div>
      </v-sheet>
    </div>

    <!-- Timestamp -->
    <div class="text-caption text-medium-emphasis text-center mt-3">
      <v-icon icon="mdi-clock-outline" size="12" class="mr-1" />
      {{ formattedDate }}
    </div>
  </v-sheet>
</template>

<style scoped>
.entry-box {
  background: rgba(255, 255, 255, 0.04) !important;
}
.entry-box--default {
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.entry-box--success {
  border: 1px solid rgba(76, 175, 80, 0.3);
}
.entry-box--error {
  border: 1px solid rgba(255, 82, 82, 0.3);
}
</style>
