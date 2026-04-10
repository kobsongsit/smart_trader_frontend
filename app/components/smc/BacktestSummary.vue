<script setup lang="ts">
import type { BacktestData } from '../../../types/trading'

// ─── Props ────────────────────────────────────────────────
const props = defineProps<{
  data: BacktestData | null
  loading: boolean
  error: string | null
}>()

// ─── Computed ─────────────────────────────────────────────
const summary = computed(() => props.data?.summary ?? null)

/** มี multi-TP data มั้ย */
const isMultiTp = computed(() =>
  summary.value != null && (
    summary.value.tp1Reached !== undefined ||
    summary.value.tp2Hits    !== undefined ||
    summary.value.trailStopHits !== undefined
  )
)

/** Pips display */
function fmtPips(p: number): string {
  return (p > 0 ? '+' : '') + p.toLocaleString('en-US')
}

/** Win Rate color */
const winRateClass = computed(() => {
  const wr = summary.value?.winRate ?? 0
  if (wr >= 60) return 'val--green'
  if (wr >= 45) return 'val--amber'
  return 'val--red'
})

/** Total Pips color */
const totalPipsClass = computed(() => {
  const p = summary.value?.totalPips ?? 0
  if (p > 0) return 'val--green'
  if (p < 0) return 'val--red'
  return ''
})

/** Profit Factor color */
const pfClass = computed(() => {
  const pf = summary.value?.profitFactor ?? 0
  if (pf >= 2.0) return 'val--green'
  if (pf >= 1.5) return 'val--cyan'
  if (pf >= 1.0) return 'val--amber'
  return 'val--red'
})

/** Date range label */
const dateRange = computed(() => {
  if (!props.data) return ''
  return `${props.data.from} → ${props.data.to}`
})

/** Mode badge */
const modeBadgeClass = computed(() =>
  props.data?.mode === 'production' ? 'mode-badge--prod' : 'mode-badge--orig'
)
</script>

<template>
  <transition name="bt-slide">
    <div v-if="data || loading || error" class="bt-summary">

      <!-- ─── Header ─── -->
      <div class="bt-header pa-3">
        <div class="d-flex align-center ga-2 flex-wrap">

          <div class="bt-icon-box">
            <v-icon icon="mdi-lightning-bolt" size="14" color="#f59e0b" />
          </div>

          <span class="bt-title">BACKTEST RESULT</span>

          <template v-if="data">
            <span class="bt-tag">{{ data.symbol }}</span>
            <span class="bt-sep">·</span>
            <span class="bt-tag">{{ data.interval }}</span>
            <span class="bt-sep">·</span>
            <span class="bt-date">{{ dateRange }}</span>
          </template>

          <v-spacer />

          <span v-if="data" class="mode-badge" :class="modeBadgeClass">
            {{ data.mode }}
          </span>

        </div>
      </div>

      <!-- ─── Loading State ─── -->
      <div v-if="loading" class="bt-loading">
        <v-progress-circular indeterminate size="24" width="2" color="#f59e0b" />
        <span class="bt-loading-txt">Running backtest...</span>
      </div>

      <!-- ─── Error State ─── -->
      <div v-else-if="error" class="bt-error pa-3">
        <v-icon icon="mdi-alert-circle-outline" size="16" color="#f87171" class="mr-1" />
        <span class="bt-error-txt">{{ error }}</span>
      </div>

      <!-- ─── Stats Grid ─── -->
      <div v-else-if="summary" class="bt-grid">

        <!-- Row 1: Main stats -->
        <div class="bt-cell">
          <div class="bt-val font-mono">{{ summary.totalTrades }}</div>
          <div class="bt-lbl">Trades</div>
        </div>
        <div class="bt-cell">
          <div class="bt-val font-mono" :class="winRateClass">{{ summary.winRate }}%</div>
          <div class="bt-lbl">Win Rate</div>
        </div>
        <div class="bt-cell bt-cell--wide">
          <div class="bt-val font-mono" :class="totalPipsClass">{{ fmtPips(summary.totalPips) }}</div>
          <div class="bt-lbl">Total Pips</div>
        </div>
        <div class="bt-cell">
          <div class="bt-val font-mono" :class="pfClass">{{ summary.profitFactor.toFixed(2) }}</div>
          <div class="bt-lbl">Prof. Factor</div>
        </div>

        <!-- Divider -->
        <div class="bt-row-divider" />

        <!-- Row 2: Breakdown -->
        <div class="bt-cell">
          <div class="bt-val font-mono val--green">+{{ summary.avgWinPips.toFixed(1) }}</div>
          <div class="bt-lbl">Avg Win</div>
        </div>
        <div class="bt-cell">
          <div class="bt-val font-mono val--red">-{{ Math.abs(summary.avgLossPips).toFixed(1) }}</div>
          <div class="bt-lbl">Avg Loss</div>
        </div>
        <div class="bt-cell">
          <div class="bt-val font-mono val--green">{{ summary.wins }}<span class="bt-val-unit">W</span></div>
          <div class="bt-lbl">Wins</div>
        </div>
        <div class="bt-cell">
          <div class="bt-val font-mono val--red">{{ summary.losses }}<span class="bt-val-unit">L</span></div>
          <div class="bt-lbl">Losses</div>
        </div>

        <!-- ─── Multi-TP Row (optional) ─── -->
        <template v-if="isMultiTp">
          <div class="bt-row-divider bt-row-divider--multitp" />

          <div class="bt-cell">
            <div class="bt-val font-mono val--cyan">
              {{ summary.tp1Reached ?? '-' }}
            </div>
            <div class="bt-lbl">TP1 Hit</div>
          </div>
          <div class="bt-cell">
            <div class="bt-val font-mono val--cyan">
              {{ summary.tp2Hits ?? '-' }}
            </div>
            <div class="bt-lbl">TP2 Hit</div>
          </div>
          <div class="bt-cell">
            <div class="bt-val font-mono" style="color: #a78bfa;">
              {{ summary.trailStopHits ?? '-' }}
            </div>
            <div class="bt-lbl">Trail Stop</div>
          </div>
          <div class="bt-cell">
            <div class="bt-val font-mono val--amber">
              {{ summary.avgRR != null ? summary.avgRR.toFixed(2) : '-' }}
            </div>
            <div class="bt-lbl">Avg R:R</div>
          </div>
        </template>

      </div>

    </div>
  </transition>
