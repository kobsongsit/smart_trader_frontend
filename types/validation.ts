/**
 * Validation Types for Smart Trader Frontend Monitor
 *
 * ระบบ Validation Checks สำหรับกรอง signals ก่อนส่ง AI
 * ประกอบด้วย 2 Phase หลัก:
 * - Phase 1: Multi-Timeframe Pre-Filter (Trend Analysis)
 * - Phase 2: ProIndicator Validation (Technical Analysis)
 */

// ============================================================================
// Enums
// ============================================================================

export enum ValidationPhase {
  PHASE1_TREND_ANALYSIS = 'phase1_trend_analysis',
  PHASE2_PROINDICATOR = 'phase2_proindicator'
}

export enum ValidationAction {
  REJECT = 'REJECT',
  WARNING = 'WARNING',
  SKIP = 'SKIP',
  PASS = 'PASS'
}

export enum TrendDirection {
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH',
  SIDEWAYS = 'SIDEWAYS',
  UNKNOWN = 'UNKNOWN'
}

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum Timeframe {
  M1 = '1m',
  M5 = '5m',
  M15 = '15m',
  M30 = '30m',
  H1 = '1H',
  H4 = '4H',
  D1 = '1D',
  W1 = '1W'
}

// ============================================================================
// Phase 1: Multi-Timeframe Pre-Filter Types
// ============================================================================

/**
 * ADX Sideways Detection Check
 * ตรวจสอบว่าตลาด sideways หรือไม่ (ADX < 20)
 */
export interface AdxSidewaysCheck {
  name: 'adx_sideways_detection'
  description: string
  timeframe: Timeframe
  adxValue: number
  threshold: number // Default: 20
  isSideways: boolean
  action: ValidationAction
  reason: string
}

/**
 * Trend Consensus Check
 * ตรวจสอบ majority trend ใน 5 timeframes
 */
export interface TrendConsensusCheck {
  name: 'trend_consensus'
  description: string
  timeframeTrends: Record<Timeframe, TrendDirection>
  majorityTrend: TrendDirection | null
  majorityCount: number
  requiredMajority: number // Default: 3
  hasMajority: boolean
  action: ValidationAction
  reason: string
}

/**
 * Trend Direction Filter Check
 * ป้องกัน signal ที่ขัดกับ majority trend
 */
export interface TrendDirectionFilterCheck {
  name: 'trend_direction_filter'
  description: string
  signalDirection: SignalType
  majorityTrend: TrendDirection
  isConflicting: boolean
  action: ValidationAction
  reason: string
}

/**
 * Phase 1 Results
 */
export interface Phase1Results {
  phase: ValidationPhase.PHASE1_TREND_ANALYSIS
  timestamp: Date
  checks: {
    adxSideways: AdxSidewaysCheck[]
    trendConsensus: TrendConsensusCheck
    trendDirectionFilter: TrendDirectionFilterCheck
  }
  sidewaysCount: number
  passed: boolean
  rejectReason: string | null
}

// ============================================================================
// Phase 2: ProIndicator Validation Types
// ============================================================================

/**
 * Bollinger Bands Data
 */
export interface BollingerBandsData {
  upper: number
  middle: number
  lower: number
  bandwidth: number
}

/**
 * Bollinger Bands Availability Check
 */
export interface BollingerBandsAvailabilityCheck {
  name: 'bollinger_bands_availability'
  description: string
  isAvailable: boolean
  data: BollingerBandsData | null
  action: ValidationAction
  reason: string
}

/**
 * Channel Detection Check
 * ตรวจสอบว่าราคาอยู่ใน BB channel หรือไม่
 */
export interface ChannelDetectionCheck {
  name: 'channel_detection'
  description: string
  currentPrice: number
  bollingerBands: BollingerBandsData
  isInsideChannel: boolean
  formula: string // "price >= BB.lower && price <= BB.upper"
  action: ValidationAction
  reason: string
}

/**
 * New High/Low Detection Check
 * ตรวจสอบว่าเป็น new high/low ใน 50 periods หรือไม่
 */
export interface NewHighLowDetectionCheck {
  name: 'new_high_low_detection'
  description: string
  currentPrice: number
  highestInPeriod: number
  lowestInPeriod: number
  lookbackPeriods: number // Default: 50
  isNewHigh: boolean
  isNewLow: boolean
  action: ValidationAction
  reason: string
}

/**
 * Candle Close Confirmation Check
 * ตรวจสอบว่าอยู่ที่ candle close time หรือไม่
 */
