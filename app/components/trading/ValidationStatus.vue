<script setup lang="ts">
import type { ValidationData } from '../../../types/trading'
import {
  getValidationStatusColor,
  getValidationStatusIcon,
  formatTimeRemaining,
} from '../../../types/trading'

interface Props {
  validation: ValidationData
}

const props = defineProps<Props>()

const checks = computed(() => [
  {
    label: 'CHANNEL DETECTION',
    ...props.validation.checks.channelDetection,
    icon: getValidationStatusIcon(props.validation.checks.channelDetection.status),
    color: getValidationStatusColor(props.validation.checks.channelDetection.status),
    showTimer: false
  },
  {
    label: 'NEW HIGH/LOW DETECTION',
    ...props.validation.checks.newHighLow,
    icon: getValidationStatusIcon(props.validation.checks.newHighLow.status),
    color: getValidationStatusColor(props.validation.checks.newHighLow.status),
    showTimer: false
  },
  {
    label: 'CANDLE CLOSE CONFIRMATION',
    ...props.validation.checks.candleClose,
    icon: getValidationStatusIcon(props.validation.checks.candleClose.status),
    color: getValidationStatusColor(props.validation.checks.candleClose.status),
    showTimer: true
  },
])

const countdownText = computed(() => {
  if (!props.validation.nextCandleClose) return null
  return formatTimeRemaining(props.validation.nextCandleClose.secondsRemaining)
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-caption font-weight-bold text-uppercase text-label-muted">
        <v-icon icon="mdi-flash" size="16" color="warning" class="mr-1" />
        Validation Rules
      </div>
      <v-chip :color="getValidationStatusColor(validation.overallStatus)" size="x-small" variant="tonal" class="font-weight-bold">
        {{ validation.overallStatusLabel }}
      </v-chip>
    </div>

    <!-- Validation Checks -->
    <div
      v-for="(check, idx) in checks"
      :key="idx"
      class="d-flex align-start ga-2 mb-3"
    >
      <v-icon :icon="check.icon" :color="check.color" size="16" class="flex-shrink-0" />
      <div class="flex-grow-1" style="min-width: 0;">
        <div class="font-weight-bold rule-title">{{ check.label }}</div>
        <div class="text-label-muted rule-desc">{{ check.message }}</div>
      </div>
      <v-chip
        v-if="check.showTimer && validation.nextCandleClose && !check.passed"
        color="info"
        size="x-small"
        variant="tonal"
        class="flex-shrink-0 font-weight-bold"
      >
        <v-icon icon="mdi-timer-outline" size="12" start />
        {{ countdownText }}
      </v-chip>
    </div>
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
