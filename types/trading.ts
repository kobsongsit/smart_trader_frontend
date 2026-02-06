/**
 * Trading Types for Smart Trader Frontend
 * Symbol & Indicators interfaces
 */

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    total: number
  }
  error?: string
}

// ============================================================================
// Symbol Types
// ============================================================================

export interface Symbol {
  id: number
  name: string
  displayName: string
  type: 'CRYPTO' | 'STOCK' | 'FOREX'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SymbolQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
  timestamp: string
}

// ============================================================================
// Indicator Types
// ============================================================================

export interface MovingAverages {
  sma50: number | null
  sma200: number | null
  ema20: number | null
}

export interface MACD {
  line: number | null
  signal: number | null
  histogram: number | null
}

export interface BollingerBands {
  upper: number | null
  middle: number | null
  lower: number | null
}

export interface Stochastic {
  k: number | null
  d: number | null
}

export interface ADX {
  adx: number | null
  plusDI: number | null
  minusDI: number | null
}

export type TrendDirection = 'UP' | 'DOWN' | 'NEUTRAL'

export interface MultiTimeframeTrends {
  '15m': TrendDirection
  '30m': TrendDirection
  '1H': TrendDirection
  '4H': TrendDirection
  '1D': TrendDirection
}

// ============================================================================
// Multi-Timeframe Trends API Types (Layer 2)
// ============================================================================

export interface TrendWithADX {
  direction: TrendDirection | null
  adx: number | null
}

export interface TimeframeTrendsWithADX {
  '15m': TrendWithADX
  '30m': TrendWithADX
  '1H': TrendWithADX
  '4H': TrendWithADX
  '1D': TrendWithADX
}

export interface TrendAnalysis {
  majorityTrend: TrendDirection
  upCount: number
  downCount: number
  neutralCount: number
  sidewaysCount: number
  isSideways: boolean
}

export interface PreFilterResult {
  shouldAnalyze: boolean
  reason?: string | null
  passedRules?: string[]
  warnings?: string[]
}

export interface SymbolTrends {
  symbol: string
  symbolName: string
  trends: TimeframeTrendsWithADX
  analysis: TrendAnalysis
  preFilter: PreFilterResult
}

// ============================================================================
// ProIndicator Validation API Types (Layer 3)
// ============================================================================

export interface ValidationCheck {
  passed: boolean
  message: string
  isWarning?: boolean
}

export interface ValidationChecks {
  insideChannel: ValidationCheck
  newHighLow: ValidationCheck
  candleClose: ValidationCheck
}

export interface BollingerBandsPosition {
  upper: number
  middle: number
  lower: number
  pricePosition: string
  percentB: string
}

export interface NextCandleClose {
  timeframe: string
  secondsRemaining: number
  minutesRemaining: number
}

export interface ValidationResult {
  isValid: boolean
  checks: ValidationChecks
  warnings?: string[]
  reason?: string
}

export interface SymbolValidation {
  symbol: string
  symbolName: string
  currentPrice: number
  timestamp: string
  validation: ValidationResult
  bollingerBands: BollingerBandsPosition
  nextCandleClose?: NextCandleClose
}

export interface Indicators {
  movingAverages: MovingAverages
  macd: MACD
  bollingerBands: BollingerBands
  rsi: number | null
  stochastic: Stochastic
  obv: number | null
  atr: number | null
  adx: ADX
  trends?: MultiTimeframeTrends
  majorityTrend?: TrendDirection
}

export interface SymbolIndicators {
  symbol: string
  symbolName: string
  currentPrice?: number
  priceChange?: number
  priceChangePercent?: number
  high24h?: number
  low24h?: number
  volume24h?: number
  indicators: Indicators
  warnings?: string[]
  timestamp: string
}

// ============================================================================
// Signal Types
// ============================================================================

export type SignalStrategy = 'BUY' | 'SELL' | 'WAIT'

export interface Signal {
  id: number
  symbolId: number
  strategy: SignalStrategy
  confidence: number
  entryPrice: number
  takeProfit: number
  stopLoss: number
  riskRewardRatio: string
  supportLevels: number[]
  resistanceLevels: number[]
  analysisSummary: string
  keyFactors: string[]
  warnings: string[]
  createdAt: string
}

// ============================================================================
// Display Helpers
// ============================================================================

export interface IndicatorDisplayConfig {
  name: string
  value: number | string | null
  unit?: string
  color?: 'success' | 'error' | 'warning' | 'info' | 'neutral'
  icon?: string
}

export function getTrendColor(trend: TrendDirection): string {
  switch (trend) {
    case 'UP': return 'success'
    case 'DOWN': return 'error'
    case 'NEUTRAL': return 'grey'
    default: return 'grey'
  }
}

export function getTrendIcon(trend: TrendDirection): string {
  switch (trend) {
    case 'UP': return 'mdi-trending-up'
    case 'DOWN': return 'mdi-trending-down'
    case 'NEUTRAL': return 'mdi-trending-neutral'
    default: return 'mdi-help'
  }
}

export function getRSIStatus(rsi: number | null): { label: string; color: string } {
  if (rsi === null) return { label: 'N/A', color: 'grey' }
  if (rsi >= 70) return { label: 'Overbought', color: 'error' }
  if (rsi <= 30) return { label: 'Oversold', color: 'success' }
  return { label: 'Neutral', color: 'info' }
}

export function getADXStrength(adx: number | null): { label: string; color: string } {
  if (adx === null) return { label: 'N/A', color: 'grey' }
  if (adx >= 50) return { label: 'Very Strong', color: 'success' }
  if (adx >= 25) return { label: 'Strong', color: 'info' }
  if (adx >= 20) return { label: 'Moderate', color: 'warning' }
  return { label: 'Weak', color: 'error' }
}

export function formatNumber(value: number | null, decimals: number = 2): string {
  if (value === null) return 'N/A'
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M'
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K'
  }
  return value.toFixed(decimals)
}

export function formatPrice(value: number | null): string {
  if (value === null) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2
  }).format(value)
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function getValidationCheckStatus(check: ValidationCheck): { icon: string; color: string } {
  if (check.passed) {
    return { icon: 'mdi-check-circle', color: 'success' }
  }
  if (check.isWarning) {
    return { icon: 'mdi-alert', color: 'warning' }
  }
  return { icon: 'mdi-close-circle', color: 'error' }
}

export function getPreFilterStatus(preFilter: PreFilterResult): { label: string; color: string; icon: string } {
  if (preFilter.shouldAnalyze) {
    return { label: 'Ready to Analyze', color: 'success', icon: 'mdi-check-circle' }
  }
  return { label: 'Filtered Out', color: 'error', icon: 'mdi-filter-remove' }
}

export function getBBPositionColor(position: string): string {
  if (position.includes('above upper') || position.includes('below lower')) {
    return 'warning'
  }
  if (position.includes('upper zone')) {
    return 'orange'
  }
  if (position.includes('lower zone')) {
    return 'cyan'
  }
  return 'grey'
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}
