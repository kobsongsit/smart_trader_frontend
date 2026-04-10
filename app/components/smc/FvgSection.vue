<script setup lang="ts">
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type { SymbolItem, ApiResponse } from '../../../types/trading'

dayjs.extend(utc)

// ─── Props & Emits ────────────────────────────────────────────
const props = defineProps<{
  symbol: string
  interval: string
  from: string
  to: string
}>()

const emit = defineEmits<{
  'update:symbol': [value: string]
  'update:interval': [value: string]
  'update:from': [value: string]
}>()

// ─── Composables ──────────────────────────────────────────────
const { data: fvgData, loading: fvgLoading, error: fvgError, fetchFvg, clearFvg } = useFvg()
const { trades, fetchTrades, clearTrades } = useChartTrades()
const { backtestData, loading: backtestLoading, error: backtestError, fetchBacktest, clearBacktest } = useBacktest()
const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

// ─── Symbols (สำหรับ fullscreen selector ใน chart) ───────────
const symbols = ref<SymbolItem[]>([])

async function loadSymbols() {
  try {
    const { data: res } = await axios.get<ApiResponse<SymbolItem[]>>(`${baseUrl}/api/symbols`)
    if (res.success) symbols.value = res.data
  } catch { /* ใช้ default */ }
}

// ─── Intervals ที่ /api/strategy/trades รองรับ ────────────────
const TRADES_VALID_INTERVALS = ['15m', '1h', '4h']
const tradesIntervalSupported = computed(() => TRADES_VALID_INTERVALS.includes(props.interval))

// ─── FVG-specific controls ────────────────────────────────────
const minBodyRatio = ref(1.0)
const minGapRatio = ref(0.1)

// ─── Debounced Fetch ──────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function triggerFetch(immediate = false) {
  if (debounceTimer) clearTimeout(debounceTimer)
  const delay = immediate ? 0 : 300
  debounceTimer = setTimeout(() => {
    const fetches: Promise<unknown>[] = [
      fetchFvg({
        symbol: props.symbol,
        interval: props.interval,
        from: props.from,
        to: props.to,
        minBodyRatio: minBodyRatio.value,
        minGapRatio: minGapRatio.value,
      }),
    ]
    // trades API รองรับแค่ 15m, 1h, 4h — skip ถ้า interval ไม่ support
    if (tradesIntervalSupported.value) {
      fetches.push(fetchTrades({
        symbol: props.symbol,
        interval: props.interval,
        from: props.from,
        to: props.to,
      }))
    } else {
      clearTrades()
    }
    Promise.all(fetches)
  }, delay)
}

function runBacktest() {
  if (!tradesIntervalSupported.value) return   // backtest ใช้ interval เดียวกับ trades
  fetchBacktest({
    symbol: props.symbol,
    interval: props.interval,
    from: props.from,
    to: props.to,
  })
}

// ─── Watch props ──────────────────────────────────────────────
watch(() => [props.symbol, props.interval], () => {
  clearFvg()
  clearTrades()
  clearBacktest()
  triggerFetch(true)
})

watch(() => [props.from, props.to], () => {
  triggerFetch(true)
})

watch(minBodyRatio, () => triggerFetch())
watch(minGapRatio, () => triggerFetch())

// ─── Infinite Scroll Handler ──────────────────────────────────
const isFetchingMore = ref(false)

async function handleNeedMoreData(leftEdgeTs: number) {
  if (isFetchingMore.value || fvgLoading.value) return

  const from = dayjs(props.from)
  const to   = dayjs(props.to)
  const leftEdgeDate = dayjs.unix(leftEdgeTs)
  const rangeDays = Math.max(to.diff(from, 'day'), 1)

  const daysFromLeftToFrom = leftEdgeDate.diff(from, 'day')
  const percentFromLeft = (daysFromLeftToFrom / rangeDays) * 100

  let newFromDate: string | null = null

  if (daysFromLeftToFrom < 0) {
    const gap = Math.abs(daysFromLeftToFrom)
    newFromDate = from.subtract(rangeDays + gap, 'day').format('YYYY-MM-DD')
  } else if (percentFromLeft < 20) {
    newFromDate = from.subtract(rangeDays, 'day').format('YYYY-MM-DD')
  }

  if (!newFromDate) return

  isFetchingMore.value = true
  emit('update:from', newFromDate)

  const fetches: Promise<unknown>[] = [
    fetchFvg({
      symbol: props.symbol,
      interval: props.interval,
      from: newFromDate,
      to: props.to,
      minBodyRatio: minBodyRatio.value,
      minGapRatio: minGapRatio.value,
    }),
  ]
  if (tradesIntervalSupported.value) {
    fetches.push(fetchTrades({
      symbol: props.symbol,
      interval: props.interval,
      from: newFromDate,
      to: props.to,
    }))
  }
  await Promise.all(fetches)

  isFetchingMore.value = false
}

// ─── Lifecycle ────────────────────────────────────────────────
onMounted(async () => {
  await loadSymbols()
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
        <div class="fvg-legend">
          <span class="legend-dot legend-dot--bull" />
          <span class="legend-txt">Bullish</span>
          <span class="legend-dot legend-dot--bear" />
          <span class="legend-txt">Bearish</span>
        </div>
      </div>
    </div>

    <!-- ─── FVG Sliders ─── -->
    <SmcFvgControls
      :min-body-ratio="minBodyRatio"
      :min-gap-ratio="minGapRatio"
      :loading="fvgLoading"
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
      :symbol="symbol"
      :interval="interval"
      @need-more-data="handleNeedMoreData"
      @run-backtest="runBacktest"
      @update:symbol="emit('update:symbol', $event)"
      @update:interval="emit('update:interval', $event)"
    />

    <!-- ─── Backtest Summary ─── -->
    <SmcBacktestSummary
      :data="(backtestData as any) ?? null"
      :loading="backtestLoading"
      :error="backtestError"
    />

    <!-- ─── Stats Panel ─── -->
    <SmcFvgStatsPanel
      :stats="fvgData?.stats ?? null"
      :interval="interval"
      :from="from"
      :to="to"
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
  font-size: var(--ds-text-label);
  font-weight: var(--ds-fw-bold);
  letter-spacing: var(--ds-ls-caps);
  color: var(--ds-text-primary);
  text-transform: uppercase;
}

.fvg-subtitle {
  font-size: var(--ds-text-micro);
  color: var(--ds-text-faint);
  margin-top: 1px;
}

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

.legend-dot--bull { background: rgba(33, 150, 243, 0.7); }
.legend-dot--bear { background: rgba(244, 67, 54, 0.7); margin-left: 8px; }

.legend-txt {
  font-size: var(--ds-text-micro);
  font-weight: var(--ds-fw-semibold);
  color: var(--ds-text-faint);
}

.fvg-error {
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}
</style>
