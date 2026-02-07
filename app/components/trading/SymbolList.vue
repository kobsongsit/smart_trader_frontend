<script setup lang="ts">
const {
  summaryError,
  summaryLastRefresh,
  fetchSymbolSummary,
  getCachedSummary,
} = useAnalysis()

const { symbols: symbolsList, fetchActiveSymbols } = useSymbols()
const { subscribeSymbol, unsubscribeSymbol, isConnected } = useSocket()

// Track which symbols are still loading their summary
const loadingSymbolIds = ref<Set<number>>(new Set())
const symbolsLoaded = ref(false)

function isSymbolLoading(symbolId: number): boolean {
  return loadingSymbolIds.value.has(symbolId)
}

/**
 * Progressive Loading Flow:
 * 1. GET /api/symbols?isActive=true  → ได้ list ทันที (เร็ว ~50ms)
 * 2. แต่ละ symbol เรียก GET /api/analysis/summary?symbolId=X ทีละตัว
 *    → ทยอยเติม detail ลง summaryList (reactive)
 */
async function loadProgressively() {
  // Step 1: Fetch active symbols list (fast — just name, type, id)
  await fetchActiveSymbols()
  symbolsLoaded.value = true

  if (symbolsList.value.length === 0) return

  // Subscribe to all symbols (WebSocket connected at app level)
  for (const s of symbolsList.value) {
    subscribeSymbol(s.id)
  }

  // Step 2: Fetch summary for each symbol progressively (parallel)
  const promises = symbolsList.value.map(async (s) => {
    loadingSymbolIds.value.add(s.id)
    try {
      await fetchSymbolSummary(s.id)
    } finally {
      loadingSymbolIds.value.delete(s.id)
    }
  })

  await Promise.allSettled(promises)
}

// Fetch on mount
onMounted(() => {
  loadProgressively()
})

// Cleanup subscriptions on unmount (socket stays connected at app level)
onUnmounted(() => {
  for (const s of symbolsList.value) {
    unsubscribeSymbol(s.id)
  }
})
</script>

<template>
  <div>
    <!-- Loading State (initial — waiting for symbol list) -->
    <div v-if="!symbolsLoaded" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <div class="text-caption mt-2">กำลังโหลดข้อมูล...</div>
    </div>

    <!-- Error State -->
    <v-alert
      v-else-if="summaryError && symbolsList.length === 0"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ summaryError }}
      <template #append>
        <v-btn variant="text" size="small" @click="loadProgressively">
          ลองใหม่
        </v-btn>
      </template>
    </v-alert>

    <!-- Empty State -->
    <div
      v-else-if="symbolsList.length === 0"
      class="text-center py-8 text-medium-emphasis"
    >
      <v-icon icon="mdi-chart-box-outline" size="48" class="mb-2" />
      <div>ไม่พบ Symbol</div>
    </div>

    <!-- Symbol Cards (Progressive) -->
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
            {{ symbolsList.length }} Symbols {{ isConnected ? 'Live' : 'Offline' }}
          </span>
        </div>
        <span v-if="summaryLastRefresh" class="text-caption text-label-muted">
          Last Refresh: {{ new Date(summaryLastRefresh).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) }}
        </span>
      </div>

      <!-- Render cards for ALL symbols — show skeleton if summary not loaded yet -->
      <template v-for="sym in symbolsList" :key="sym.id">
        <!-- Has summary data → render full card -->
        <TradingSymbolCard
          v-if="getCachedSummary(sym.id)"
          :summary="getCachedSummary(sym.id)!"
        />

        <!-- Still loading → skeleton card -->
        <v-card v-else elevation="0" rounded="lg" class="mb-3 glass-card">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center">
                <v-avatar color="grey-darken-3" size="46" rounded="lg" class="mr-3">
                  <span class="text-white font-weight-bold text-body-1">{{ sym.name?.charAt(0)?.toUpperCase() || '?' }}</span>
                </v-avatar>
                <div>
                  <div class="d-flex align-center ga-2">
                    <span class="text-body-1 font-weight-bold">{{ sym.name || sym.displayName }}</span>
                    <v-chip size="x-small" variant="outlined" rounded="lg">{{ sym.type }}</v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis">กำลังโหลด...</div>
                </div>
              </div>
              <v-progress-circular
                v-if="isSymbolLoading(sym.id)"
                indeterminate
                color="primary"
                size="20"
                width="2"
              />
            </div>
            <v-skeleton-loader type="text@2" />
          </v-card-text>
        </v-card>
      </template>
    </div>
  </div>
</template>
