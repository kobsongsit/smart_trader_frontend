<script setup lang="ts">
import type {
  IndicatorAtData,
  IndicatorAtDerivedSignals,
  IndicatorAtBollingerPosition,
  IndicatorAtTrendDirection,
  IndicatorAtTrendStrength,
} from '../../../types/trading'
import { formatNumber } from '../../../types/trading'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

// ─── Composable (shared singleton) ───
const { indicatorAtData, isLoading, error, isOpen, closePanel } = useIndicatorDetail()

// ─── Responsive: side drawer (desktop) vs bottom sheet (mobile) ───
const { mobile } = useDisplay()

// ─── Computed Data ───
const data = computed<IndicatorAtData | null>(() => indicatorAtData.value)
const indicators = computed(() => data.value?.indicators ?? null)
const derived = computed<IndicatorAtDerivedSignals | null>(() => data.value?.derivedSignals ?? null)
const bbPos = computed<IndicatorAtBollingerPosition | null>(() => data.value?.bollingerPosition ?? null)

// ─── Formatters ───
function fmtTimestamp(iso: string): string {
  return dayjs.utc(iso).local().format('DD MMM YYYY HH:mm')
}

function fmtVal(val: number | null, decimals = 2): string {
  if (val === null || val === undefined) return '--'
  return formatNumber(val, decimals)
}

function fmtPercent(val: number | null): string {
  if (val === null || val === undefined) return '--'
  return `${(val * 100).toFixed(1)}%`
}

// ─── RSI helpers ───
function rsiColor(val: number | null): string {
  if (val === null) return 'grey'
  if (val > 70) return 'error'
  if (val < 30) return 'success'
  return 'info'
}

function rsiLabel(val: number | null): string {
  if (val === null) return 'N/A'
  if (val > 70) return 'Overbought'
  if (val < 30) return 'Oversold'
  return 'Neutral'
}

// ─── MACD histogram color ───
function macdHistColor(val: number | null): string {
  if (val === null) return 'grey'
  return val >= 0 ? 'success' : 'error'
}

// ─── ADX trend strength ───
function adxStrengthLabel(val: number | null): string {
  if (val === null) return 'N/A'
  if (val >= 40) return 'Strong'
  if (val >= 20) return 'Moderate'
  return 'Weak'
}

function adxStrengthColor(val: number | null): string {
  if (val === null) return 'grey'
  if (val >= 40) return 'success'
  if (val >= 20) return 'warning'
  return 'grey'
}

// ─── Derived Signal chip helpers ───
function squeezChip(val: boolean | null): { label: string; color: string } {
  if (val === true) return { label: 'Squeeze', color: 'warning' }
  if (val === false) return { label: 'Normal', color: 'success' }
  return { label: 'N/A', color: 'grey' }
}

function divergenceChip(val: 'BULLISH' | 'BEARISH' | null): { label: string; color: string } {
  if (val === 'BULLISH') return { label: 'Bullish', color: 'success' }
  if (val === 'BEARISH') return { label: 'Bearish', color: 'error' }
  return { label: 'None', color: 'grey' }
}

function crossoverChip(val: 'GOLDEN' | 'DEATH' | null): { label: string; color: string } {
  if (val === 'GOLDEN') return { label: 'Golden Cross', color: 'success' }
  if (val === 'DEATH') return { label: 'Death Cross', color: 'error' }
  return { label: 'None', color: 'grey' }
}

function patternDirChip(val: 'BULLISH' | 'BEARISH' | null): { label: string; color: string } {
  if (val === 'BULLISH') return { label: 'Bullish', color: 'success' }
  if (val === 'BEARISH') return { label: 'Bearish', color: 'error' }
  return { label: 'N/A', color: 'grey' }
}

// ─── Trend Direction / Strength ───
function trendDirChip(val: IndicatorAtTrendDirection): { label: string; color: string; icon: string } {
  if (val === 'BULLISH') return { label: 'Bullish', color: 'success', icon: 'mdi-trending-up' }
  if (val === 'BEARISH') return { label: 'Bearish', color: 'error', icon: 'mdi-trending-down' }
  if (val === 'SIDEWAYS') return { label: 'Sideways', color: 'grey', icon: 'mdi-trending-neutral' }
  return { label: 'N/A', color: 'grey', icon: 'mdi-help' }
}

