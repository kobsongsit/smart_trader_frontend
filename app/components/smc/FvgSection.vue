<script setup lang="ts">
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type { SymbolItem, ApiResponse } from '../../../types/trading'

dayjs.extend(utc)

// ─── Composables ──────────────────────────────────────────────
const { data: fvgData, loading: fvgLoading, error: fvgError, fetchFvg } = useFvg()
const { trades, fetchTrades } = useChartTrades()
const { backtestData, loading: backtestLoading, fetchBacktest } = useBacktest()
const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

// ─── Symbols ──────────────────────────────────────────────────
const symbols = ref<SymbolItem[]>([])
const symbolsLoading = ref(false)

async function loadSymbols() {
  symbolsLoading.value = true
  try {
    const { data: res } = await axios.get<ApiResponse<SymbolItem[]>>(`${baseUrl}/api/symbols`)
    if (res.success) symbols.value = res.data
  } catch {
    // ถ้าโหลด symbols ไม่ได้ก็ใช้ default ไปก่อน
  } finally {
    symbolsLoading.value = false
  }
}

// ─── Controls State ───────────────────────────────────────────
const selectedSymbol = ref('XAU-USD')
const selectedInterval = ref('15m')
const fromDate = ref(dayjs().subtract(20, 'day').format('YYYY-MM-DD'))
const toDate = ref(dayjs().format('YYYY-MM-DD'))
const minBodyRatio = ref(1.0)
const minGapRatio = ref(0.1)

// ─── Debounced Fetch ──────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Fetch FVG + live trades — ยิงทุกครั้งที่ date range หรือ filter เปลี่ยน
 */
function triggerFetch(immediate = false) {
  if (debounceTimer) clearTimeout(debounceTimer)
  const delay = immediate ? 0 : 300
  debounceTimer = setTimeout(() => {
    Promise.all([
      fetchFvg({
        symbol: selectedSymbol.value,
        interval: selectedInterval.value,
        from: fromDate.value,
        to: toDate.value,
        minBodyRatio: minBodyRatio.value,
        minGapRatio: minGapRatio.value,
      }),
      fetchTrades({
        symbol: selectedSymbol.value,
        interval: selectedInterval.value,
        from: fromDate.value,
        to: toDate.value,
      }),
    ])
  }, delay)
}

/**
 * Fetch backtest — ยิงเมื่อพี่กดปุ่มเอง
 * ใช้ from/to ของ chart ที่แสดงอยู่ตอนนี้
 */
function runBacktest() {
  fetchBacktest({
    symbol: selectedSymbol.value,
    interval: selectedInterval.value,
    from: fromDate.value,
    to: toDate.value,
  })
}

// Watch ทุก control → fetch ใหม่ (slider debounce 300ms)
// suppressFromDateWatch ป้องกัน watch ยิงซ้ำตอน handleNeedMoreData แก้ fromDate
let suppressFromDateWatch = false

watch(selectedSymbol, () => triggerFetch(true))
watch(selectedInterval, () => triggerFetch(true))
watch(fromDate, () => {
  if (suppressFromDateWatch) return
  triggerFetch(true)
})
watch(toDate, () => triggerFetch(true))
watch(minBodyRatio, () => triggerFetch())
watch(minGapRatio, () => triggerFetch())

// ─── Infinite Scroll Handler ──────────────────────────────────
const isFetchingMore = ref(false)

async function handleNeedMoreData(leftEdgeTs: number) {
  if (isFetchingMore.value || fvgLoading.value) return

  const leftEdgeDate = dayjs.unix(leftEdgeTs)
  const from = dayjs(fromDate.value)
  const to = dayjs(toDate.value)
  const rangeDays = Math.max(to.diff(from, 'day'), 1)

  const daysFromLeftToFrom = leftEdgeDate.diff(from, 'day')
  const percentFromLeft = (daysFromLeftToFrom / rangeDays) * 100

  let newFromDate: string | null = null

  if (daysFromLeftToFrom < 0) {
    // Condition 2: left edge ล้ำเกินข้อมูลที่โหลด → fetch rangeDays + gap
    const gap = Math.abs(daysFromLeftToFrom)
    newFromDate = from.subtract(rangeDays + gap, 'day').format('YYYY-MM-DD')
  } else if (percentFromLeft < 20) {
    // Condition 1: left edge อยู่ใน 20% แรก → pre-load อีก 100%
    newFromDate = from.subtract(rangeDays, 'day').format('YYYY-MM-DD')
  }

  if (!newFromDate) return

  isFetchingMore.value = true
  suppressFromDateWatch = true
  fromDate.value = newFromDate

  // infinite scroll → fetch FVG + trades เท่านั้น
  // backtest ไม่ต้อง re-fetch เพราะมันไม่ขึ้นกับ date range
  await Promise.all([
    fetchFvg({
      symbol: selectedSymbol.value,
      interval: selectedInterval.value,
      from: newFromDate,
      to: toDate.value,
      minBodyRatio: minBodyRatio.value,
      minGapRatio: minGapRatio.value,
    }),
    fetchTrades({
      symbol: selectedSymbol.value,
      interval: selectedInterval.value,
      from: newFromDate,
      to: toDate.value,
    }),
  ])

  isFetchingMore.value = false
  nextTick(() => { suppressFromDateWatch = false })
}

