<script setup lang="ts">
import type { Symbol, SymbolIndicators, TrendDirection } from '../../../types/trading'
import { formatPrice, getRSIStatus, getADXStrength, formatNumber } from '../../../types/trading'

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

// Computed
const currentPrice = computed(() => props.indicators?.currentPrice || null)
const majorityTrend = computed(() => props.indicators?.indicators?.majorityTrend || 'NEUTRAL')
const rsi = computed(() => props.indicators?.indicators?.rsi || null)
const adx = computed(() => props.indicators?.indicators?.adx?.adx || null)

const rsiStatus = computed(() => getRSIStatus(rsi.value))
const adxStrength = computed(() => getADXStrength(adx.value))

const trends = computed(() => props.indicators?.indicators?.trends)

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
            v-if="!props.loading"
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

      <!-- Quick Stats -->
      <div class="d-flex justify-space-between mt-3">
        <div v-if="props.loading" class="d-flex gap-2">
          <v-skeleton-loader type="chip" width="80" />
          <v-skeleton-loader type="chip" width="60" />
          <v-skeleton-loader type="chip" width="60" />
        </div>
        <template v-else-if="props.indicators">
          <v-chip size="small" variant="tonal" color="primary">
            {{ formatPrice(currentPrice) }}
          </v-chip>
          <v-chip size="small" variant="tonal" :color="rsiStatus.color">
            RSI: {{ rsi !== null ? rsi.toFixed(0) : 'N/A' }}
          </v-chip>
          <v-chip size="small" variant="tonal" :color="adxStrength.color">
            ADX: {{ adx !== null ? adx.toFixed(0) : 'N/A' }}
          </v-chip>
        </template>
        <div v-else class="text-caption text-medium-emphasis">
          Click to load indicators
        </div>
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
                  :decimals="0"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="SMA 200"
                  :value="props.indicators.indicators.movingAverages.sma200"
                  :decimals="0"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="EMA 20"
                  :value="props.indicators.indicators.movingAverages.ema20"
                  :decimals="0"
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
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Signal"
                  :value="props.indicators.indicators.macd.signal"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Histogram"
                  :value="props.indicators.indicators.macd.histogram"
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
                  :decimals="0"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Middle"
                  :value="props.indicators.indicators.bollingerBands.middle"
                  :decimals="0"
                />
              </v-col>
              <v-col cols="4">
                <TradingIndicatorValue
                  label="Lower"
                  :value="props.indicators.indicators.bollingerBands.lower"
                  :decimals="0"
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

          <!-- Multi-Timeframe Trends -->
          <template v-if="trends">
            <v-divider class="my-2" />
            <div class="indicator-section">
              <div class="text-overline text-primary mb-2">
                <v-icon icon="mdi-clock-outline" size="16" class="mr-1" />
                Multi-Timeframe Trends
              </div>
              <div class="d-flex flex-wrap gap-2">
                <div
                  v-for="(trend, timeframe) in trends"
                  :key="timeframe"
                  class="text-center"
                >
                  <div class="text-caption text-medium-emphasis">{{ timeframe }}</div>
                  <TradingTrendBadge
                    :trend="trend"
                    size="x-small"
                    :show-label="false"
                  />
                </div>
              </div>
              <div class="mt-2">
                <span class="text-caption text-medium-emphasis">Majority: </span>
                <TradingTrendBadge :trend="majorityTrend as TrendDirection" size="small" />
              </div>
            </div>
          </template>
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

.gap-2 {
  gap: 8px;
}
</style>
