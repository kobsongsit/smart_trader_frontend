<script setup lang="ts">
import type { Symbol, SymbolIndicators, TrendDirection } from '../../../types/trading'
import { formatPrice, getRSIStatus, getADXStrength, formatNumber, getTrendColor } from '../../../types/trading'

interface Props {
  symbol: Symbol
  indicators?: SymbolIndicators | null
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
})

const emit = defineEmits<{
  expand: [symbolId: number]
}>()

// State
const isExpanded = ref(false)

// Computed - Price Info
const currentPrice = computed(() => props.indicators?.currentPrice || null)
const priceChange = computed(() => props.indicators?.priceChange || null)
const priceChangePercent = computed(() => props.indicators?.priceChangePercent || null)
const high24h = computed(() => props.indicators?.high24h || null)
const low24h = computed(() => props.indicators?.low24h || null)
const volume24h = computed(() => props.indicators?.volume24h || null)
const timestamp = computed(() => props.indicators?.timestamp || null)

// Computed - Indicators
const majorityTrend = computed(() => props.indicators?.indicators?.majorityTrend || 'NEUTRAL')
const rsi = computed(() => props.indicators?.indicators?.rsi || null)
const adx = computed(() => props.indicators?.indicators?.adx?.adx || null)
const trends = computed(() => props.indicators?.indicators?.trends)
const warnings = computed(() => props.indicators?.warnings || [])

const rsiStatus = computed(() => getRSIStatus(rsi.value))
const adxStrength = computed(() => getADXStrength(adx.value))

const isPriceUp = computed(() => (priceChange.value || 0) >= 0)

// Format timestamp to relative time
const timeAgo = computed(() => {
  if (!timestamp.value) return null
  const date = new Date(timestamp.value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
})

// Count trends
const trendCount = computed(() => {
  if (!trends.value) return { up: 0, down: 0, neutral: 0, total: 0 }
  const values = Object.values(trends.value) as TrendDirection[]
  return {
    up: values.filter(t => t === 'UP').length,
    down: values.filter(t => t === 'DOWN').length,
    neutral: values.filter(t => t === 'NEUTRAL').length,
    total: values.length
  }
})

// Methods
function toggleExpand() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    emit('expand', props.symbol.id)
  }
}

function getSymbolIcon(type: string): string {
  switch (type) {
    case 'CRYPTO': return 'mdi-bitcoin'
    case 'STOCK': return 'mdi-chart-line'
    case 'FOREX': return 'mdi-currency-usd'
    default: return 'mdi-chart-box'
  }
}
</script>

