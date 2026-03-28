<script setup lang="ts">
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type IPriceLine,
  type UTCTimestamp,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type { FvgCandle, FvgZone, ChartTrade, BacktestTrade, SymbolItem } from '../../../types/trading'

dayjs.extend(utc)

// ─── Props & Emits ───────────────────────────────────────────
const props = defineProps<{
  candles: readonly FvgCandle[]
  fvgZones: readonly FvgZone[]
  trades: readonly ChartTrade[]
  backtestTrades: readonly BacktestTrade[]
  loading: boolean
  backtestLoading?: boolean  // กำลัง fetch backtest อยู่
  appendingData?: boolean    // true = กำลัง load more (อย่า fitContent)
  // fullscreen symbol/interval controls
  symbols?: readonly SymbolItem[]
  symbol?: string
  interval?: string
}>()

const emit = defineEmits<{
  'need-more-data': [leftEdgeTimestamp: number]
  'run-backtest': []
  'update:symbol': [symbol: string]
  'update:interval': [interval: string]
}>()

// ─── Template Ref ─────────────────────────────────────────────
const chartContainer = ref<HTMLDivElement | null>(null)

// ─── Chart Instances ──────────────────────────────────────────
let chart: IChartApi | null = null
let candleSeries: ISeriesApi<'Candlestick'> | null = null
let ema200Series: ISeriesApi<'Line'> | null = null
let markersPlugin: ISeriesMarkersPluginApi<Time> | null = null
let resizeObserver: ResizeObserver | null = null

// ─── Scroll Monitor ───────────────────────────────────────────
let scrollDebounce: ReturnType<typeof setTimeout> | null = null

function checkLeftEdge() {
  if (!chart || !props.candles.length) return
  const range = chart.timeScale().getVisibleRange()
  if (!range) return
  emit('need-more-data', range.from as number)
}

// ─── Fullscreen State ─────────────────────────────────────────
const isFullscreen = ref(false)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  // lock/unlock body scroll
  document.body.style.overflow = isFullscreen.value ? 'hidden' : ''
  // re-apply chart size after DOM update (ต้อง update ทั้ง width และ height)
  nextTick(() => {
    if (chart && chartContainer.value) {
      chart.applyOptions({
        width: chartContainer.value.clientWidth,
        height: chartContainer.value.clientHeight,
      })
    }
  })
}

// ESC key to exit fullscreen
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreen.value) toggleFullscreen()
}

// ─── Fibonacci State ──────────────────────────────────────────
type FibStep = 'idle' | 'picking'
const fibStep = ref<FibStep>('idle')
const fibPrice1 = ref<number | null>(null)
const fibHint = ref('')
let fibPriceLines: IPriceLine[] = []

// ─── Fullscreen symbol/interval controls ─────────────────────
const INTERVALS = ['15m', '1h', '4h', '1d'] as const

// ─── Layer Toggles ────────────────────────────────────────────
const showFvgMarkers = ref(true)
const showLiveTrades = ref(true)
const showBacktestTrades = ref(false)

// Trade price lines (SL ของ OPEN positions)
let tradePriceLines: IPriceLine[] = []

// Fibonacci levels with label + color
const FIB_LEVELS = [
  { ratio: 0,     label: '0%',    color: 'rgba(148, 163, 184, 0.8)' },
  { ratio: 0.236, label: '23.6%', color: 'rgba(255, 213, 79, 0.85)' },
  { ratio: 0.382, label: '38.2%', color: 'rgba(102, 187, 106, 0.9)' },
  { ratio: 0.5,   label: '50%',   color: 'rgba(255, 167, 38, 0.9)'  },
  { ratio: 0.618, label: '61.8%', color: 'rgba(255, 215, 0, 1)'     },
  { ratio: 0.786, label: '78.6%', color: 'rgba(171, 71, 188, 0.85)' },
  { ratio: 1,     label: '100%',  color: 'rgba(148, 163, 184, 0.8)' },
]

// ============================================================
// EMA Calculation (client-side)
// ============================================================

function calculateEMA(candles: readonly FvgCandle[], period: number) {
  if (candles.length < period) return []

  const multiplier = 2 / (period + 1)
  const result: Array<{ time: UTCTimestamp; value: number }> = []
  let ema = 0

  // Warm up: SMA สำหรับ period แรก
  for (let i = 0; i < period; i++) {
    ema += candles[i]!.close
  }
  ema /= period

  result.push({
    time: dayjs(candles[period - 1]!.timestamp).unix() as UTCTimestamp,
    value: ema,
  })

  // คำนวณ EMA ต่อ
  for (let i = period; i < candles.length; i++) {
    ema = (candles[i]!.close - ema) * multiplier + ema
    result.push({
      time: dayjs(candles[i]!.timestamp).unix() as UTCTimestamp,
      value: ema,
    })
  }

  return result
}

