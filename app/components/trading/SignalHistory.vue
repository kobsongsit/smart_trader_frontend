<script setup lang="ts">
import type { Signal, SignalStrategy } from '../../../types/trading'
import { formatPrice } from '../../../types/trading'

interface Props {
  signals: Signal[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  select: [signal: Signal]
}>()

// Computed
function getStrategyColor(strategy: SignalStrategy): string {
  switch (strategy) {
    case 'BUY': return 'success'
    case 'SELL': return 'error'
    case 'WAIT': return 'warning'
    default: return 'grey'
  }
}

function getStrategyIcon(strategy: SignalStrategy): string {
  switch (strategy) {
    case 'BUY': return 'mdi-arrow-up-bold'
    case 'SELL': return 'mdi-arrow-down-bold'
    case 'WAIT': return 'mdi-pause'
    default: return 'mdi-help'
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleSelect(signal: Signal) {
  emit('select', signal)
}
</script>

<template>
  <div class="signal-history">
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
    <v-list v-else density="compact" class="bg-transparent">
      <v-list-item
        v-for="signal in props.signals"
        :key="signal.id"
        class="signal-history-item mb-1"
        rounded
        @click="handleSelect(signal)"
      >
        <template #prepend>
          <v-avatar
            :color="getStrategyColor(signal.strategy)"
            size="32"
          >
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
          <span>
            Entry: {{ formatPrice(signal.entryPrice) }}
          </span>
          <span class="text-caption">
            {{ formatDate(signal.createdAt) }}
          </span>
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </div>
</template>

<style scoped>
.signal-history-item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
}

.signal-history-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
