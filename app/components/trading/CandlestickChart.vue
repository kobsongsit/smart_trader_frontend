<script setup lang="ts">
import { createChart, createSeriesMarkers, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts'
import type {
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  SeriesType,
  DeepPartial,
  ChartOptions,
  CandlestickSeriesOptions,
  SeriesMarker,
  Time,
  LogicalRange,
} from 'lightweight-charts'
import type { ChartTimeframe, ChartData } from '../../../types/trading'

interface Props {
  symbolId: number
}

const props = defineProps<Props>()

const { fetchChartData, fetchOlderChartData, isLoadingChart, isFetchingOlder, getHasMore, clearTimelineForTf } = useChart()

// ─── State ───
const chartContainer = ref<HTMLElement | null>(null)
const selectedTimeframe = ref<ChartTimeframe>('1H')
const isLoading = computed(() => isLoadingChart(props.symbolId, selectedTimeframe.value))
const chartError = ref<string | null>(null)
const currentData = ref<ChartData | null>(null)

// Infinite scroll state
const isLoadingOlder = ref(false)
const hasMoreData = ref(true)

// Overlay toggles
const showMA = ref(true)
const showBB = ref(true)
const showSignals = ref(true)

// Chart instance references
let chart: IChartApi | null = null
let candleSeries: ISeriesApi<SeriesType> | null = null
let volumeSeries: ISeriesApi<SeriesType> | null = null
let sma50Series: ISeriesApi<SeriesType> | null = null
let sma200Series: ISeriesApi<SeriesType> | null = null
let ema20Series: ISeriesApi<SeriesType> | null = null
let bbUpperSeries: ISeriesApi<SeriesType> | null = null
let bbMiddleSeries: ISeriesApi<SeriesType> | null = null
let bbLowerSeries: ISeriesApi<SeriesType> | null = null
let seriesMarkers: ISeriesMarkersPluginApi<Time> | null = null
let resizeObserver: ResizeObserver | null = null

/** Debounce timer สำหรับ scroll detection — ป้องกัน spam API */
let scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null

const timeframes: { value: ChartTimeframe; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1H', label: '1H' },
  { value: '4H', label: '4H' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
]

/** Default candle limit per timeframe — ให้ได้ช่วงเวลาที่เหมาะสมกับแต่ละ interval */
const TIMEFRAME_LIMITS: Record<ChartTimeframe, number> = {
  '1m': 500,   // ~8 ชม.
  '5m': 500,   // ~1.7 วัน
  '15m': 200,  // ~2 วัน
  '1H': 200,   // ~8 วัน
  '4H': 200,   // ~33 วัน
  '1D': 200,   // ~200 วัน
  '1W': 200,   // ~4 ปี
  '1M': 200,   // ~16 ปี
}

/** Threshold: เมื่อ visible range เริ่มที่ index < นี้ → trigger fetch older data */
const SCROLL_THRESHOLD = 10

/** Debounce delay (ms) สำหรับ scroll detection */
const SCROLL_DEBOUNCE_MS = 300

/** Overlay พร้อมใช้ทุก timeframe (backend ส่ง overlay กลับมาครบทุก TF) */
const hasOverlays = computed(() => true)

// ─── Chart Configuration ───
const chartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { color: 'transparent' },
    textColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
  },
  grid: {
    vertLines: { color: 'rgba(255, 255, 255, 0.06)' },
    horzLines: { color: 'rgba(255, 255, 255, 0.06)' },
  },
  crosshair: {
    vertLine: { color: 'rgba(255, 255, 255, 0.2)', width: 1, labelBackgroundColor: '#1E1E1E' },
    horzLine: { color: 'rgba(255, 255, 255, 0.2)', width: 1, labelBackgroundColor: '#1E1E1E' },
  },
  rightPriceScale: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeScale: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    timeVisible: true,
    secondsVisible: false,
  },
  handleScroll: { vertTouchDrag: false },
}

const candleOptions: DeepPartial<CandlestickSeriesOptions> = {
  upColor: '#4CAF50',
  downColor: '#FF5252',
  borderUpColor: '#4CAF50',
  borderDownColor: '#FF5252',
  wickUpColor: '#4CAF50',
  wickDownColor: '#FF5252',
}