// ============================================================
// Fibonacci Drawing
// ============================================================

function clearFib() {
  if (!candleSeries) return
  for (const line of fibPriceLines) {
    candleSeries.removePriceLine(line)
  }
  fibPriceLines = []
  fibStep.value = 'idle'
  fibPrice1.value = null
  fibHint.value = ''
}

function drawFibLevels(p1: number, p2: number) {
  if (!candleSeries) return
  clearFib()

  const high = Math.max(p1, p2)
  const low = Math.min(p1, p2)
  const range = high - low

  for (const level of FIB_LEVELS) {
    const price = high - range * level.ratio
    const line = candleSeries.createPriceLine({
      price,
      color: level.color,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `Fib ${level.label}  ${price.toFixed(2)}`,
    })
    fibPriceLines.push(line)
  }
}

function toggleFibMode() {
  if (fibStep.value !== 'idle') {
    clearFib()
    return
  }
  fibStep.value = 'picking'
  fibHint.value = 'คลิกจุดที่ 1 บน chart'
}

function onChartClick(e: MouseEvent) {
  if (fibStep.value === 'idle' || !candleSeries || !chartContainer.value) return

  const rect = chartContainer.value.getBoundingClientRect()
  const y = e.clientY - rect.top
  const price = candleSeries.coordinateToPrice(y)
  if (price === null) return

  if (fibStep.value === 'picking' && fibPrice1.value === null) {
    // จุดที่ 1
    fibPrice1.value = price
    fibHint.value = 'คลิกจุดที่ 2 เพื่อวาด Fibonacci'
  } else if (fibPrice1.value !== null) {
    // จุดที่ 2 → วาดเลย
    drawFibLevels(fibPrice1.value, price)
    fibStep.value = 'idle'
    fibHint.value = ''
    fibPrice1.value = null
  }
}

// ============================================================
// Chart Lifecycle
// ============================================================

function initChart() {
  if (!chartContainer.value) return

  chart = createChart(chartContainer.value, {
    layout: {
      background: { color: 'transparent' },
      textColor: 'rgba(148, 163, 184, 0.9)',
      fontSize: 11,
    },
    grid: {
      vertLines: { color: 'rgba(51, 65, 85, 0.4)' },
      horzLines: { color: 'rgba(51, 65, 85, 0.4)' },
    },
    crosshair: {
      vertLine: { color: 'rgba(74, 222, 128, 0.4)', labelBackgroundColor: '#1A2234' },
      horzLine: { color: 'rgba(74, 222, 128, 0.4)', labelBackgroundColor: '#1A2234' },
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
      borderColor: 'rgba(51, 65, 85, 0.6)',
    },
    rightPriceScale: {
      borderColor: 'rgba(51, 65, 85, 0.6)',
    },
    handleScroll: true,
    handleScale: true,
  })

  // ─── EMA200 line (ใต้ candles) ───
  ema200Series = chart.addSeries(LineSeries, {
    color: 'rgba(255, 152, 0, 0.85)',
    lineWidth: 2,
    lineStyle: LineStyle.Solid,
    priceLineVisible: false,
    lastValueVisible: true,
    title: 'EMA200',
    crosshairMarkerVisible: false,
  })

  // ─── Candlestick series (บน EMA) ───
  candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderUpColor: '#26a69a',
    borderDownColor: '#ef5350',
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  })

  // ─── FVG markers ───
  markersPlugin = createSeriesMarkers(candleSeries)

  // ─── Resize observer ───
  resizeObserver = new ResizeObserver(() => {
    if (chart && chartContainer.value) {
      chart.applyOptions({
        width: chartContainer.value.clientWidth,
        height: chartContainer.value.clientHeight,
      })
    }
  })
  resizeObserver.observe(chartContainer.value)

  // ─── Scroll monitor — emit left edge ธ debounce 300ms ───
  chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
    if (scrollDebounce) clearTimeout(scrollDebounce)
    scrollDebounce = setTimeout(checkLeftEdge, 300)
  })
}

