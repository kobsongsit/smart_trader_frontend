<script setup lang="ts">
import { useValidationMetrics } from '../../composables/useValidationMetrics'
import type { SignalValidationResult, ValidationPhase, SignalType, TrendDirection, ValidationAction } from '../../../types/validation'

// Composable
const {
  state,
  metricCards,
  phase1RejectionBreakdown,
  phase2RejectionBreakdown,
  filterRate,
  passRate,
  isLoading
} = useValidationMetrics()

// Demo mode toggle
const isDemoMode = ref(false)
let demoInterval: ReturnType<typeof setInterval> | null = null

// Generate demo data
function generateDemoValidation(): SignalValidationResult {
  const actions: ValidationAction[] = ['PASS', 'REJECT', 'WARNING']
  const phases: ValidationPhase[] = ['phase1_trend_analysis', 'phase2_proindicator']
  const signals: SignalType[] = ['BUY', 'SELL']
  const trends: TrendDirection[] = ['BULLISH', 'BEARISH', 'SIDEWAYS']

  const passed = Math.random() > 0.6 // 40% rejection rate
  const action = passed ? 'PASS' : 'REJECT'
  const rejectionPhase = !passed ? phases[Math.floor(Math.random() * phases.length)] : null

  const rejectReasons: Record<string, string[]> = {
    phase1_trend_analysis: [
      'Market too sideways - most timeframes have weak trends',
      'Conflicting trends - no clear majority direction',
      'Signal direction conflicts with majority trend'
    ],
    phase2_proindicator: [
      'Bollinger Bands not available',
      'Price inside channel (sideways market)',
      'New high/low detected - wait for confirmation'
    ]
  }

  const rejectionReason = rejectionPhase
    ? rejectReasons[rejectionPhase][Math.floor(Math.random() * rejectReasons[rejectionPhase].length)]
    : null

  return {
    id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT'][Math.floor(Math.random() * 4)],
    signalType: signals[Math.floor(Math.random() * signals.length)],
    timestamp: new Date(),
    phase1: {
      phase: 'phase1_trend_analysis',
      timestamp: new Date(),
      checks: {
        adxSideways: [],
        trendConsensus: {
          name: 'trend_consensus',
          description: 'Check majority trend across 5 timeframes',
          timeframeTrends: {} as Record<string, TrendDirection>,
          majorityTrend: trends[Math.floor(Math.random() * trends.length)],
          majorityCount: Math.floor(Math.random() * 3) + 2,
          requiredMajority: 3,
          hasMajority: Math.random() > 0.3,
          action: action as ValidationAction,
          reason: ''
        },
        trendDirectionFilter: {
          name: 'trend_direction_filter',
          description: 'Prevent signals against majority trend',
          signalDirection: signals[Math.floor(Math.random() * signals.length)],
          majorityTrend: trends[Math.floor(Math.random() * trends.length)],
          isConflicting: Math.random() > 0.7,
          action: action as ValidationAction,
          reason: ''
        }
      },
      sidewaysCount: Math.floor(Math.random() * 5),
      passed: rejectionPhase !== 'phase1_trend_analysis',
      rejectReason: rejectionPhase === 'phase1_trend_analysis' ? rejectionReason : null
    },
    phase2: rejectionPhase === 'phase1_trend_analysis' ? null : {
      phase: 'phase2_proindicator',
      timestamp: new Date(),
      checks: {
        bollingerBandsAvailability: {
          name: 'bollinger_bands_availability',
          description: 'Check if BB data available',
          isAvailable: true,
          data: { upper: 100, middle: 95, lower: 90, bandwidth: 10 },
          action: 'PASS',
          reason: ''
        },
        channelDetection: null,
        newHighLowDetection: {
          name: 'new_high_low_detection',
          description: 'Check if new high/low (50 periods)',
          currentPrice: 95,
          highestInPeriod: 100,
          lowestInPeriod: 90,
          lookbackPeriods: 50,
          isNewHigh: false,
          isNewLow: false,
          action: 'PASS',
          reason: ''
        },
        candleCloseConfirmation: {
          name: 'candle_close_confirmation',
          description: 'Check if at candle close time',
          currentTime: new Date(),
          timeframe: '15m',
          isClosed: Math.random() > 0.3,
          nextCloseTime: new Date(Date.now() + 15 * 60 * 1000),
          timeUntilClose: 15 * 60 * 1000,
          action: Math.random() > 0.3 ? 'PASS' : 'WARNING',
          reason: ''
        }
      },
      passed: rejectionPhase !== 'phase2_proindicator',
      hasWarnings: Math.random() > 0.7,
      rejectReason: rejectionPhase === 'phase2_proindicator' ? rejectionReason : null,
      warnings: Math.random() > 0.7 ? ['Not at candle close - signal may be premature'] : []
    },
    finalAction: action as ValidationAction,
    passed,
    rejectionPhase,
    rejectionReason,
    warnings: Math.random() > 0.7 ? ['Not at candle close'] : [],
    processingTime: Math.floor(Math.random() * 50) + 10
  }
}

