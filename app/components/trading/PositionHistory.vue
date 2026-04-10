<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ClosedTrade } from '../../../types/trading'
import { usePositionHistory } from '../../composables/usePositionHistory'

// ============================================================
// Composable
// ============================================================

const { trades, loading, loadingMore, error, hasMore, fetchHistory, loadMore } = usePositionHistory()

// ============================================================
// Expand / Collapse
// ============================================================

const isExpanded = ref(false)

function toggle() {
  isExpanded.value = !isExpanded.value
  // fetch เฉพาะครั้งแรกที่ expand
  if (isExpanded.value && trades.value.length === 0 && !loading.value) {
    fetchHistory()
  }
}

// ============================================================
// Helpers
// ============================================================

function formatPips(pips: number): string {
  const prefix = pips > 0 ? '+' : ''
  return `${prefix}${pips.toLocaleString('en-US', { maximumFractionDigits: 1 })}`
}

function pipsColorClass(pips: number): string {
  if (pips > 0) return 'text-success'
  if (pips < 0) return 'text-error'
  return 'text-medium-emphasis'
}

function exitReasonLabel(reason: ClosedTrade['exitReason']): string {
  const map: Record<string, string> = {
    TP: 'TP',
    TP2: 'TP2',
    SL: 'SL',
    OPPOSITE_SIGNAL: 'SIGNAL',
    MANUAL: 'MANUAL',
    TRAIL_STOP: 'TRAIL',
  }
  return map[reason] ?? reason
}

function exitReasonClass(reason: ClosedTrade['exitReason']): string {
  if (reason === 'TP' || reason === 'TP2') return 'reason-badge--tp'
  if (reason === 'SL') return 'reason-badge--sl'
  return 'reason-badge--neutral'
}
</script>

