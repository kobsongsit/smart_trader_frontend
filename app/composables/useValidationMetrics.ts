import type {
  ValidationMetrics,
  SignalValidationResult,
  ValidationTimelineEvent,
  DashboardState,
  MetricCardData,
  Phase1Rejects,
  Phase2Rejects,
  ValidationWarnings
} from '../../types/validation'

/**
 * Composable สำหรับจัดการ Validation Metrics
 * ใช้ใน Dashboard เพื่อแสดงสถิติการ validate signals
 */
export function useValidationMetrics() {
  // State
  const state = reactive<DashboardState>({
    metrics: getDefaultMetrics(),
    recentValidations: [],
    timelineEvents: [],
    rejectionBreakdown: {
      phase1: {
        adx_sideways: [],
        no_majority: [],
        conflicting_trends: []
      },
      phase2: {
        bb_unavailable: [],
        inside_channel: [],
        new_high_low: []
      }
    },
    isLoading: false,
    error: null
  })

  // Computed values
  const filterRate = computed(() => {
    if (state.metrics.total_signals === 0) return 0
    return (state.metrics.rejected_signals / state.metrics.total_signals) * 100
  })

  const passRate = computed(() => {
    if (state.metrics.total_signals === 0) return 0
    return (state.metrics.passed_signals / state.metrics.total_signals) * 100
  })

  const totalPhase1Rejects = computed(() => {
    const { adx_sideways, no_majority, conflicting_trends } = state.metrics.phase1_rejects
    return adx_sideways + no_majority + conflicting_trends
  })

  const totalPhase2Rejects = computed(() => {
    const { bb_unavailable, inside_channel, new_high_low } = state.metrics.phase2_rejects
    return bb_unavailable + inside_channel + new_high_low
  })

  // Metric Cards for Dashboard
  const metricCards = computed<MetricCardData[]>(() => [
    {
      title: 'Total Signals',
      value: state.metrics.total_signals,
      icon: 'mdi-signal',
      color: 'primary'
    },
    {
      title: 'Passed',
      value: state.metrics.passed_signals,
      subtitle: `${passRate.value.toFixed(1)}%`,
      icon: 'mdi-check-circle',
      color: 'success'
    },
    {
      title: 'Rejected',
      value: state.metrics.rejected_signals,
      subtitle: `${filterRate.value.toFixed(1)}%`,
      icon: 'mdi-close-circle',
      color: 'error'
    },
    {
      title: 'API Calls Saved',
      value: state.metrics.api_calls_saved,
      icon: 'mdi-cloud-off-outline',
      color: 'info'
    },
    {
      title: 'Cost Saved',
      value: `$${state.metrics.estimated_cost_saved.toFixed(2)}`,
      icon: 'mdi-currency-usd',
      color: 'success'
    },
    {
      title: 'Warnings',
      value: state.metrics.warnings.candle_not_closed,
      icon: 'mdi-alert',
      color: 'warning'
    }
  ])

  // Phase 1 Rejection Breakdown
  const phase1RejectionBreakdown = computed(() => [
    {
      label: 'ADX Sideways',
      value: state.metrics.phase1_rejects.adx_sideways,
      color: '#FF5252',
      icon: 'mdi-trending-neutral'
    },
    {
      label: 'No Majority Trend',
      value: state.metrics.phase1_rejects.no_majority,
      color: '#FB8C00',
      icon: 'mdi-help-circle'
    },
    {
      label: 'Conflicting Trends',
      value: state.metrics.phase1_rejects.conflicting_trends,
      color: '#E91E63',
      icon: 'mdi-swap-vertical'
    }
  ])

  // Phase 2 Rejection Breakdown
  const phase2RejectionBreakdown = computed(() => [
    {
      label: 'BB Unavailable',
      value: state.metrics.phase2_rejects.bb_unavailable,
      color: '#9C27B0',
      icon: 'mdi-chart-bell-curve'
    },
    {
      label: 'Inside Channel',
      value: state.metrics.phase2_rejects.inside_channel,
      color: '#3F51B5',
      icon: 'mdi-arrow-collapse-horizontal'
    },
    {
      label: 'New High/Low',
      value: state.metrics.phase2_rejects.new_high_low,
      color: '#00BCD4',
      icon: 'mdi-arrow-up-bold'
    }
  ])

  // Actions
  function updateMetrics(newMetrics: Partial<ValidationMetrics>) {
    Object.assign(state.metrics, newMetrics)
    state.metrics.last_updated = new Date()
  }

  function addValidationResult(result: SignalValidationResult) {
    state.recentValidations.unshift(result)
    // Keep only last 100 results
    if (state.recentValidations.length > 100) {
      state.recentValidations.pop()
    }
    updateMetricsFromResult(result)
  }

  function updateMetricsFromResult(result: SignalValidationResult) {
    state.metrics.total_signals++

    if (result.passed) {
      state.metrics.passed_signals++
    } else {
      state.metrics.rejected_signals++
      state.metrics.api_calls_saved++
      // Assuming $0.002 per API call (GPT-4 approximate)
      state.metrics.estimated_cost_saved += 0.002

      // Update rejection stats based on phase
      if (result.rejectionPhase === 'phase1_trend_analysis') {
        updatePhase1Rejects(result)
      } else if (result.rejectionPhase === 'phase2_proindicator') {
        updatePhase2Rejects(result)
      }
    }

    // Update warnings
    if (result.warnings.length > 0) {
      if (result.warnings.some(w => w.includes('candle'))) {
        state.metrics.warnings.candle_not_closed++
      }
    }

    state.metrics.filter_rate = filterRate.value
    state.metrics.last_updated = new Date()
  }

  function updatePhase1Rejects(result: SignalValidationResult) {
    const reason = result.rejectionReason?.toLowerCase() || ''
    if (reason.includes('sideways')) {
      state.metrics.phase1_rejects.adx_sideways++
    } else if (reason.includes('majority') || reason.includes('conflicting')) {
      if (reason.includes('no') || reason.includes('clear')) {
        state.metrics.phase1_rejects.no_majority++
      } else {
        state.metrics.phase1_rejects.conflicting_trends++
      }
    }
  }

  function updatePhase2Rejects(result: SignalValidationResult) {
    const reason = result.rejectionReason?.toLowerCase() || ''
    if (reason.includes('bollinger') || reason.includes('unavailable')) {
      state.metrics.phase2_rejects.bb_unavailable++
    } else if (reason.includes('channel') || reason.includes('inside')) {
      state.metrics.phase2_rejects.inside_channel++
    } else if (reason.includes('high') || reason.includes('low')) {
      state.metrics.phase2_rejects.new_high_low++
    }
  }

  function addTimelineEvent(event: ValidationTimelineEvent) {
    state.timelineEvents.unshift(event)
    // Keep only last 50 events
    if (state.timelineEvents.length > 50) {
      state.timelineEvents.pop()
    }
  }

  function resetMetrics() {
    state.metrics = getDefaultMetrics()
    state.recentValidations = []
    state.timelineEvents = []
  }

  function setLoading(loading: boolean) {
    state.isLoading = loading
  }

  function setError(error: string | null) {
    state.error = error
  }

  // WebSocket หรือ API connection สำหรับ real-time updates
  async function startRealTimeUpdates(wsUrl?: string) {
    // TODO: Implement WebSocket connection for real-time metrics
    console.log('Starting real-time updates...', wsUrl)
  }

  function stopRealTimeUpdates() {
    // TODO: Implement WebSocket disconnection
    console.log('Stopping real-time updates...')
  }

  return {
    // State
    state: readonly(state),
    metrics: computed(() => state.metrics),
    recentValidations: computed(() => state.recentValidations),
    timelineEvents: computed(() => state.timelineEvents),
    isLoading: computed(() => state.isLoading),
    error: computed(() => state.error),

    // Computed
    filterRate,
    passRate,
    totalPhase1Rejects,
    totalPhase2Rejects,
    metricCards,
    phase1RejectionBreakdown,
    phase2RejectionBreakdown,

    // Actions
    updateMetrics,
    addValidationResult,
    addTimelineEvent,
    resetMetrics,
    setLoading,
    setError,
    startRealTimeUpdates,
    stopRealTimeUpdates
  }
}

// Helper function
function getDefaultMetrics(): ValidationMetrics {
  return {
    total_signals: 0,
    passed_signals: 0,
    rejected_signals: 0,
    filter_rate: 0,
    phase1_rejects: {
      adx_sideways: 0,
      no_majority: 0,
      conflicting_trends: 0
    },
    phase2_rejects: {
      bb_unavailable: 0,
      inside_channel: 0,
      new_high_low: 0
    },
    warnings: {
      candle_not_closed: 0
    },
    api_calls_saved: 0,
    estimated_cost_saved: 0,
    last_updated: new Date(),
    period_start: new Date(),
    period_end: new Date()
  }
}
