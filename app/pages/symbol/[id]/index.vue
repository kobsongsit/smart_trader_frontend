<script setup lang="ts">
import type { TrendDirection, IndicatorInterval, RawIndicators } from '../../../../types/trading'
import {
  formatPrice,
  formatPriceChange,
  formatTimeAgo,
  formatNumber,
  getPriceChangeColor,
  getTrendColor,
  getZoneColor,
  getZoneLabel,
  getCrossColor,
  getCrossLabel,
  getCrossIcon,
  getMACDTrendColor,
  getMomentumIcon,
  getOBVConfirmationColor,
  getATRLevelColor,
  getADXStrengthColor,
  getADXStrengthIcon,
  getADXDirectionColor,
  getBiasColor,
  getBiasIcon,
  getConsensusColor,
} from '../../../../types/trading'

// ─── Route params ───
const route = useRoute()
const symbolId = computed(() => Number(route.params.id))

// ─── Composables ───
const {
  getCachedSummary,
  getCachedAnalysis,
  fetchAnalysis,
  fetchSymbolSummary,
  checkFreshness,
  isLoadingSymbol,
  isAIAnalyzing,
  analyzeSignal,
  analyzeError,
} = useAnalysis()

const { subscribeSymbol, unsubscribeSymbol } = useSocket()

// ─── Multi-TF Indicators (NEW — ใช้ /api/indicators/:id?interval=) ───
const {
  fetchIndicators,
  getCached: getCachedIndicator,
  isLoading: isIndicatorLoading,
  getSignalCount,
  error: indicatorError,
} = useIndicators()

const TIMEFRAMES: IndicatorInterval[] = ['15m', '1h', '4h', '1d']
const indicatorsLoading = ref(false)

// Reactive indicator data ทุก TF พร้อมกัน
function getRaw(tf: IndicatorInterval): RawIndicators | null {
  return getCachedIndicator(symbolId.value, tf)?.indicators ?? null
}

// Signal count ทุก TF
function getTfSignalCount(tf: IndicatorInterval) {
  return getSignalCount(symbolId.value, tf)
}

// Fetch ทุก TF พร้อมกัน
async function fetchAllTimeframes(forceRefresh = false) {
  indicatorsLoading.value = true
  try {
    await Promise.all(
      TIMEFRAMES.map((tf) => fetchIndicators(symbolId.value, tf, { forceRefresh })),
    )
  } finally {
    indicatorsLoading.value = false
  }
}

// Check ว่ามี data ครบทุก TF หรือยัง
const hasAnyIndicator = computed(() =>
  TIMEFRAMES.some((tf) => getCachedIndicator(symbolId.value, tf) != null),
)

// ─── Helper: ดึงค่า indicator ตาม TF สำหรับ template ───
function rsiVal(tf: IndicatorInterval): number | null { return getRaw(tf)?.rsi ?? null }
function macdHist(tf: IndicatorInterval): number | null { return getRaw(tf)?.macd?.histogram ?? null }
function adxVal(tf: IndicatorInterval): number | null { return getRaw(tf)?.adx?.adx ?? null }
function adxPlusDI(tf: IndicatorInterval): number | null { return getRaw(tf)?.adx?.plusDI ?? null }
function adxMinusDI(tf: IndicatorInterval): number | null { return getRaw(tf)?.adx?.minusDI ?? null }
function stochK(tf: IndicatorInterval): number | null { return getRaw(tf)?.stochastic?.k ?? null }
function atrVal(tf: IndicatorInterval): number | null { return getRaw(tf)?.atr ?? null }
function sma50(tf: IndicatorInterval): number | null { return getRaw(tf)?.movingAverages?.sma50 ?? null }
function sma200(tf: IndicatorInterval): number | null { return getRaw(tf)?.movingAverages?.sma200 ?? null }

// ─── Summary (from cache or freshly fetched) ───
const summary = computed(() => getCachedSummary(symbolId.value))
const pageReady = ref(false)

// ─── Fetch data on mount + subscribe WebSocket ───
onMounted(async () => {
  // 1. Subscribe to this symbol's WebSocket channel (socket connected at app level)
  subscribeSymbol(symbolId.value)

  // 2. Fetch summary if not cached (e.g., direct navigation / page refresh)
  // TODO: ปิดไว้ชั่วคราว — /api/analysis/summary ช้ามาก
  // if (!getCachedSummary(symbolId.value)) {
  //   await fetchSymbolSummary(symbolId.value)
  // }

  // 3. Load full analysis data (from cache or API)
  // TODO: ปิดไว้ชั่วคราว — /api/analysis/:id ช้ามาก
  // await fetchAnalysis(symbolId.value)

  // 3. Fetch indicators ทุก TF พร้อมกัน (เร็ว — แค่ดึง DB)
  await fetchAllTimeframes()

  // Mark page as ready
  pageReady.value = true

  // 4. Check freshness — ถ้า cache มีอยู่แล้ว ตรวจว่ายัง fresh อยู่ไหม
  //    ถ้า backend มี data ใหม่กว่า → auto re-fetch + update cache (UI reactive)
  // TODO: ปิดไว้ชั่วคราว — fetchAnalysis ข้างบนถูก comment แล้ว cache จะไม่มี
  // if (getCachedAnalysis(symbolId.value)) {
  //   await checkFreshness(symbolId.value)
  // }
})