<template>
  <div id="position-history-section">

    <!-- ── Section Header — clickable toggle ── -->
    <div class="d-flex align-center ga-3 mb-4 section-header" @click="toggle">
      <v-icon icon="mdi-history" size="14" class="text-medium-emphasis" style="flex-shrink:0" />
      <span class="section-title flex-grow-1">POSITION HISTORY</span>
      <span v-if="trades.length > 0" class="count-badge font-mono font-weight-bold">
        {{ trades.length }}
      </span>
      <v-icon
        :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="16"
        class="text-medium-emphasis toggle-icon"
      />
    </div>

    <!-- ── Collapsible content ── -->
    <Transition name="expand">
      <div v-if="isExpanded">

    <!-- ── Loading State ── -->
    <template v-if="loading">
      <div v-for="i in 2" :key="i" class="history-card mb-3">
        <div class="pa-3 pl-4">
          <!-- Row 1 skeleton -->
          <div class="d-flex align-center ga-2 mb-3">
            <div class="sk-bar" style="width: 36px; height: 18px; border-radius: 4px;" />
            <div class="sk-bar" style="width: 80px; height: 13px;" />
            <div class="flex-grow-1" />
            <div class="sk-bar" style="width: 48px; height: 18px; border-radius: 6px;" />
            <div class="sk-bar" style="width: 28px; height: 18px; border-radius: 6px;" />
          </div>
          <!-- Row 2 skeleton -->
          <div class="price-box">
            <div class="d-flex">
              <div class="flex-1 pa-2 px-3">
                <div class="price-label mb-1">Entry</div>
                <div class="sk-bar" style="width: 64px; height: 13px;" />
              </div>
              <div class="price-divider" />
              <div class="flex-1 pa-2 px-3">
                <div class="price-label mb-1">Exit</div>
                <div class="sk-bar" style="width: 64px; height: 13px;" />
              </div>
              <div class="price-divider" />
              <div class="flex-1 pa-2 px-3">
                <div class="price-label mb-1">Pips</div>
                <div class="sk-bar" style="width: 48px; height: 13px;" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Error State ── -->
    <v-card v-else-if="error" elevation="0" rounded="lg" class="glass-card">
      <v-card-text class="pa-4">
        <v-alert type="error" variant="tonal" class="mb-0">
          Failed to load position history
          <template #append>
            <v-btn variant="text" size="small" @click="fetchHistory">Retry</v-btn>
          </template>
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- ── Empty State ── -->
    <v-card v-else-if="trades.length === 0" elevation="0" rounded="lg" class="glass-card">
      <v-card-text class="pa-6 text-center">
        <v-icon icon="mdi-clipboard-text-clock-outline" size="48" class="text-medium-emphasis mb-2" />
        <div class="text-body-2 text-medium-emphasis">No closed positions yet</div>
      </v-card-text>
    </v-card>

    <!-- ── History Cards ── -->
    <template v-else>
      <div
        v-for="trade in trades"
        :key="trade.id"
        class="history-card mb-3"
        :class="trade.action === 'BUY' ? 'history-card--buy' : 'history-card--sell'"
      >
        <div class="pa-3 pl-4">

          <!-- Row 1: direction / symbol / duration / exit reason / TF -->
          <div class="d-flex align-center ga-2 mb-3">
            <span
              class="direction-badge font-weight-black"
              :class="trade.action === 'BUY' ? 'direction-badge--buy' : 'direction-badge--sell'"
            >
              {{ trade.action }}
            </span>

            <span class="text-subtitle-2 font-weight-bold text-slate-100">
              {{ trade.symbol }}
            </span>

            <v-spacer />

            <!-- Duration -->
            <span v-if="trade.duration" class="time-badge font-mono">
              <v-icon icon="mdi-clock-outline" size="11" class="mr-1 text-label-muted" />
              {{ trade.duration }}
            </span>

            <!-- Exit reason badge -->
            <span class="reason-badge font-mono font-weight-bold" :class="exitReasonClass(trade.exitReason)">
              {{ exitReasonLabel(trade.exitReason) }}
            </span>

            <!-- Timeframe -->
            <span class="tf-badge font-weight-medium font-mono">{{ trade.interval }}</span>
          </div>

          <!-- Row 2: Entry / Exit / Pips -->
          <div class="price-box">
            <div class="d-flex">

              <!-- Entry -->
              <div class="flex-1 pa-2 px-3">
                <div class="price-label mb-1">Entry</div>
                <div class="price-value font-mono">{{ trade.entryPrice }}</div>
              </div>

              <div class="price-divider" />

              <!-- Exit -->
              <div class="flex-1 pa-2 px-3">
                <div class="price-label mb-1">Exit</div>
                <div class="price-value font-mono">{{ trade.exitPrice }}</div>
              </div>

              <div class="price-divider" />

              <!-- Pips (realized P&L) -->
              <div class="flex-1 pa-2 px-3">
                <div class="price-label mb-1">Pips</div>
                <div
                  class="price-value font-mono font-weight-bold"
                  :class="pipsColorClass(trade.profitPips)"
                >
                  {{ formatPips(trade.profitPips) }}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>


    </template>

      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* ── Skeleton ── */
@keyframes sk-shimmer {
  0%, 100% { opacity: 0.35; }
  50%       { opacity: 0.65; }
}

.sk-bar {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  animation: sk-shimmer 1.4s ease-in-out infinite;
  flex-shrink: 0;
}

/* ── Section Title ── */
.section-title {
  font-size: var(--ds-text-label);
  font-weight: var(--ds-fw-bold);
  letter-spacing: var(--ds-ls-caps);
  text-transform: uppercase;
  color: var(--ds-text-primary);
}

/* ── Count Badge ── */
.count-badge {
  background: var(--ds-neutral-bg);
  border: 1px solid var(--ds-neutral-border);
  color: var(--ds-text-secondary);
  padding: 1px 8px;
  border-radius: var(--ds-radius-xs);
  font-size: var(--ds-text-caption);
}

