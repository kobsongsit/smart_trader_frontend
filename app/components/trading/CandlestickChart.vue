<script setup lang="ts">
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts'
import type {
  IChartApi,
  ISeriesApi,
  SeriesType,
  DeepPartial,
  ChartOptions,
  CandlestickSeriesOptions,
  SeriesMarker,
  Time,
} from 'lightweight-charts'
import type { ChartTimeframe, ChartData } from '../../../types/trading'

interface Props {
  symbolId: number
}

const props = defineProps<Props>()

const { fetchChartData, isLoadingChart } = useChart()

// ─── State ───
const chartContainer = ref<HTMLElement | null>(null)
const selectedTimeframe = ref<ChartTimeframe>('1H')
const isLoading = computed(() => isLoadingChart(props.symbolId, selectedTimeframe.value))
const chartError = ref<string | null>(null)
const currentData = ref<ChartData | null>(null)

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
let resizeObserver: ResizeObserver | null = null

const timeframes: { value: ChartTimeframe; label: string }[] = [
  { value: '15m', label: '15m' },
  { value: '1H', label: '1H' },
  { value: '4H', label: '4H' },
  { value: '1D', label: '1D' },
]

// ─── Chart Configuration ───
const chartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { color: 'transparent' },
    textColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
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

  // ResizeObserver for responsive width
  resizeObserver = new ResizeObserver((entries) => {
    if (chart && entries.length > 0) {
      const { width } = entries[0].contentRect
      chart.applyOptions({ width })
    }
  })
  resizeObserver.observe(chartContainer.value)
}

// ─── Update Chart Data ───
function updateChartData(data: ChartData) {
  if (!chart || !candleSeries || !volumeSeries) return

  // Set candle data
  candleSeries.setData(data.candles as any)

  // Set volume data
  volumeSeries.setData(data.volume as any)

  // Update MA overlays
  updateOverlays(data)

  // Update signal markers
  updateSignalMarkers(data)

  // Fit content
  chart.timeScale().fitContent()
}

function updateOverlays(data: ChartData) {
  if (!data.overlays) return

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
  if (!candleSeries || !data.signals) return

  if (showSignals.value && data.signals.length > 0) {
    const markers: SeriesMarker<Time>[] = data.signals.map((sig) => ({
      time: sig.time as Time,
      position: sig.position,
      color: sig.color,
      shape: sig.shape,
      text: sig.text,
    }))
    candleSeries.setMarkers(markers)
  } else {
    candleSeries.setMarkers([])
  }
}

// ─── Fetch & Render ───
async function loadChart(forceRefresh = false) {
  chartError.value = null

  const data = await fetchChartData(props.symbolId, {
    timeframe: selectedTimeframe.value,
    forceRefresh,
  })

  if (data) {
    currentData.value = data
    updateChartData(data)
  } else {
    // Check for error
    const { getChartError } = useChart()
    const err = getChartError(props.symbolId, selectedTimeframe.value)
    if (err) chartError.value = err
  }
}

// ─── Watch timeframe changes ───
watch(selectedTimeframe, () => {
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
  if (resizeObserver && chartContainer.value) {
    resizeObserver.unobserve(chartContainer.value)
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chart) {
    chart.remove()
    chart = null
  }
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
    <div class="text-overline text-primary mb-2">
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

        <!-- Overlay toggles -->
        <div class="d-flex ga-1">
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

      <!-- Loading -->
      <div v-if="isLoading && !currentData" class="d-flex align-center justify-center" style="height: 350px;">
        <v-progress-circular indeterminate color="primary" size="32" />
      </div>

      <!-- Error -->
      <v-alert v-else-if="chartError && !currentData" type="error" variant="tonal" density="compact" class="mb-2">
        {{ chartError }}
      </v-alert>

      <!-- Chart Container -->
      <div
        ref="chartContainer"
        class="chart-container"
        :class="{ 'chart-loading': isLoading && currentData }"
      />

      <!-- Legend -->
      <div v-if="currentData" class="d-flex flex-wrap ga-2 mt-2">
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
.chart-container {
  width: 100%;
  min-height: 350px;
}

.chart-loading {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