// ─── Cleanup WebSocket on unmount ───
onUnmounted(() => {
  unsubscribeSymbol(symbolId.value)
})

// ─── Visibility change listener — เช็ค freshness เมื่อ user กลับมาที่ tab นี้ ───
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
  title: computed(() => summary.value ? `${summary.value.name} - Smart Trader` : 'Symbol Detail'),
})

// ─── Full analysis data ───
const analysis = computed(() => getCachedAnalysis(symbolId.value))
const isLoading = computed(() => isLoadingSymbol(symbolId.value))
const isAIWorking = computed(() => isAIAnalyzing(symbolId.value))

const indicators = computed(() => analysis.value?.indicators ?? null)
const trends = computed(() => analysis.value?.trends ?? null)
const validation = computed(() => analysis.value?.validation ?? null)
const signal = computed(() => analysis.value?.signal ?? null)
const meta = computed(() => analysis.value?.meta ?? null)

// ─── Summary derived values ───
const majorityTrend = computed((): TrendDirection => summary.value?.trend.direction ?? 'NEUTRAL')

const strengthLabel = computed(() => {
  if (majorityTrend.value === 'UP') return 'UPTREND STRENGTH'
  if (majorityTrend.value === 'DOWN') return 'DOWNTREND STRENGTH'
  return 'NEUTRAL STRENGTH'
})
const strengthScore = computed(() => {
  const t = summary.value?.trend
  if (!t || t.totalTimeframes === 0) return 0
  if (t.direction === 'UP') return Math.round((t.upCount / t.totalTimeframes) * 100)
  if (t.direction === 'DOWN') return Math.round((t.downCount / t.totalTimeframes) * 100)
  return Math.round((t.neutralCount / t.totalTimeframes) * 100)
})
const strengthColor = computed(() => getTrendColor(majorityTrend.value))

const trendSummaryText = computed(() => {
  const t = summary.value?.trend
  if (!t) return '-'
  if (t.direction === 'NEUTRAL') return `NEUTRAL ${t.neutralCount}/${t.totalTimeframes}`
  return `${t.direction} ${Math.max(t.upCount, t.downCount)}/${t.totalTimeframes}`
})

// Indicator summary
const overallBias = computed(() => indicators.value?.summary?.overallBias ?? 'neutral')
const overallBiasLabel = computed(() => indicators.value?.summary?.overallBiasLabel ?? '-')
const biasStrength = computed(() => indicators.value?.summary?.strength ?? 'weak')
const bullishCount = computed(() => indicators.value?.summary?.bullishCount ?? 0)
const bearishCount = computed(() => indicators.value?.summary?.bearishCount ?? 0)
const neutralCount = computed(() => indicators.value?.summary?.neutralCount ?? 0)

// Technical indicators
const maData = computed(() => indicators.value?.movingAverages ?? null)
const macdData = computed(() => indicators.value?.macd ?? null)
const bbData = computed(() => indicators.value?.bollingerBands ?? null)
const rsiData = computed(() => indicators.value?.rsi ?? null)
const stochData = computed(() => indicators.value?.stochastic ?? null)
const obvData = computed(() => indicators.value?.obv ?? null)
const atrData = computed(() => indicators.value?.atr ?? null)
const adxData = computed(() => indicators.value?.adx ?? null)

// ─── Reload ───
const isRefreshing = ref(false)

