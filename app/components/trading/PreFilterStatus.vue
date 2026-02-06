<script setup lang="ts">
import type { PreFilterResult, TrendsAnalysis } from '../../../types/trading'
import { getPreFilterStatus } from '../../../types/trading'

interface Props {
  preFilter: PreFilterResult
  analysis?: TrendsAnalysis
}

const props = defineProps<Props>()

const filterStatus = computed(() => getPreFilterStatus(props.preFilter))

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

  // Rule 3: Higher Timeframe Weight
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
  <div class="py-2">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-overline text-primary">
        <v-icon icon="mdi-filter-check" size="16" class="mr-1" />
        Pre-Filter Status
      </div>
      <v-chip :color="filterStatus.color" size="small" variant="flat">
        <v-icon :icon="filterStatus.icon" size="14" start />
        {{ filterStatus.label }}
      </v-chip>
    </div>

    <!-- Rules List -->
    <v-sheet color="grey-darken-4" rounded="lg" class="pa-1">
      <v-list density="compact" class="bg-transparent pa-0">
        <v-list-item
          v-for="(rule, idx) in rules"
          :key="idx"
          class="px-2"
          :style="idx < rules.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.06)' : ''"
        >
          <template #prepend>
            <v-icon :icon="rule.icon" :color="rule.color" size="18" class="mr-2" />
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">{{ rule.name }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption">{{ rule.description }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-sheet>

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
