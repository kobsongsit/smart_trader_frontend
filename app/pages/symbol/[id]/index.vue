<script setup lang="ts">
import type {
  TrendCacheDirection,
  IndicatorInterval,
  RawIndicators,
  LatestPriceData,
  TrendsResponse,
  ValidationData,
  SignalData,
  DerivedSignals,
  BBPosition,
  IndicatorSummaryCount,
  OverallBias,
  IchimokuSignals,
} from '../../../../types/trading'
import {
  formatPrice,
  formatPriceChange,
  formatTimeAgo,
  formatNumber,
  formatTimeRemaining,
  getPriceChangeColor,
  getTrendCacheColor,
  getTrendCacheIcon,
  getTrendStrengthColor,
  getBiasColor,
  getBiasIcon,
  getConsensusColor,
  getValidationStatusColor,
  getValidationStatusIcon,
  getStrategyColor,
  getStrategyIcon,
  getConfidenceColor,
  getPerformanceStatusColor,
  getDivergenceColor,
  getCrossoverLabel,
  getBBPositionLabelText,
  getBBPositionLabelColor,
  getIchimokuTKColor,
  getIchimokuCloudPosColor,
  getIchimokuCloudColorHelper,
} from '../../../../types/trading'

// ─── Route params ───
const route = useRoute()
const symbolId = computed(() => Number(route.params.id))

// ─── Composables (all singletons) ───
const { fetchPrice, getCachedPrice, isLoadingPrice } = usePrice()

const { fetchTrends, getCachedTrends } = useTrends()

const {
  fetchIndicators,
  getCached: getCachedIndicator,
  getSignalCount,
  getDerivedSignals,
  getBBPosition,
  getServerSummary,
  getIchimokuSignals,
  error: indicatorError,
} = useIndicators()

const { fetchValidation, getCachedValidation } = useValidation()

const { fetchLatestSignal, currentSignal, isAnalyzing: isSignalAnalyzing } = useSignals()

const {
  getCachedSummary,
  fetchSymbolSummary,
  checkFreshness,
  isAIAnalyzing,
  analyzeSignal,
  analyzeError,
} = useAnalysis()

const { subscribeSymbol, unsubscribeSymbol } = useSocket()

// ─── Constants ───
const TIMEFRAMES: IndicatorInterval[] = ['15m', '1h', '4h', '1d']

// ─── Loading state ───
const pageReady = ref(false)
const indicatorsLoading = ref(false)
const isRefreshing = ref(false)

// ─── Reactive data from composables ───
const priceData = computed((): LatestPriceData | undefined => getCachedPrice(symbolId.value))
const trendsData = computed((): TrendsResponse | undefined => getCachedTrends(symbolId.value))
const validationData = computed((): ValidationData | undefined => getCachedValidation(symbolId.value))
const signalData = computed((): SignalData | null => currentSignal.value as SignalData | null)
const summary = computed(() => getCachedSummary(symbolId.value))
const isAIWorking = computed(() => isAIAnalyzing(symbolId.value))

// ─── Multi-TF Indicators ───
function getRaw(tf: IndicatorInterval): RawIndicators | null {
  return getCachedIndicator(symbolId.value, tf)?.indicators ?? null
}

function getTfSignalCount(tf: IndicatorInterval) {
  return getSignalCount(symbolId.value, tf)
}

const hasAnyIndicator = computed(() =>
  TIMEFRAMES.some((tf) => getCachedIndicator(symbolId.value, tf) != null),
)

// ─── Enhanced indicator helpers ───
function getTfDerivedSignals(tf: IndicatorInterval): DerivedSignals | null {
  return getDerivedSignals(symbolId.value, tf)
}

function getTfBBPosition(tf: IndicatorInterval): BBPosition | null {
  return getBBPosition(symbolId.value, tf)
}

function getTfServerSummary(tf: IndicatorInterval): IndicatorSummaryCount | null {
  return getServerSummary(symbolId.value, tf)
}

// ─── Per-TF indicator value helpers ───
function rsiVal(tf: IndicatorInterval): number | null { return getRaw(tf)?.rsi ?? null }
function macdHist(tf: IndicatorInterval): number | null { return getRaw(tf)?.macd?.histogram ?? null }
function adxVal(tf: IndicatorInterval): number | null { return getRaw(tf)?.adx?.adx ?? null }
function adxPlusDI(tf: IndicatorInterval): number | null { return getRaw(tf)?.adx?.plusDI ?? null }
function adxMinusDI(tf: IndicatorInterval): number | null { return getRaw(tf)?.adx?.minusDI ?? null }
function stochK(tf: IndicatorInterval): number | null { return getRaw(tf)?.stochastic?.k ?? null }
function atrVal(tf: IndicatorInterval): number | null { return getRaw(tf)?.atr ?? null }
function sma50(tf: IndicatorInterval): number | null { return getRaw(tf)?.movingAverages?.sma50 ?? null }
function sma200(tf: IndicatorInterval): number | null { return getRaw(tf)?.movingAverages?.sma200 ?? null }
function ema20(tf: IndicatorInterval): number | null { return getRaw(tf)?.movingAverages?.ema20 ?? null }
function obvVal(tf: IndicatorInterval): number | null { return getRaw(tf)?.obv ?? null }
function stochD(tf: IndicatorInterval): number | null { return getRaw(tf)?.stochastic?.d ?? null }
function macdLine(tf: IndicatorInterval): number | null { return getRaw(tf)?.macd?.line ?? null }
function macdSignal(tf: IndicatorInterval): number | null { return getRaw(tf)?.macd?.signal ?? null }

// ─── Ichimoku per-TF computed map (avoid repeated calls + non-null assertions in template) ───
const ichimokuMap = computed(() => {
  const map: Record<IndicatorInterval, {
    signals: IchimokuSignals | null
    raw: { conversion: number | null; base: number | null; spanA: number | null; spanB: number | null } | null
  }> = {} as any
  for (const tf of TIMEFRAMES) {
    map[tf] = {
      signals: getIchimokuSignals(symbolId.value, tf),
      raw: getRaw(tf)?.ichimoku ?? null,
    }
  }
  return map
})