// ─── Create Chart ───
function createChartInstance() {
  if (!chartContainer.value) return

  chart = createChart(chartContainer.value, {
    ...chartOptions,
    width: chartContainer.value.clientWidth,
    height: 350,
  })

  // Candlestick series
  candleSeries = chart.addSeries(CandlestickSeries, candleOptions)

  // Signal markers (v5: ใช้ createSeriesMarkers แทน series.setMarkers)
  seriesMarkers = createSeriesMarkers(candleSeries)

  // Volume series (histogram below candles)
  volumeSeries = chart.addSeries(HistogramSeries, {
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
  })

  // Volume scale configuration
  chart.priceScale('volume').applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
  })

  // MA overlay series
  sma50Series = chart.addSeries(LineSeries, {
    color: '#2196F3',
    lineWidth: 1,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
  })

  sma200Series = chart.addSeries(LineSeries, {
    color: '#FB8C00',
    lineWidth: 1,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
  })

  ema20Series = chart.addSeries(LineSeries, {
    color: '#FFD54F',
    lineWidth: 1,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
  })

  // Bollinger Bands series
  bbUpperSeries = chart.addSeries(LineSeries, {
    color: 'rgba(156, 39, 176, 0.5)',
    lineWidth: 1,
    lineStyle: 2, // dashed
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
  })

  bbMiddleSeries = chart.addSeries(LineSeries, {
    color: 'rgba(156, 39, 176, 0.7)',
    lineWidth: 1,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
  })

  bbLowerSeries = chart.addSeries(LineSeries, {
    color: 'rgba(156, 39, 176, 0.5)',
    lineWidth: 1,
    lineStyle: 2, // dashed
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
  })

  // ─── Infinite Scroll: detect when user scrolls near the left edge ───
  chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange)

  // ResizeObserver for responsive width
  resizeObserver = new ResizeObserver((entries) => {
    if (chart && entries.length > 0) {
      const { width } = entries[0]!.contentRect
      chart.applyOptions({ width })
    }
  })
  resizeObserver.observe(chartContainer.value)
}

// ─── Scroll Detection (debounced) ───
function onVisibleRangeChange(logicalRange: LogicalRange | null) {
  if (!logicalRange) return

  // ถ้า visible range เริ่มที่ index < THRESHOLD → trigger fetch older data
  if (logicalRange.from < SCROLL_THRESHOLD && !isLoadingOlder.value && hasMoreData.value) {
    // Debounce เพื่อป้องกัน rapid scroll spam API
    if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer)
    scrollDebounceTimer = setTimeout(() => {
      loadOlderCandles()
    }, SCROLL_DEBOUNCE_MS)
  }
}

// ─── Load Older Candles (Infinite Scroll) ───
async function loadOlderCandles() {
  if (!chart || isLoadingOlder.value || !hasMoreData.value) return

  isLoadingOlder.value = true

  try {
    // 1. เก็บ current visible logical range ก่อน (เพื่อ restore position หลัง prepend)
    const oldRange = chart.timeScale().getVisibleLogicalRange()

    // 2. Fetch older data
    const { data: mergedData, addedCount } = await fetchOlderChartData(
      props.symbolId,
      selectedTimeframe.value,
      { limit: TIMEFRAME_LIMITS[selectedTimeframe.value] }
    )

    if (mergedData && addedCount > 0) {
      // 3. Update chart with merged data
      currentData.value = mergedData
      updateChartData(mergedData, false) // ไม่ fitContent — จะ restore position เอง

      // 4. Restore scroll position ไม่ให้กราฟกระโดด
      //    candle ใหม่ถูก prepend → index ทุกตัวเดิมเลื่อนขวา addedCount ตำแหน่ง
      if (oldRange) {
        chart.timeScale().setVisibleLogicalRange({
          from: oldRange.from + addedCount,
          to: oldRange.to + addedCount,
        })
      }
    }

    // 5. Update hasMore state
    hasMoreData.value = getHasMore(props.symbolId, selectedTimeframe.value)
  } finally {
    isLoadingOlder.value = false
  }
}

// ─── Determine price precision based on price range ───
function getPriceFormat(candles: ChartData['candles']) {
  if (!candles || candles.length === 0) return { precision: 2, minMove: 0.01 }

  const samplePrice = candles[candles.length - 1]!.close
  if (samplePrice < 0.01) return { precision: 8, minMove: 0.00000001 }
  if (samplePrice < 1) return { precision: 5, minMove: 0.00001 }
  if (samplePrice < 100) return { precision: 4, minMove: 0.0001 }
  return { precision: 2, minMove: 0.01 }
}

