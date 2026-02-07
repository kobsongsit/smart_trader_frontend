<script setup lang="ts">
const {
  summaryList,
  summaryLoading,
  summaryError,
  summaryLastRefresh,
  fetchSummary,
} = useAnalysis()

const { connect, disconnect, subscribeSymbol, unsubscribeSymbol, isConnected } = useSocket()

// Fetch summary on mount + connect WebSocket
onMounted(async () => {
  connect()
  await fetchSummary()

  // Subscribe WebSocket for each symbol
  for (const s of summaryList.value) {
    subscribeSymbol(s.id)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  for (const s of summaryList.value) {
    unsubscribeSymbol(s.id)
  }
  disconnect()
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="summaryLoading && summaryList.length === 0" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <div class="text-caption mt-2">กำลังโหลดข้อมูล...</div>
    </div>

    <!-- Error State -->
    <v-alert
      v-else-if="summaryError && summaryList.length === 0"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ summaryError }}
      <template #append>
        <v-btn variant="text" size="small" @click="fetchSummary({ forceRefresh: true })">
          ลองใหม่
        </v-btn>
      </template>
    </v-alert>

    <!-- Empty State -->
    <div
      v-else-if="summaryList.length === 0"
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
            {{ summaryList.length }} Symbols {{ isConnected ? 'Live' : 'Offline' }}
          </span>
        </div>
        <span v-if="summaryLastRefresh" class="text-caption text-medium-emphasis">
          Last Refresh: {{ new Date(summaryLastRefresh).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) }}
        </span>
      </div>

      <TradingSymbolCard
        v-for="summary in summaryList"
        :key="summary.id"
        :summary="summary"
      />
    </div>
  </div>
</template>
