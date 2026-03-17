<script setup lang="ts">
const { fetchPortfolio } = usePortfolio()
const { fetchPositions } = useOpenPositions()

const isRefreshing = ref(false)

async function handleRefresh() {
  isRefreshing.value = true
  await Promise.all([fetchPortfolio(), fetchPositions()])
  isRefreshing.value = false
}
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- ── Header ── -->
    <div class="d-flex align-center ga-3 mb-5 mt-1">
      <div class="page-header-icon">
        <v-icon icon="mdi-flash" size="22" color="#050505" />
      </div>

      <div class="flex-grow-1">
        <div class="text-h5 font-weight-bold">Smart Trader</div>
        <div class="text-caption text-label-muted mt-1">AI-Powered Trading Signal Dashboard</div>
      </div>

      <button class="refresh-btn" :class="{ 'refresh-btn--spinning': isRefreshing }" @click="handleRefresh">
        <v-icon icon="mdi-refresh" size="20" />
      </button>
    </div>

    <div class="page-header-divider mb-5" />

    <!-- Portfolio Overview -->
    <TradingPortfolioOverview />

    <div class="my-4" />

    <!-- Open Positions -->
    <TradingOpenPositions />

    <!-- Footer -->
    <div class="text-center mt-8">
      <div class="text-caption text-medium-emphasis">
        <v-icon icon="mdi-shield-check" size="12" class="mr-1" />
        KOB-Trade v2.0
      </div>
    </div>

  </v-container>
</template>