// ─── Update Chart Data ───
function updateChartData(data: ChartData, shouldFitContent = true) {
  if (!chart || !candleSeries || !volumeSeries) return

  // Apply price precision based on price range
  const pf = getPriceFormat(data.candles)
  candleSeries.applyOptions({
    priceFormat: { type: 'price', precision: pf.precision, minMove: pf.minMove },
  })

  // Set candle data
  candleSeries.setData(data.candles as any)

  // Set volume data
  volumeSeries.setData(data.volume as any)

  // Update MA overlays
  updateOverlays(data)

  // Update signal markers
  updateSignalMarkers(data)

  // Fit content (only on initial load, not on infinite scroll prepend)
  if (shouldFitContent) {
    chart.timeScale().fitContent()
  }
}

function updateOverlays(data: ChartData) {
  if (!data.overlays || !hasOverlays.value) {
    // Clear all overlay series when no overlay data available
    sma50Series?.setData([])
    sma200Series?.setData([])
    ema20Series?.setData([])
    bbUpperSeries?.setData([])
    bbMiddleSeries?.setData([])
    bbLowerSeries?.setData([])
    return
  }

  // MA lines
  if (showMA.value) {
    sma50Series?.setData(data.overlays.sma50 as any)
    sma200Series?.setData(data.overlays.sma200 as any)
    ema20Series?.setData(data.overlays.ema20 as any)
  } else {
    sma50Series?.setData([])
    sma200Series?.setData([])
    ema20Series?.setData([])
  }

  // Bollinger Bands
  if (showBB.value) {
    bbUpperSeries?.setData(data.overlays.bbUpper as any)
    bbMiddleSeries?.setData(data.overlays.bbMiddle as any)
    bbLowerSeries?.setData(data.overlays.bbLower as any)
  } else {
    bbUpperSeries?.setData([])
    bbMiddleSeries?.setData([])
    bbLowerSeries?.setData([])
  }
}

function updateSignalMarkers(data: ChartData) {
  if (!seriesMarkers || !data.signals) return

  if (showSignals.value && data.signals.length > 0) {
    const markers: SeriesMarker<Time>[] = data.signals.map((sig) => ({
      time: sig.time as Time,
      position: sig.position,
      color: sig.color,
      shape: sig.shape,
      text: sig.text,
    }))
    seriesMarkers.setMarkers(markers)
  } else {
    seriesMarkers.setMarkers([])
  }
}

// ─── Fetch & Render ───
async function loadChart(forceRefresh = false) {
  chartError.value = null

  // Reset infinite scroll state for new load
  hasMoreData.value = true

  const tf = selectedTimeframe.value
  const data = await fetchChartData(props.symbolId, {
    timeframe: tf,
    limit: TIMEFRAME_LIMITS[tf],
    includeOverlays: hasOverlays.value,
    forceRefresh,
  })

  if (data) {
    currentData.value = data
    updateChartData(data)
    // Sync hasMore from cache
    hasMoreData.value = getHasMore(props.symbolId, tf)
  } else {
    // Check for error
    const { getChartError } = useChart()
    const err = getChartError(props.symbolId, selectedTimeframe.value)
    if (err) chartError.value = err
  }
}

// ─── Watch timeframe changes ───
watch(selectedTimeframe, (_newTf, oldTf) => {
  // Reset timeline cache สำหรับ TF เก่า (ป้องกัน memory leak)
  if (oldTf) {
    clearTimelineForTf(props.symbolId, oldTf)
  }
  // Reset infinite scroll state
  hasMoreData.value = true
  isLoadingOlder.value = false
  // Load new TF
  loadChart()
})

// ─── Watch overlay toggle changes ───
watch([showMA, showBB, showSignals], () => {
  if (currentData.value) {
    updateOverlays(currentData.value)
    updateSignalMarkers(currentData.value)
  }
})

// ─── Lifecycle ───
onMounted(() => {
  createChartInstance()
  loadChart()
})

onBeforeUnmount(() => {
  // Clear debounce timer
  if (scrollDebounceTimer) {
    clearTimeout(scrollDebounceTimer)
    scrollDebounceTimer = null
  }

  if (resizeObserver && chartContainer.value) {
    resizeObserver.unobserve(chartContainer.value)
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chart) {
    chart.remove()
    chart = null
  }
  seriesMarkers = null
  candleSeries = null
  volumeSeries = null
  sma50Series = null
  sma200Series = null
  ema20Series = null
  bbUpperSeries = null
  bbMiddleSeries = null
  bbLowerSeries = null
})
</script>

