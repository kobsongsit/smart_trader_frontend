<script setup lang="ts">
import type { TrendDirection } from '../../../types/trading'
import {
  formatPrice,
  formatPriceChange,
  formatTimeAgo,
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
} from '../../../types/trading'

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

// ─── Summary (from cache or freshly fetched) ───
const summary = computed(() => getCachedSummary(symbolId.value))
const pageReady = ref(false)

// ─── Fetch data on mount + subscribe WebSocket ───
onMounted(async () => {
  // 1. Subscribe to this symbol's WebSocket channel (socket connected at app level)
  subscribeSymbol(symbolId.value)

  // 2. Fetch summary if not cached (e.g., direct navigation / page refresh)
  if (!getCachedSummary(symbolId.value)) {
    await fetchSymbolSummary(symbolId.value)
  }

  // 3. Load full analysis data (from cache or API)
  await fetchAnalysis(symbolId.value)

  // Mark page as ready — "ไม่พบข้อมูล" จะแสดงได้หลังจากนี้เท่านั้น
  pageReady.value = true

  // 4. Check freshness — ถ้า cache มีอยู่แล้ว ตรวจว่ายัง fresh อยู่ไหม
  //    ถ้า backend มี data ใหม่กว่า → auto re-fetch + update cache (UI reactive)
  if (getCachedAnalysis(symbolId.value)) {
    await checkFreshness(symbolId.value)
  }
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
      <v-btn icon variant="text" size="small" @click="goBack">
        <v-icon icon="mdi-arrow-left" />
      </v-btn>
      <div v-if="summary" class="text-center">
        <div class="d-flex align-center justify-center ga-2">
          <span class="text-h6 font-weight-black">{{ summary.name }}</span>
          <v-chip size="x-small" variant="outlined" rounded="lg">{{ summary.type }}</v-chip>
        </div>
        <div class="text-caption text-medium-emphasis">{{ summary.price.updatedAgo }}</div>
      </div>
      <div v-else style="width: 40px;" />
      <!-- Placeholder for right side alignment -->
      <div style="width: 40px;" />
    </div>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- Page loading state (before data is ready)          -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div v-if="!pageReady" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="40" />
      <div class="text-caption mt-3 text-medium-emphasis">กำลังโหลดข้อมูล...</div>
    </div>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- Not found state (only after fetch completed)       -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div v-else-if="!summary" class="text-center py-12">
      <v-icon icon="mdi-alert-circle-outline" size="48" class="mb-3 text-medium-emphasis" />
      <div class="text-body-1 text-medium-emphasis mb-4">ไม่พบข้อมูล Symbol</div>
      <v-btn variant="tonal" color="primary" @click="goBack">
        <v-icon icon="mdi-arrow-left" start />
        กลับหน้าหลัก
      </v-btn>
    </div>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- MAIN CONTENT (when summary exists)                 -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div v-else>

      <!-- ══════ Price + Strength ══════ -->
      <div class="mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div>
            <div class="text-h4 font-weight-black font-mono">
              {{ formatPrice(summary.price.current) }}
            </div>
            <span :class="['text-body-2 font-weight-medium font-mono', getPriceChangeColor(summary.price.changePercent) === 'success' ? 'text-success' : getPriceChangeColor(summary.price.changePercent) === 'error' ? 'text-error' : 'text-grey']">
              {{ formatPriceChange(summary.price.changePercent) }}
            </span>
          </div>
          <div class="text-right">
            <div class="text-caption text-uppercase text-medium-emphasis">{{ strengthLabel }}</div>
            <div class="text-h4 font-weight-black font-mono" :class="`text-${strengthColor}`">{{ strengthScore }}%</div>
          </div>
        </div>

        <v-progress-linear
          :model-value="strengthScore"
          :color="strengthColor"
          rounded
          height="6"
          bg-color="#2A2A2A"
          class="mb-3"
        />

        <div class="d-flex flex-wrap ga-1">
          <v-chip :color="getTrendColor(majorityTrend)" size="small" variant="tonal" rounded="lg">
            {{ trendSummaryText }}
          </v-chip>
          <v-chip
            v-if="summary.trend.consensusLabel"
            size="small"
            variant="tonal"
            rounded="lg"
          >
            {{ summary.trend.consensusLabel }}
          </v-chip>
        </div>
      </div>

      <!-- ══════ Loading State ══════ -->
      <div v-if="isLoading && !analysis" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="40" />
        <div class="text-caption mt-3 text-medium-emphasis">กำลังโหลดข้อมูลวิเคราะห์...</div>
      </div>

      <!-- ══════ Analysis Content ══════ -->
      <template v-if="analysis">

        <!-- ══════ Candlestick Chart ══════ -->
        <div class="mb-4">
          <TradingCandlestickChart :symbol-id="symbolId" />
        </div>

        <!-- ══════ Indicator Summary ══════ -->
        <div v-if="indicators" class="mb-4">
          <div class="text-overline font-weight-bold mb-2" style="color: rgb(100 116 139);">
            <v-icon icon="mdi-chart-box" size="16" class="mr-1" />
            Indicator Summary
          </div>
          <v-sheet rounded="lg" class="glass-sheet pa-3">
            <div class="d-flex align-center justify-space-between mb-2">
              <v-chip :color="getBiasColor(overallBias)" variant="flat" size="small">
                <v-icon :icon="getBiasIcon(overallBias)" start size="14" />
                {{ overallBiasLabel }}
              </v-chip>
              <span class="text-caption font-weight-bold text-uppercase">{{ biasStrength }}</span>
            </div>

            <!-- Bullish / Bearish / Neutral counts -->
            <v-row dense>
              <v-col cols="4">
                <div class="text-center">
                  <div class="text-caption text-success">Bullish</div>
                  <div class="text-h5 font-weight-black text-success font-mono">{{ bullishCount }}</div>
                </div>
              </v-col>
              <v-col cols="4">
                <div class="text-center">
                  <div class="text-caption text-error">Bearish</div>
                  <div class="text-h5 font-weight-black text-error font-mono">{{ bearishCount }}</div>
                </div>
              </v-col>
              <v-col cols="4">
                <div class="text-center">
                  <div class="text-caption text-grey">Neutral</div>
                  <div class="text-h5 font-weight-black font-mono">{{ neutralCount }}</div>
                </div>
              </v-col>
            </v-row>

            <!-- Visual bar -->
            <div class="d-flex mt-2 rounded overflow-hidden" style="height: 8px;">
              <div :style="{ flex: bullishCount, background: '#4CAF50' }" />
              <div :style="{ flex: neutralCount, background: '#9E9E9E' }" />
              <div :style="{ flex: bearishCount, background: '#FF5252' }" />
            </div>
          </v-sheet>
        </div>

        <!-- ══════ Multi-Timeframe Trends ══════ -->
        <div v-if="trends" class="mb-4">
          <div class="text-overline font-weight-bold mb-2" style="color: rgb(100 116 139);">
            <v-icon icon="mdi-clock-outline" size="16" class="mr-1" />
            Multi-Timeframe Trends
          </div>
          <!-- Trends Grid — card-based -->
          <div class="d-flex ga-2 mb-3">
            <v-sheet
              v-for="(tf, key) in trends.timeframes"
              :key="key"
              rounded="lg"
              class="glass-sheet pa-3 text-center flex-fill"
            >
              <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">{{ key }}</div>
              <v-chip
                :color="getTrendColor(tf.direction || 'NEUTRAL')"
                variant="flat"
                size="small"
                class="justify-center font-weight-black font-mono"
                style="min-width: 40px;"
              >
                {{ tf.adx !== null ? tf.adx.toFixed(0) : '-' }}
              </v-chip>
            </v-sheet>
          </div>

          <!-- Majority + Consensus -->
          <div class="d-flex align-center ga-2">
            <v-chip
              :color="getTrendColor(trends.analysis.majorityTrend)"
              size="small"
              variant="flat"
            >
              <v-icon icon="mdi-check-circle" size="14" start />
              {{ trends.analysis.majorityTrendLabel }}
            </v-chip>
            <v-chip
              :color="getConsensusColor(trends.analysis.consensus)"
              size="small"
              variant="tonal"
            >
              {{ trends.analysis.consensus }}
            </v-chip>
          </div>
        </div>

        <!-- ══════ Price Position (Bollinger Bands) ══════ -->
        <div v-if="bbData" class="mb-4">
          <div class="text-overline font-weight-bold mb-2" style="color: rgb(100 116 139);">
            <v-icon icon="mdi-target" size="16" class="mr-1" />
            Price Position (Bollinger Bands)
          </div>
          <TradingPricePosition
            :bb="bbData"
            :current-price="summary.price.current"
          />
        </div>

        <!-- ══════ Technical Indicators ══════ -->
        <div v-if="indicators" class="mb-4">
          <div class="text-overline font-weight-bold mb-2" style="color: rgb(100 116 139);">
            <v-icon icon="mdi-chart-line" size="16" class="mr-1" />
            Technical Indicators
          </div>

          <!-- Moving Averages -->
          <v-sheet rounded="lg" class="glass-sheet pa-3 mb-2">
            <div class="text-caption font-weight-bold mb-2">
              <v-icon icon="mdi-chart-timeline-variant" size="14" color="info" class="mr-1" />
              Moving Averages
            </div>
            <v-row dense>
              <v-col cols="4">
                <TradingIndicatorValue label="SMA 50" :value="maData?.sma50 ?? null" :decimals="4" />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue label="SMA 200" :value="maData?.sma200 ?? null" :decimals="4" />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue label="EMA 20" :value="maData?.ema20 ?? null" :decimals="4" />
              </v-col>
            </v-row>
            <div v-if="maData" class="d-flex flex-wrap ga-1 mt-2">
              <v-chip :color="getCrossColor(maData.sma50VsSma200)" size="x-small" variant="flat">
                <v-icon :icon="getCrossIcon(maData.sma50VsSma200)" size="12" start />
                {{ getCrossLabel(maData.sma50VsSma200) }}
              </v-chip>
              <v-chip
                :color="maData.priceVsSma50 === 'above' ? 'success' : 'error'"
                size="x-small"
                variant="tonal"
              >
                Price {{ maData.priceVsSma50 }} SMA50
              </v-chip>
              <v-chip
                :color="maData.priceVsEma20 === 'above' ? 'success' : 'error'"
                size="x-small"
                variant="tonal"
              >
                Price {{ maData.priceVsEma20 }} EMA20
              </v-chip>
            </div>
          </v-sheet>

          <!-- MACD -->
          <v-sheet rounded="lg" class="glass-sheet pa-3 mb-2">
            <div class="text-caption font-weight-bold mb-2">
              <v-icon icon="mdi-chart-bar" size="14" color="orange" class="mr-1" />
              MACD
            </div>
            <v-row dense>
              <v-col cols="4">
                <TradingIndicatorValue label="Line" :value="macdData?.line ?? null" :decimals="4" />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue label="Signal" :value="macdData?.signal ?? null" :decimals="4" />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Histogram"
                  :value="macdData?.histogram ?? null"
                  :decimals="4"
                  :color="(macdData?.histogram ?? 0) >= 0 ? 'success' : 'error'"
                  show-bar
                  :bar-max="Math.abs(macdData?.histogram ?? 0) * 3 || 1"
                />
              </v-col>
            </v-row>
            <div v-if="macdData" class="d-flex ga-1 mt-2">
              <v-chip :color="getMACDTrendColor(macdData.trend)" size="x-small" variant="flat">
                {{ macdData.trend }}
              </v-chip>
              <v-chip size="x-small" variant="tonal">
                <v-icon :icon="getMomentumIcon(macdData.momentum)" size="12" start />
                {{ macdData.momentum }}
              </v-chip>
            </div>
          </v-sheet>

          <!-- Oscillators: RSI + Stochastic -->
          <v-sheet rounded="lg" class="glass-sheet pa-3 mb-2">
            <div class="text-caption font-weight-bold mb-2">
              <v-icon icon="mdi-sine-wave" size="14" color="green" class="mr-1" />
              Oscillators (RSI / Stoch)
            </div>
            <v-row dense>
              <v-col cols="4">
                <TradingIndicatorValue
                  v-if="rsiData"
                  label="RSI"
                  :value="rsiData.value"
                  :decimals="1"
                  :color="getZoneColor(rsiData.zone)"
                  show-bar
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue label="Stoch %K" :value="stochData?.k ?? null" :decimals="1" />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue label="Stoch %D" :value="stochData?.d ?? null" :decimals="1" />
              </v-col>
            </v-row>
            <div class="d-flex flex-wrap ga-1 mt-2">
              <v-chip v-if="rsiData" :color="getZoneColor(rsiData.zone)" size="x-small" variant="tonal">
                {{ getZoneLabel(rsiData.zone) }}
              </v-chip>
              <v-chip
                v-if="stochData && stochData.crossover !== 'none'"
                :color="stochData.crossover === 'bullish_cross' ? 'success' : 'error'"
                size="x-small"
                variant="flat"
              >
                {{ stochData.crossover === 'bullish_cross' ? 'Bullish Cross' : 'Bearish Cross' }}
              </v-chip>
            </div>
          </v-sheet>

          <!-- Volume & Volatility: OBV + ATR -->
          <v-sheet rounded="lg" class="glass-sheet pa-3 mb-2">
            <div class="text-caption font-weight-bold mb-2">
              <v-icon icon="mdi-chart-areaspline" size="14" color="blue" class="mr-1" />
              Volume & Volatility
            </div>
            <v-row dense>
              <v-col cols="6">
                <TradingIndicatorValue label="OBV" :value="obvData?.value ?? null" :decimals="0" />
                <div v-if="obvData" class="d-flex flex-wrap ga-1 mt-1">
                  <v-chip :color="getOBVConfirmationColor(obvData.confirmation)" size="x-small" variant="tonal">
                    {{ obvData.confirmation }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="6">
                <TradingIndicatorValue label="ATR" :value="atrData?.value ?? null" :decimals="4" />
                <v-chip v-if="atrData" :color="getATRLevelColor(atrData.level)" size="x-small" variant="tonal" class="mt-1">
                  {{ atrData.level }}
                </v-chip>
              </v-col>
            </v-row>
          </v-sheet>

          <!-- Trend Strength: ADX -->
          <v-sheet rounded="lg" class="glass-sheet pa-3">
            <div class="text-caption font-weight-bold mb-2">
              <v-icon icon="mdi-trending-up" size="14" color="amber" class="mr-1" />
              Trend Strength (ADX)
            </div>
            <v-row dense>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="ADX"
                  :value="adxData?.value ?? null"
                  :decimals="1"
                  :color="adxData ? getADXStrengthColor(adxData.trendStrength) : 'grey'"
                  show-bar
                  :bar-max="60"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue label="+DI" :value="adxData?.plusDI ?? null" :decimals="1" color="success" />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue label="-DI" :value="adxData?.minusDI ?? null" :decimals="1" color="error" />
              </v-col>
            </v-row>
            <div v-if="adxData" class="d-flex flex-wrap ga-1 mt-2">
              <v-chip :color="getADXStrengthColor(adxData.trendStrength)" size="x-small" variant="tonal">
                <v-icon :icon="getADXStrengthIcon(adxData.trendStrength)" size="12" start />
                {{ adxData.trendStrength }}
              </v-chip>
              <v-chip :color="getADXDirectionColor(adxData.trendDirection)" size="x-small" variant="tonal">
                {{ adxData.trendDirection }}
              </v-chip>
            </div>
          </v-sheet>
        </div>

        <!-- ══════ AI ENGINE DECISION LOGIC ══════ -->
        <div class="mb-4">
          <div class="text-overline font-weight-bold mb-2" style="color: rgb(100 116 139);">
            <v-icon icon="mdi-flash" size="16" class="mr-1" />
            AI Engine Decision Logic
          </div>

          <v-sheet rounded="lg" class="glass-card pa-4">
            <!-- Pre-Filter Checks -->
            <div v-if="trends" class="mb-4">
              <TradingPreFilterStatus
                :pre-filter="trends.preFilter"
                :analysis="trends.analysis"
              />
            </div>

            <!-- Validation Rules -->
            <div v-if="validation" class="mb-4">
              <TradingValidationStatus :validation="validation" />
            </div>

            <!-- Analyze Button -->
            <TradingSignalAnalyzeButton
              :loading="isAIWorking"
              @analyze="handleAnalyze"
            />

            <!-- Signal Error -->
            <v-alert v-if="analyzeError" type="error" variant="tonal" density="compact" class="mt-3">
              {{ analyzeError }}
            </v-alert>
          </v-sheet>
        </div>

        <!-- ══════ AI SIGNAL ANALYSIS RESULT ══════ -->
        <div v-if="isAIWorking || signal" class="mb-4">
          <div class="text-overline font-weight-bold mb-2" style="color: rgb(100 116 139);">
            <v-icon icon="mdi-flash" size="16" class="mr-1" />
            AI Signal Analysis Result
          </div>
          <!-- Skeleton while AI is analyzing -->
          <TradingSignalResultSkeleton v-if="isAIWorking" />
          <!-- Actual result -->
          <TradingSignalResult v-else :signal="signal!" />
        </div>

        <!-- ══════ Meta Info Footer ══════ -->
        <v-sheet v-if="meta" rounded="lg" class="glass-sheet pa-3 text-center mb-4">
          <div class="text-caption text-medium-emphasis">
            <span>Updated: {{ formatTimeAgo(meta.timestamp) }}</span>
            <span class="mx-1">&middot;</span>
            <span>v{{ meta.version }}</span>
            <span class="mx-1">&middot;</span>
            <span>WebSocket Active</span>
          </div>
        </v-sheet>

      </template>
    </div>
  </v-container>
</template>
