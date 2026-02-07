<script setup lang="ts">
import type { PreFilterResult, TrendsAnalysis } from '../../../types/trading'

interface Props {
  preFilter: PreFilterResult
  analysis?: TrendsAnalysis
}

const props = defineProps<Props>()

const filterStatus = computed(() => {
  if (props.preFilter.shouldAnalyze) {
    return { label: 'READY', color: 'success', icon: 'mdi-check-circle-outline' }
  }
  return { label: 'FILTERED', color: 'error', icon: 'mdi-filter-remove' }
})

const rules = computed(() => {
  if (!props.analysis) return []

  const items = []

  // Rule 1: Sideways Detection
  const sidewaysCount = props.analysis.sidewaysCount
  const isSidewaysPassed = sidewaysCount < 3
  items.push({
    name: 'SIDEWAYS DETECTION',
    description: `${sidewaysCount}/5 timeframes have ADX < 20`,
    passed: isSidewaysPassed,
    icon: isSidewaysPassed ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline',
    color: isSidewaysPassed ? 'success' : 'error'
  })

  // Rule 2: Majority Consensus
  const hasMajority = props.analysis.upCount >= 3 || props.analysis.downCount >= 3
  const majorityDirection = props.analysis.upCount >= 3 ? 'UP' : props.analysis.downCount >= 3 ? 'DOWN' : 'NONE'
  const majorityCount = Math.max(props.analysis.upCount, props.analysis.downCount)
  items.push({
    name: 'MAJORITY CONSENSUS',
    description: hasMajority
      ? `${majorityDirection}: ${majorityCount}/5 timeframes agree`
      : `No majority (UP: ${props.analysis.upCount}, DOWN: ${props.analysis.downCount})`,
    passed: hasMajority,
    icon: hasMajority ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline',
    color: hasMajority ? 'success' : 'error'
  })

  // Rule 3: Higher Timeframe Weight
  const higherTFWarning = props.preFilter.warnings?.find(w => w.includes('Higher timeframes'))
  const higherTFPassed = props.preFilter.passedRules?.some(r => r.includes('Higher timeframes'))
  items.push({
    name: 'HIGHER TF WEIGHT',
    description: higherTFWarning || (higherTFPassed ? '4H & 1D align with majority' : '4H & 1D acceptable'),
    passed: !higherTFWarning,
    icon: higherTFWarning ? 'mdi-alert-outline' : 'mdi-check-circle-outline',
    color: higherTFWarning ? 'warning' : 'success'
  })

  return items
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-caption font-weight-bold text-uppercase text-label-muted">
        <v-icon icon="mdi-shield-check" size="16" color="info" class="mr-1" />
        Pre-Filter Checks
      </div>
      <v-chip :color="filterStatus.color" size="x-small" variant="tonal" class="font-weight-bold">
        {{ filterStatus.label }}
      </v-chip>
    </div>

    <!-- Rules List -->
    <div
      v-for="(rule, idx) in rules"
      :key="idx"
      class="d-flex align-start ga-2 mb-3"
    >
      <v-icon :icon="rule.icon" :color="rule.color" size="16" class="flex-shrink-0" />
      <div style="min-width: 0;">
        <div class="font-weight-bold rule-title">{{ rule.name }}</div>
        <div class="text-label-muted rule-desc">{{ rule.description }}</div>
      </div>
    </div>

    <!-- Reason (if filtered out) -->
    <v-alert
      v-if="!preFilter.shouldAnalyze && preFilter.reason"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-2"
    >
      <div class="text-caption">{{ preFilter.reason }}</div>
    </v-alert>
  </div>
</template>

<style scoped>
.rule-title {
  font-size: 12px;
  line-height: 1.4;
}
.rule-desc {
  font-size: 10px;
  line-height: 1.4;
}
</style>
