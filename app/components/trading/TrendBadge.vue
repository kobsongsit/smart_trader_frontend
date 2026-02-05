<script setup lang="ts">
import type { TrendDirection } from '../../../types/trading'
import { getTrendColor, getTrendIcon } from '../../../types/trading'

interface Props {
  trend: TrendDirection
  size?: 'x-small' | 'small' | 'default' | 'large'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
  showLabel: true
})

const color = computed(() => getTrendColor(props.trend))
const icon = computed(() => getTrendIcon(props.trend))
</script>

<template>
  <v-chip
    :color="color"
    :size="props.size"
    variant="flat"
    class="font-weight-bold"
  >
    <v-icon
      :icon="icon"
      :size="props.size === 'x-small' ? 12 : 16"
      :start="props.showLabel"
    />
    <span v-if="props.showLabel">{{ props.trend }}</span>
  </v-chip>
</template>
