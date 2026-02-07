<script setup lang="ts">
import { formatTimeAgo } from '../../../types/trading'

const { symbols, isLoading, error, fetchActiveSymbols } = useSymbols()
const { fetchAnalysis } = useAnalysis()
const { connect, disconnect, subscribeSymbol, unsubscribeSymbol, isConnected } = useSocket()

const lastUpdateTime = ref<string | null>(null)

// Fetch symbols on mount, connect WebSocket, then fetch analysis for each
onMounted(async () => {
  // Connect WebSocket
  connect()

  await fetchActiveSymbols()

  // Subscribe & fetch analysis for each symbol sequentially
  for (const symbol of symbols.value) {
    subscribeSymbol(symbol.id)
    await fetchAnalysis(symbol.id)
  }

  lastUpdateTime.value = new Date().toISOString()
})

// Cleanup on unmount
onUnmounted(() => {
  for (const symbol of symbols.value) {
    unsubscribeSymbol(symbol.id)
  }
  disconnect()
})

const lastUpdateLabel = computed(() => {
  if (!lastUpdateTime.value) return ''
  return formatTimeAgo(lastUpdateTime.value)
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <div class="text-caption mt-2">กำลังโหลดข้อมูล...</div>
    </div>

    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
      <template #append>
        <v-btn variant="text" size="small" @click="fetchActiveSymbols">
          ลองใหม่
        </v-btn>
      </template>
    </v-alert>

    <!-- Empty State -->
    <div
      v-else-if="symbols.length === 0"
      class="text-center py-8 text-medium-emphasis"
    >
      <v-icon icon="mdi-chart-box-outline" size="48" class="mb-2" />
      <div>ไม่พบ Symbol</div>
    </div>

    <!-- Symbol Cards -->
    <div v-else>
      <!-- Header: N SYMBOLS LIVE ... Last Update -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center ga-2">
          <v-icon
            :icon="isConnected ? 'mdi-circle' : 'mdi-circle-outline'"
            :color="isConnected ? 'success' : 'grey'"
            size="10"
          />
          <span class="text-caption font-weight-bold text-uppercase">
            {{ symbols.length }} Symbols {{ isConnected ? 'Live' : 'Offline' }}
          </span>
        </div>
        <span class="text-caption text-medium-emphasis">
          Last Update: {{ lastUpdateLabel || 'Just now' }}
        </span>
      </div>

      <TradingSymbolCard
        v-for="symbol in symbols"
        :key="symbol.id"
        :symbol="symbol"
      />
    </div>
  </div>
</template>
