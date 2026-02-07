<script setup lang="ts">
import type { BollingerBandsData } from '../../../types/trading'
import { formatNumber, getBBPositionColor } from '../../../types/trading'

interface Props {
  bb: BollingerBandsData
  currentPrice: number
}

const props = defineProps<Props>()

// Calculate pointer position as percentage (0% = lower, 100% = upper)
const pointerPercent = computed(() => {
  const range = props.bb.upper - props.bb.lower
  if (range <= 0) return 50
  const pos = ((props.currentPrice - props.bb.lower) / range) * 100
  return Math.max(0, Math.min(100, pos))
})

const zoneLabel = computed(() => {
  return `${props.bb.pricePosition} (${props.bb.percentB.toFixed(1)}%)`
})
</script>

<template>
  <v-sheet rounded="lg" class="glass-sheet pa-3">
    <!-- Gradient Bar with Pointer -->
    <div class="position-relative mb-3" style="padding-top: 16px;">
      <!-- Pointer (triangle) -->
      <div
        class="position-absolute"
        :style="{
          left: pointerPercent + '%',
          top: '0px',
          transform: 'translateX(-50%)',
        }"
      >
        <v-icon icon="mdi-menu-down" size="20" />
      </div>

      <!-- Gradient Bar -->
      <div
        class="rounded-pill overflow-hidden"
        style="height: 10px; background: linear-gradient(to right, #4CAF50, #FFC107, #FF5252);"
      />
    </div>

    <!-- Lower / Middle / Upper Labels -->
    <div class="d-flex justify-space-between text-caption font-mono mb-2">
      <span class="text-success">{{ formatNumber(bb.lower, 4) }}</span>
      <span class="text-medium-emphasis">{{ formatNumber(bb.middle, 4) }}</span>
      <span class="text-error">{{ formatNumber(bb.upper, 4) }}</span>
    </div>

    <!-- Zone Chip -->
    <div class="text-center">
      <v-chip
        :color="getBBPositionColor(bb.pricePosition)"
        size="small"
        variant="tonal"
        class="font-mono"
      >
        <v-icon icon="mdi-information-outline" start size="14" />
        {{ zoneLabel }}
      </v-chip>
      <v-chip
        v-if="bb.squeeze"
        color="warning"
        size="small"
        variant="flat"
        class="ml-2"
      >
        <v-icon icon="mdi-flash" start size="14" />
        Squeeze!
      </v-chip>
    </div>
  </v-sheet>
</template>