function updateCandles() {
  const series = candleSeries
  if (!series || !props.candles.length) return

  const chartData = props.candles.map(c => ({
    time: dayjs(c.timestamp).unix() as UTCTimestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }))

  series.setData(chartData)

  // คำนวณและ plot EMA200
  const ema200Data = calculateEMA(props.candles, 200)
  ema200Series?.setData(ema200Data)

  // ไม่ fitContent เมื่อ append data (user กำลัง scroll อยู่)
  if (!props.appendingData) {
    chart?.timeScale().fitContent()
  }
}

// ============================================================
// Marker Builders
// ============================================================

function buildFvgMarkers(): SeriesMarker<Time>[] {
  return props.fvgZones.map(zone => ({
    time: dayjs(zone.timestamp).unix() as UTCTimestamp,
    position: zone.type === 'BULLISH' ? 'belowBar' : 'aboveBar',
    shape: zone.type === 'BULLISH' ? 'arrowUp' : 'arrowDown',
    color: zone.type === 'BULLISH' ? '#2196F3' : '#f44336',
    size: 1.2,
    text: 'FVG',
  }))
}

function exitMarkerConfig(reason: string | null): { color: string; text: string } {
  switch (reason) {
    case 'SL':               return { color: '#ef4444', text: 'SL' }
    case 'TP':               return { color: '#22c55e', text: 'TP' }
    case 'OPPOSITE_SIGNAL':  return { color: '#f59e0b', text: 'SIG' }
    case 'MANUAL':           return { color: '#94a3b8', text: 'MNL' }
    default:                 return { color: '#94a3b8', text: 'EXIT' }
  }
}

function buildTradeMarkers(): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = []

  for (const trade of props.trades) {
    const isBuy = trade.action === 'BUY'

    // ── Entry marker ──
    markers.push({
      time: trade.entryTimestamp as UTCTimestamp,
      position: isBuy ? 'belowBar' : 'aboveBar',
      shape: isBuy ? 'arrowUp' : 'arrowDown',
      color: isBuy ? '#10b981' : '#ef4444',
      size: 2,
      text: trade.action,
    })

    // ── Exit marker (CLOSED only) ──
    if (trade.status === 'CLOSED' && trade.exitTimestamp !== null) {
      const cfg = exitMarkerConfig(trade.exitReason)
      markers.push({
        time: trade.exitTimestamp as UTCTimestamp,
        position: isBuy ? 'aboveBar' : 'belowBar',
        shape: 'circle',
        color: cfg.color,
        size: 1.5,
        text: cfg.text,
      })
    }
  }

  return markers
}

function backtestExitMarkerConfig(reason: string | null): { color: string; text: string } {
  switch (reason) {
    case 'SL':               return { color: '#ef4444', text: 'BT·SL' }
    case 'TP':               return { color: '#22c55e', text: 'BT·TP' }
    case 'OPPOSITE_SIGNAL':  return { color: '#f59e0b', text: 'BT·SIG' }
    case 'MANUAL':           return { color: '#94a3b8', text: 'BT·MNL' }
    default:                 return { color: '#94a3b8', text: 'BT·EXIT' }
  }
}

function buildBacktestMarkers(): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = []

  for (const trade of props.backtestTrades) {
    const isBuy = trade.action === 'BUY'

    // ── Entry marker — blue (#60a5fa) BUY, purple (#c084fc) SELL ──
    markers.push({
      time: trade.entryTimestamp as UTCTimestamp,
      position: isBuy ? 'belowBar' : 'aboveBar',
      shape: isBuy ? 'arrowUp' : 'arrowDown',
      color: isBuy ? '#60a5fa' : '#c084fc',
      size: 2,
      text: `BT·${trade.action}`,
    })

    // ── Exit marker — square shape (แยกจาก live ที่เป็น circle) ──
    const cfg = backtestExitMarkerConfig(trade.exitReason)
    markers.push({
      time: trade.exitTimestamp as UTCTimestamp,
      position: isBuy ? 'aboveBar' : 'belowBar',
      shape: 'square',
      color: cfg.color,
      size: 1.2,
      text: cfg.text,
    })
  }

  return markers
}

/** Merge FVG + Live + Backtest markers แล้ว set ทีเดียว */
function refreshMarkers() {
  if (!markersPlugin) return

  const all = [
    ...(showFvgMarkers.value ? buildFvgMarkers() : []),
    ...(showLiveTrades.value ? buildTradeMarkers() : []),
    ...(showBacktestTrades.value ? buildBacktestMarkers() : []),
  ].sort((a, b) => (a.time as number) - (b.time as number))

  markersPlugin.setMarkers(all)
}