// ─── Enhanced display helpers (Status-first approach) ───
function priceVsMA(tf: IndicatorInterval, maVal: number | null): { above: boolean; diff: string } | null {
  if (!priceData.value || maVal === null) return null
  const price = priceData.value.price
  const above = price >= maVal // BUG-3 fix: >= so price === MA shows green (not bearish)
  const pct = ((price - maVal) / maVal) * 100
  return { above, diff: `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%` }
}

function macdStatus(tf: IndicatorInterval): { label: string; color: string } {
  const line = macdLine(tf)
  const signal = macdSignal(tf)
  if (line === null || signal === null) return { label: '-', color: 'grey' }
  // BUG-4 fix: "Bullish"/"Bearish" = position, not crossover event
  if (line > signal) return { label: 'Bullish', color: 'success' }
  return { label: 'Bearish', color: 'error' }
}

// ─── Pre-computed indicator maps (BUG-1/2 fix: avoid repeated calls in template) ───
function getMaComparison(tf: IndicatorInterval) {
  return {
    ema20: priceVsMA(tf, ema20(tf)),
    sma50: priceVsMA(tf, sma50(tf)),
    sma200: priceVsMA(tf, sma200(tf)),
  }
}

function getIndicatorStatus(tf: IndicatorInterval) {
  return {
    macd: macdStatus(tf),
    rsi: rsiZone(tf),
    stoch: stochZone(tf),
    bb: bbStatus(tf),
  }
}

function rsiZone(tf: IndicatorInterval): { label: string; color: string; variant: string } {
  const val = rsiVal(tf)
  if (val === null) return { label: '-', color: 'grey', variant: 'tonal' }
  if (val < 20) return { label: 'Oversold', color: 'success', variant: 'tonal' }
  if (val < 30) return { label: 'Near OS', color: 'light-green', variant: 'tonal' }
  if (val > 80) return { label: 'Overbought', color: 'error', variant: 'tonal' }
  if (val > 70) return { label: 'Near OB', color: 'orange', variant: 'tonal' }
  return { label: 'Neutral', color: 'grey', variant: 'outlined' }
}

function stochZone(tf: IndicatorInterval): { label: string; color: string; variant: string } {
  const val = stochK(tf)
  if (val === null) return { label: '-', color: 'grey', variant: 'tonal' }
  if (val < 20) return { label: 'Oversold', color: 'success', variant: 'tonal' }
  if (val < 25) return { label: 'Near OS', color: 'light-green', variant: 'tonal' }
  if (val > 80) return { label: 'Overbought', color: 'error', variant: 'tonal' }
  if (val > 75) return { label: 'Near OB', color: 'orange', variant: 'tonal' }
  return { label: 'Neutral', color: 'grey', variant: 'outlined' }
}

function bbStatus(tf: IndicatorInterval): { position: string; posColor: string; squeeze: boolean; percentB: number } | null {
  const bbPos = getTfBBPosition(tf)
  const derived = getTfDerivedSignals(tf)
  if (!bbPos) return null
  return {
    position: getBBPositionLabelText(bbPos.position),
    posColor: getBBPositionLabelColor(bbPos.position),
    squeeze: derived?.bollingerSqueeze ?? false,
    percentB: bbPos.percentB,
  }
}

// ─── Trends derived values ───
const majorityTrend = computed((): TrendCacheDirection => trendsData.value?.analysis?.majorityTrend ?? 'SIDEWAYS')

const strengthLabel = computed(() => {
  if (majorityTrend.value === 'BULLISH') return 'UPTREND STRENGTH'
  if (majorityTrend.value === 'BEARISH') return 'DOWNTREND STRENGTH'
  return 'NEUTRAL STRENGTH'
})
const strengthScore = computed(() => trendsData.value?.analysis?.strength ?? 0)
const strengthColor = computed(() => getTrendCacheColor(majorityTrend.value))

// ─── Fetch all TFs (enhanced=true) ───
async function fetchAllTimeframes(forceRefresh = false) {
  indicatorsLoading.value = true
  try {
    await Promise.all(
      TIMEFRAMES.map((tf) => fetchIndicators(symbolId.value, tf, { forceRefresh, enhanced: true })),
    )
  } finally {
    indicatorsLoading.value = false
  }
}

// ─── Fetch data on mount + subscribe WebSocket ───
onMounted(async () => {
  // 1. Subscribe to this symbol's WebSocket channel
  subscribeSymbol(symbolId.value)

  // 2. Parallel fetch all 5 APIs
  await Promise.all([
    fetchPrice(symbolId.value),
    fetchTrends(symbolId.value),
    fetchAllTimeframes(),
    fetchValidation(symbolId.value),
    fetchLatestSignal(symbolId.value),
  ])

  // 3. Also fetch summary for header (if not cached)
  if (!getCachedSummary(symbolId.value)) {
    fetchSymbolSummary(symbolId.value)
  }

  // Mark page as ready
  pageReady.value = true

  // 4. Check freshness in background
  checkFreshness(symbolId.value)
})

// ─── Cleanup WebSocket on unmount ───
onUnmounted(() => {
  unsubscribeSymbol(symbolId.value)
})

// ─── Visibility change listener — check freshness when user returns ───
onMounted(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      checkFreshness(symbolId.value)
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibility)
  })
})

useHead({
  title: computed(() => {
    if (summary.value) return `${summary.value.name} - Smart Trader`
    if (priceData.value) return `${priceData.value.symbol} - Smart Trader`
    return 'Symbol Detail'
  }),
})

// ─── Reload ───
async function handleReload() {
  isRefreshing.value = true
  try {
    await Promise.all([
      fetchPrice(symbolId.value, true),
      fetchTrends(symbolId.value, true),
      fetchAllTimeframes(true),
      fetchValidation(symbolId.value, '15m', true),
      fetchLatestSignal(symbolId.value),
      fetchSymbolSummary(symbolId.value),
    ])
  } finally {
    setTimeout(() => { isRefreshing.value = false }, 500)
  }
}

// ─── Handlers ───
function goBack() {
  navigateTo('/')
}