/* ── History Card ── */
.history-card {
  position: relative;
  background: var(--ds-glass-1-bg);
  backdrop-filter: blur(var(--ds-glass-1-blur)) saturate(var(--ds-glass-1-sat));
  -webkit-backdrop-filter: blur(var(--ds-glass-1-blur)) saturate(var(--ds-glass-1-sat));
  border: 1px solid var(--ds-glass-2-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.30),
    var(--ds-glass-inset);
  transition:
    border-color var(--ds-transition-normal),
    box-shadow var(--ds-transition-normal);
  opacity: 0.85;
}

.history-card:hover {
  opacity: 1;
  border-color: rgba(255, 255, 255, 0.10);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.40),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

/* Left accent bar */
.history-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.history-card--buy::before {
  background: var(--ds-success-dim);
  opacity: 0.5;
}

.history-card--sell::before {
  background: var(--ds-error-dim);
  opacity: 0.5;
}

/* ── Direction Badge ── */
.direction-badge {
  font-size: var(--ds-text-micro);
  letter-spacing: var(--ds-ls-caps);
  padding: 2px 6px;
  border-radius: var(--ds-radius-2xs);
  line-height: var(--ds-lh-relaxed);
  text-transform: uppercase;
}

.direction-badge--buy {
  background: var(--ds-success-bg);
  color: var(--ds-success-text);
  border: 1px solid var(--ds-success-border);
}

.direction-badge--sell {
  background: var(--ds-error-bg);
  color: var(--ds-error-bright);
  border: 1px solid var(--ds-error-border);
}

/* ── Exit Reason Badge ── */
.reason-badge {
  font-size: var(--ds-text-micro);
  letter-spacing: var(--ds-ls-caps);
  padding: 2px 6px;
  border-radius: var(--ds-radius-2xs);
  line-height: var(--ds-lh-relaxed);
  text-transform: uppercase;
}

.reason-badge--tp {
  background: var(--ds-success-bg);
  color: var(--ds-success-text);
  border: 1px solid var(--ds-success-border);
}

.reason-badge--sl {
  background: var(--ds-error-bg);
  color: var(--ds-error-bright);
  border: 1px solid var(--ds-error-border);
}

.reason-badge--neutral {
  background: var(--ds-neutral-bg);
  color: var(--ds-text-muted);
  border: 1px solid var(--ds-neutral-border);
}

/* ── Time & TF badges ── */
.time-badge {
  display: flex;
  align-items: center;
  font-size: var(--ds-text-caption);
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: var(--ds-radius-xs);
}

.tf-badge {
  font-size: var(--ds-text-caption);
  color: var(--ds-text-secondary);
  background: var(--ds-neutral-bg);
  border: 1px solid var(--ds-neutral-border);
  padding: 2px 6px;
  border-radius: var(--ds-radius-xs);
}

/* ── Price Box ── */
.price-box {
  background: var(--ds-bg-deep);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--ds-radius-sm);
  overflow: hidden;
}

.price-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 6px 0;
}

.price-label {
  font-size: var(--ds-text-caption);
  font-weight: var(--ds-fw-medium);
  color: var(--ds-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.price-value {
  font-size: var(--ds-text-body);
  font-weight: var(--ds-fw-semibold);
  color: var(--ds-text-primary);
}

/* ── Section Header toggle ── */
.section-header {
  cursor: pointer;
  user-select: none;
  border-radius: var(--ds-radius-xs);
  transition: opacity var(--ds-transition-fast);
}

.section-header:hover {
  opacity: 0.8;
}

.toggle-icon {
  transition: transform var(--ds-transition-normal);
}

/* ── Expand transition ── */
.expand-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.expand-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Load More Button ── */
.load-more-btn {
  font-size: var(--ds-text-caption);
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.06);
  letter-spacing: var(--ds-ls-caps);
}

/* ── Flex utils ── */
.flex-1 {
  flex: 1;
}
</style>
