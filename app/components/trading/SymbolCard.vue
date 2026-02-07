<script setup lang="ts">
import type { SymbolSummary, SignalData, TrendDirection } from '../../../types/trading'
import {
  formatNumber,
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
  getBBPositionColor,
  getOBVConfirmationColor,
  getATRLevelColor,
  getADXStrengthColor,
  getADXStrengthIcon,
  getADXDirectionColor,
  getBiasColor,
  getBiasIcon,
  getConsensusColor,
} from '../../../types/trading'

interface Props {
  summary: SymbolSummary
}

const props = defineProps<Props>()

// Full Analysis composable (singleton) — for detail lazy-load
const {
  getCachedAnalysis,
  fetchAnalysis,
  isLoadingSymbol,
  isAIAnalyzing,
  analyzeSignal,
  fetchSignalHistory,
  isAnalyzing,
  analyzeError,
} = useAnalysis()

// ─── State ───
const expanded = ref(false)
const detailLoaded = ref(false)
const showSignalResult = ref(false)
const currentSignal = ref<SignalData | null>(null)
const showHistory = ref(false)
const signalHistory = ref<SignalData[]>([])

// ─── Summary derived values (from props.summary — instant, no API call) ───
const majorityTrend = computed((): TrendDirection => props.summary.trend.direction)
const trendAvatarColor = computed(() => getTrendColor(majorityTrend.value))

const avatarLetter = computed(() => props.summary.name?.charAt(0)?.toUpperCase() || '?')

// Trend summary text from summary API
const trendSummaryText = computed(() => {
  const t = props.summary.trend
  if (t.direction === 'NEUTRAL') {
    return `NEUTRAL ${t.neutralCount}/${t.totalTimeframes}`
  }
  return `${t.direction} ${Math.max(t.upCount, t.downCount)}/${t.totalTimeframes}`
})

// Strength bar — uses trend counts
const strengthLabel = computed(() => {
  if (majorityTrend.value === 'UP') return 'UPTREND STRENGTH'
  if (majorityTrend.value === 'DOWN') return 'DOWNTREND STRENGTH'
  return 'NEUTRAL STRENGTH'
})
const strengthIcon = computed(() => {
  if (majorityTrend.value === 'UP') return 'mdi-trending-up'
  if (majorityTrend.value === 'DOWN') return 'mdi-trending-down'
  return 'mdi-information-outline'
})
const strengthScore = computed(() => {
  const t = props.summary.trend
  if (t.totalTimeframes === 0) return 0
  if (t.direction === 'UP') return Math.round((t.upCount / t.totalTimeframes) * 100)
  if (t.direction === 'DOWN') return Math.round((t.downCount / t.totalTimeframes) * 100)
  return Math.round((t.neutralCount / t.totalTimeframes) * 100)
})
const strengthColor = computed(() => getTrendColor(majorityTrend.value))

// ─── Full analysis data (lazy-loaded on expand) ───
const analysis = computed(() => getCachedAnalysis(props.summary.id))
const isLoading = computed(() => isLoadingSymbol(props.summary.id))
const isAIWorking = computed(() => isAIAnalyzing(props.summary.id))

const indicators = computed(() => analysis.value?.indicators ?? null)
const trends = computed(() => analysis.value?.trends ?? null)
const validation = computed(() => analysis.value?.validation ?? null)
const signal = computed(() => analysis.value?.signal ?? null)
const meta = computed(() => analysis.value?.meta ?? null)

// Indicator summary (from full analysis)
const overallBias = computed(() => indicators.value?.summary?.overallBias ?? 'neutral')
const overallBiasLabel = computed(() => indicators.value?.summary?.overallBiasLabel ?? '-')
const biasStrength = computed(() => indicators.value?.summary?.strength ?? 'weak')
const bullishCount = computed(() => indicators.value?.summary?.bullishCount ?? 0)
const bearishCount = computed(() => indicators.value?.summary?.bearishCount ?? 0)
const neutralCount = computed(() => indicators.value?.summary?.neutralCount ?? 0)

// Moving Averages safe access (from full analysis)
const maData = computed(() => indicators.value?.movingAverages ?? null)
const macdData = computed(() => indicators.value?.macd ?? null)
const bbData = computed(() => indicators.value?.bollingerBands ?? null)
const rsiData = computed(() => indicators.value?.rsi ?? null)
const stochData = computed(() => indicators.value?.stochastic ?? null)
const obvData = computed(() => indicators.value?.obv ?? null)
const atrData = computed(() => indicators.value?.atr ?? null)
const adxData = computed(() => indicators.value?.adx ?? null)

// ─── Handlers ───
async function toggleExpand() {
  expanded.value = !expanded.value

  // Lazy-load full analysis on first expand
  if (expanded.value && !detailLoaded.value) {
    detailLoaded.value = true
    await fetchAnalysis(props.summary.id)
  }
}