export interface CandleCloseConfirmationCheck {
  name: 'candle_close_confirmation'
  description: string
  currentTime: Date
  timeframe: Timeframe
  isClosed: boolean
  nextCloseTime: Date
  timeUntilClose: number // milliseconds
  action: ValidationAction
  reason: string
}

/**
 * Timeframe Close Rules
 */
export interface TimeframeCloseRules {
  '15m': string // "minutes % 15 === 0"
  '1H': string // "minutes === 0"
  '4H': string // "minutes === 0 && hours % 4 === 0"
}

/**
 * Phase 2 Results
 */
export interface Phase2Results {
  phase: ValidationPhase.PHASE2_PROINDICATOR
  timestamp: Date
  checks: {
    bollingerBandsAvailability: BollingerBandsAvailabilityCheck
    channelDetection: ChannelDetectionCheck | null
    newHighLowDetection: NewHighLowDetectionCheck
    candleCloseConfirmation: CandleCloseConfirmationCheck
  }
  passed: boolean
  hasWarnings: boolean
  rejectReason: string | null
  warnings: string[]
}

// ============================================================================
// Validation Metrics Interface (สำหรับ Frontend Monitor)
// ============================================================================

/**
 * Phase 1 Rejection Stats
 */
export interface Phase1Rejects {
  adx_sideways: number
  no_majority: number
  conflicting_trends: number
}

/**
 * Phase 2 Rejection Stats
 */
export interface Phase2Rejects {
  bb_unavailable: number
  inside_channel: number
  new_high_low: number
}

/**
 * Warning Stats
 */
export interface ValidationWarnings {
  candle_not_closed: number
}

/**
 * Main Validation Metrics Interface
 * สำหรับแสดงใน Dashboard
 */
export interface ValidationMetrics {
  // Overview
  total_signals: number
  passed_signals: number
  rejected_signals: number
  filter_rate: number // percentage (0-100)

  // Phase 1 Stats
  phase1_rejects: Phase1Rejects

  // Phase 2 Stats
  phase2_rejects: Phase2Rejects

  // Warnings
  warnings: ValidationWarnings

  // Cost Savings
  api_calls_saved: number
  estimated_cost_saved: number // USD

  // Timestamps
  last_updated: Date
  period_start: Date
  period_end: Date
}

// ============================================================================
// Full Validation Result Interface
// ============================================================================

/**
 * Single Signal Validation Result
 */
export interface SignalValidationResult {
  id: string
  symbol: string
  signalType: SignalType
  timestamp: Date

  // Phase Results
  phase1: Phase1Results
  phase2: Phase2Results | null // null if rejected in Phase 1

  // Final Result
  finalAction: ValidationAction
  passed: boolean
  rejectionPhase: ValidationPhase | null
  rejectionReason: string | null
  warnings: string[]

  // Metadata
  processingTime: number // milliseconds
}

/**
 * Validation Check Definition
 * สำหรับกำหนด validation rules
 */
export interface ValidationCheckDefinition {
  name: string
  description: string
  phase: ValidationPhase
  action: ValidationAction
  reason: string
  formula?: string
  threshold?: number
  lookback?: number
}

/**
 * Validation Timeline Event
 * สำหรับแสดง Timeline ใน UI
 */
export interface ValidationTimelineEvent {
  id: string
  timestamp: Date
  phase: ValidationPhase
  checkName: string
  action: ValidationAction
  reason: string
  details: Record<string, unknown>
}

// ============================================================================
// Dashboard Display Types
// ============================================================================

/**
 * Metric Card Data
 */
export interface MetricCardData {
  title: string
  value: number | string
  subtitle?: string
  icon: string
  color: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
}

/**
 * Chart Data Point
 */
export interface ChartDataPoint {
  timestamp: Date
  value: number
  label?: string
}

/**
 * Rejection Breakdown Chart Data
 */
export interface RejectionBreakdownData {
  phase1: {
    adx_sideways: ChartDataPoint[]
    no_majority: ChartDataPoint[]
    conflicting_trends: ChartDataPoint[]
  }
  phase2: {
    bb_unavailable: ChartDataPoint[]
    inside_channel: ChartDataPoint[]
    new_high_low: ChartDataPoint[]
  }
}

/**
 * Dashboard State
 */
export interface DashboardState {
  metrics: ValidationMetrics
  recentValidations: SignalValidationResult[]
  timelineEvents: ValidationTimelineEvent[]
  rejectionBreakdown: RejectionBreakdownData
  isLoading: boolean
  error: string | null
}
