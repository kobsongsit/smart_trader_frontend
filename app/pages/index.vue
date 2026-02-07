<script setup lang="ts">
const { symbols, fetchActiveSymbols } = useSymbols()
const { fetchAnalysis, clearCache } = useAnalysis()

const isRefreshing = ref(false)

useHead({
  title: 'Smart Trader - AI Trading Signals',
  meta: [
    { name: 'description', content: 'AI-Powered Trading Signal Bot with Technical Analysis' }
  ]
})

async function handleRefresh() {
  isRefreshing.value = true
  try {
    clearCache()
    await fetchActiveSymbols()
    for (const symbol of symbols.value) {
      await fetchAnalysis(symbol.id, { forceRefresh: true })
    }
  } finally {
    isRefreshing.value = false
  }
}
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- Header: avatar + title + refresh on ONE line -->
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
      <v-avatar color="primary" size="40" rounded="lg" style="flex-shrink: 0;">
        <v-icon icon="mdi-flash" color="white" size="22" />
      </v-avatar>
      <span style="font-size: 22px; font-weight: 700; flex-grow: 1;">Smart Trader</span>
      <v-icon
        icon="mdi-refresh"
        size="22"
        :class="{ 'spin-animation': isRefreshing }"
        class="text-medium-emphasis"
        style="cursor: pointer; flex-shrink: 0;"
        @click="handleRefresh"
      />
    </div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      AI-Powered Trading Signal Bot v5.1
    </p>

    <v-divider class="mb-4" />

    <!-- Symbol List -->
    <TradingSymbolList />

    <!-- Footer -->
    <v-sheet color="transparent" class="pa-3 text-center mt-4">
      <div class="text-caption text-medium-emphasis">
        <v-icon icon="mdi-shield-check" size="14" class="mr-1" />
        Smart Trader — AI-Powered Trading Signal Bot
      </div>
      <div class="text-caption text-medium-emphasis mt-1">
        ข้อมูลเพื่อประกอบการตัดสินใจเท่านั้น ไม่ใช่คำแนะนำการลงทุน
      </div>
    </v-sheet>

  </v-container>
</template>

<style scoped>
.spin-animation {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