// ============================================================
// Trade Price Lines (SL ของ OPEN positions)
// ============================================================

function clearTradePriceLines() {
  if (!candleSeries) return
  for (const line of tradePriceLines) {
    try { candleSeries.removePriceLine(line) } catch { /* already removed */ }
  }
  tradePriceLines = []
}

function updateTradePriceLines() {
  if (!candleSeries) return
  for (const trade of props.trades) {
    if (trade.status !== 'OPEN' || trade.slPrice === null) continue
    const isBuy = trade.action === 'BUY'
    const line = candleSeries.createPriceLine({
      price: trade.slPrice,
      color: 'rgba(239, 68, 68, 0.55)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `SL · ${trade.action}`,
    })
    tradePriceLines.push(line)
  }
}

// ─── Watch props ───────────────────────────────────────────────
watch(() => props.candles, () => {
  clearFib()
  updateCandles()
  refreshMarkers()
}, { deep: false })

watch(() => props.fvgZones, () => {
  refreshMarkers()
}, { deep: false })

watch(() => props.trades, () => {
  clearTradePriceLines()
  updateTradePriceLines()
  refreshMarkers()
}, { deep: false })

watch(() => props.backtestTrades, (newVal) => {
  // auto-show markers เมื่อโหลด backtest เสร็จครั้งแรก
  if (newVal.length > 0) showBacktestTrades.value = true
  refreshMarkers()
}, { deep: false })

watch(showFvgMarkers, () => refreshMarkers())

watch(showLiveTrades, () => {
  clearTradePriceLines()
  if (showLiveTrades.value) updateTradePriceLines()
  refreshMarkers()
})

watch(showBacktestTrades, () => {
  refreshMarkers()
})

