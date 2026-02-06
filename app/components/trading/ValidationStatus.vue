<script setup lang="ts">
import type { ValidationResult, BollingerBandsPosition, NextCandleClose } from '../../../types/trading'
import { getValidationCheckStatus, getBBPositionColor, formatTimeRemaining, formatNumber } from '../../../types/trading'

interface Props {
  validation: ValidationResult
  bollingerBands: BollingerBandsPosition
  currentPrice: number
  nextCandleClose?: NextCandleClose
}

const props = defineProps<Props>()

// Computed check statuses
const channelCheck = computed(() => ({
  ...props.validation.checks.insideChannel,
  ...getValidationCheckStatus(props.validation.checks.insideChannel)
}))

const highLowCheck = computed(() => ({
  ...props.validation.checks.newHighLow,
  ...getValidationCheckStatus(props.validation.checks.newHighLow)
}))

const candleCloseCheck = computed(() => ({
  ...props.validation.checks.candleClose,
  ...getValidationCheckStatus(props.validation.checks.candleClose)
}))

// BB Position
const bbPositionColor = computed(() => getBBPositionColor(props.bollingerBands.pricePosition))
const bbPercentB = computed(() => parseFloat(props.bollingerBands.percentB))

// Countdown timer
const countdownText = computed(() => {
  if (!props.nextCandleClose) return null
  return formatTimeRemaining(props.nextCandleClose.secondsRemaining)
})
</script>

<template>
  <div class="validation-status">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-overline text-primary">
        <v-icon icon="mdi-shield-check" size="16" class="mr-1" />
        ProIndicator Validation
      </div>
      <v-chip
        :color="validation.isValid ? 'success' : 'error'"
        size="small"
        variant="flat"
      >
        <v-icon
          :icon="validation.isValid ? 'mdi-check-circle' : 'mdi-close-circle'"
          size="14"
          start
        />
        {{ validation.isValid ? 'Valid' : 'Invalid' }}
      </v-chip>
    </div>

    <!-- Validation Checks -->
    <div class="checks-list mb-3">
      <!-- Check 1: Channel Detection -->
      <div class="check-item d-flex align-center py-2">
        <v-icon
          :icon="channelCheck.icon"
          :color="channelCheck.color"
          size="20"
          class="mr-2"
        />
        <div class="flex-grow-1">
          <div class="text-body-2 font-weight-medium">Channel Detection</div>
          <div class="text-caption text-medium-emphasis">{{ channelCheck.message }}</div>
        </div>
      </div>

      <!-- Check 2: New High/Low -->
      <div class="check-item d-flex align-center py-2">
        <v-icon
          :icon="highLowCheck.icon"
          :color="highLowCheck.color"
          size="20"
          class="mr-2"
        />
        <div class="flex-grow-1">
          <div class="text-body-2 font-weight-medium">New High/Low Detection</div>
          <div class="text-caption text-medium-emphasis">{{ highLowCheck.message }}</div>
        </div>
      </div>

      <!-- Check 3: Candle Close -->
      <div class="check-item d-flex align-center py-2">
        <v-icon
          :icon="candleCloseCheck.icon"
          :color="candleCloseCheck.color"
          size="20"
          class="mr-2"
        />
        <div class="flex-grow-1">
          <div class="text-body-2 font-weight-medium">Candle Close Confirmation</div>
          <div class="text-caption text-medium-emphasis">{{ candleCloseCheck.message }}</div>
        </div>
        <v-chip
          v-if="nextCandleClose && !candleCloseCheck.passed"
          color="info"
          size="x-small"
          variant="tonal"
        >
          <v-icon icon="mdi-timer-outline" size="12" start />
          {{ countdownText }}
        </v-chip>
      </div>
    </div>

    <!-- Bollinger Bands Position -->
    <div class="bb-position mb-2">
      <div class="text-overline text-secondary mb-1">
        <v-icon icon="mdi-chart-bell-curve" size="14" class="mr-1" />
        Price Position (Bollinger Bands)
      </div>

      <div class="bb-visual">
        <div class="bb-bar">
          <div class="bb-zone bb-upper" />
          <div class="bb-zone bb-middle" />
          <div class="bb-zone bb-lower" />
          <div
            class="bb-price-marker"
            :style="{ left: `${Math.max(0, Math.min(100, bbPercentB))}%` }"
          >
            <v-icon icon="mdi-triangle" size="12" color="white" />
          </div>
        </div>

        <div class="d-flex justify-space-between text-caption mt-1">
          <span>Lower: {{ formatNumber(bollingerBands.lower, 4) }}</span>
          <span>Middle: {{ formatNumber(bollingerBands.middle, 4) }}</span>
          <span>Upper: {{ formatNumber(bollingerBands.upper, 4) }}</span>
        </div>
      </div>

      <v-chip
        :color="bbPositionColor"
        size="small"
        variant="tonal"
        class="mt-2"
      >
        <v-icon icon="mdi-map-marker" size="14" start />
        {{ bollingerBands.pricePosition }} ({{ bollingerBands.percentB }}%)
      </v-chip>
    </div>

    <!-- Warnings -->
    <div v-if="validation.warnings && validation.warnings.length > 0" class="mt-2">
      <v-alert
        v-for="(warning, idx) in validation.warnings"
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
.validation-status {
  padding: 8px 0;
}

.checks-list {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 4px 12px;
}

.check-item:not(:last-child) {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}

.bb-position {
  background: rgba(var(--v-theme-surface-variant), 0.2);
  border-radius: 8px;
  padding: 8px 12px;
}

.bb-bar {
  position: relative;
  height: 20px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
}

.bb-zone {
  flex: 1;
}

.bb-lower {
  background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%);
}

.bb-middle {
  background: linear-gradient(90deg, #8BC34A 0%, #FFC107 50%, #FF9800 100%);
}

.bb-upper {
  background: linear-gradient(90deg, #FF9800 0%, #f44336 100%);
}

.bb-price-marker {
  position: absolute;
  top: -2px;
  transform: translateX(-50%);
  z-index: 1;
}

.bb-price-marker .v-icon {
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
}
</style>
