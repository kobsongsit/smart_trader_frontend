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
const selectedTF = ref<IndicatorInterval>('1h')

// Reactive indicator data สำหรับ TF ที่เลือก
const currentIndicator = computed(() => getCachedIndicator(symbolId.value, selectedTF.value))
const currentRaw = computed(() => currentIndicator.value?.indicators ?? null)
const tfLoading = computed(() => isIndicatorLoading(symbolId.value, selectedTF.value))
const tfSignalCount = computed(() => getSignalCount(symbolId.value, selectedTF.value))

// เมื่อเปลี่ยน TF → fetch ใหม่ (cache จะ return ทันทีถ้ามีอยู่แล้ว)
watch(selectedTF, (tf) => {
  fetchIndicators(symbolId.value, tf)
})

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

  // 3. Fetch indicators สำหรับ default TF (เร็ว — แค่ดึง DB)
  await fetchIndicators(symbolId.value, selectedTF.value)

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

    // Refresh indicators (เร็ว — ใช้ API แยก)
    await fetchIndicators(symbolId.value, selectedTF.value, { forceRefresh: true })
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
      <!-- Technical Indicators — Multi-Timeframe              -->
      <!-- ═══════════════════════════════════════════════════ -->
      <div class="mb-4">
        <!-- Section header -->
        <div class="text-overline font-weight-bold mb-2 text-label-muted">
          <v-icon icon="mdi-chart-box" size="16" class="mr-1" />
          Technical Indicators
        </div>

        <!-- TF Tabs -->
        <v-btn-toggle
          v-model="selectedTF"
          mandatory
          density="compact"
          color="primary"
          variant="outlined"
          divided
          class="mb-3"
          style="width: 100%;"
        >
          <v-btn v-for="tf in TIMEFRAMES" :key="tf" :value="tf" size="small" class="flex-grow-1">
            {{ tf }}
          </v-btn>
        </v-btn-toggle>

        <!-- Loading state -->
        <div v-if="tfLoading && !currentRaw" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="28" width="2" />
          <div class="text-caption text-label-muted mt-2">กำลังโหลด {{ selectedTF }}...</div>
        </div>

        <!-- Error state -->
        <v-alert v-else-if="indicatorError && !currentRaw" type="error" variant="tonal" density="compact" class="mb-3">
          {{ indicatorError }}
        </v-alert>

        <!-- Indicator data -->
        <template v-else-if="currentRaw">
          <!-- Signal Summary Bar -->
          <v-card class="glass-card mb-3" rounded="lg">
            <v-card-text class="pa-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold text-uppercase text-label-muted">Signal Summary ({{ selectedTF }})</span>
                <v-chip
                  size="x-small"
                  :color="tfSignalCount.bullish > tfSignalCount.bearish ? 'success' : tfSignalCount.bearish > tfSignalCount.bullish ? 'error' : 'grey'"
                  variant="tonal"
                >
                  {{ tfSignalCount.bullish > tfSignalCount.bearish ? 'BULLISH' : tfSignalCount.bearish > tfSignalCount.bullish ? 'BEARISH' : 'NEUTRAL' }}
                </v-chip>
              </div>
              <div class="d-flex ga-2">
                <v-chip size="small" color="success" variant="tonal" prepend-icon="mdi-arrow-up-bold">
                  {{ tfSignalCount.bullish }}
                </v-chip>
                <v-chip size="small" color="error" variant="tonal" prepend-icon="mdi-arrow-down-bold">
                  {{ tfSignalCount.bearish }}
                </v-chip>
                <v-chip size="small" color="grey" variant="tonal" prepend-icon="mdi-minus">
                  {{ tfSignalCount.neutral }}
                </v-chip>
                <v-spacer />
                <span class="text-caption text-label-muted align-self-center">
                  {{ formatTimeAgo(currentRaw.timestamp) }}
                </span>
              </div>
            </v-card-text>
          </v-card>

          <!-- Indicator Cards Grid -->
          <div class="d-flex flex-column ga-2">

            <!-- RSI -->
            <v-card class="glass-card" rounded="lg">
              <v-card-text class="d-flex align-center justify-space-between pa-3">
                <div>
                  <div class="text-caption font-weight-bold text-label-muted">RSI</div>
                  <div class="text-body-1 font-weight-bold font-mono">
                    {{ currentRaw.rsi !== null ? currentRaw.rsi.toFixed(2) : 'N/A' }}
                  </div>
                </div>
                <v-chip
                  v-if="currentRaw.rsi !== null"
                  size="small"
                  :color="currentRaw.rsi < 30 ? 'success' : currentRaw.rsi > 70 ? 'error' : 'grey'"
                  variant="tonal"
                >
                  {{ currentRaw.rsi < 30 ? 'Oversold' : currentRaw.rsi > 70 ? 'Overbought' : 'Neutral' }}
                </v-chip>
              </v-card-text>
              <v-progress-linear
                v-if="currentRaw.rsi !== null"
                :model-value="currentRaw.rsi"
                :color="currentRaw.rsi < 30 ? 'success' : currentRaw.rsi > 70 ? 'error' : 'primary'"
                height="3"
              />
            </v-card>

            <!-- MACD -->
            <v-card class="glass-card" rounded="lg">
              <v-card-text class="d-flex align-center justify-space-between pa-3">
                <div>
                  <div class="text-caption font-weight-bold text-label-muted">MACD</div>
                  <div class="d-flex align-center ga-2">
                    <span class="text-body-2 font-mono">
                      H: <span :class="currentRaw.macd.histogram !== null && currentRaw.macd.histogram > 0 ? 'text-success' : 'text-error'" class="font-weight-bold">
                        {{ currentRaw.macd.histogram !== null ? currentRaw.macd.histogram.toFixed(5) : 'N/A' }}
                      </span>
                    </span>
                  </div>
                </div>
                <v-chip
                  v-if="currentRaw.macd.histogram !== null"
                  size="small"
                  :color="currentRaw.macd.histogram > 0 ? 'success' : 'error'"
                  variant="tonal"
                >
                  {{ currentRaw.macd.histogram > 0 ? 'Bullish' : 'Bearish' }}
                </v-chip>
              </v-card-text>
            </v-card>

            <!-- ADX -->
            <v-card class="glass-card" rounded="lg">
              <v-card-text class="d-flex align-center justify-space-between pa-3">
                <div>
                  <div class="text-caption font-weight-bold text-label-muted">ADX</div>
                  <div class="text-body-1 font-weight-bold font-mono">
                    {{ currentRaw.adx?.adx !== null && currentRaw.adx?.adx !== undefined ? currentRaw.adx.adx.toFixed(2) : 'N/A' }}
                  </div>
                  <div class="text-caption font-mono text-label-muted">
                    +DI: {{ currentRaw.adx?.plusDI?.toFixed(1) ?? '-' }}
                    · -DI: {{ currentRaw.adx?.minusDI?.toFixed(1) ?? '-' }}
                  </div>
                </div>
                <div class="text-right">
                  <v-chip
                    v-if="currentRaw.adx?.adx != null"
                    size="small"
                    :color="currentRaw.adx.adx < 20 ? 'grey' : currentRaw.adx.adx < 40 ? 'warning' : 'success'"
                    variant="tonal"
                  >
                    {{ currentRaw.adx.adx < 20 ? 'No Trend' : currentRaw.adx.adx < 25 ? 'Developing' : currentRaw.adx.adx < 40 ? 'Established' : 'Strong' }}
                  </v-chip>
                  <div v-if="currentRaw.adx?.plusDI != null && currentRaw.adx?.minusDI != null" class="mt-1">
                    <v-chip
                      size="x-small"
                      :color="currentRaw.adx.plusDI > currentRaw.adx.minusDI ? 'success' : 'error'"
                      variant="tonal"
                    >
                      {{ currentRaw.adx.plusDI > currentRaw.adx.minusDI ? 'Bullish' : 'Bearish' }}
                    </v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Stochastic -->
            <v-card class="glass-card" rounded="lg">
              <v-card-text class="d-flex align-center justify-space-between pa-3">
                <div>
                  <div class="text-caption font-weight-bold text-label-muted">Stochastic</div>
                  <div class="text-body-2 font-mono">
                    %K: <span class="font-weight-bold">{{ currentRaw.stochastic?.k?.toFixed(2) ?? 'N/A' }}</span>
                    · %D: <span class="font-weight-bold">{{ currentRaw.stochastic?.d?.toFixed(2) ?? 'N/A' }}</span>
                  </div>
                </div>
                <v-chip
                  v-if="currentRaw.stochastic?.k != null"
                  size="small"
                  :color="currentRaw.stochastic.k < 20 ? 'success' : currentRaw.stochastic.k > 80 ? 'error' : 'grey'"
                  variant="tonal"
                >
                  {{ currentRaw.stochastic.k < 20 ? 'Oversold' : currentRaw.stochastic.k > 80 ? 'Overbought' : 'Neutral' }}
                </v-chip>
              </v-card-text>
            </v-card>

            <!-- Moving Averages -->
            <v-card class="glass-card" rounded="lg">
              <v-card-text class="pa-3">
                <div class="text-caption font-weight-bold text-label-muted mb-2">Moving Averages</div>
                <div class="d-flex flex-column ga-1">
                  <div class="d-flex justify-space-between text-body-2 font-mono">
                    <span class="text-label-muted">EMA 20</span>
                    <span class="font-weight-bold">{{ currentRaw.movingAverages.ema20?.toFixed(4) ?? 'N/A' }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-body-2 font-mono">
                    <span class="text-label-muted">SMA 50</span>
                    <span class="font-weight-bold">{{ currentRaw.movingAverages.sma50?.toFixed(4) ?? 'N/A' }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-body-2 font-mono">
                    <span class="text-label-muted">SMA 200</span>
                    <span class="font-weight-bold">{{ currentRaw.movingAverages.sma200?.toFixed(4) ?? 'N/A' }}</span>
                  </div>
                  <div v-if="currentRaw.movingAverages.sma50 != null && currentRaw.movingAverages.sma200 != null" class="mt-1">
                    <v-chip
                      size="x-small"
                      :color="currentRaw.movingAverages.sma50 > currentRaw.movingAverages.sma200 ? 'success' : 'error'"
                      variant="tonal"
                    >
                      {{ currentRaw.movingAverages.sma50 > currentRaw.movingAverages.sma200 ? 'Golden Cross' : 'Death Cross' }}
                    </v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Bollinger Bands -->
            <v-card class="glass-card" rounded="lg">
              <v-card-text class="pa-3">
                <div class="text-caption font-weight-bold text-label-muted mb-2">Bollinger Bands</div>
                <div class="d-flex flex-column ga-1">
                  <div class="d-flex justify-space-between text-body-2 font-mono">
                    <span class="text-label-muted">Upper</span>
                    <span class="font-weight-bold text-error">{{ currentRaw.bollingerBands?.upper?.toFixed(4) ?? 'N/A' }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-body-2 font-mono">
                    <span class="text-label-muted">Middle</span>
                    <span class="font-weight-bold">{{ currentRaw.bollingerBands?.middle?.toFixed(4) ?? 'N/A' }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-body-2 font-mono">
                    <span class="text-label-muted">Lower</span>
                    <span class="font-weight-bold text-success">{{ currentRaw.bollingerBands?.lower?.toFixed(4) ?? 'N/A' }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- ATR -->
            <v-card class="glass-card" rounded="lg">
              <v-card-text class="d-flex align-center justify-space-between pa-3">
                <div>
                  <div class="text-caption font-weight-bold text-label-muted">ATR</div>
                  <div class="text-body-1 font-weight-bold font-mono">
                    {{ currentRaw.atr !== null ? currentRaw.atr.toFixed(5) : 'N/A' }}
                  </div>
                </div>
                <v-chip size="small" color="info" variant="tonal">
                  Volatility
                </v-chip>
              </v-card-text>
            </v-card>

          </div>

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
