<script setup lang="ts">
const { clearCache } = useAnalysis()

const isRefreshing = ref(false)
const refreshKey = ref(0)

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
    // Increment key → remount SymbolList → triggers progressive loading fresh
    refreshKey.value++
  } finally {
    // Small delay so user sees the loading indicator
    setTimeout(() => { isRefreshing.value = false }, 500)
  }
}
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- Header: avatar + title + refresh on ONE line -->
    <div class="d-flex align-center ga-3 mb-1">
      <v-avatar color="primary" size="40" rounded="lg">
        <v-icon icon="mdi-flash" color="white" size="22" />
      </v-avatar>
      <span class="text-h5 font-weight-bold">Smart Trader</span>
      <v-spacer />
      <v-btn
        icon
        variant="text"
        size="small"
        :loading="isRefreshing"
        @click="handleRefresh"
      >
        <v-icon icon="mdi-refresh" size="22" class="text-medium-emphasis" />
      </v-btn>
    </div>
    <p class="text-body-2 text-medium-emphasis mb-4">
      AI-Powered Trading Signal Bot v5.1
    </p>

    <v-divider class="mb-4" />

    <!-- Symbol List (key change → remount → progressive loading fresh) -->
    <TradingSymbolList :key="refreshKey" />

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