function trendStrChip(val: IndicatorAtTrendStrength): { label: string; color: string } {
  if (val === 'STRONG') return { label: 'Strong', color: 'success' }
  if (val === 'MODERATE') return { label: 'Moderate', color: 'warning' }
  if (val === 'WEAK') return { label: 'Weak', color: 'grey' }
  return { label: 'N/A', color: 'grey' }
}

// ─── BB Position visual ───
function bbPositionPercent(percentB: number | null): number {
  if (percentB === null) return 50
  return Math.max(0, Math.min(100, percentB * 100))
}
</script>

<template>
  <!-- Desktop: side drawer / Mobile: bottom sheet -->
  <v-navigation-drawer
    v-if="!mobile"
    v-model="isOpen"
    location="right"
    temporary
    width="380"
    class="indicator-drawer"
    :scrim="false"
  >
    <template #prepend>
      <div class="drawer-header d-flex align-center justify-space-between pa-3">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-chart-bell-curve-cumulative" size="20" color="primary" />
          <span class="text-body-2 font-weight-bold">Indicator Detail</span>
        </div>
        <v-btn icon variant="text" size="small" @click="closePanel">
          <v-icon icon="mdi-close" size="18" />
        </v-btn>
      </div>
      <v-divider />
    </template>

    <!-- Content -->
    <div class="pa-3">
      <!-- Loading -->
      <div v-if="isLoading" class="d-flex flex-column ga-3">
        <v-skeleton-loader type="list-item-two-line" />
        <v-skeleton-loader type="list-item-three-line" />
        <v-skeleton-loader type="list-item-three-line" />
        <v-skeleton-loader type="list-item-three-line" />
        <v-skeleton-loader type="list-item-three-line" />
      </div>

      <!-- Error -->
      <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mb-3">
        {{ error }}
      </v-alert>

      <!-- No Data -->
      <div v-else-if="!data" class="text-center text-medium-emphasis pa-6">
        <v-icon icon="mdi-cursor-default-click" size="32" class="mb-2" />
        <div class="text-caption">Click on a candle to see indicator details</div>
      </div>

      <!-- Data Content -->
      <template v-else>
        <!-- Section 1: Price Info -->
        <div class="section-block mb-3">
          <div class="section-title">
            <v-icon icon="mdi-information-outline" size="14" class="mr-1" />
            Price Info
          </div>
          <div class="d-flex flex-wrap ga-x-4 ga-y-1 mt-1">
            <div class="info-item">
              <span class="info-label">Time</span>
              <span class="info-value font-mono">{{ fmtTimestamp(data.timestamp) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Interval</span>
              <span class="info-value">{{ data.interval.toUpperCase() }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Symbol</span>
              <span class="info-value font-weight-bold">{{ data.symbol }}</span>
            </div>
          </div>
        </div>

        <!-- Section 2: Moving Averages -->
        <div class="section-block mb-3">
          <div class="section-title">
            <v-icon icon="mdi-chart-line" size="14" class="mr-1" />
            Moving Averages
          </div>
          <div class="d-flex flex-column ga-1 mt-1">
            <div class="d-flex align-center ga-2">
              <span class="legend-dot" style="background: #2196F3;" />
              <span class="info-label flex-grow-1">SMA 50</span>
              <span class="info-value font-mono">{{ fmtVal(indicators?.sma50 ?? null, 4) }}</span>
            </div>
            <div class="d-flex align-center ga-2">
              <span class="legend-dot" style="background: #FB8C00;" />
              <span class="info-label flex-grow-1">SMA 200</span>
              <span class="info-value font-mono">{{ fmtVal(indicators?.sma200 ?? null, 4) }}</span>
            </div>
            <div class="d-flex align-center ga-2">
              <span class="legend-dot" style="background: #FFD54F;" />
              <span class="info-label flex-grow-1">EMA 20</span>
              <span class="info-value font-mono">{{ fmtVal(indicators?.ema20 ?? null, 4) }}</span>
            </div>
          </div>
        </div>

        <!-- Section 3: Momentum -->
        <div class="section-block mb-3">
          <div class="section-title">
            <v-icon icon="mdi-speedometer" size="14" class="mr-1" />
            Momentum
          </div>
          <div class="d-flex flex-column ga-2 mt-1">
            <!-- RSI -->
            <div>
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="info-label">RSI</span>
                <div class="d-flex align-center ga-1">
                  <span class="info-value font-mono">{{ fmtVal(indicators?.rsi ?? null, 1) }}</span>
                  <v-chip
                    size="x-small"
                    :color="rsiColor(indicators?.rsi ?? null)"
                    variant="tonal"
                    class="font-weight-bold"
                  >
                    {{ rsiLabel(indicators?.rsi ?? null) }}
                  </v-chip>
                </div>
              </div>
              <v-progress-linear
                v-if="indicators?.rsi !== null && indicators?.rsi !== undefined"
                :model-value="indicators.rsi"
                :color="rsiColor(indicators.rsi)"
                height="6"
                rounded
                bg-color="rgba(255,255,255,0.08)"
              />
            </div>

            <!-- Stochastic -->
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">Stoch %K / %D</span>
              <span class="info-value font-mono">
                {{ fmtVal(indicators?.stochK ?? null, 1) }} / {{ fmtVal(indicators?.stochD ?? null, 1) }}
              </span>
            </div>

            <!-- MACD -->
            <div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">MACD Line</span>
                <span class="info-value font-mono">{{ fmtVal(indicators?.macdLine ?? null, 4) }}</span>
              </div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">MACD Signal</span>
                <span class="info-value font-mono">{{ fmtVal(indicators?.macdSignal ?? null, 4) }}</span>
              </div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">Histogram</span>
                <v-chip
                  size="x-small"
                  :color="macdHistColor(indicators?.macdHistogram ?? null)"
                  variant="tonal"
                  class="font-weight-bold font-mono"
                >
                  {{ fmtVal(indicators?.macdHistogram ?? null, 4) }}
                </v-chip>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Volatility & Trend -->
        <div class="section-block mb-3">
          <div class="section-title">
            <v-icon icon="mdi-chart-bell-curve" size="14" class="mr-1" />
            Volatility & Trend
          </div>
          <div class="d-flex flex-column ga-2 mt-1">
            <!-- Bollinger Bands -->
            <div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">BB Upper</span>
                <span class="info-value font-mono">{{ fmtVal(indicators?.bbUpper ?? null, 4) }}</span>
              </div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">BB Middle</span>
                <span class="info-value font-mono">{{ fmtVal(indicators?.bbMiddle ?? null, 4) }}</span>
              </div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">BB Lower</span>
                <span class="info-value font-mono">{{ fmtVal(indicators?.bbLower ?? null, 4) }}</span>
              </div>
              <!-- BB %B position visual -->
              <div v-if="bbPos?.percentB !== null && bbPos?.percentB !== undefined" class="mt-1">
                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="info-label">%B Position</span>
                  <span class="info-value font-mono">{{ fmtPercent(bbPos.percentB) }}</span>
                </div>
                <div class="bb-position-bar">
                  <div class="bb-position-marker" :style="{ left: `${bbPositionPercent(bbPos.percentB)}%` }" />
                  <div class="bb-zone bb-zone-lower" />
                  <div class="bb-zone bb-zone-middle" />
                  <div class="bb-zone bb-zone-upper" />
                </div>
                <div class="d-flex justify-space-between mt-1">
                  <span class="text-caption" style="font-size: 9px; color: rgba(255,255,255,0.3);">Lower</span>
                  <span class="text-caption" style="font-size: 9px; color: rgba(255,255,255,0.3);">Mid</span>
                  <span class="text-caption" style="font-size: 9px; color: rgba(255,255,255,0.3);">Upper</span>
                </div>
              </div>
              <div v-if="bbPos?.position" class="mt-1">
                <span class="info-label">Position: </span>
                <span class="info-value text-capitalize">{{ bbPos.position.replace(/_/g, ' ') }}</span>
              </div>
            </div>

            <v-divider class="my-1" />

            <!-- ATR -->
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">ATR</span>
              <span class="info-value font-mono">{{ fmtVal(indicators?.atr ?? null, 4) }}</span>
            </div>

            <v-divider class="my-1" />

            <!-- ADX -->
            <div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">ADX</span>
                <div class="d-flex align-center ga-1">
                  <span class="info-value font-mono">{{ fmtVal(indicators?.adx ?? null, 1) }}</span>
                  <v-chip
                    size="x-small"
                    :color="adxStrengthColor(indicators?.adx ?? null)"
                    variant="tonal"
                    class="font-weight-bold"
                  >
                    {{ adxStrengthLabel(indicators?.adx ?? null) }}
                  </v-chip>
                </div>
              </div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">+DI</span>
                <span class="info-value font-mono text-success">{{ fmtVal(indicators?.plusDI ?? null, 1) }}</span>
              </div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">-DI</span>
                <span class="info-value font-mono text-error">{{ fmtVal(indicators?.minusDI ?? null, 1) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 5: Ichimoku Cloud -->
        <div class="section-block mb-3">
          <div class="section-title">
            <v-icon icon="mdi-weather-cloudy" size="14" class="mr-1" />
            Ichimoku Cloud
          </div>
          <div class="d-flex flex-column ga-1 mt-1">
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">Tenkan (Conv.)</span>
              <span class="info-value font-mono">{{ fmtVal(indicators?.ichimokuConversion ?? null, 4) }}</span>
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">Kijun (Base)</span>
              <span class="info-value font-mono">{{ fmtVal(indicators?.ichimokuBase ?? null, 4) }}</span>
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">Span A</span>
              <span class="info-value font-mono">{{ fmtVal(indicators?.ichimokuSpanA ?? null, 4) }}</span>
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">Span B</span>
              <span class="info-value font-mono">{{ fmtVal(indicators?.ichimokuSpanB ?? null, 4) }}</span>
            </div>
          </div>
        </div>

        <!-- Section 6: Derived Signals -->
        <div class="section-block mb-3">
          <div class="section-title">
            <v-icon icon="mdi-flash" size="14" class="mr-1" />
            Derived Signals
          </div>
          <div v-if="derived" class="d-flex flex-column ga-2 mt-2">
            <!-- Bollinger Squeeze -->
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">BB Squeeze</span>
              <v-chip
                size="x-small"
                :color="squeezChip(derived.bollingerSqueeze).color"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ squeezChip(derived.bollingerSqueeze).label }}
              </v-chip>
            </div>

            <!-- RSI Divergence -->
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">RSI Divergence</span>
              <v-chip
                size="x-small"
                :color="divergenceChip(derived.rsiDivergence).color"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ divergenceChip(derived.rsiDivergence).label }}
              </v-chip>
            </div>

            <!-- MACD Divergence -->
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">MACD Divergence</span>
              <v-chip
                size="x-small"
                :color="divergenceChip(derived.macdDivergence).color"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ divergenceChip(derived.macdDivergence).label }}
              </v-chip>
            </div>

            <!-- SMA Crossover -->
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">SMA Crossover</span>
              <v-chip
                size="x-small"
                :color="crossoverChip(derived.smaCrossover).color"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ crossoverChip(derived.smaCrossover).label }}
              </v-chip>
            </div>

            <!-- Candlestick Pattern -->
            <div class="d-flex align-center justify-space-between">
              <span class="info-label">Pattern</span>
              <div class="d-flex align-center ga-1">
                <v-chip
                  v-if="derived.candlestickPattern"
                  size="x-small"
                  :color="patternDirChip(derived.patternDirection).color"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ derived.candlestickPattern }}
                </v-chip>
                <span v-else class="info-value">--</span>
              </div>
            </div>

            <!-- Pattern Direction -->
            <div v-if="derived.patternDirection" class="d-flex align-center justify-space-between">
              <span class="info-label">Pattern Direction</span>
              <v-chip
                size="x-small"
                :color="patternDirChip(derived.patternDirection).color"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ patternDirChip(derived.patternDirection).label }}
              </v-chip>
            </div>
          </div>
          <div v-else class="text-caption text-medium-emphasis mt-1">No derived signals available</div>
        </div>

        <!-- Section 7: Overall Assessment -->
        <div class="section-block mb-3">
          <div class="section-title">
            <v-icon icon="mdi-compass" size="14" class="mr-1" />
            Overall Assessment
          </div>
          <div class="d-flex flex-wrap ga-2 mt-2">
            <v-chip
              :color="trendDirChip(data.trendDirection).color"
              variant="tonal"
              size="small"
              class="font-weight-bold"
            >
              <v-icon :icon="trendDirChip(data.trendDirection).icon" size="14" class="mr-1" />
              {{ trendDirChip(data.trendDirection).label }}
            </v-chip>
            <v-chip
              :color="trendStrChip(data.trendStrength).color"
              variant="tonal"
              size="small"
              class="font-weight-bold"
            >
              {{ trendStrChip(data.trendStrength).label }}
            </v-chip>
          </div>
          <div v-if="bbPos?.position" class="mt-2">
            <span class="info-label">Bollinger Position: </span>
            <span class="info-value text-capitalize">{{ bbPos.position.replace(/_/g, ' ') }}</span>
          </div>
        </div>
      </template>
    </div>
  </v-navigation-drawer>

  <!-- Mobile: bottom sheet -->
  <v-bottom-sheet v-else v-model="isOpen" max-width="100%">
    <v-card class="indicator-bottom-sheet" rounded="t-xl">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between pa-3 pb-0">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-chart-bell-curve-cumulative" size="20" color="primary" />
          <span class="text-body-2 font-weight-bold">Indicator Detail</span>
        </div>
        <v-btn icon variant="text" size="small" @click="closePanel">
          <v-icon icon="mdi-close" size="18" />
        </v-btn>
      </div>

      <v-card-text class="pa-3" style="max-height: 70vh; overflow-y: auto;">
        <!-- Loading -->
        <div v-if="isLoading" class="d-flex flex-column ga-3">
          <v-skeleton-loader type="list-item-two-line" />
          <v-skeleton-loader type="list-item-three-line" />
          <v-skeleton-loader type="list-item-three-line" />
        </div>

        <!-- Error -->
        <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mb-3">
          {{ error }}
        </v-alert>

        <!-- No Data -->
        <div v-else-if="!data" class="text-center text-medium-emphasis pa-6">
          <v-icon icon="mdi-cursor-default-click" size="32" class="mb-2" />
          <div class="text-caption">Click on a candle to see indicator details</div>
        </div>

        <!-- Data Content (same sections but compact for mobile) -->
        <template v-else>
          <!-- Price Info -->
          <div class="section-block mb-3">
            <div class="section-title">Price Info</div>
            <div class="d-flex flex-wrap ga-x-4 ga-y-1 mt-1">
              <div class="info-item">
                <span class="info-label">Time</span>
                <span class="info-value font-mono" style="font-size: 11px;">{{ fmtTimestamp(data.timestamp) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ data.interval.toUpperCase() }}</span>
              </div>
              <div class="info-item">
                <span class="info-value font-weight-bold">{{ data.symbol }}</span>
              </div>
            </div>
          </div>

          <!-- Moving Averages (compact) -->
          <div class="section-block mb-3">
            <div class="section-title">Moving Averages</div>
            <div class="d-flex flex-wrap ga-x-3 ga-y-1 mt-1">
              <div class="d-flex align-center ga-1">
                <span class="legend-dot" style="background: #2196F3;" />
                <span class="info-label">SMA50</span>
                <span class="info-value font-mono">{{ fmtVal(indicators?.sma50 ?? null, 4) }}</span>
              </div>
              <div class="d-flex align-center ga-1">
                <span class="legend-dot" style="background: #FB8C00;" />
                <span class="info-label">SMA200</span>
                <span class="info-value font-mono">{{ fmtVal(indicators?.sma200 ?? null, 4) }}</span>
              </div>
              <div class="d-flex align-center ga-1">
                <span class="legend-dot" style="background: #FFD54F;" />
                <span class="info-label">EMA20</span>
                <span class="info-value font-mono">{{ fmtVal(indicators?.ema20 ?? null, 4) }}</span>
              </div>
            </div>
          </div>

          <!-- Momentum (compact) -->
          <div class="section-block mb-3">
            <div class="section-title">Momentum</div>
            <div class="mt-1">
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">RSI</span>
                <v-chip size="x-small" :color="rsiColor(indicators?.rsi ?? null)" variant="tonal" class="font-weight-bold font-mono">
                  {{ fmtVal(indicators?.rsi ?? null, 1) }}
                </v-chip>
              </div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">Stoch %K/%D</span>
                <span class="info-value font-mono">{{ fmtVal(indicators?.stochK ?? null, 1) }}/{{ fmtVal(indicators?.stochD ?? null, 1) }}</span>
              </div>
              <div class="d-flex align-center justify-space-between">
                <span class="info-label">MACD Hist.</span>
                <v-chip size="x-small" :color="macdHistColor(indicators?.macdHistogram ?? null)" variant="tonal" class="font-weight-bold font-mono">
                  {{ fmtVal(indicators?.macdHistogram ?? null, 4) }}
                </v-chip>
              </div>
            </div>
          </div>

          <!-- Derived Signals (compact) -->
          <div class="section-block mb-3">
            <div class="section-title">Derived Signals</div>
            <div v-if="derived" class="d-flex flex-wrap ga-1 mt-2">
              <v-chip size="x-small" :color="squeezChip(derived.bollingerSqueeze).color" variant="tonal">
                BB: {{ squeezChip(derived.bollingerSqueeze).label }}
              </v-chip>
              <v-chip size="x-small" :color="divergenceChip(derived.rsiDivergence).color" variant="tonal">
                RSI Div: {{ divergenceChip(derived.rsiDivergence).label }}
              </v-chip>
              <v-chip size="x-small" :color="divergenceChip(derived.macdDivergence).color" variant="tonal">
                MACD Div: {{ divergenceChip(derived.macdDivergence).label }}
              </v-chip>
              <v-chip size="x-small" :color="crossoverChip(derived.smaCrossover).color" variant="tonal">
                {{ crossoverChip(derived.smaCrossover).label }}
              </v-chip>
              <v-chip v-if="derived.candlestickPattern" size="x-small" :color="patternDirChip(derived.patternDirection).color" variant="tonal">
                {{ derived.candlestickPattern }}
              </v-chip>
            </div>
          </div>

          <!-- Overall -->
          <div class="section-block">
            <div class="section-title">Overall</div>
            <div class="d-flex flex-wrap ga-1 mt-2">
              <v-chip :color="trendDirChip(data.trendDirection).color" variant="tonal" size="small" class="font-weight-bold">
                <v-icon :icon="trendDirChip(data.trendDirection).icon" size="14" class="mr-1" />
                {{ trendDirChip(data.trendDirection).label }}
              </v-chip>
              <v-chip :color="trendStrChip(data.trendStrength).color" variant="tonal" size="small" class="font-weight-bold">
                {{ trendStrChip(data.trendStrength).label }}
              </v-chip>
            </div>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
