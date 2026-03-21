<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const { fetchPortfolio } = usePortfolio()
const { fetchPositions } = useOpenPositions()
const { data: priceSummary, loading: priceLoading, showTooltip, fetchAndShow: fetchPriceSummary } = usePriceSummary()

const isRefreshing = ref(false)

async function handleRefresh() {
  isRefreshing.value = true
  await Promise.all([fetchPortfolio(), fetchPositions()])
  isRefreshing.value = false
}

/**
 * Format candle time to HH:mm local time (using dayjs — never use raw Date)
 */
function formatTime(isoString: string | null): string {
  if (!isoString) return '--:--'
  return dayjs(isoString).format('HH:mm')
}
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- ── Header ── -->
    <div class="d-flex align-center ga-3 mb-5 mt-1">
      <div class="page-header-icon position-relative" style="cursor: pointer" @click="fetchPriceSummary">
        <v-icon icon="mdi-flash" size="22" color="#050505" :class="{ 'flash-spin': priceLoading }" />

        <!-- Price Summary Tooltip -->
        <Transition name="tooltip-fade">
          <div v-if="showTooltip" class="price-tooltip" @click.stop>
            <div class="price-tooltip__header">
              <v-icon icon="mdi-access-point" size="12" color="#4ade80" class="mr-1" />
              Price Summary
            </div>
            <div class="price-tooltip__body">
              <div
                v-for="item in priceSummary"
                :key="item.symbol"
                class="price-tooltip__row"
              >
                <span class="price-tooltip__symbol">{{ item.symbol }}</span>
                <span class="price-tooltip__price font-mono">{{ item.price ?? '---' }}</span>
                <span class="price-tooltip__time">{{ formatTime(item.candleTime) }}</span>
                <span
                  v-if="item.ageMinutes !== null && item.ageMinutes > 2"
                  class="price-tooltip__stale"
                >{{ item.ageMinutes }}m</span>
              </div>
            </div>
          </div>
        </Transition>
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

<style scoped>
/* ─── Flash icon spin while loading ─── */
.flash-spin {
  animation: flash-pulse 0.6s ease-in-out infinite;
}

@keyframes flash-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ─── Price Summary Tooltip ─── */
.price-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 100;
  min-width: 280px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 24px rgba(74, 222, 128, 0.08);
  backdrop-filter: blur(12px);
}

.price-tooltip__header {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.price-tooltip__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-tooltip__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 1.6;
}

.price-tooltip__symbol {
  color: rgb(148 163 184);
  width: 64px;
  flex-shrink: 0;
  font-size: 11px;
}

.price-tooltip__price {
  color: #e2e8f0;
  flex: 1;
  text-align: right;
}

.price-tooltip__time {
  color: rgb(100 116 139);
  font-size: 11px;
  width: 40px;
  text-align: right;
}

.price-tooltip__stale {
  color: #fbbf24;
  font-size: 10px;
  font-weight: 600;
}

/* ─── Tooltip fade transition ─── */
.tooltip-fade-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.tooltip-fade-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