// ─── Lifecycle ─────────────────────────────────────────────────
onMounted(() => {
  initChart()
  if (props.candles.length) {
    updateCandles()
    updateTradePriceLines()
    refreshMarkers()
  }
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  clearTradePriceLines()
  chart?.remove()
  chart = null
  candleSeries = null
  ema200Series = null
  markersPlugin = null
  fibPriceLines = []
  tradePriceLines = []
  if (scrollDebounce) clearTimeout(scrollDebounce)
  window.removeEventListener('keydown', onKeydown)
  // cleanup body scroll lock ถ้า unmount ขณะ fullscreen
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="fvg-chart-wrapper" :class="{ 'fvg-chart-wrapper--fullscreen': isFullscreen }">

    <!-- ─── Toolbar ─── -->
    <div class="chart-toolbar">

      <!-- ─── Fullscreen: Symbol + Interval selector ─── -->
      <template v-if="isFullscreen && symbols?.length">
        <select
          class="fs-symbol-select"
          :value="symbol"
          @change="emit('update:symbol', ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="s in symbols"
            :key="s.symbol"
            :value="s.symbol"
          >
            {{ s.symbol }}
          </option>
        </select>

        <div class="fs-interval-group">
          <button
            v-for="iv in INTERVALS"
            :key="iv"
            class="fs-interval-btn"
            :class="{ 'fs-interval-btn--active': interval === iv }"
            @click="emit('update:interval', iv)"
          >
            {{ iv }}
          </button>
        </div>

        <div class="toolbar-divider" />
      </template>

      <!-- EMA200 badge -->
      <div class="toolbar-badge">
        <span class="badge-dot badge-dot--ema" />
        <span class="badge-txt">EMA200</span>
      </div>

      <div class="toolbar-divider" />

      <!-- FVG toggle -->
      <button
        class="toolbar-btn toolbar-btn--layer"
        :class="{ 'toolbar-btn--layer-active toolbar-btn--layer-fvg': showFvgMarkers }"
        @click="showFvgMarkers = !showFvgMarkers"
      >
        <span class="layer-dot layer-dot--fvg" />
        FVG
      </button>

      <!-- Live Trades toggle -->
      <button
        class="toolbar-btn toolbar-btn--layer"
        :class="{ 'toolbar-btn--layer-active': showLiveTrades }"
        @click="showLiveTrades = !showLiveTrades"
      >
        <span class="layer-dot layer-dot--live" />
        Live
      </button>

      <!-- Backtest group: Run button + toggle -->
      <div class="backtest-group">
        <!-- Run backtest button -->
        <button
          class="toolbar-btn toolbar-btn--run-bt"
          :class="{ 'toolbar-btn--run-bt-loading': backtestLoading }"
          :disabled="backtestLoading"
          @click="emit('run-backtest')"
        >
          <v-progress-circular
            v-if="backtestLoading"
            indeterminate
            size="10"
            width="1.5"
            color="#60a5fa"
            class="mr-1"
          />
          <v-icon v-else icon="mdi-play" size="12" class="mr-1" />
          {{ backtestLoading ? 'Loading...' : 'Backtest' }}
        </button>

        <!-- Show/hide backtest markers toggle -->
        <button
          v-if="backtestTrades.length > 0"
          class="toolbar-btn toolbar-btn--bt-eye"
          :class="{ 'toolbar-btn--bt-eye-active': showBacktestTrades }"
          :title="showBacktestTrades ? 'ซ่อน backtest markers' : 'แสดง backtest markers'"
          @click="showBacktestTrades = !showBacktestTrades"
        >
          <v-icon :icon="showBacktestTrades ? 'mdi-eye' : 'mdi-eye-off'" size="12" />
        </button>
      </div>

      <div class="toolbar-divider" />

      <!-- Fibonacci controls -->
      <button
        class="toolbar-btn"
        :class="{ 'toolbar-btn--active': fibStep !== 'idle' }"
        @click="toggleFibMode"
      >
        <v-icon icon="mdi-vector-triangle" size="14" class="mr-1" />
        {{ fibStep !== 'idle' ? 'ยกเลิก' : 'วาด Fib' }}
      </button>

      <button
        v-if="fibPriceLines.length > 0"
        class="toolbar-btn toolbar-btn--danger"
        @click="clearFib"
      >
        <v-icon icon="mdi-close" size="14" class="mr-1" />
        ล้าง Fib
      </button>

      <!-- Hint text เมื่ออยู่ใน drawing mode -->
      <Transition name="fade">
        <span v-if="fibHint" class="toolbar-hint">
          <v-icon icon="mdi-cursor-pointer" size="12" class="mr-1" />
          {{ fibHint }}
        </span>
      </Transition>

      <!-- Spacer -->
      <div class="flex-grow-1" />

      <!-- Fullscreen toggle -->
      <button class="toolbar-btn toolbar-btn--fs" @click="toggleFullscreen">
        <v-icon :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'" size="16" />
      </button>
    </div>

    <!-- ─── Loading overlay ─── -->
    <Transition name="fade">
      <div v-if="loading" class="fvg-chart-loading">
        <v-progress-circular indeterminate color="primary" size="32" />
        <span class="mt-2 text-caption text-label-muted">กำลังโหลด...</span>
      </div>
    </Transition>

    <!-- ─── Chart canvas ─── -->
    <div
      ref="chartContainer"
      class="fvg-chart-canvas"
      :class="{ 'fvg-chart-canvas--picking': fibStep !== 'idle' }"
      @click="onChartClick"
    />

  </div>
</template>

<style scoped>
.fvg-chart-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* ─── Fullscreen overlay ─── */
.fvg-chart-wrapper--fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1001;
  background: rgb(17, 22, 32);
  border-radius: 0;
}

/* ─── Fullscreen Symbol + Interval Controls ─── */
.fs-symbol-select {
  appearance: none;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(51, 65, 85, 0.8);
  border-radius: 6px;
  color: rgb(226, 232, 240);
  font-size: 0.7rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.04em;
  padding: 3px 24px 3px 10px;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2364748b'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  transition: border-color 0.15s;
}

.fs-symbol-select:focus {
  outline: none;
  border-color: rgba(74, 222, 128, 0.5);
}

.fs-interval-group {
  display: flex;
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 6px;
  overflow: hidden;
}

.fs-interval-btn {
  padding: 3px 9px;
  background: transparent;
  border: none;
  border-right: 1px solid rgba(51, 65, 85, 0.7);
  color: rgb(100, 116, 139);
  font-size: 0.63rem;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  transition: all 0.15s;
}

.fs-interval-btn:last-child {
  border-right: none;
}

.fs-interval-btn:hover {
  background: rgba(74, 222, 128, 0.06);
  color: rgb(226, 232, 240);
}

.fs-interval-btn--active {
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
}

/* ─── Toolbar ─── */
.chart-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(23, 30, 45, 0.8);
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  flex-wrap: wrap;
}

.toolbar-badge {
  display: flex;
  align-items: center;
  gap: 5px;
}

