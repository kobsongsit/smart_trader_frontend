<script setup lang="ts">
import type { FvgStats } from '../../../types/trading'

const props = defineProps<{
  stats: FvgStats | null
  interval: string
  from: string
  to: string
}>()

/** FVG per day = total / จำนวนวัน */
const fvgPerDay = computed(() => {
  if (!props.stats || props.stats.total === 0) return '0.0'
  // คำนวณจำนวนวันระหว่าง from → to
  const msPerDay = 1000 * 60 * 60 * 24
  const fromMs = new Date(props.from).getTime()
  const toMs = new Date(props.to).getTime()
  const days = Math.max(1, Math.round((toMs - fromMs) / msPerDay))
  return (props.stats.total / days).toFixed(1)
})
</script>

<template>
  <div v-if="stats" class="fvg-stats">

    <!-- Total FVG (highlight) -->
    <div class="stat-block stat-block--total">
      <div class="stat-num">{{ stats.total }}</div>
      <div class="stat-lbl">Total FVG</div>
    </div>

    <!-- Bullish -->
    <div class="stat-block">
      <div class="stat-num text-info">{{ stats.bullish }}</div>
      <div class="stat-lbl">Bullish</div>
    </div>

    <!-- Bearish -->
    <div class="stat-block">
      <div class="stat-num text-error">{{ stats.bearish }}</div>
      <div class="stat-lbl">Bearish</div>
    </div>

    <!-- Avg Gap -->
    <div class="stat-block">
      <div class="stat-num font-mono">{{ stats.avgGapSize.toFixed(1) }}</div>
      <div class="stat-lbl">Avg Gap</div>
    </div>

    <!-- Avg Body Ratio -->
    <div class="stat-block">
      <div class="stat-num font-mono">{{ stats.avgBodyRatio.toFixed(2) }}</div>
      <div class="stat-lbl">Avg Body Ratio</div>
    </div>

    <!-- FVG per Day -->
    <div class="stat-block">
      <div class="stat-num font-mono">{{ fvgPerDay }}</div>
      <div class="stat-lbl">Per Day</div>
    </div>

  </div>
</template>

<style scoped>
.fvg-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  background: rgba(51, 65, 85, 0.3);
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 0 0 16px 16px;
  overflow: hidden;
}

.stat-block {
  flex: 1;
  min-width: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  background: rgb(17, 22, 32);
  gap: 2px;
}

.stat-block--total .stat-num {
  color: rgb(74, 222, 128);
}

.stat-num {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgb(226, 232, 240);
  line-height: 1.2;
}

.stat-lbl {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-semibold);
  color: var(--ds-text-faint);
  text-transform: uppercase;
  letter-spacing: var(--ds-ls-caps-wide);
  text-align: center;
}
</style>