</template>

<style scoped>
/* ─── Container ─── */
.bt-summary {
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  background: rgba(15, 18, 26, 0.8);
}

/* ─── Header ─── */
.bt-header {
  border-bottom: 1px solid rgba(51, 65, 85, 0.35);
}

.bt-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 158, 11, 0.12);
  border-radius: 6px;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.bt-title {
  font-size: var(--ds-text-caption);
  font-weight: var(--ds-fw-bold);
  letter-spacing: var(--ds-ls-caps);
  color: var(--ds-text-primary);
}

.bt-tag {
  font-size: var(--ds-text-caption);
  font-weight: var(--ds-fw-bold);
  color: var(--ds-text-muted);
  background: rgba(51, 65, 85, 0.5);
  border-radius: var(--ds-radius-2xs);
  padding: 1px 6px;
}

.bt-sep {
  font-size: var(--ds-text-micro);
  color: rgb(71, 85, 105);
}

.bt-date {
  font-size: var(--ds-text-micro);
  color: var(--ds-text-faint);
  font-family: 'JetBrains Mono', monospace;
}

.mode-badge {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: var(--ds-radius-2xs);
  padding: 2px 7px;
}
.mode-badge--prod {
  background: rgba(74, 222, 128, 0.1);
  color: rgb(74, 222, 128);
  border: 1px solid rgba(74, 222, 128, 0.25);
}
.mode-badge--orig {
  background: rgba(148, 163, 184, 0.1);
  color: rgb(148, 163, 184);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

/* ─── Loading ─── */
.bt-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 16px;
}
.bt-loading-txt {
  font-size: var(--ds-text-label);
  color: var(--ds-text-muted);
  letter-spacing: 0.04em;
}

/* ─── Error ─── */
.bt-error {
  display: flex;
  align-items: center;
}
.bt-error-txt {
  font-size: var(--ds-text-caption);
  color: var(--ds-error);
}

/* ─── Stats Grid ─── */
.bt-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  background: rgba(51, 65, 85, 0.25);
}

.bt-cell {
  flex: 1;
  min-width: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  background: rgba(15, 18, 26, 0.8);
  gap: 3px;
}

/* wide cell สำหรับ total pips */
.bt-cell--wide {
  flex: 1.4;
}

/* row divider — full width */
.bt-row-divider {
  width: 100%;
  height: 1px;
  background: rgba(51, 65, 85, 0.35);
  flex-basis: 100%;
  flex-shrink: 0;
}

.bt-row-divider--multitp {
  background: rgba(167, 139, 250, 0.15);
}

/* ─── Values ─── */
.bt-val {
  font-size: 1.05rem;
  font-weight: 700;
  color: rgb(226, 232, 240);
  line-height: 1.2;
}

.bt-val-unit {
  font-size: var(--ds-text-caption);
  font-weight: var(--ds-fw-semibold);
  margin-left: 1px;
  opacity: 0.7;
}

.bt-lbl {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-semibold);
  color: var(--ds-text-faint);
  text-transform: uppercase;
  letter-spacing: var(--ds-ls-caps-wide);
  text-align: center;
}

/* ─── Color tokens ─── */
.val--green { color: rgb(74, 222, 128); }
.val--red   { color: rgb(248, 113, 113); }
.val--amber { color: rgb(251, 191, 36); }
.val--cyan  { color: rgb(34, 211, 238); }

/* ─── Transition ─── */
.bt-slide-enter-active,
.bt-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.bt-slide-enter-from,
.bt-slide-leave-to {
  opacity: 0;
  max-height: 0;
}
.bt-slide-enter-to,
.bt-slide-leave-from {
  opacity: 1;
  max-height: 300px;
}
</style>