async function handleAnalyze(includeNews: boolean) {
  const result = await analyzeSignal(props.summary.id, includeNews)
  if (result) {
    currentSignal.value = result
    showSignalResult.value = true
  }
}

async function loadSignalHistory() {
  showHistory.value = !showHistory.value
  if (showHistory.value) {
    signalHistory.value = await fetchSignalHistory(props.summary.id, 5)
  }
}

function handleSelectHistorySignal(sig: SignalData) {
  currentSignal.value = sig
  showSignalResult.value = true
}
</script>

<template>
  <v-card elevation="0" rounded="lg" class="mb-3 glass-card">

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- SUMMARY SECTION (always visible, from summary API) -->
    <!-- ═══════════════════════════════════════════════════ -->
    <v-card-text class="pb-1">

      <!-- Row 1: Symbol Info + Price -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center" style="min-width: 0;">
          <v-avatar :color="trendAvatarColor" size="46" rounded="lg" class="mr-3 flex-shrink-0">
            <span class="text-white font-weight-bold text-body-1">{{ avatarLetter }}</span>
          </v-avatar>
          <div style="min-width: 0;">
            <div class="d-flex align-center ga-2">
              <span class="text-body-1 font-weight-bold text-truncate">{{ props.summary.name }}</span>
              <v-chip size="x-small" variant="outlined" rounded="lg">{{ props.summary.type }}</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ props.summary.price.updatedAgo }}
            </div>
          </div>
        </div>

        <!-- Price -->
        <div class="text-right flex-shrink-0 ml-2">
          <div class="text-h6 font-weight-bold font-mono">{{ formatPrice(props.summary.price.current) }}</div>
          <span :class="['text-caption font-weight-medium font-mono', getPriceChangeColor(props.summary.price.changePercent) === 'success' ? 'text-success' : getPriceChangeColor(props.summary.price.changePercent) === 'error' ? 'text-error' : 'text-grey']">
            {{ formatPriceChange(props.summary.price.changePercent) }}
          </span>
        </div>
      </div>

      <!-- Row 2: Strength Bar -->
      <div class="mb-3">
        <div class="d-flex align-center justify-space-between mb-1">
          <div class="d-flex align-center ga-1">
            <v-icon :icon="strengthIcon" :color="strengthColor" size="18" />
            <span class="text-body-2 font-weight-bold text-uppercase">{{ strengthLabel }}</span>
          </div>
          <span class="text-body-2 font-weight-bold">{{ strengthScore }}%</span>
        </div>
        <v-progress-linear
          :model-value="strengthScore"
          :color="strengthColor"
          rounded
          height="6"
          bg-color="#1A2540"
        />
      </div>

      <!-- Row 3: Status Chips + Details Button -->
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex flex-wrap ga-1">
          <!-- Trend -->
          <v-chip :color="getTrendColor(majorityTrend)" size="x-small" variant="tonal" rounded="lg">
            {{ trendSummaryText }}
          </v-chip>

          <!-- Consensus -->
          <v-chip
            v-if="props.summary.trend.consensusLabel"
            size="x-small"
            variant="tonal"
            rounded="lg"
          >
            {{ props.summary.trend.consensusLabel }}
          </v-chip>
        </div>

        <!-- Details Button -->
        <v-btn
          variant="text"
          size="small"
          color="white"
          class="text-caption text-uppercase font-weight-medium"
          @click="toggleExpand"
        >
          Details
          <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" end size="16" />
        </v-btn>
      </div>

      <!-- AI Analyzing Indicator -->
      <v-sheet v-if="isAIWorking" rounded="lg" class="glass-sheet pa-2 mt-2">
        <div class="d-flex align-center ga-2">
          <v-progress-circular indeterminate color="primary" size="18" width="2" />
          <span class="text-caption text-primary font-weight-medium">
            AI กำลังวิเคราะห์...
          </span>
        </div>
      </v-sheet>
    </v-card-text>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- DETAIL SECTION (expandable, lazy-loaded)           -->
    <!-- ═══════════════════════════════════════════════════ -->
    <v-expand-transition>
      <div v-show="expanded">
        <v-divider />
        <v-card-text v-if="analysis">

          <!-- ══════ Candlestick Chart ══════ -->
          <div class="mb-4">
            <TradingCandlestickChart :symbol-id="props.summary.id" />
          </div>

          <!-- ══════ Indicator Summary ══════ -->
          <div v-if="indicators" class="mb-4">
            <div class="text-overline text-primary mb-2">
              <v-icon icon="mdi-chart-box" size="16" class="mr-1" />
              Indicator Summary
            </div>
            <v-sheet rounded="lg" class="glass-sheet pa-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <v-chip :color="getBiasColor(overallBias)" variant="flat" size="small">
                  <v-icon :icon="getBiasIcon(overallBias)" start size="14" />
                  {{ overallBiasLabel }}
                </v-chip>
                <v-chip variant="tonal" size="x-small">
                  {{ biasStrength }}
                </v-chip>
              </div>

              <!-- Bullish / Bearish / Neutral counts -->
              <v-row dense>
                <v-col cols="4">
                  <div class="text-center">
                    <div class="text-caption text-success">Bullish</div>
                    <div class="text-body-2 font-weight-bold text-success">{{ bullishCount }}</div>
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-center">
                    <div class="text-caption text-error">Bearish</div>
                    <div class="text-body-2 font-weight-bold text-error">{{ bearishCount }}</div>
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-center">
                    <div class="text-caption text-grey">Neutral</div>
                    <div class="text-body-2 font-weight-bold">{{ neutralCount }}</div>
                  </div>
                </v-col>
              </v-row>

              <!-- Visual bar -->
              <div class="d-flex mt-2 rounded overflow-hidden" style="height: 6px;">
                <div :style="{ flex: bullishCount, background: '#4CAF50' }" />
                <div :style="{ flex: neutralCount, background: '#9E9E9E' }" />
                <div :style="{ flex: bearishCount, background: '#FF5252' }" />
              </div>
            </v-sheet>
          </div>

          <!-- ══════ Multi-Timeframe Trends ══════ -->
          <div v-if="trends" class="mb-4">
            <div class="text-overline text-primary mb-2">
              <v-icon icon="mdi-clock-outline" size="16" class="mr-1" />
              Multi-Timeframe Trends
            </div>
            <v-sheet rounded="lg" class="glass-sheet pa-3">
              <!-- Trends Grid -->
              <v-row dense class="mb-2">
                <v-col
                  v-for="(tf, key) in trends.timeframes"
                  :key="key"
                  class="text-center"
                >
                  <div class="text-caption font-weight-medium mb-1">{{ key }}</div>
                  <v-chip
                    :color="getTrendColor(tf.direction || 'NEUTRAL')"
                    variant="flat"
                    size="x-small"
                    class="justify-center font-weight-bold"
                    style="min-width: 36px;"
                  >
                    {{ tf.adx !== null ? tf.adx.toFixed(0) : '-' }}
                  </v-chip>
                </v-col>
              </v-row>

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
                  size="x-small"
                  variant="tonal"
                >
                  {{ trends.analysis.consensus }}
                </v-chip>
              </div>
            </v-sheet>
          </div>

          <!-- ══════ Pre-Filter Status ══════ -->
          <div v-if="trends" class="mb-4">
            <TradingPreFilterStatus
              :pre-filter="trends.preFilter"
              :analysis="trends.analysis"
            />
          </div>

          <!-- ══════ Validation ══════ -->
          <div v-if="validation" class="mb-4">
            <TradingValidationStatus :validation="validation" />
          </div>

          <!-- ══════ Technical Indicators ══════ -->
          <div v-if="indicators" class="mb-4">
            <div class="text-overline text-primary mb-2">
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

            <!-- Bollinger Bands -->
            <v-sheet rounded="lg" class="glass-sheet pa-3 mb-2">
              <div class="text-caption font-weight-bold mb-2">
                <v-icon icon="mdi-chart-bell-curve" size="14" color="cyan" class="mr-1" />
                Bollinger Bands
              </div>
              <v-row dense>
                <v-col cols="4">
                  <TradingIndicatorValue label="Upper" :value="bbData?.upper ?? null" :decimals="4" />
                </v-col>
                <v-col cols="4">
                  <TradingIndicatorValue label="Middle" :value="bbData?.middle ?? null" :decimals="4" />
                </v-col>
                <v-col cols="4">
                  <TradingIndicatorValue label="Lower" :value="bbData?.lower ?? null" :decimals="4" />
                </v-col>
              </v-row>
              <div v-if="bbData" class="d-flex flex-wrap ga-1 mt-2">
                <v-chip :color="getBBPositionColor(bbData.pricePosition)" size="x-small" variant="tonal">
                  {{ bbData.pricePosition }} ({{ bbData.percentB.toFixed(0) }}%)
                </v-chip>
                <v-chip v-if="bbData.squeeze" color="warning" size="x-small" variant="flat">
                  <v-icon icon="mdi-flash" size="12" start />
                  Squeeze!
                </v-chip>
              </div>
            </v-sheet>

            <!-- Oscillators: RSI + Stochastic -->
            <v-sheet rounded="lg" class="glass-sheet pa-3 mb-2">
              <div class="text-caption font-weight-bold mb-2">
                <v-icon icon="mdi-sine-wave" size="14" color="green" class="mr-1" />
                Oscillators
              </div>
              <v-row dense>
                <v-col cols="6">
                  <TradingIndicatorValue
                    v-if="rsiData"
                    label="RSI"
                    :value="rsiData.value"
                    :decimals="1"
                    :color="getZoneColor(rsiData.zone)"
                    show-bar
                  />
                  <v-chip v-if="rsiData" :color="getZoneColor(rsiData.zone)" size="x-small" variant="tonal" class="mt-1">
                    {{ getZoneLabel(rsiData.zone) }}
                  </v-chip>
                  <div v-if="rsiData" class="text-caption text-medium-emphasis mt-1">{{ rsiData.description }}</div>
                </v-col>
                <v-col cols="6">
                  <TradingIndicatorValue label="Stoch %K" :value="stochData?.k ?? null" :decimals="1" />
                  <TradingIndicatorValue label="Stoch %D" :value="stochData?.d ?? null" :decimals="1" />
                  <div v-if="stochData" class="d-flex flex-wrap ga-1 mt-1">
                    <v-chip :color="getZoneColor(stochData.zone)" size="x-small" variant="tonal">
                      {{ getZoneLabel(stochData.zone) }}
                    </v-chip>
                    <v-chip
                      v-if="stochData.crossover !== 'none'"
                      :color="stochData.crossover === 'bullish_cross' ? 'success' : 'error'"
                      size="x-small"
                      variant="flat"
                    >
                      {{ stochData.crossover === 'bullish_cross' ? 'Bullish Cross' : 'Bearish Cross' }}
                    </v-chip>
                  </div>
                </v-col>
              </v-row>
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
                  <div v-if="obvData" class="text-caption text-medium-emphasis mt-1">{{ obvData.description }}</div>
                </v-col>
                <v-col cols="6">
                  <TradingIndicatorValue label="ATR" :value="atrData?.value ?? null" :decimals="4" />
                  <v-chip v-if="atrData" :color="getATRLevelColor(atrData.level)" size="x-small" variant="tonal" class="mt-1">
                    {{ atrData.level }}
                  </v-chip>
                  <div v-if="atrData" class="text-caption text-medium-emphasis mt-1">
                    SL: {{ formatNumber(atrData.suggestedSL, 4) }} |
                    TP: {{ formatNumber(atrData.suggestedTP, 4) }}
                  </div>
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
              <div v-if="adxData" class="text-caption text-medium-emphasis mt-1">{{ adxData.description }}</div>
            </v-sheet>
          </div>

          <!-- ══════ AI Signal Analysis ══════ -->
          <div class="mb-4">
            <div class="text-overline text-primary mb-2">
              <v-icon icon="mdi-robot" size="16" class="mr-1" />
              AI Signal Analysis
            </div>

            <!-- Existing Signal from API (full detail) -->
            <div v-if="signal && !showSignalResult" class="mb-3">
              <TradingSignalResult :signal="signal" />
            </div>

            <!-- Analyze Button -->
            <TradingSignalAnalyzeButton
              :loading="isAnalyzing"
              @analyze="handleAnalyze"
            />

            <!-- Signal Error -->
            <v-alert v-if="analyzeError" type="error" variant="tonal" density="compact" class="mt-2">
              {{ analyzeError }}
            </v-alert>

            <!-- New Signal Result -->
            <div v-if="showSignalResult && currentSignal" class="mt-3">
              <TradingSignalResult :signal="currentSignal" />
            </div>

            <!-- History Toggle -->
            <v-btn variant="text" size="small" color="primary" class="mt-2" @click="loadSignalHistory">
              <v-icon :icon="showHistory ? 'mdi-chevron-up' : 'mdi-chevron-down'" start />
              {{ showHistory ? 'ซ่อน' : 'ดู' }} Signal History
            </v-btn>

            <!-- Signal History -->
            <v-expand-transition>
              <div v-show="showHistory" class="mt-2">
                <TradingSignalHistory
                  :signals="signalHistory"
                  :loading="false"
                  @select="handleSelectHistorySignal"
                />
              </div>
            </v-expand-transition>
          </div>

          <!-- ══════ Meta Info ══════ -->
          <v-sheet v-if="meta" rounded="lg" class="glass-sheet pa-2">
            <div class="d-flex justify-space-between text-caption text-medium-emphasis">
              <span>
                <v-icon icon="mdi-clock-outline" size="12" />
                อัพเดท: {{ formatTimeAgo(meta.timestamp) }}
              </span>
              <span v-if="meta.nextUpdate">
                ถัดไป: {{ formatTimeAgo(meta.nextUpdate) }}
              </span>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              v{{ meta.version }} · {{ meta.source }}
            </div>
          </v-sheet>

        </v-card-text>

        <!-- Loading state for detail -->
        <v-card-text v-else-if="isLoading">
          <v-skeleton-loader type="list-item@6" />
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>