async function handleReload() {
  isRefreshing.value = true
  try {
    // TODO: ปิดไว้ชั่วคราว — /api/analysis/summary ช้ามาก
    // await fetchSymbolSummary(symbolId.value)
    // TODO: ปิดไว้ชั่วคราว — /api/analysis/:id ช้ามาก
    // await fetchAnalysis(symbolId.value)

    // Refresh indicators ทุก TF (เร็ว — ใช้ API แยก)
    await fetchAllTimeframes(true)
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
  // Signal will be updated reactively via analysisCache
  // (both REST response and WebSocket signal:new update cached.signal)
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
      <div v-if="summary" class="text-center">
        <div class="d-flex align-center justify-center ga-2">
          <span class="text-h6 font-weight-black">{{ summary.name }}</span>
          <v-chip size="x-small" variant="tonal" color="info" rounded="lg" class="font-weight-bold">{{ summary.type }}</v-chip>
        </div>
        <div class="text-caption text-label-muted">{{ summary.price.updatedAgo }}</div>
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
    <!-- Candlestick Chart (ไม่ต้องพึ่ง summary/analysis)  -->
    <!-- ═══════════════════════════════════════════════════ -->
    <template v-else>
      <div class="mb-4">
        <TradingCandlestickChart :symbol-id="symbolId" />
      </div>

      <!-- ═══════════════════════════════════════════════════ -->
      <!-- Technical Indicators — All Timeframes Comparison    -->
      <!-- ═══════════════════════════════════════════════════ -->
      <div class="mb-4">
        <!-- Section header -->
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

        <!-- Loading state (first load — no data yet) -->
        <div v-if="indicatorsLoading && !hasAnyIndicator" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="28" width="2" />
          <div class="text-caption text-label-muted mt-2">กำลังโหลด indicators ทุก timeframe...</div>
        </div>

        <!-- Error state -->
        <v-alert v-else-if="indicatorError && !hasAnyIndicator" type="error" variant="tonal" density="compact" class="mb-3">
          {{ indicatorError }}
        </v-alert>

        <!-- All-TF Indicator Comparison -->
        <template v-else-if="hasAnyIndicator">

          <!-- ── Signal Summary per TF ── -->
          <v-card class="glass-card mb-3" rounded="lg">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-2">Signal Summary</div>
              <div class="d-flex ga-2 flex-wrap">
                <v-chip
                  v-for="tf in TIMEFRAMES"
                  :key="`signal-${tf}`"
                  size="small"
                  :color="getTfSignalCount(tf).bullish > getTfSignalCount(tf).bearish ? 'success' : getTfSignalCount(tf).bearish > getTfSignalCount(tf).bullish ? 'error' : 'grey'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ tf }}
                  <v-icon
                    :icon="getTfSignalCount(tf).bullish > getTfSignalCount(tf).bearish ? 'mdi-arrow-up-bold' : getTfSignalCount(tf).bearish > getTfSignalCount(tf).bullish ? 'mdi-arrow-down-bold' : 'mdi-minus'"
                    size="14"
                    class="ml-1"
                  />
                  {{ getTfSignalCount(tf).bullish }}/{{ getTfSignalCount(tf).bearish }}/{{ getTfSignalCount(tf).neutral }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── RSI Comparison ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold text-label-muted mb-2">RSI</div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`rsi-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <div class="text-body-2 font-weight-bold font-mono text-center">
                    {{ rsiVal(tf) !== null ? rsiVal(tf)!.toFixed(1) : '-' }}
                  </div>
                  <v-chip
                    v-if="rsiVal(tf) !== null"
                    size="x-small"
                    :color="rsiVal(tf)! < 30 ? 'success' : rsiVal(tf)! > 70 ? 'error' : 'grey'"
                    variant="tonal"
                    class="d-flex justify-center"
                  >
                    {{ rsiVal(tf)! < 30 ? 'OS' : rsiVal(tf)! > 70 ? 'OB' : 'N' }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── MACD Histogram Comparison ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold text-label-muted mb-2">MACD Histogram</div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`macd-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <div
                    class="text-body-2 font-weight-bold font-mono text-center"
                    :class="macdHist(tf) !== null && macdHist(tf)! > 0 ? 'text-success' : macdHist(tf) !== null && macdHist(tf)! < 0 ? 'text-error' : ''"
                  >
                    {{ macdHist(tf) !== null ? macdHist(tf)!.toFixed(4) : '-' }}
                  </div>
                  <v-chip
                    v-if="macdHist(tf) !== null"
                    size="x-small"
                    :color="macdHist(tf)! > 0 ? 'success' : 'error'"
                    variant="tonal"
                    class="d-flex justify-center"
                  >
                    {{ macdHist(tf)! > 0 ? 'Bull' : 'Bear' }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── ADX Comparison ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold text-label-muted mb-2">ADX (Trend Strength)</div>
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
                    variant="tonal"
                    class="d-flex justify-center"
                  >
                    {{ adxVal(tf)! < 20 ? 'Weak' : adxVal(tf)! < 40 ? 'Med' : 'Strong' }}
                  </v-chip>
                  <!-- DI direction -->
                  <v-chip
                    v-if="adxPlusDI(tf) !== null && adxMinusDI(tf) !== null"
                    size="x-small"
                    :color="adxPlusDI(tf)! > adxMinusDI(tf)! ? 'success' : 'error'"
                    variant="tonal"
                    class="d-flex justify-center mt-1"
                  >
                    {{ adxPlusDI(tf)! > adxMinusDI(tf)! ? '▲' : '▼' }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── Stochastic Comparison ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold text-label-muted mb-2">Stochastic %K</div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`stoch-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <div class="text-body-2 font-weight-bold font-mono text-center">
                    {{ stochK(tf) !== null ? stochK(tf)!.toFixed(1) : '-' }}
                  </div>
                  <v-chip
                    v-if="stochK(tf) !== null"
                    size="x-small"
                    :color="stochK(tf)! < 20 ? 'success' : stochK(tf)! > 80 ? 'error' : 'grey'"
                    variant="tonal"
                    class="d-flex justify-center"
                  >
                    {{ stochK(tf)! < 20 ? 'OS' : stochK(tf)! > 80 ? 'OB' : 'N' }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── ATR Comparison ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold text-label-muted mb-2">ATR (Volatility)</div>
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

          <!-- ── Moving Averages (SMA Cross) ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold text-label-muted mb-2">SMA Cross (50 vs 200)</div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`sma-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center">{{ tf }}</div>
                  <v-chip
                    v-if="sma50(tf) !== null && sma200(tf) !== null"
                    size="x-small"
                    :color="sma50(tf)! > sma200(tf)! ? 'success' : 'error'"
                    variant="tonal"
                    class="d-flex justify-center"
                  >
                    {{ sma50(tf)! > sma200(tf)! ? 'Golden' : 'Death' }}
                  </v-chip>
                  <div v-else class="text-body-2 font-mono text-center text-label-muted">-</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ── Bollinger Bands (per TF) ── -->
          <v-card class="glass-card mb-2" rounded="lg">
            <v-card-text class="pa-3">
              <div class="text-caption font-weight-bold text-label-muted mb-2">Bollinger Bands</div>
              <div class="d-flex ga-2 flex-wrap">
                <div v-for="tf in TIMEFRAMES" :key="`bb-${tf}`" class="tf-cell">
                  <div class="text-caption text-label-muted text-center mb-1">{{ tf }}</div>
                  <template v-if="getRaw(tf)?.bollingerBands">
                    <div class="text-caption font-mono text-center text-error">{{ getRaw(tf)!.bollingerBands!.upper?.toFixed(3) }}</div>
                    <div class="text-caption font-mono text-center">{{ getRaw(tf)!.bollingerBands!.middle?.toFixed(3) }}</div>
                    <div class="text-caption font-mono text-center text-success">{{ getRaw(tf)!.bollingerBands!.lower?.toFixed(3) }}</div>
                  </template>
                  <div v-else class="text-caption font-mono text-center text-label-muted">-</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- TODO: Derived Signals — รอ backend เพิ่มใน analysis API
          <DerivedSignals>
            <Signal type="bollinger_squeeze" />
            <Signal type="rsi_divergence" />
            <Signal type="macd_divergence" />
            <Signal type="sma_crossover" />
            <Signal type="candlestick_pattern" />
          </DerivedSignals>
          -->
        </template>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- MAIN CONTENT (when summary exists)                 -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div v-if="pageReady && summary">

      <!-- ══════ Loading State ══════ -->
      <div v-if="isLoading && !analysis" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="40" />
        <div class="text-caption mt-3 text-label-muted">กำลังโหลดข้อมูลวิเคราะห์...</div>
      </div>

      <!-- ══════ COMMENTED OUT — uncomment เมื่อ verify graph เรียบร้อยแล้ว ══════ -->
      <!--
      <div class="mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div>
            <div class="text-h4 font-weight-black font-mono">
              {{ formatPrice(summary.price.current) }}
            </div>
            <span :class="['text-body-2 font-weight-bold font-mono', getPriceChangeColor(summary.price.changePercent) === 'success' ? 'text-success' : getPriceChangeColor(summary.price.changePercent) === 'error' ? 'text-error' : 'text-grey']">
              {{ formatPriceChange(summary.price.changePercent) }}
            </span>
          </div>
          <div class="text-right">
            <div class="text-caption text-uppercase text-label-muted font-weight-bold">{{ strengthLabel }}</div>
            <div class="text-h4 font-weight-black font-mono" :class="`text-${strengthColor}`">{{ strengthScore }}%</div>
          </div>
        </div>
      </div>

      <div v-if="indicators" class="mb-4">
        <div class="text-overline font-weight-bold mb-2 text-label-muted">
          <v-icon icon="mdi-chart-box" size="16" class="mr-1" />
          Indicator Summary
        </div>
        ... (indicator summary content) ...
      </div>

      <div v-if="trends" class="mb-4">
        ... (multi-timeframe trends content) ...
      </div>

      <div v-if="bbData" class="mb-4">
        ... (price position / bollinger bands content) ...
      </div>

      <div v-if="indicators" class="mb-4">
        ... (technical indicators content) ...
      </div>

      <div class="mb-4">
        ... (AI engine decision logic content) ...
      </div>

      <div v-if="isAIWorking || signal" class="mb-4">
        ... (AI signal analysis result content) ...
      </div>
      -->
    </div>
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
