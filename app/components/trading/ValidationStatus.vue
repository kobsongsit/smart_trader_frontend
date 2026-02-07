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
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-caption font-weight-bold text-uppercase tracking-wide">
        <v-icon icon="mdi-shield-check" size="16" color="primary" class="mr-1" />
        Validation Rules
      </div>
      <v-chip :color="getValidationStatusColor(validation.overallStatus)" size="small" variant="flat">
        <v-icon :icon="getValidationStatusIcon(validation.overallStatus)" size="14" start />
        {{ validation.overallStatusLabel }}
      </v-chip>
    </div>

    <!-- Validation Checks -->
    <v-sheet rounded="lg" class="glass-sheet pa-2">
      <div
        v-for="(check, idx) in checks"
        :key="idx"
        class="d-flex align-start ga-2 px-2 py-2"
        :style="idx < checks.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.06)' : ''"
      >
        <v-icon :icon="check.icon" :color="check.color" size="18" class="mt-1 flex-shrink-0" />
        <div class="flex-grow-1" style="min-width: 0;">
          <div class="text-body-2 font-weight-bold">{{ check.label }}</div>
          <div class="text-caption text-medium-emphasis">{{ check.message }}</div>
        </div>
        <div v-if="check.detail || (check.showTimer && validation.nextCandleClose && !check.passed)" class="d-flex align-center ga-1 flex-shrink-0">
          <v-tooltip v-if="check.detail" location="top">
            <template #activator="{ props: tp }">
              <v-icon v-bind="tp" icon="mdi-information-outline" size="14" color="grey" />
            </template>
            {{ check.detail }}
          </v-tooltip>
          <v-chip
            v-if="check.showTimer && validation.nextCandleClose && !check.passed"
            color="info"
            size="x-small"
            variant="tonal"
          >
            <v-icon icon="mdi-timer-outline" size="12" start />
            {{ countdownText }}
          </v-chip>
        </div>
      </div>
    </v-sheet>
  </div>
</template>