// ─── Lifecycle ────────────────────────────────────────────────
onMounted(async () => {
  await loadSymbols()
  // Auto-select XAU-USD ถ้ามีในรายการ
  const hasXauUsd = symbols.value.some(s => s.symbol === 'XAU-USD')
  if (!hasXauUsd && symbols.value.length) {
    selectedSymbol.value = symbols.value[0]?.symbol ?? 'XAU-USD'
  }
  triggerFetch(true)
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="fvg-section">

    <!-- ─── Section Header ─── -->
    <div class="fvg-header pa-4">
      <div class="d-flex align-center ga-3">
        <div class="fvg-icon-box">
          <v-icon icon="mdi-chart-waterfall" size="18" color="#2196F3" />
        </div>
        <div>
          <div class="fvg-title">SMC — FVG DETECTION</div>
          <div class="fvg-subtitle">Fair Value Gap · Smart Money Concepts</div>
        </div>
        <v-spacer />
        <!-- Legend -->
        <div class="fvg-legend">
          <span class="legend-dot legend-dot--bull" />
          <span class="legend-txt">Bullish</span>
          <span class="legend-dot legend-dot--bear" />
          <span class="legend-txt">Bearish</span>
        </div>
      </div>
    </div>

    <!-- ─── Controls ─── -->
    <SmcFvgControls
      :symbols="symbols"
      :symbols-loading="symbolsLoading"
      :symbol="selectedSymbol"
      :interval="selectedInterval"
      :from="fromDate"
      :to="toDate"
      :min-body-ratio="minBodyRatio"
      :min-gap-ratio="minGapRatio"
      :loading="fvgLoading"
      @update:symbol="selectedSymbol = $event"
      @update:interval="selectedInterval = $event"
      @update:from="fromDate = $event"
      @update:to="toDate = $event"
      @update:min-body-ratio="minBodyRatio = $event"
      @update:min-gap-ratio="minGapRatio = $event"
    />

    <!-- ─── Error State ─── -->
    <div v-if="fvgError && !fvgLoading" class="fvg-error pa-4">
      <v-alert type="error" variant="tonal" density="compact" class="mb-0">
        {{ fvgError }}
      </v-alert>
    </div>

    <!-- ─── Chart ─── -->
    <SmcFvgChart
      :candles="fvgData?.candles ?? []"
      :fvg-zones="fvgData?.fvgZones ?? []"
      :trades="trades"
      :backtest-trades="backtestData?.trades ?? []"
      :loading="fvgLoading && !isFetchingMore"
      :backtest-loading="backtestLoading"
      :appending-data="isFetchingMore"
      :symbols="symbols"
      :symbol="selectedSymbol"
      :interval="selectedInterval"
      @need-more-data="handleNeedMoreData"
      @run-backtest="runBacktest"
      @update:symbol="selectedSymbol = $event"
      @update:interval="selectedInterval = $event"
    />

    <!-- ─── Stats Panel ─── -->
    <SmcFvgStatsPanel
      :stats="fvgData?.stats ?? null"
      :interval="selectedInterval"
      :from="fromDate"
      :to="toDate"
    />

  </div>
</template>

<style scoped>
.fvg-section {
  background: rgb(17, 22, 32);
  border: 1px solid rgb(51, 65, 85, 0.7);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgb(0, 0, 0, 0.35);
}

/* ─── Header ─── */
.fvg-header {
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}

.fvg-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(33, 150, 243, 0.12);
  border-radius: 10px;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.fvg-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgb(226, 232, 240);
}

.fvg-subtitle {
  font-size: 0.62rem;
  color: rgb(100, 116, 139);
  margin-top: 1px;
}

/* ─── Legend ─── */
.fvg-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-dot--bull {
  background: rgba(33, 150, 243, 0.7);
}

.legend-dot--bear {
  background: rgba(244, 67, 54, 0.7);
  margin-left: 8px;
}

.legend-txt {
  font-size: 0.62rem;
  font-weight: 600;
  color: rgb(100, 116, 139);
}

/* ─── Error ─── */
.fvg-error {
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}
</style>