// Toggle demo mode
function toggleDemoMode() {
  isDemoMode.value = !isDemoMode.value

  if (isDemoMode.value) {
    // Start generating demo data
    demoInterval = setInterval(() => {
      const { addValidationResult, addTimelineEvent } = useValidationMetrics()
      const result = generateDemoValidation()
      addValidationResult(result)

      // Add timeline event
      addTimelineEvent({
        id: result.id,
        timestamp: result.timestamp,
        phase: result.rejectionPhase || 'phase1_trend_analysis',
        checkName: result.passed ? 'All Checks Passed' : result.rejectionReason?.split(' ')[0] || 'Unknown',
        action: result.finalAction,
        reason: result.rejectionReason || 'Signal validated successfully',
        details: { symbol: result.symbol, signalType: result.signalType }
      })
    }, 2000) // Generate new data every 2 seconds
  } else {
    if (demoInterval) {
      clearInterval(demoInterval)
      demoInterval = null
    }
  }
}

onUnmounted(() => {
  if (demoInterval) {
    clearInterval(demoInterval)
  }
})
</script>

<template>
  <v-container
    fluid
    class="validation-dashboard"
  >
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">
              <v-icon
                icon="mdi-shield-check"
                class="mr-2"
                color="primary"
              />
              Validation Monitor
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis mt-1">
              Signal Validation Checks Timeline - Pre-AI Filter Dashboard
            </p>
          </div>

          <div class="d-flex align-center gap-2">
            <v-btn
              :color="isDemoMode ? 'error' : 'primary'"
              :prepend-icon="isDemoMode ? 'mdi-stop' : 'mdi-play'"
              @click="toggleDemoMode"
            >
              {{ isDemoMode ? 'Stop Demo' : 'Start Demo' }}
            </v-btn>

            <v-chip
              :color="isDemoMode ? 'success' : 'grey'"
              variant="flat"
            >
              <v-icon
                :icon="isDemoMode ? 'mdi-circle' : 'mdi-circle-outline'"
                start
                :class="{ 'pulse-animation': isDemoMode }"
              />
              {{ isDemoMode ? 'LIVE' : 'IDLE' }}
            </v-chip>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Metric Cards -->
    <v-row>
      <v-col
        v-for="card in metricCards"
        :key="card.title"
        cols="12"
        sm="6"
        md="4"
        lg="2"
      >
        <ValidationMetricCard
          :data="card"
          :loading="isLoading"
        />
      </v-col>
    </v-row>

    <!-- Filter Rate Progress -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon
              icon="mdi-filter"
              class="mr-2"
              color="primary"
            />
            Filter Rate Overview
          </v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-success font-weight-medium">
                <v-icon
                  icon="mdi-check"
                  size="small"
                />
                Passed: {{ passRate.toFixed(1) }}%
              </span>
              <span class="text-error font-weight-medium">
                <v-icon
                  icon="mdi-close"
                  size="small"
                />
                Rejected: {{ filterRate.toFixed(1) }}%
              </span>
            </div>
            <v-progress-linear
              :model-value="passRate"
              color="success"
              :buffer-value="100"
              buffer-color="error"
              height="24"
              rounded
            >
              <template #default>
                <span class="text-caption font-weight-bold">
                  {{ state.metrics.passed_signals }} / {{ state.metrics.total_signals }} passed
                </span>
              </template>
            </v-progress-linear>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Rejection Breakdowns -->
    <v-row class="mt-4">
      <v-col
        cols="12"
        md="6"
      >
        <ValidationRejectionBreakdown
          title="Phase 1: Trend Analysis Rejections"
          :items="phase1RejectionBreakdown"
          :loading="isLoading"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <ValidationRejectionBreakdown
          title="Phase 2: ProIndicator Rejections"
          :items="phase2RejectionBreakdown"
          :loading="isLoading"
        />
      </v-col>
    </v-row>

    <!-- Timeline -->
    <v-row class="mt-4">
      <v-col cols="12">
        <ValidationValidationTimeline
          :events="state.timelineEvents"
          :max-items="15"
          :loading="isLoading"
        />
      </v-col>
    </v-row>

    <!-- Cost Savings Summary -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card
          color="success"
          variant="tonal"
          elevation="2"
        >
          <v-card-text class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-avatar
                color="success"
                size="56"
                class="mr-4"
              >
                <v-icon
                  icon="mdi-piggy-bank"
                  size="28"
                  color="white"
                />
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">
                  Cost Savings Summary
                </div>
                <div class="text-caption text-medium-emphasis">
                  By filtering invalid signals before AI processing
                </div>
              </div>
            </div>

            <div class="d-flex gap-6">
              <div class="text-center">
                <div class="text-h4 font-weight-bold text-success">
                  {{ state.metrics.api_calls_saved }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  API Calls Saved
                </div>
              </div>
              <v-divider
                vertical
                class="mx-2"
              />
              <div class="text-center">
                <div class="text-h4 font-weight-bold text-success">
                  ${{ state.metrics.estimated_cost_saved.toFixed(2) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Estimated Savings
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.validation-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.02) 0%, rgba(30, 136, 229, 0.02) 100%);
}

.pulse-animation {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

.gap-2 {
  gap: 8px;
}

.gap-6 {
  gap: 24px;
}
</style>