/* ─── Drawer dark theme ─── */
.indicator-drawer {
  background: rgba(18, 18, 18, 0.97) !important;
  border-left: 1px solid rgba(255, 255, 255, 0.06) !important;
  backdrop-filter: blur(12px);
}

.indicator-drawer :deep(.v-navigation-drawer__content) {
  overflow-y: auto;
}

.drawer-header {
  background: rgba(30, 30, 30, 0.6);
}

/* ─── Bottom sheet dark theme ─── */
.indicator-bottom-sheet {
  background: rgba(18, 18, 18, 0.98) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* ─── Section styling ─── */
.section-block {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px 12px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(100, 116, 139);
  display: flex;
  align-items: center;
}

/* ─── Info items ─── */
.info-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.info-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.info-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

/* ─── Legend dot (matches chart) ─── */
.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ─── BB Position visual bar ─── */
.bb-position-bar {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: visible;
  display: flex;
}

.bb-zone {
  height: 100%;
  flex: 1;
}

.bb-zone-lower {
  background: rgba(76, 175, 80, 0.15);
  border-radius: 4px 0 0 4px;
}

.bb-zone-middle {
  background: rgba(255, 255, 255, 0.06);
}

.bb-zone-upper {
  background: rgba(255, 82, 82, 0.15);
  border-radius: 0 4px 4px 0;
}

.bb-position-marker {
  position: absolute;
  top: -2px;
  width: 4px;
  height: 12px;
  background: #FFD54F;
  border-radius: 2px;
  z-index: 1;
  transform: translateX(-2px);
  box-shadow: 0 0 6px rgba(255, 213, 79, 0.5);
  transition: left 0.3s ease;
}
</style>
