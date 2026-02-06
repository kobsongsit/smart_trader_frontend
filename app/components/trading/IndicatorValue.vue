<script setup lang="ts">
import { formatNumber } from '../../../types/trading'

interface Props {
  label: string
  value: number | null
  decimals?: number
  prefix?: string
  suffix?: string
  color?: string
  showBar?: boolean
  barMax?: number
}

const props = withDefaults(defineProps<Props>(), {
  decimals: 2,
  prefix: '',
  suffix: '',
  color: 'primary',
  showBar: false,
  barMax: 100
})

const displayValue = computed(() => {
  if (props.value === null) return 'N/A'
  return props.prefix + formatNumber(props.value, props.decimals) + props.suffix
})

const barValue = computed(() => {
  if (props.value === null) return 0
  return Math.min((props.value / props.barMax) * 100, 100)
})
</script>

<template>
  <v-sheet class="py-1" color="transparent">
    <div class="d-flex justify-space-between align-center">
      <span class="text-caption text-medium-emphasis">{{ props.label }}</span>
      <span class="text-body-2 font-weight-medium">{{ displayValue }}</span>
    </div>
    <v-progress-linear
      v-if="props.showBar && props.value !== null"
      :model-value="barValue"
      :color="props.color"
      height="4"
      rounded
      class="mt-1"
    />
  </v-sheet>
</template>
