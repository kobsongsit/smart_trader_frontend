<script setup lang="ts">
import type { TrendDirection } from '../../../../types/trading'
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

// ─── Reload ───
const isRefreshing = ref(false)

async function handleReload() {
  isRefreshing.value = true
  try {
    await fetchSymbolSummary(symbolId.value)
    await fetchAnalysis(symbolId.value)
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
    <!-- Not found state (only after fetch completed)       -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div v-else-if="!summary" class="text-center py-12">
      <v-icon icon="mdi-alert-circle-outline" size="48" class="mb-3 text-label-muted" />
      <div class="text-body-1 text-label-muted mb-4">ไม่พบข้อมูล Symbol</div>
      <v-btn variant="tonal" color="primary" @click="goBack">
        <v-icon icon="mdi-arrow-left" start />
        กลับหน้าหลัก
      </v-btn>
    </div>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- MAIN CONTENT (when summary exists)                 -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div v-else>

      <!-- ══════ Loading State ══════ -->
      <div v-if="isLoading && !analysis" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="40" />
        <div class="text-caption mt-3 text-label-muted">กำลังโหลดข้อมูลวิเคราะห์...</div>
      </div>

      <!-- ══════ Candlestick Chart (graph only — for verification) ══════ -->
      <template v-if="analysis">
        <div class="mb-4">
          <TradingCandlestickChart :symbol-id="symbolId" />
        </div>
      </template>

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
