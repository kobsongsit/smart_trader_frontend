<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { usePortfolio } from '../composables/usePortfolio'
import { useOpenPositions } from '../composables/useOpenPositions'
import { usePriceSummary } from '../composables/usePriceSummary'

dayjs.extend(utc)

const { refresh: refreshPortfolio } = usePortfolio()
const { fetchPositions } = useOpenPositions()
const { data: priceSummary, loading: priceLoading, showTooltip, fetchAndShow: fetchPriceSummary } = usePriceSummary()

const isRefreshing = ref(false)

// ─── Tooltip anchor position ───────────────────────────────────
const flashIconRef = ref<HTMLElement | null>(null)
const tooltipStyle = computed(() => {
  if (!flashIconRef.value) return {}
  const rect = flashIconRef.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
  }
})

async function handleRefresh() {
  isRefreshing.value = true
  // refresh() จะใช้ lastParams อัตโนมัติ — ไม่ต้องรู้ว่า range ปัจจุบันคืออะไร
  await Promise.all([refreshPortfolio(), fetchPositions()])
  isRefreshing.value = false
}

/**
 * Format candle time to HH:mm local time (using dayjs -- never use raw Date)
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
      <div ref="flashIconRef" class="page-header-icon" style="cursor: pointer" @click="fetchPriceSummary">
        <v-icon icon="mdi-flash" size="22" color="#4ADE80" :class="{ 'flash-spin': priceLoading }" />
      </div>

      <!-- Price Summary Tooltip — Teleport to body เพื่อหนี stacking context -->
      <Teleport to="body">
        <Transition name="tooltip-fade">
          <div v-if="showTooltip" class="price-tooltip" :style="tooltipStyle" @click.stop>
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
      </Teleport>

      <div class="flex-grow-1">
        <div class="text-h5 font-weight-bold">Dashboard</div>
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

    <div class="my-4" />

    <!-- Position History -->
    <TradingPositionHistory />

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

/* ─── Price Summary Tooltip — Frosted Glass ─── */
.price-tooltip {
  position: fixed;
  z-index: 2000;
  min-width: 280px;
  background: rgba(6, 10, 19, 0.85);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid var(--ds-success-border);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-2) var(--ds-space-3);
  box-shadow:
    var(--ds-shadow-card-deep),
    var(--ds-shadow-green-glow),
    var(--ds-glass-inset);
}

.price-tooltip__header {
  display: flex;
  align-items: center;
  font-size: var(--ds-text-caption);
  font-weight: var(--ds-fw-semibold);
  color: var(--ds-success);
  text-transform: uppercase;
  letter-spacing: var(--ds-ls-caps);
  margin-bottom: var(--ds-space-2);
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.price-tooltip__body {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
}

.price-tooltip__row {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  font-size: var(--ds-text-label);
  line-height: var(--ds-lh-relaxed);
}

.price-tooltip__symbol {
  color: var(--ds-text-muted);
  width: 64px;
  flex-shrink: 0;
  font-size: var(--ds-text-caption);
}

.price-tooltip__price {
  color: var(--ds-text-primary);
  flex: 1;
  text-align: right;
}

.price-tooltip__time {
  color: var(--ds-text-ghost);
  font-size: var(--ds-text-caption);
  width: 40px;
  text-align: right;
}

.price-tooltip__stale {
  color: var(--ds-warning);
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-semibold);
}

/* ─── Tooltip fade transition ─── */
.tooltip-fade-enter-active {
  transition: opacity var(--ds-transition-fast), transform var(--ds-transition-fast);
}
.tooltip-fade-leave-active {
  transition: opacity var(--ds-transition-normal), transform var(--ds-transition-normal);
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