.badge-dot {
  width: 10px;
  height: 3px;
  border-radius: 2px;
}

.badge-dot--ema {
  background: rgba(255, 152, 0, 0.9);
}

.badge-txt {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgb(148, 163, 184);
  letter-spacing: 0.05em;
}

.toolbar-divider {
  width: 1px;
  height: 16px;
  background: rgba(51, 65, 85, 0.8);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid rgba(51, 65, 85, 0.7);
  background: transparent;
  color: rgb(148, 163, 184);
  font-size: 0.65rem;
  font-weight: 600;
  font-family: 'Noto Sans Thai', sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.03em;
}

.toolbar-btn:hover {
  border-color: rgba(74, 222, 128, 0.4);
  color: rgb(226, 232, 240);
  background: rgba(74, 222, 128, 0.05);
}

.toolbar-btn--active {
  border-color: rgba(255, 213, 79, 0.6);
  color: rgb(255, 213, 79);
  background: rgba(255, 213, 79, 0.08);
}

.toolbar-btn--danger {
  border-color: rgba(244, 67, 54, 0.4);
  color: rgba(244, 67, 54, 0.85);
}

.toolbar-btn--danger:hover {
  border-color: rgba(244, 67, 54, 0.7);
  background: rgba(244, 67, 54, 0.08);
}

/* ─── Layer toggle buttons ─── */
.toolbar-btn--layer {
  gap: 5px;
  opacity: 0.45;
}

.toolbar-btn--layer:hover {
  opacity: 0.75;
  border-color: rgba(51, 65, 85, 0.9);
  background: transparent;
  color: rgb(148, 163, 184);
}

.toolbar-btn--layer-active {
  opacity: 1;
  border-color: rgba(16, 185, 129, 0.45);
  color: rgb(226, 232, 240);
  background: rgba(16, 185, 129, 0.06);
}

.toolbar-btn--layer-active.toolbar-btn--layer-fvg {
  border-color: rgba(33, 150, 243, 0.45);
  background: rgba(33, 150, 243, 0.06);
}

.toolbar-btn--layer-active.toolbar-btn--layer-bt {
  border-color: rgba(96, 165, 250, 0.45);
  background: rgba(96, 165, 250, 0.06);
}

.layer-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.layer-dot--fvg {
  background: #2196F3;
}

.layer-dot--live {
  background: #10b981;
}

.layer-dot--bt {
  background: #60a5fa;
}

/* ─── Backtest group (Run button + eye toggle) ─── */
.backtest-group {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 6px;
  overflow: hidden;
}

.toolbar-btn--run-bt {
  border: none;
  border-radius: 0;
  color: #60a5fa;
  gap: 4px;
  padding: 3px 10px;
  background: rgba(96, 165, 250, 0.06);
  transition: all 0.15s ease;
}

.toolbar-btn--run-bt:hover:not(:disabled) {
  background: rgba(96, 165, 250, 0.14);
  color: #93c5fd;
  border-color: transparent;
}

.toolbar-btn--run-bt:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.toolbar-btn--run-bt-loading {
  color: rgba(96, 165, 250, 0.6);
}

.toolbar-btn--bt-eye {
  border: none;
  border-left: 1px solid rgba(96, 165, 250, 0.25);
  border-radius: 0;
  padding: 3px 7px;
  color: rgba(96, 165, 250, 0.45);
  background: rgba(96, 165, 250, 0.04);
  transition: all 0.15s ease;
}

.toolbar-btn--bt-eye:hover {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
  border-color: rgba(96, 165, 250, 0.25);
}

.toolbar-btn--bt-eye-active {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
}

.toolbar-hint {
  font-size: 0.62rem;
  color: rgb(255, 213, 79);
  display: flex;
  align-items: center;
  animation: pulse-hint 1.5s ease-in-out infinite;
}

@keyframes pulse-hint {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ─── Chart canvas ─── */
.fvg-chart-canvas {
  width: 100%;
  height: 250px;
}

/* ─── Fullscreen: chart fills all space below toolbar ─── */
.fvg-chart-wrapper--fullscreen .fvg-chart-canvas {
  height: calc(100dvh - 44px);
}

.fvg-chart-canvas--picking {
  cursor: crosshair;
}

/* ─── Loading overlay ─── */
.fvg-chart-loading {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(17, 22, 32, 0.7);
  backdrop-filter: blur(4px);
}

/* ─── Transitions ─── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