<template>
  <div>
    <div class="text-overline font-weight-bold mb-2 text-label-muted">
      <v-icon icon="mdi-chart-waterfall" size="16" class="mr-1" />
      Candlestick Chart
    </div>

    <v-sheet rounded="lg" class="glass-sheet pa-3">
      <!-- Timeframe selector + Overlay toggles -->
      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
        <!-- Timeframe -->
        <v-btn-toggle
          v-model="selectedTimeframe"
          mandatory
          density="compact"
          variant="outlined"
          divided
          rounded="lg"
          color="primary"
        >
          <v-btn
            v-for="tf in timeframes"
            :key="tf.value"
            :value="tf.value"
            size="x-small"
            class="text-caption"
          >
            {{ tf.label }}
          </v-btn>
        </v-btn-toggle>

        <!-- Overlay toggles (MA / BB / Signals) -->
        <div v-if="hasOverlays" class="d-flex ga-1">
          <v-chip
            size="x-small"
            :variant="showMA ? 'flat' : 'outlined'"
            :color="showMA ? 'info' : 'grey'"
            rounded="lg"
            @click="showMA = !showMA"
          >
            MA
          </v-chip>
          <v-chip
            size="x-small"
            :variant="showBB ? 'flat' : 'outlined'"
            :color="showBB ? 'purple' : 'grey'"
            rounded="lg"
            @click="showBB = !showBB"
          >
            BB
          </v-chip>
          <v-chip
            size="x-small"
            :variant="showSignals ? 'flat' : 'outlined'"
            :color="showSignals ? 'success' : 'grey'"
            rounded="lg"
            @click="showSignals = !showSignals"
          >
            Signals
          </v-chip>
        </div>
      </div>

      <!-- Loading (initial) -->
      <div v-if="isLoading && !currentData" class="d-flex align-center justify-center" style="height: 350px;">
        <v-progress-circular indeterminate color="primary" size="32" />
      </div>

      <!-- Error -->
      <v-alert v-else-if="chartError && !currentData" type="error" variant="tonal" density="compact" class="mb-2">
        {{ chartError }}
      </v-alert>

      <!-- Chart Container (with loading older indicator) -->
      <div class="chart-wrapper">
        <!-- Loading older data spinner (ขอบซ้ายของ chart) -->
        <Transition name="fade">
          <div v-if="isLoadingOlder" class="chart-loading-older">
            <v-progress-circular indeterminate color="primary" size="20" width="2" />
          </div>
        </Transition>

        <div
          ref="chartContainer"
          class="chart-container"
          :class="{ 'chart-loading': isLoading && currentData }"
        />

        <!-- "No more data" indicator -->
        <Transition name="fade">
          <div v-if="!hasMoreData && currentData" class="chart-no-more">
            <v-icon icon="mdi-history" size="12" class="mr-1" />
            <span class="text-caption">No older data</span>
          </div>
        </Transition>
      </div>

      <!-- Legend -->
      <div v-if="currentData && hasOverlays" class="d-flex flex-wrap ga-2 mt-2">
        <div v-if="showMA" class="d-flex align-center ga-1">
          <span class="legend-dot" style="background: #2196F3;" />
          <span class="text-caption text-medium-emphasis">SMA50</span>
        </div>
        <div v-if="showMA" class="d-flex align-center ga-1">
          <span class="legend-dot" style="background: #FB8C00;" />
          <span class="text-caption text-medium-emphasis">SMA200</span>
        </div>
        <div v-if="showMA" class="d-flex align-center ga-1">
          <span class="legend-dot" style="background: #FFD54F;" />
          <span class="text-caption text-medium-emphasis">EMA20</span>
        </div>
        <div v-if="showBB" class="d-flex align-center ga-1">
          <span class="legend-dot" style="background: #9C27B0;" />
          <span class="text-caption text-medium-emphasis">BB</span>
        </div>
      </div>
    </v-sheet>
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
}

.chart-container {
  width: 100%;
  min-height: 350px;
}

.chart-loading {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

/* Loading older data spinner — ซ้ายบนของ chart */
.chart-loading-older {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(30, 30, 30, 0.8);
  border-radius: 8px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(4px);
}

/* "No more data" indicator — ซ้ายล่าง */
.chart-no-more {
  position: absolute;
  bottom: 28px;
  left: 8px;
  z-index: 10;
  background: rgba(30, 30, 30, 0.7);
  border-radius: 6px;
  padding: 2px 8px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.4);
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