async function handleAnalyze() {
  await analyzeSignal(symbolId.value, false)
}
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- HEADER: Back + Symbol + Type                       -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div class="d-flex align-center justify-space-between mb-2">
      <v-btn icon variant="tonal" color="grey-darken-3" size="small" rounded="circle" @click="goBack">
        <v-icon icon="mdi-arrow-left" size="28" class="text-label-muted" />
      </v-btn>
      <div v-if="summary || priceData" class="text-center">
        <div class="d-flex align-center justify-center ga-2">
          <span class="text-h6 font-weight-black">{{ summary?.name ?? priceData?.symbol ?? '-' }}</span>
          <v-chip v-if="summary?.type" size="x-small" variant="tonal" color="info" rounded="lg" class="font-weight-bold">{{ summary.type }}</v-chip>
        </div>
        <div v-if="priceData" class="text-caption text-label-muted">{{ formatTimeAgo(priceData.timestamp) }}</div>
      </div>
      <div v-else style="width: 40px;" />
      <div class="d-flex align-center">
        <v-btn icon variant="text" size="small" @click="navigateTo(`/symbol/${symbolId}/edit`)">
          <v-icon icon="mdi-pencil" size="22" class="text-label-muted" />
        </v-btn>
        <v-btn
          icon
          variant="text"
          size="small"
          :loading="isRefreshing"
          @click="handleReload"
        >
          <v-icon icon="mdi-sync" size="26" class="text-label-muted" />
        </v-btn>
      </div>
    </div>

    <v-divider class="mb-4" />

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- Page loading state (before data is ready)          -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div v-if="!pageReady" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="40" />
      <div class="text-caption mt-3 text-label-muted">กำลังโหลดข้อมูล...</div>
    </div>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- MAIN CONTENT                                       -->
    <!-- ═══════════════════════════════════════════════════ -->
    <template v-else>

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- Section 1: Price + Strength                        -->
      <!-- ═══════════════════════════════════════════════════ -->
      <div v-if="priceData" class="mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div>
            <div class="text-h4 font-weight-black font-mono">
              {{ formatPrice(priceData.price) }}
            </div>
            <span :class="['text-body-2 font-weight-bold font-mono', getPriceChangeColor(priceData.changePercent) === 'success' ? 'text-success' : getPriceChangeColor(priceData.changePercent) === 'error' ? 'text-error' : 'text-grey']">
              {{ formatPriceChange(priceData.changePercent) }}
            </span>
          </div>
          <div v-if="trendsData?.analysis" class="text-right">
            <div class="text-caption text-uppercase text-label-muted font-weight-bold">{{ strengthLabel }}</div>
            <div class="text-h4 font-weight-black font-mono" :class="`text-${strengthColor}`">{{ strengthScore }}%</div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- Candlestick Chart                                  -->
      <!-- ═══════════════════════════════════════════════════ -->
      <div class="mb-4">
        <TradingCandlestickChart :symbol-id="symbolId" />
      </div>

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- Section 2: Indicator Summary (enhanced server data)-->
      <!-- ═══════════════════════════════════════════════════ -->
      <div class="mb-4">
        <div class="text-overline font-weight-bold mb-2 text-label-muted">
          <v-icon icon="mdi-chart-box" size="16" class="mr-1" />
          Indicator Summary
        </div>

        <v-card class="glass-card mb-3" rounded="lg">
          <v-card-text class="pa-3">
            <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-2">Signal Summary (per TF)</div>
            <div class="d-flex ga-2 flex-wrap">
              <template v-for="tf in TIMEFRAMES" :key="`summary-${tf}`">
                <!-- Use server summary if available, otherwise client-side -->
                <v-chip
                  size="small"
                  :color="
                    (getTfServerSummary(tf)?.overall === 'BULLISH' || (!getTfServerSummary(tf) && getTfSignalCount(tf).bullish > getTfSignalCount(tf).bearish))
                      ? 'success'
                      : (getTfServerSummary(tf)?.overall === 'BEARISH' || (!getTfServerSummary(tf) && getTfSignalCount(tf).bearish > getTfSignalCount(tf).bullish))
                        ? 'error'
                        : 'grey'
                  "
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ tf }}
                  <v-icon
                    :icon="
                      (getTfServerSummary(tf)?.overall === 'BULLISH' || (!getTfServerSummary(tf) && getTfSignalCount(tf).bullish > getTfSignalCount(tf).bearish))
                        ? 'mdi-arrow-up-bold'
                        : (getTfServerSummary(tf)?.overall === 'BEARISH' || (!getTfServerSummary(tf) && getTfSignalCount(tf).bearish > getTfSignalCount(tf).bullish))
                          ? 'mdi-arrow-down-bold'
                          : 'mdi-minus'
                    "
                    size="14"
                    class="ml-1"
                  />
                  <template v-if="getTfServerSummary(tf)">
                    {{ getTfServerSummary(tf)!.bullish }}/{{ getTfServerSummary(tf)!.bearish }}/{{ getTfServerSummary(tf)!.neutral }}
                  </template>
                  <template v-else>
                    {{ getTfSignalCount(tf).bullish }}/{{ getTfSignalCount(tf).bearish }}/{{ getTfSignalCount(tf).neutral }}
                  </template>
                </v-chip>
              </template>
            </div>

            <!-- Overall Bias (per TF) -->
            <div v-if="TIMEFRAMES.some((tf) => getTfServerSummary(tf)?.overall)" class="mt-3">
              <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-2">Overall Bias</div>
              <div class="d-flex ga-2 flex-wrap">
                <template v-for="tf in TIMEFRAMES" :key="`bias-${tf}`">
                  <v-chip
                    v-if="getTfServerSummary(tf)?.overall"
                    size="small"
                    :color="getBiasColor(getTfServerSummary(tf)!.overall.toLowerCase() as OverallBias)"
                    variant="tonal"
                    class="font-weight-bold"
                  >
                    <v-icon :icon="getBiasIcon(getTfServerSummary(tf)!.overall.toLowerCase() as OverallBias)" size="14" class="mr-1" />
                    {{ tf }}: {{ getTfServerSummary(tf)!.overall }}
                  </v-chip>
                </template>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- Section 3: Multi-TF Trends (from useTrends)        -->
      <!-- ═══════════════════════════════════════════════════ -->
      <div v-if="trendsData" class="mb-4">
        <div class="text-overline font-weight-bold mb-2 text-label-muted">
          <v-icon icon="mdi-chart-timeline-variant" size="16" class="mr-1" />
          Multi-Timeframe Trends
        </div>

        <!-- Trend per timeframe -->
        <v-card class="glass-card mb-2" rounded="lg">
          <v-card-text class="pa-3">
            <div class="d-flex ga-2 flex-wrap">
              <div v-for="(tfData, tfKey) in trendsData.timeframes" :key="`trend-${tfKey}`" class="tf-cell">
                <div class="text-caption text-label-muted text-center">{{ tfKey }}</div>
                <v-chip
                  size="small"
                  :color="getTrendCacheColor(tfData.direction)"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  <v-icon :icon="getTrendCacheIcon(tfData.direction)" size="14" class="mr-1" />
                  {{ tfData.direction }}
                </v-chip>
                <v-chip
                  size="x-small"
                  :color="getTrendStrengthColor(tfData.strength)"
                  variant="outlined"
                  class="mt-1"
                >
                  {{ tfData.strength }}
                </v-chip>
                <div v-if="tfData.adx !== null" class="text-caption font-mono text-center mt-1">
                  ADX {{ tfData.adx.toFixed(1) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Analysis summary -->
        <v-card class="glass-card" rounded="lg">
          <v-card-text class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div>
                <span class="text-caption text-label-muted">Consensus: </span>
                <v-chip
                  size="small"
                  :color="getConsensusColor(trendsData.analysis.consensus as any)"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ trendsData.analysis.consensus }}
                </v-chip>
              </div>
              <div>
                <v-chip
                  size="small"
                  :color="getTrendCacheColor(trendsData.analysis.majorityTrend)"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  <v-icon :icon="getTrendCacheIcon(trendsData.analysis.majorityTrend)" size="14" class="mr-1" />
                  {{ trendsData.analysis.majorityTrend }}
                  {{ trendsData.analysis.strength }}%
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- Section 4: Technical Indicators (Grouped)           -->
      <!-- ═══════════════════════════════════════════════════ -->
      <div class="mb-4">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-overline font-weight-bold text-label-muted">
            <v-icon icon="mdi-chart-box" size="16" class="mr-1" />
            Technical Indicators
          </div>
          <v-chip v-if="indicatorsLoading" size="x-small" color="primary" variant="tonal">
            <v-progress-circular indeterminate size="10" width="1" class="mr-1" />
            Loading...
          </v-chip>
        </div>

        <!-- Loading state -->
        <div v-if="indicatorsLoading && !hasAnyIndicator" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="28" width="2" />
          <div class="text-caption text-label-muted mt-2">กำลังโหลด indicators ทุก timeframe...</div>
        </div>

        <!-- Error state -->
        <v-alert v-else-if="indicatorError && !hasAnyIndicator" type="error" variant="tonal" density="compact" class="mb-3">
          {{ indicatorError }}
        </v-alert>

        <!-- All-TF Indicator Comparison (Grouped) -->
        <template v-else-if="hasAnyIndicator">

          <!-- ════════════════════════════════════════════ -->
          <!-- GROUP: Trend Indicators                      -->
          <!-- ════════════════════════════════════════════ -->
          <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-2 mt-1">
            <v-icon icon="mdi-trending-up" size="14" class="mr-1" />
            Trend
          </div>

          <!-- ── Moving Averages (Price vs MA comparison) ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="d-flex align-center ga-1 mb-2">
                <span class="text-caption font-weight-bold text-label-muted">Moving Averages</span>
                <v-tooltip location="top" max-width="300">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-information-outline" size="14" class="text-label-muted" style="cursor: help;" />
                  </template>
                  <div>
                    <div>Price เหนือ MA = Bullish, ใต้ = Bearish</div>
                    <div>Golden Cross = SMA50 ตัด SMA200 ขึ้น</div>
                    <div>Death Cross = SMA50 ตัด SMA200 ลง</div>
                  </div>
                </v-tooltip>
              </div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`ma-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <!-- EMA 20 vs Price (pre-computed) -->
                  <div v-if="getMaComparison(tf).ema20" class="d-flex align-center ga-1">
                    <v-icon
                      :icon="getMaComparison(tf).ema20!.above ? 'mdi-check-circle' : 'mdi-close-circle'"
                      :color="getMaComparison(tf).ema20!.above ? 'success' : 'error'"
                      size="12"
                    />
                    <span class="text-caption font-mono">E20</span>
                    <span class="text-caption font-mono" :class="getMaComparison(tf).ema20!.above ? 'text-success' : 'text-error'">
                      {{ getMaComparison(tf).ema20!.diff }}
                    </span>
                  </div>
                  <!-- SMA 50 vs Price (pre-computed) -->
                  <div v-if="getMaComparison(tf).sma50" class="d-flex align-center ga-1">
                    <v-icon
                      :icon="getMaComparison(tf).sma50!.above ? 'mdi-check-circle' : 'mdi-close-circle'"
                      :color="getMaComparison(tf).sma50!.above ? 'success' : 'error'"
                      size="12"
                    />
                    <span class="text-caption font-mono">S50</span>
                    <span class="text-caption font-mono" :class="getMaComparison(tf).sma50!.above ? 'text-success' : 'text-error'">
                      {{ getMaComparison(tf).sma50!.diff }}
                    </span>
                  </div>
                  <!-- SMA 200 vs Price (pre-computed) -->
                  <div v-if="getMaComparison(tf).sma200" class="d-flex align-center ga-1">
                    <v-icon
                      :icon="getMaComparison(tf).sma200!.above ? 'mdi-check-circle' : 'mdi-close-circle'"
                      :color="getMaComparison(tf).sma200!.above ? 'success' : 'error'"
                      size="12"
                    />
                    <span class="text-caption font-mono">S200</span>
                    <span class="text-caption font-mono" :class="getMaComparison(tf).sma200!.above ? 'text-success' : 'text-error'">
                      {{ getMaComparison(tf).sma200!.diff }}
                    </span>
                  </div>
                  <!-- Cross status -->
                  <v-chip
                    v-if="sma50(tf) !== null && sma200(tf) !== null"
                    size="x-small"
                    :color="sma50(tf)! > sma200(tf)! ? 'success' : 'error'"
                    variant="tonal"
                    class="d-flex justify-center mt-1"
                  >
                    {{ sma50(tf)! > sma200(tf)! ? 'Golden' : 'Death' }}
                  </v-chip>
                  <div v-else-if="ema20(tf) === null && sma50(tf) === null" class="text-body-2 font-mono text-center text-label-muted">-</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── ADX (Trend Strength) ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="d-flex align-center ga-1 mb-2">
                <span class="text-caption font-weight-bold text-label-muted">ADX (Trend Strength)</span>
                <v-tooltip location="top" max-width="300">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-information-outline" size="14" class="text-label-muted" style="cursor: help;" />
                  </template>
                  <div>
                    <div>ADX > 25 = Trend แข็ง, > 50 = แข็งมาก</div>
                    <div>+DI > -DI = Uptrend</div>
                    <div>-DI > +DI = Downtrend</div>
                  </div>
                </v-tooltip>
              </div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`adx-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <div class="text-body-2 font-weight-bold font-mono text-center">
                    {{ adxVal(tf) !== null ? adxVal(tf)!.toFixed(1) : '-' }}
                  </div>
                  <v-chip
                    v-if="adxVal(tf) !== null"
                    size="x-small"
                    :color="adxVal(tf)! < 20 ? 'grey' : adxVal(tf)! < 40 ? 'warning' : 'success'"
                    :variant="adxVal(tf)! < 20 ? 'outlined' : 'tonal'"
                    class="d-flex justify-center"
                  >
                    {{ adxVal(tf)! < 20 ? 'Weak' : adxVal(tf)! < 40 ? 'Med' : 'Strong' }}
                  </v-chip>
                  <v-chip
                    v-if="adxPlusDI(tf) !== null && adxMinusDI(tf) !== null"
                    size="x-small"
                    :color="adxPlusDI(tf)! > adxMinusDI(tf)! ? 'success' : 'error'"
                    variant="tonal"
                    class="d-flex justify-center mt-1"
                  >
                    {{ adxPlusDI(tf)! > adxMinusDI(tf)! ? '▲ +DI' : '▼ -DI' }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── MACD (Status-first approach) ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="d-flex align-center ga-1 mb-2">
                <span class="text-caption font-weight-bold text-label-muted">MACD</span>
                <v-tooltip location="top" max-width="300">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-information-outline" size="14" class="text-label-muted" style="cursor: help;" />
                  </template>
                  <div>
                    <div>MACD Line > Signal = Bullish</div>
                    <div>Histogram บวก = Momentum ขาขึ้น</div>
                    <div>Line ตัด Signal ขึ้น = Buy Signal</div>
                  </div>
                </v-tooltip>
              </div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`macd-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <!-- MACD position status (primary info, pre-computed) -->
                  <v-chip
                    v-if="macdLine(tf) !== null"
                    size="x-small"
                    :color="getIndicatorStatus(tf).macd.color"
                    variant="tonal"
                    class="d-flex justify-center"
                  >
                    {{ getIndicatorStatus(tf).macd.label }}
                  </v-chip>
                  <!-- Histogram value + direction (secondary) -->
                  <div
                    v-if="macdHist(tf) !== null"
                    class="d-flex align-center justify-center ga-1 mt-1"
                  >
                    <v-icon
                      :icon="macdHist(tf)! > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                      :color="macdHist(tf)! > 0 ? 'success' : 'error'"
                      size="12"
                    />
                    <span
                      class="text-caption font-mono"
                      :class="macdHist(tf)! > 0 ? 'text-success' : 'text-error'"
                    >
                      {{ macdHist(tf)!.toFixed(4) }}
                    </span>
                  </div>
                  <div v-else class="text-body-2 font-mono text-center text-label-muted">-</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── Ichimoku Cloud ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="d-flex align-center ga-1 mb-2">
                <span class="text-caption font-weight-bold text-label-muted">Ichimoku Cloud</span>
                <v-tooltip location="top" max-width="300">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-information-outline" size="14" class="text-label-muted" style="cursor: help;" />
                  </template>
                  <div>
                    <div>TK Cross: Tenkan ตัด Kijun ขึ้น = Bullish</div>
                    <div>ราคาเหนือ Cloud = Bullish Zone</div>
                    <div>Cloud เขียว (Span A > B) = Bullish</div>
                  </div>
                </v-tooltip>
              </div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`ichimoku-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <template v-if="ichimokuMap[tf].signals">
                    <!-- TK Cross -->
                    <v-chip
                      size="x-small"
                      :color="getIchimokuTKColor(ichimokuMap[tf].signals!.tkCross)"
                      variant="tonal"
                      class="d-flex justify-center"
                    >
                      TK {{ ichimokuMap[tf].signals!.tkCross === 'BULLISH' ? '▲' : '▼' }}
                    </v-chip>
                    <!-- Price vs Cloud -->
                    <v-chip
                      v-if="ichimokuMap[tf].signals!.priceVsCloud"
                      size="x-small"
                      :color="getIchimokuCloudPosColor(ichimokuMap[tf].signals!.priceVsCloud)"
                      variant="tonal"
                      class="d-flex justify-center mt-1"
                    >
                      {{ ichimokuMap[tf].signals!.priceVsCloud }}
                    </v-chip>
                    <!-- Cloud Color -->
                    <v-chip
                      v-if="ichimokuMap[tf].signals!.cloudColor"
                      size="x-small"
                      :color="getIchimokuCloudColorHelper(ichimokuMap[tf].signals!.cloudColor)"
                      variant="outlined"
                      class="d-flex justify-center mt-1"
                    >
                      Cloud {{ ichimokuMap[tf].signals!.cloudColor === 'BULLISH' ? '▲' : '▼' }}
                    </v-chip>
                    <!-- Tenkan / Kijun raw values -->
                    <div v-if="ichimokuMap[tf].raw" class="text-caption font-mono text-center text-label-muted mt-1">
                      T: {{ ichimokuMap[tf].raw?.conversion?.toFixed(2) ?? '-' }}
                      <br>
                      K: {{ ichimokuMap[tf].raw?.base?.toFixed(2) ?? '-' }}
                    </div>
                  </template>
                  <div v-else class="text-body-2 font-mono text-center text-label-muted">-</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ════════════════════════════════════════════ -->
          <!-- GROUP: Momentum / Oscillators                -->
          <!-- ════════════════════════════════════════════ -->
          <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-2 mt-4">
            <v-icon icon="mdi-speedometer" size="14" class="mr-1" />
            Momentum
          </div>

          <!-- ── RSI (with near-OS/OB zones) ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="d-flex align-center ga-1 mb-2">
                <span class="text-caption font-weight-bold text-label-muted">RSI (14)</span>
                <v-tooltip location="top" max-width="300">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-information-outline" size="14" class="text-label-muted" style="cursor: help;" />
                  </template>
                  <div>
                    <div>RSI > 70 = Overbought (ซื้อมากเกิน)</div>
                    <div>RSI &lt; 30 = Oversold (ขายมากเกิน)</div>
                    <div>Near zone = ใกล้จะถึงจุดกลับตัว</div>
                  </div>
                </v-tooltip>
              </div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`rsi-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <div class="text-body-2 font-weight-bold font-mono text-center">
                    {{ rsiVal(tf) !== null ? rsiVal(tf)!.toFixed(1) : '-' }}
                  </div>
                  <v-chip
                    v-if="rsiVal(tf) !== null"
                    size="x-small"
                    :color="getIndicatorStatus(tf).rsi.color"
                    :variant="(getIndicatorStatus(tf).rsi.variant as any)"
                    class="d-flex justify-center"
                  >
                    {{ getIndicatorStatus(tf).rsi.label }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── Stochastic (with near-OS/OB zones) ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="d-flex align-center ga-1 mb-2">
                <span class="text-caption font-weight-bold text-label-muted">Stochastic %K / %D</span>
                <v-tooltip location="top" max-width="300">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-information-outline" size="14" class="text-label-muted" style="cursor: help;" />
                  </template>
                  <div>
                    <div>%K > 80 = Overbought</div>
                    <div>%K &lt; 20 = Oversold</div>
                    <div>%K ตัด %D ขึ้น = Buy Signal</div>
                  </div>
                </v-tooltip>
              </div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`stoch-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <div class="text-body-2 font-weight-bold font-mono text-center">
                    {{ stochK(tf) !== null ? stochK(tf)!.toFixed(1) : '-' }}
                    <span v-if="stochD(tf) !== null" class="text-label-muted"> · {{ stochD(tf)!.toFixed(1) }}</span>
                  </div>
                  <v-chip
                    v-if="stochK(tf) !== null"
                    size="x-small"
                    :color="getIndicatorStatus(tf).stoch.color"
                    :variant="(getIndicatorStatus(tf).stoch.variant as any)"
                    class="d-flex justify-center"
                  >
                    {{ getIndicatorStatus(tf).stoch.label }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ════════════════════════════════════════════ -->
          <!-- GROUP: Volatility                            -->
          <!-- ════════════════════════════════════════════ -->
          <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-2 mt-4">
            <v-icon icon="mdi-chart-bell-curve" size="14" class="mr-1" />
            Volatility
          </div>

          <!-- ── Bollinger Bands (Merged: Position + Squeeze) ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="d-flex align-center ga-1 mb-2">
                <span class="text-caption font-weight-bold text-label-muted">Bollinger Bands</span>
                <v-tooltip location="top" max-width="300">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-information-outline" size="14" class="text-label-muted" style="cursor: help;" />
                  </template>
                  <div>
                    <div>Price ใกล้ Upper = อาจ Overbought</div>
                    <div>ใกล้ Lower = อาจ Oversold</div>
                    <div>Squeeze = ผันผวนต่ำ อาจเกิด Breakout</div>
                  </div>
                </v-tooltip>
              </div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`bb-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <template v-if="getIndicatorStatus(tf).bb">
                    <!-- Price position badge (pre-computed) -->
                    <v-chip
                      size="x-small"
                      :color="getIndicatorStatus(tf).bb!.posColor"
                      variant="tonal"
                      class="d-flex justify-center"
                    >
                      {{ getIndicatorStatus(tf).bb!.position }}
                    </v-chip>
                    <!-- %B value -->
                    <div class="text-caption font-mono text-center mt-1">
                      %B: {{ getIndicatorStatus(tf).bb!.percentB.toFixed(2) }}
                    </div>
                    <!-- Squeeze warning -->
                    <v-chip
                      v-if="getIndicatorStatus(tf).bb!.squeeze"
                      size="x-small"
                      color="warning"
                      variant="tonal"
                      class="d-flex justify-center mt-1"
                    >
                      SQUEEZE
                    </v-chip>
                  </template>
                  <div v-else class="text-caption text-label-muted text-center">-</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── ATR (Volatility) ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="d-flex align-center ga-1 mb-2">
                <span class="text-caption font-weight-bold text-label-muted">ATR (Volatility)</span>
                <v-tooltip location="top" max-width="300">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-information-outline" size="14" class="text-label-muted" style="cursor: help;" />
                  </template>
                  <div>
                    <div>ค่าสูง = ความผันผวนสูง</div>
                    <div>ใช้คำนวณ Stop Loss และ Take Profit แบบ Dynamic</div>
                  </div>
                </v-tooltip>
              </div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`atr-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <div class="text-body-2 font-weight-bold font-mono text-center">
                    {{ atrVal(tf) !== null ? atrVal(tf)!.toFixed(4) : '-' }}
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ════════════════════════════════════════════ -->
          <!-- GROUP: Volume                                -->
          <!-- ════════════════════════════════════════════ -->
          <template v-if="TIMEFRAMES.some((tf) => obvVal(tf) !== null)">
            <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-2 mt-4">
              <v-icon icon="mdi-chart-bar" size="14" class="mr-1" />
              Volume
            </div>

            <!-- ── OBV ── -->
            <v-card class="glass-card mb-2" rounded="lg">
              <v-card-text class="pa-3">
                <div class="d-flex align-center ga-1 mb-2">
                  <span class="text-caption font-weight-bold text-label-muted">OBV (On-Balance Volume)</span>
                  <v-tooltip location="top" max-width="300">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" icon="mdi-information-outline" size="14" class="text-label-muted" style="cursor: help;" />
                    </template>
                    <div>
                      <div>OBV เพิ่ม + ราคาขึ้น = ยืนยัน Uptrend</div>
                      <div>OBV ลด + ราคาขึ้น = Divergence อาจกลับตัว</div>
                    </div>
                  </v-tooltip>
                </div>
                <div class="d-flex ga-2 flex-wrap">
                  <div v-for="tf in TIMEFRAMES" :key="`obv-${tf}`" class="tf-cell">
                    <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                    <div v-if="obvVal(tf) !== null" class="text-body-2 font-weight-bold font-mono text-center">
                      {{ formatNumber(obvVal(tf)!) }}
                    </div>
                    <div v-else class="text-body-2 font-mono text-center text-label-muted">-</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </template>

          <!-- ════════════════════════════════════════════ -->
          <!-- GROUP: Derived Signals                       -->
          <!-- ════════════════════════════════════════════ -->
          <!-- BUG-5 fix: check ALL timeframes, not just 15m/1h -->
          <template v-if="TIMEFRAMES.some((tf) => getTfDerivedSignals(tf))">
            <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-2 mt-4">
              <v-icon icon="mdi-flash" size="14" class="mr-1" />
              Derived Signals
            </div>

            <v-card class="glass-card mb-2" rounded="lg">
              <v-card-text class="pa-3">
                <div class="d-flex ga-2 flex-wrap">
                  <div v-for="tf in TIMEFRAMES" :key="`derived-${tf}`" class="tf-cell">
                    <div class="text-caption text-label-muted text-center mb-1">{{ tf }}</div>
                    <template v-if="getTfDerivedSignals(tf)">
                      <!-- RSI Divergence -->
                      <v-chip
                        v-if="getTfDerivedSignals(tf)!.rsiDivergence"
                        size="x-small"
                        :color="getDivergenceColor(getTfDerivedSignals(tf)!.rsiDivergence)"
                        variant="tonal"
                        class="mb-1"
                      >
                        RSI {{ getTfDerivedSignals(tf)!.rsiDivergence }}
                      </v-chip>

                      <!-- MACD Divergence -->
                      <v-chip
                        v-if="getTfDerivedSignals(tf)!.macdDivergence"
                        size="x-small"
                        :color="getDivergenceColor(getTfDerivedSignals(tf)!.macdDivergence)"
                        variant="tonal"
                        class="mb-1"
                      >
                        MACD {{ getTfDerivedSignals(tf)!.macdDivergence }}
                      </v-chip>

                      <!-- SMA Crossover -->
                      <v-chip
                        v-if="getTfDerivedSignals(tf)!.smaCrossover"
                        size="x-small"
                        :color="getTfDerivedSignals(tf)!.smaCrossover === 'GOLDEN' ? 'success' : 'error'"
                        variant="tonal"
                        class="mb-1"
                      >
                        {{ getCrossoverLabel(getTfDerivedSignals(tf)!.smaCrossover) }}
                      </v-chip>

                      <!-- Candlestick Pattern -->
                      <v-chip
                        v-if="getTfDerivedSignals(tf)!.candlestickPattern"
                        size="x-small"
                        :color="getTfDerivedSignals(tf)!.patternDirection === 'BULLISH' ? 'success' : getTfDerivedSignals(tf)!.patternDirection === 'BEARISH' ? 'error' : 'grey'"
                        variant="tonal"
                      >
                        {{ getTfDerivedSignals(tf)!.candlestickPattern }}
                      </v-chip>

                      <!-- No active signals -->
                      <div
                        v-if="!getTfDerivedSignals(tf)!.rsiDivergence && !getTfDerivedSignals(tf)!.macdDivergence && !getTfDerivedSignals(tf)!.smaCrossover && !getTfDerivedSignals(tf)!.candlestickPattern"
                        class="text-caption text-label-muted text-center"
                      >
                        -
                      </div>
                    </template>
                    <div v-else class="text-caption text-label-muted text-center">-</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </template>

        </template>
      </div>

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- Section 5: AI Decision Logic (Validation)           -->
      <!-- ═══════════════════════════════════════════════════ -->
      <div v-if="validationData" class="mb-4">
        <div class="text-overline font-weight-bold mb-2 text-label-muted">
          <v-icon icon="mdi-shield-check" size="16" class="mr-1" />
          AI Decision Logic
        </div>

        <!-- Overall status -->
        <v-card v-if="validationData.overallStatus" class="glass-card mb-2" rounded="lg">
          <v-card-text class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-icon
                  :icon="getValidationStatusIcon(validationData.overallStatus)"
                  :color="getValidationStatusColor(validationData.overallStatus)"
                  size="24"
                />
                <div>
                  <div class="text-body-2 font-weight-bold">{{ validationData.overallStatusLabel }}</div>
                  <div class="text-caption text-label-muted">
                    {{ validationData.isValid ? 'Ready for signal' : 'Conditions not met' }}
                  </div>
                </div>
              </div>
              <v-chip
                size="small"
                :color="getValidationStatusColor(validationData.overallStatus)"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ validationData.overallStatus.toUpperCase() }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>

        <!-- Individual checks -->
        <v-card class="glass-card mb-2" rounded="lg">
          <v-card-text class="pa-3">
            <div class="text-caption font-weight-bold text-label-muted mb-2">Validation Checks</div>
            <div v-for="(check, checkKey) in validationData.checks" :key="checkKey" class="d-flex align-center ga-2 mb-2">
              <v-icon
                :icon="getValidationStatusIcon(check.status)"
                :color="getValidationStatusColor(check.status)"
                size="18"
              />
              <div class="flex-grow-1">
                <div class="text-body-2">{{ check.message }}</div>
                <div v-if="check.detail" class="text-caption text-label-muted">{{ check.detail }}</div>
              </div>
              <v-chip
                size="x-small"
                :color="getValidationStatusColor(check.status)"
                variant="tonal"
              >
                {{ check.status }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>

        <!-- Bollinger position from validation -->
        <v-card v-if="validationData.bollingerPosition" class="glass-card mb-2" rounded="lg">
          <v-card-text class="pa-3">
            <div class="text-caption font-weight-bold text-label-muted mb-2">Price Position (Bollinger)</div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2">{{ validationData.bollingerPosition.pricePosition }}</span>
              <span class="text-body-2 font-mono">%B: {{ validationData.bollingerPosition.percentB.toFixed(2) }}</span>
            </div>
          </v-card-text>
        </v-card>

        <!-- Next candle close -->
        <v-card v-if="validationData.nextCandleClose" class="glass-card" rounded="lg">
          <v-card-text class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption text-label-muted">Next {{ validationData.nextCandleClose.timeframe }} close</span>
              <span class="text-body-2 font-weight-bold font-mono">
                {{ formatTimeRemaining(validationData.nextCandleClose.secondsRemaining) }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- Section 6: AI Signal Result                         -->
      <!-- ═══════════════════════════════════════════════════ -->
      <div class="mb-4">
        <div class="text-overline font-weight-bold mb-2 text-label-muted">
          <v-icon icon="mdi-robot" size="16" class="mr-1" />
          AI Signal
        </div>

        <!-- AI Analyzing state -->
        <v-card v-if="isAIWorking || isSignalAnalyzing" class="glass-card mb-2" rounded="lg">
          <v-card-text class="pa-3 text-center">
            <v-progress-circular indeterminate color="primary" size="32" width="3" class="mb-2" />
            <div class="text-body-2">AI กำลังวิเคราะห์...</div>
          </v-card-text>
        </v-card>

        <!-- Signal data -->
        <template v-else-if="signalData">
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <!-- Strategy + Confidence -->
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center ga-2">
                  <v-icon
                    :icon="getStrategyIcon(signalData.strategy)"
                    :color="getStrategyColor(signalData.strategy)"
                    size="32"
                  />
                  <div>
                    <div class="text-h6 font-weight-black">{{ signalData.strategyLabel }}</div>
                    <div class="text-caption text-label-muted">{{ formatTimeAgo(signalData.timestamp) }}</div>
                  </div>
                </div>
                <v-chip
                  size="small"
                  :color="getConfidenceColor(signalData.confidence)"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ signalData.confidence }}% {{ signalData.confidenceLabel }}
                </v-chip>
              </div>

              <!-- Entry / TP / SL -->
              <div class="d-flex justify-space-between mb-2">
                <div class="text-center">
                  <div class="text-caption text-label-muted">Entry</div>
                  <div class="text-body-2 font-weight-bold font-mono">{{ formatPrice(signalData.prices.entry) }}</div>
                </div>
                <div class="text-center">
                  <div class="text-caption text-success">Take Profit</div>
                  <div class="text-body-2 font-weight-bold font-mono text-success">{{ formatPrice(signalData.prices.takeProfit) }}</div>
                </div>
                <div class="text-center">
                  <div class="text-caption text-error">Stop Loss</div>
                  <div class="text-body-2 font-weight-bold font-mono text-error">{{ formatPrice(signalData.prices.stopLoss) }}</div>
                </div>
              </div>

              <!-- R:R ratio -->
              <div class="d-flex align-center justify-center ga-3">
                <v-chip size="x-small" variant="tonal" color="info">R:R {{ signalData.prices.riskRewardRatio }}</v-chip>
                <v-chip size="x-small" variant="tonal" color="success">+{{ signalData.prices.potentialProfit.toFixed(2) }}%</v-chip>
                <v-chip size="x-small" variant="tonal" color="error">-{{ signalData.prices.potentialLoss.toFixed(2) }}%</v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Analysis summary -->
          <v-card v-if="signalData.analysis" class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold text-label-muted mb-1">Analysis</div>
              <div class="text-body-2 mb-2">{{ signalData.analysis.summary }}</div>

              <div v-if="signalData.analysis.keyFactors.length" class="mb-2">
                <div class="text-caption text-label-muted mb-1">Key Factors</div>
                <v-chip
                  v-for="(factor, i) in signalData.analysis.keyFactors"
                  :key="`factor-${i}`"
                  size="x-small"
                  variant="tonal"
                  color="info"
                  class="mr-1 mb-1"
                >
                  {{ factor }}
                </v-chip>
              </div>

              <div v-if="signalData.analysis.warnings.length">
                <div class="text-caption text-label-muted mb-1">Warnings</div>
                <v-chip
                  v-for="(warn, i) in signalData.analysis.warnings"
                  :key="`warn-${i}`"
                  size="x-small"
                  variant="tonal"
                  color="warning"
                  class="mr-1 mb-1"
                >
                  {{ warn }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Performance -->
          <v-card v-if="signalData.performance" class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold text-label-muted">Performance</span>
                <v-chip
                  size="x-small"
                  :color="getPerformanceStatusColor(signalData.performance.status)"
                  variant="tonal"
                >
                  {{ signalData.performance.statusLabel }}
                </v-chip>
              </div>
              <div class="d-flex justify-space-between">
                <div class="text-center">
                  <div class="text-caption text-label-muted">P&L</div>
                  <div
                    class="text-body-2 font-weight-bold font-mono"
                    :class="signalData.performance.profitLossPercent >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ signalData.performance.profitLossPercent >= 0 ? '+' : '' }}{{ signalData.performance.profitLossPercent.toFixed(2) }}%
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-caption text-label-muted">Max Profit</div>
                  <div class="text-body-2 font-mono text-success">+{{ signalData.performance.maxProfit.toFixed(2) }}%</div>
                </div>
                <div class="text-center">
                  <div class="text-caption text-label-muted">Max DD</div>
                  <div class="text-body-2 font-mono text-error">-{{ signalData.performance.maxDrawdown.toFixed(2) }}%</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </template>

        <!-- No signal + analyze button -->
        <v-card v-else class="glass-card" rounded="lg">
          <v-card-text class="pa-3 text-center">
            <div class="text-body-2 text-label-muted mb-3">ยังไม่มี AI Signal</div>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              :loading="isAIWorking"
              @click="handleAnalyze"
            >
              <v-icon start icon="mdi-robot" />
              Analyze Now
            </v-btn>
            <div v-if="analyzeError" class="text-caption text-error mt-2">{{ analyzeError }}</div>
          </v-card-text>
        </v-card>
      </div>

    </template>

  </v-container>
</template>

<style scoped>
/* ── Multi-TF grid cell: 4 equal columns ── */
.tf-cell {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
</style>