<template>
  <v-card
    class="symbol-card mb-3"
    elevation="2"
    @click="toggleExpand"
  >
    <!-- Header - Always Visible -->
    <v-card-text class="pb-2">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-avatar
            :color="props.symbol.isActive ? 'success' : 'grey'"
            size="40"
            class="mr-3"
          >
            <v-icon
              :icon="getSymbolIcon(props.symbol.type)"
              color="white"
            />
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">
              {{ props.symbol.name }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ props.symbol.displayName }}
            </div>
          </div>
        </div>

        <div class="d-flex align-center">
          <TradingTrendBadge
            v-if="!props.loading && props.indicators"
            :trend="majorityTrend as TrendDirection"
            size="small"
            class="mr-2"
          />
          <v-icon
            :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            size="24"
          />
        </div>
      </div>

      <!-- Price Info -->
      <div v-if="props.loading" class="mt-3">
        <v-skeleton-loader type="text" width="150" />
        <v-skeleton-loader type="text" width="100" class="mt-1" />
      </div>
      <div v-else-if="props.indicators" class="mt-3">
        <div class="d-flex align-center">
          <span class="text-h6 font-weight-bold">
            {{ formatPrice(currentPrice) }}
          </span>
          <v-chip
            v-if="priceChangePercent !== null"
            :color="isPriceUp ? 'success' : 'error'"
            size="x-small"
            variant="flat"
            class="ml-2"
          >
            <v-icon
              :icon="isPriceUp ? 'mdi-arrow-up' : 'mdi-arrow-down'"
              size="12"
              start
            />
            {{ Math.abs(priceChangePercent).toFixed(2) }}%
          </v-chip>
        </div>
        <div class="text-caption text-medium-emphasis mt-1">
          <span v-if="high24h && low24h">
            24h: {{ formatPrice(high24h) }} / {{ formatPrice(low24h) }}
          </span>
          <span v-if="timeAgo" class="ml-2">
            <v-icon icon="mdi-clock-outline" size="12" />
            {{ timeAgo }}
          </span>
        </div>
      </div>
      <div v-else class="text-caption text-medium-emphasis mt-3">
        Click to load indicators
      </div>

      <!-- Quick Stats -->
      <div v-if="props.indicators && !props.loading" class="d-flex flex-wrap gap-1 mt-2">
        <v-chip size="x-small" variant="tonal" :color="rsiStatus.color">
          RSI: {{ rsi !== null ? rsi.toFixed(0) : 'N/A' }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" :color="adxStrength.color">
          ADX: {{ adx !== null ? adx.toFixed(0) : 'N/A' }}
        </v-chip>
        <v-chip v-if="volume24h" size="x-small" variant="tonal" color="info">
          Vol: {{ formatNumber(volume24h, 0) }}
        </v-chip>
      </div>
    </v-card-text>

    <!-- Expanded Content -->
    <v-expand-transition>
      <div v-show="isExpanded">
        <v-divider />

        <!-- Loading State -->
        <v-card-text v-if="props.loading">
          <v-skeleton-loader type="list-item@6" />
        </v-card-text>

        <!-- Error State -->
        <v-card-text v-else-if="props.error">
          <v-alert type="error" variant="tonal" density="compact">
            {{ props.error }}
          </v-alert>
        </v-card-text>

        <!-- Indicators Content -->
        <v-card-text v-else-if="props.indicators" class="pt-2">

          <!-- Multi-Timeframe Trends (TOP PRIORITY) -->
          <div v-if="trends" class="indicator-section">
            <div class="text-overline text-primary mb-2">
              <v-icon icon="mdi-clock-outline" size="16" class="mr-1" />
              Multi-Timeframe Trends
            </div>
            <div class="trends-grid mb-2">
              <div
                v-for="(trend, timeframe) in trends"
                :key="timeframe"
                class="trend-item"
              >
                <span class="text-caption">{{ timeframe }}</span>
                <TradingTrendBadge
                  :trend="trend"
                  size="x-small"
                />
              </div>
            </div>
            <v-chip
              :color="getTrendColor(majorityTrend as TrendDirection)"
              size="small"
              variant="flat"
            >
              <v-icon icon="mdi-check-circle" size="14" start />
              Majority: {{ majorityTrend }} ({{ trendCount.up > trendCount.down ? trendCount.up : trendCount.down }}/{{ trendCount.total }})
            </v-chip>
          </div>

          <!-- Warnings -->
          <template v-if="warnings.length > 0">
            <v-divider class="my-2" />
            <div class="indicator-section">
              <div class="text-overline text-warning mb-1">
                <v-icon icon="mdi-alert" size="16" class="mr-1" />
                Warnings
              </div>
              <v-alert
                v-for="(warning, idx) in warnings"
                :key="idx"
                type="warning"
                variant="tonal"
                density="compact"
                class="mb-1"
              >
                {{ warning }}
              </v-alert>
            </div>
          </template>

          <v-divider class="my-2" />

          <!-- Moving Averages -->
          <div class="indicator-section">
            <div class="text-overline text-primary mb-1">
              <v-icon icon="mdi-chart-line" size="16" class="mr-1" />
              Moving Averages
            </div>
            <v-row dense>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="SMA 50"
                  :value="props.indicators.indicators.movingAverages.sma50"
                  :decimals="4"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="SMA 200"
                  :value="props.indicators.indicators.movingAverages.sma200"
                  :decimals="4"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="EMA 20"
                  :value="props.indicators.indicators.movingAverages.ema20"
                  :decimals="4"
                />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-2" />

          <!-- MACD -->
          <div class="indicator-section">
            <div class="text-overline text-primary mb-1">
              <v-icon icon="mdi-chart-bar" size="16" class="mr-1" />
              MACD
            </div>
            <v-row dense>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Line"
                  :value="props.indicators.indicators.macd.line"
                  :decimals="4"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Signal"
                  :value="props.indicators.indicators.macd.signal"
                  :decimals="4"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Histogram"
                  :value="props.indicators.indicators.macd.histogram"
                  :decimals="4"
                />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-2" />

          <!-- Bollinger Bands -->
          <div class="indicator-section">
            <div class="text-overline text-primary mb-1">
              <v-icon icon="mdi-chart-bell-curve" size="16" class="mr-1" />
              Bollinger Bands
            </div>
            <v-row dense>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Upper"
                  :value="props.indicators.indicators.bollingerBands.upper"
                  :decimals="4"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Middle"
                  :value="props.indicators.indicators.bollingerBands.middle"
                  :decimals="4"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Lower"
                  :value="props.indicators.indicators.bollingerBands.lower"
                  :decimals="4"
                />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-2" />

          <!-- Oscillators -->
          <div class="indicator-section">
            <div class="text-overline text-primary mb-1">
              <v-icon icon="mdi-sine-wave" size="16" class="mr-1" />
              Oscillators
            </div>
            <v-row dense>
              <v-col cols="6">
                <TradingIndicatorValue
                  label="RSI"
                  :value="rsi"
                  :decimals="1"
                  :color="rsiStatus.color"
                  show-bar
                />
                <v-chip
                  :color="rsiStatus.color"
                  size="x-small"
                  variant="tonal"
                  class="mt-1"
                >
                  {{ rsiStatus.label }}
                </v-chip>
              </v-col>
              <v-col cols="6">
                <TradingIndicatorValue
                  label="Stoch %K"
                  :value="props.indicators.indicators.stochastic.k"
                  :decimals="1"
                />
                <TradingIndicatorValue
                  label="Stoch %D"
                  :value="props.indicators.indicators.stochastic.d"
                  :decimals="1"
                />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-2" />

          <!-- Volume & Volatility -->
          <div class="indicator-section">
            <div class="text-overline text-primary mb-1">
              <v-icon icon="mdi-chart-areaspline" size="16" class="mr-1" />
              Volume & Volatility
            </div>
            <v-row dense>
              <v-col cols="6">
                <TradingIndicatorValue
                  label="OBV"
                  :value="props.indicators.indicators.obv"
                  :decimals="0"
                />
              </v-col>
              <v-col cols="6">
                <TradingIndicatorValue
                  label="ATR"
                  :value="props.indicators.indicators.atr"
                  :decimals="4"
                />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-2" />

          <!-- ADX -->
          <div class="indicator-section">
            <div class="text-overline text-primary mb-1">
              <v-icon icon="mdi-trending-up" size="16" class="mr-1" />
              Trend Strength (ADX)
            </div>
            <v-row dense>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="ADX"
                  :value="adx"
                  :decimals="1"
                  :color="adxStrength.color"
                  show-bar
                  :bar-max="50"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="+DI"
                  :value="props.indicators.indicators.adx.plusDI"
                  :decimals="1"
                  color="success"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="-DI"
                  :value="props.indicators.indicators.adx.minusDI"
                  :decimals="1"
                  color="error"
                />
              </v-col>
            </v-row>
            <v-chip
              :color="adxStrength.color"
              size="x-small"
              variant="tonal"
              class="mt-1"
            >
              {{ adxStrength.label }} Trend
            </v-chip>
          </div>

        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<style scoped>
.symbol-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.symbol-card:hover {
  transform: translateY(-2px);
}

.indicator-section {
  padding: 4px 0;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}

.trends-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.trend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
</style>
