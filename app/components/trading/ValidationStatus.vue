<script setup lang="ts">
import type { ValidationData } from '../../../types/trading'
import {
  getValidationStatusColor,
  getValidationStatusIcon,
  getBBPositionColor,
  formatTimeRemaining,
  formatNumber
} from '../../../types/trading'

interface Props {
  validation: ValidationData
}

const props = defineProps<Props>()

const checks = computed(() => [
  {
    label: 'Channel Detection',
    ...props.validation.checks.channelDetection,
    icon: getValidationStatusIcon(props.validation.checks.channelDetection.status),
    color: getValidationStatusColor(props.validation.checks.channelDetection.status),
    showTimer: false
  },
  {
    label: 'New High/Low Detection',
    ...props.validation.checks.newHighLow,
    icon: getValidationStatusIcon(props.validation.checks.newHighLow.status),
    color: getValidationStatusColor(props.validation.checks.newHighLow.status),
    showTimer: false
  },
  {
    label: 'Candle Close Confirmation',
    ...props.validation.checks.candleClose,
    icon: getValidationStatusIcon(props.validation.checks.candleClose.status),
    color: getValidationStatusColor(props.validation.checks.candleClose.status),
    showTimer: true
  },
])

const bbPositionColor = computed(() => getBBPositionColor(props.validation.bollingerPosition.pricePosition))
const bbPercentB = computed(() => props.validation.bollingerPosition.percentB)

const countdownText = computed(() => {
  if (!props.validation.nextCandleClose) return null
  return formatTimeRemaining(props.validation.nextCandleClose.secondsRemaining)
})
</script>

<template>
  <div class="py-2">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-overline text-primary">
        <v-icon icon="mdi-shield-check" size="16" class="mr-1" />
        ProIndicator Validation
      </div>
      <v-chip :color="getValidationStatusColor(validation.overallStatus)" size="small" variant="flat">
        <v-icon :icon="getValidationStatusIcon(validation.overallStatus)" size="14" start />
        {{ validation.overallStatusLabel }}
      </v-chip>
    </div>

    <!-- Validation Checks -->
    <v-sheet color="grey-darken-4" rounded="lg" class="pa-1 mb-3">
      <v-list density="compact" class="bg-transparent pa-0">
        <v-list-item
          v-for="(check, idx) in checks"
          :key="idx"
          class="px-2"
          :style="idx < checks.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.06)' : ''"
        >
          <template #prepend>
            <v-icon :icon="check.icon" :color="check.color" size="20" class="mr-2" />
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">{{ check.label }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption">{{ check.message }}</v-list-item-subtitle>
          <template #append>
            <div class="d-flex align-center ga-1">
              <!-- Detail tooltip -->
              <v-tooltip v-if="check.detail" location="top">
                <template #activator="{ props: tp }">
                  <v-icon v-bind="tp" icon="mdi-information-outline" size="14" color="grey" />
                </template>
                {{ check.detail }}
              </v-tooltip>
              <!-- Timer -->
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
          </template>
        </v-list-item>
      </v-list>
    </v-sheet>

    <!-- Bollinger Bands Position -->
    <v-sheet color="grey-darken-4" rounded="lg" class="pa-3 mb-2">
      <div class="text-overline text-secondary mb-2">
        <v-icon icon="mdi-chart-bell-curve" size="14" class="mr-1" />
        Price Position (Bollinger Bands)
      </div>

      <!-- BB Visual Bar -->
      <div class="bb-bar rounded mb-2">
        <div class="bb-zone" style="background: linear-gradient(90deg, #4CAF50, #8BC34A);" />
        <div class="bb-zone" style="background: linear-gradient(90deg, #8BC34A, #FFC107, #FF9800);" />
        <div class="bb-zone" style="background: linear-gradient(90deg, #FF9800, #f44336);" />
        <v-icon
          icon="mdi-triangle"
          size="12"
          color="white"
          class="bb-marker"
          :style="{ left: `${Math.max(0, Math.min(100, bbPercentB))}%` }"
        />
      </div>

      <v-row dense class="mb-2">
        <v-col cols="4" class="text-caption text-left">{{ formatNumber(validation.bollingerPosition.lower, 4) }}</v-col>
        <v-col cols="4" class="text-caption text-center">{{ formatNumber(validation.bollingerPosition.middle, 4) }}</v-col>
        <v-col cols="4" class="text-caption text-right">{{ formatNumber(validation.bollingerPosition.upper, 4) }}</v-col>
      </v-row>

      <v-chip :color="bbPositionColor" size="small" variant="tonal">
        <v-icon icon="mdi-map-marker" size="14" start />
        {{ validation.bollingerPosition.pricePosition }} ({{ validation.bollingerPosition.percentB }}%)
      </v-chip>
    </v-sheet>
  </div>
</template>

<style scoped>
.bb-bar {
  position: relative;
  height: 20px;
  overflow: hidden;
  display: flex;
}
.bb-zone {
  flex: 1;
}
.bb-marker {
  position: absolute;
  top: -2px;
  transform: translateX(-50%);
  z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
}
</style>
