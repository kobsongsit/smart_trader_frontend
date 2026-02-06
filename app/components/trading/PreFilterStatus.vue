<script setup lang="ts">
import type { PreFilterResult, TrendAnalysis } from '../../../types/trading'
import { getPreFilterStatus } from '../../../types/trading'

interface Props {
  preFilter: PreFilterResult
  analysis?: TrendAnalysis
}

const props = defineProps<Props>()

const filterStatus = computed(() => getPreFilterStatus(props.preFilter))

// Pre-filter rules based on analysis
const rules = computed(() => {
  if (!props.analysis) return []

  const items = []

  // Rule 1: Sideways Detection
  const sidewaysCount = props.analysis.sidewaysCount
  const isSidewaysPassed = sidewaysCount < 3
  items.push({
    name: 'Sideways Detection',
    description: `${sidewaysCount}/5 timeframes have ADX < 20`,
    passed: isSidewaysPassed,
    icon: isSidewaysPassed ? 'mdi-check-circle' : 'mdi-close-circle',
    color: isSidewaysPassed ? 'success' : 'error'
  })

  // Rule 2: Majority Consensus
  const hasMajority = props.analysis.upCount >= 3 || props.analysis.downCount >= 3
  const majorityDirection = props.analysis.upCount >= 3 ? 'UP' : props.analysis.downCount >= 3 ? 'DOWN' : 'NONE'
  const majorityCount = Math.max(props.analysis.upCount, props.analysis.downCount)
  items.push({
    name: 'Majority Consensus',
    description: hasMajority
      ? `${majorityDirection}: ${majorityCount}/5 timeframes agree`
      : `No majority (UP: ${props.analysis.upCount}, DOWN: ${props.analysis.downCount})`,
    passed: hasMajority,
    icon: hasMajority ? 'mdi-check-circle' : 'mdi-close-circle',
    color: hasMajority ? 'success' : 'error'
  })

  // Rule 3: Higher Timeframe Weight (from passedRules/warnings)
  const higherTFWarning = props.preFilter.warnings?.find(w => w.includes('Higher timeframes'))
  const higherTFPassed = props.preFilter.passedRules?.some(r => r.includes('Higher timeframes'))
  items.push({
    name: 'Higher TF Weight',
    description: higherTFWarning || (higherTFPassed ? '4H & 1D align with majority' : '4H & 1D acceptable'),
    passed: !higherTFWarning,
    icon: higherTFWarning ? 'mdi-alert' : 'mdi-check-circle',
    color: higherTFWarning ? 'warning' : 'success'
  })

  return items
})
</script>

<template>
  <div class="pre-filter-status">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-overline text-primary">
        <v-icon icon="mdi-filter-check" size="16" class="mr-1" />
        Pre-Filter Status
      </div>
      <v-chip
        :color="filterStatus.color"
        size="small"
        variant="flat"
      >
        <v-icon :icon="filterStatus.icon" size="14" start />
        {{ filterStatus.label }}
      </v-chip>
    </div>

    <!-- Rules List -->
    <div class="rules-list">
      <div
        v-for="(rule, idx) in rules"
        :key="idx"
        class="rule-item d-flex align-center py-1"
      >
        <v-icon
          :icon="rule.icon"
          :color="rule.color"
          size="18"
          class="mr-2"
        />
        <div class="flex-grow-1">
          <div class="text-body-2 font-weight-medium">{{ rule.name }}</div>
          <div class="text-caption text-medium-emphasis">{{ rule.description }}</div>
        </div>
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

    <!-- Warnings -->
    <div v-if="preFilter.warnings && preFilter.warnings.length > 0" class="mt-2">
      <v-alert
        v-for="(warning, idx) in preFilter.warnings"
        :key="idx"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-1"
      >
        <div class="text-caption">{{ warning }}</div>
      </v-alert>
    </div>
  </div>
</template>

<style scoped>
.pre-filter-status {
  padding: 8px 0;
}

.rules-list {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 8px 12px;
}

.rule-item:not(:last-child) {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}
</style>
