<script setup lang="ts">
const { symbols, isLoading, error, fetchActiveSymbols } = useSymbols()
const { fetchAnalysis } = useAnalysis()
const { connect, disconnect, subscribeSymbol, unsubscribeSymbol, isConnected } = useSocket()

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
})

// Cleanup on unmount
onUnmounted(() => {
  for (const symbol of symbols.value) {
    unsubscribeSymbol(symbol.id)
  }
  disconnect()
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
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis">
            {{ symbols.length }} symbol{{ symbols.length > 1 ? 's' : '' }}
          </span>
          <!-- WebSocket status indicator -->
          <v-chip
            :color="isConnected ? 'success' : 'grey'"
            size="x-small"
            variant="tonal"
          >
            <v-icon
              :icon="isConnected ? 'mdi-access-point' : 'mdi-access-point-off'"
              size="12"
              start
            />
            {{ isConnected ? 'Live' : 'Offline' }}
          </v-chip>
        </div>
        <v-btn
          variant="text"
          size="x-small"
          color="primary"
          @click="fetchActiveSymbols"
          prepend-icon="mdi-refresh"
        >
          Refresh
        </v-btn>
      </div>

      <TradingSymbolCard
        v-for="symbol in symbols"
        :key="symbol.id"
        :symbol="symbol"
      />
    </div>
  </div>
</template>
