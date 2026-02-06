<script setup lang="ts">
import type { SignalData } from '../../../types/trading'
import { formatPrice, formatThaiDate, getStrategyColor, getStrategyIcon } from '../../../types/trading'

interface Props {
  signals: SignalData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  select: [signal: SignalData]
}>()

function handleSelect(signal: SignalData) {
  emit('select', signal)
}
</script>

<template>
  <div>
    <div class="text-overline text-primary mb-2">
      <v-icon icon="mdi-history" size="16" class="mr-1" />
      Signal History
    </div>

    <!-- Loading -->
    <div v-if="props.loading">
      <v-skeleton-loader type="list-item@3" />
    </div>

    <!-- Empty State -->
    <v-alert
      v-else-if="props.signals.length === 0"
      type="info"
      variant="tonal"
      density="compact"
    >
      No signal history available
    </v-alert>

    <!-- Signal List -->
    <v-list v-else density="compact" class="bg-transparent pa-0">
      <v-list-item
        v-for="signal in props.signals"
        :key="signal.id"
        rounded="lg"
        border
        class="mb-1"
        @click="handleSelect(signal)"
      >
        <template #prepend>
          <v-avatar :color="getStrategyColor(signal.strategy)" size="32">
            <v-icon :icon="getStrategyIcon(signal.strategy)" size="18" color="white" />
          </v-avatar>
        </template>

        <v-list-item-title class="d-flex align-center justify-space-between">
          <span class="font-weight-bold">{{ signal.strategy }}</span>
          <v-chip size="x-small" :color="getStrategyColor(signal.strategy)" variant="tonal">
            {{ signal.confidence }}%
          </v-chip>
        </v-list-item-title>

        <v-list-item-subtitle class="d-flex justify-space-between">
          <span>Entry: {{ formatPrice(signal.prices.entry) }}</span>
          <span class="text-caption">{{ formatThaiDate(signal.timestamp) }}</span>
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </div>
</template>
