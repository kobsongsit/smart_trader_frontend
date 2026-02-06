/**
 * Trading Types for Smart Trader Frontend
 * Based on FRONTEND_API_REFERENCE.md by Cappu
 *
 * Unified API: GET /api/analysis/:symbolId
 * Frontend does NOT compute anything - just display
 */

// ============================================================================
// API Response Wrapper
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
// Unified Analysis Response (GET /api/analysis/:symbolId)
// ============================================================================

export interface AnalysisData {
  symbol: SymbolInfo
  price: PriceData
  indicators: IndicatorsData
  trends: TrendsData
  validation: ValidationData
  signal: SignalData | null
  news: NewsData | null
  meta: MetaData
}

// ============================================================================
// Section 3: Symbol
// ============================================================================

export interface SymbolInfo {
  id: number
  symbol: string        // e.g. "EUR-USD"
  name: string          // e.g. "Euro / US Dollar"
  type: 'FOREX' | 'CRYPTO' | 'STOCK' | 'COMMODITY'
  exchange: string      // e.g. "FOREX", "NASDAQ", "BINANCE"
  isActive: boolean
}

/**
 * @deprecated Use SymbolInfo instead - kept for backward compat with useSymbols
 */
export interface Symbol {
  id: number
  name: string
  displayName: string
  type: 'CRYPTO' | 'STOCK' | 'FOREX'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Section 4: Price
// ============================================================================

export interface PriceData {
  current: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number           // price change from open
  changePercent: number    // % change (> 0 green, < 0 red, == 0 grey)
  timestamp: string        // ISO string
  high24h: number
  low24h: number
  volume24h: number
}

// ============================================================================
// Section 5: Indicators (with derived values - no frontend calculation needed)
// ============================================================================

export interface IndicatorsData {
  timestamp: string

  movingAverages: MovingAveragesData
  macd: MACDData
  bollingerBands: BollingerBandsData
  rsi: RSIData
  stochastic: StochasticData
  obv: OBVData
  atr: ATRData
  adx: ADXData
  summary: IndicatorsSummary
}

// --- 5.1 Moving Averages ---

export type PricePosition = 'above' | 'below'
export type CrossType = 'golden_cross' | 'death_cross'

export interface MovingAveragesData {
  sma50: number | null
  sma200: number | null
  ema20: number | null
  priceVsSma50: PricePosition
  priceVsSma200: PricePosition
  sma50VsSma200: CrossType
  priceVsEma20: PricePosition
}

// --- 5.2 MACD ---

export type MACDTrend = 'bullish' | 'bearish'
export type Momentum = 'increasing' | 'decreasing' | 'flat'

export interface MACDData {
  line: number
  signal: number
  histogram: number
  trend: MACDTrend
  momentum: Momentum
}

// --- 5.3 Bollinger Bands ---

export type BBPricePosition = 'above_upper' | 'upper_zone' | 'middle' | 'lower_zone' | 'below_lower'

export interface BollingerBandsData {
  upper: number
  middle: number
  lower: number
  bandwidth: number
  percentB: number           // 0-100 (can exceed)
  pricePosition: BBPricePosition
  squeeze: boolean           // true = potential breakout
}

// --- 5.4 RSI ---

export type IndicatorZone = 'overbought' | 'oversold' | 'neutral'

export interface RSIData {
  value: number              // 0-100
  zone: IndicatorZone
  description: string        // Thai description
}

// --- 5.5 Stochastic ---

export type StochCrossover = 'bullish_cross' | 'bearish_cross' | 'none'

export interface StochasticData {
  k: number
  d: number
  zone: IndicatorZone
  crossover: StochCrossover
  description: string
}

// --- 5.6 OBV ---

export type OBVTrend = 'increasing' | 'decreasing' | 'flat'
export type OBVConfirmation = 'confirmed' | 'divergence' | 'unknown'

export interface OBVData {
  value: number
  trend: OBVTrend
  confirmation: OBVConfirmation
  description: string
}

// --- 5.7 ATR ---

export type ATRLevel = 'low' | 'normal' | 'high' | 'extreme'

export interface ATRData {
  value: number
  level: ATRLevel
  suggestedSL: number
  suggestedTP: number
  description: string
}

// --- 5.8 ADX ---

export type ADXTrendStrength = 'no_trend' | 'developing' | 'established' | 'strong' | 'extreme'
export type ADXTrendDirection = 'bullish' | 'bearish' | 'neutral'

export interface ADXData {
  value: number              // 0-100
  plusDI: number
  minusDI: number
  trendStrength: ADXTrendStrength
  trendDirection: ADXTrendDirection
  description: string
}

// --- 5.9 Indicators Summary ---

export type OverallBias = 'bullish' | 'bearish' | 'neutral'
export type BiasStrength = 'strong' | 'moderate' | 'weak'

export interface IndicatorsSummary {
  bullishCount: number
  bearishCount: number
  neutralCount: number
  overallBias: OverallBias
  overallBiasLabel: string     // Thai label
  strength: BiasStrength
}

// ============================================================================
// Section 6: Trends (Multi-Timeframe)
// ============================================================================

export type TrendDirection = 'UP' | 'DOWN' | 'NEUTRAL'
export type Consensus = 'strong' | 'moderate' | 'weak' | 'none'

export interface TimeframeTrend {
  direction: TrendDirection | null
  adx: number | null
  label: string              // Thai label
}

export interface TrendsAnalysis {
  majorityTrend: TrendDirection
  majorityTrendLabel: string
  upCount: number
  downCount: number
  neutralCount: number
  sidewaysCount: number
  consensus: Consensus
}

export interface PreFilterResult {
  shouldAnalyze: boolean
  reason: string | null
  passedRules: string[]
  warnings: string[]
}

export interface TrendsData {
  timeframes: Record<string, TimeframeTrend>
  analysis: TrendsAnalysis
  preFilter: PreFilterResult
}

// ============================================================================
// Section 7: Validation (ProIndicator)
// ============================================================================

export type ValidationStatus = 'pass' | 'fail' | 'warning'

export interface ValidationCheck {
  passed: boolean
  status: ValidationStatus
  message: string            // Thai description
  isWarningOnly?: boolean
  detail: string | null
}

export interface ValidationChecks {
  channelDetection: ValidationCheck
  newHighLow: ValidationCheck
  candleClose: ValidationCheck
}

export interface BollingerPosition {
  upper: number
  middle: number
  lower: number
  pricePosition: string
  percentB: number
}

export interface NextCandleClose {
  timeframe: string
  secondsRemaining: number
  minutesRemaining: number
}

export interface ValidationData {
  isValid: boolean
  overallStatus: ValidationStatus
  overallStatusLabel: string
  checks: ValidationChecks
  bollingerPosition: BollingerPosition
  nextCandleClose: NextCandleClose | null
}

// ============================================================================
// Section 8: Signal (AI Trading Signal)
// ============================================================================

export type SignalStrategy = 'BUY' | 'SELL' | 'WAIT'
export type SignalPerformanceStatus = 'ACTIVE' | 'HIT_TP' | 'HIT_SL' | 'PENDING'

export interface SignalPrices {
  entry: number
  takeProfit: number
  stopLoss: number
  riskRewardRatio: string    // e.g. "1:2.5"
  potentialProfit: number    // % profit (entry -> TP)
  potentialLoss: number      // % loss (entry -> SL)
  profitPips: number
  lossPips: number
}

export interface SignalLevels {
  support: number[]          // 1-5 levels, nearest first
  resistance: number[]       // 1-5 levels, nearest first
}

export interface SignalAnalysis {
  summary: string            // 2-3 sentences Thai
  keyFactors: string[]       // 1-5 items
  warnings: string[]
}

export interface SignalPerformance {
  status: SignalPerformanceStatus
  statusLabel: string
  currentPrice: number
  profitLoss: number
  profitLossPercent: number
  maxProfit: number
  maxDrawdown: number
  durationMinutes: number
}

export interface SignalData {
  id: number
  timestamp: string
  strategy: SignalStrategy
  strategyLabel: string
  confidence: number         // 0-100
  confidenceLabel: string
  prices: SignalPrices
  levels: SignalLevels
  analysis: SignalAnalysis
  performance: SignalPerformance
}

// ============================================================================
// Section 9: News Sentiment
// ============================================================================

export type SentimentOverall = 'positive' | 'neutral' | 'negative'
export type NewsImpactDirection = 'supportive' | 'conflicting' | 'neutral'

export interface NewsSentiment {
  overall: SentimentOverall
  overallLabel: string
  score: number              // -10 to +10
  scoreLabel: string         // e.g. "+3.5/10"
}

export interface NewsHighlights {
  positive: string[]         // max 3
  negative: string[]         // max 3
}

export interface NewsImpact {
  direction: NewsImpactDirection
  directionLabel: string
  confidenceAdjustment: string   // e.g. "+5%" or "-10%"
  note: string
}

export interface NewsData {
  available: boolean
  totalArticles: number
  timeRange: string
  latestNewsDate: string
  sentiment: NewsSentiment
  highlights: NewsHighlights
  keyEvents: string[]
  summary: string
  impactOnSignal: NewsImpact
}

// ============================================================================
// Section 10: Meta
// ============================================================================

export interface DataAge {
  priceSeconds: number
  indicatorsSeconds: number
  trendsSeconds: number
  signalSeconds: number
  newsSeconds: number
}

export interface MetaData {
  timestamp: string
  version: string
  dataAge: DataAge
  source: 'rest' | 'websocket'
  nextUpdate: string | null
}

// ============================================================================
// Section 11: WebSocket Events
// ============================================================================

export type WSServerEvent =
  | 'analysis:full'
  | 'price:update'
  | 'indicators:update'
  | 'trends:update'
  | 'validation:update'
  | 'signal:new'
  | 'signal:loading'
  | 'news:update'
  | 'error'

export type WSClientEvent =
  | 'subscribe:symbol'
  | 'unsubscribe:symbol'
  | 'request:refresh'

// ============================================================================
// Display Helper Functions
// ============================================================================

// --- Trend helpers ---

export function getTrendColor(trend: TrendDirection | null): string {
  switch (trend) {
    case 'UP': return 'success'
    case 'DOWN': return 'error'
    case 'NEUTRAL': return 'grey'
    default: return 'grey'
  }
}

export function getTrendIcon(trend: TrendDirection | null): string {
  switch (trend) {
    case 'UP': return 'mdi-trending-up'
    case 'DOWN': return 'mdi-trending-down'
    case 'NEUTRAL': return 'mdi-trending-neutral'
    default: return 'mdi-help'
  }
}

// --- Price helpers ---

export function getPriceChangeColor(changePercent: number): string {
  if (changePercent > 0) return 'success'
  if (changePercent < 0) return 'error'
  return 'grey'
}

export function formatPriceChange(changePercent: number): string {
  const prefix = changePercent > 0 ? '+' : ''
  return `${prefix}${changePercent.toFixed(2)}%`
}

// --- Indicator zone helpers ---

export function getZoneColor(zone: IndicatorZone): string {
  switch (zone) {
    case 'overbought': return 'error'
    case 'oversold': return 'success'
    case 'neutral': return 'grey'
    default: return 'grey'
  }
}

export function getZoneLabel(zone: IndicatorZone): string {
  switch (zone) {
    case 'overbought': return 'Overbought'
    case 'oversold': return 'Oversold'
    case 'neutral': return 'Neutral'
    default: return 'N/A'
  }
}

// --- MA cross helpers ---

export function getCrossColor(cross: CrossType): string {
  return cross === 'golden_cross' ? 'success' : 'error'
}

export function getCrossLabel(cross: CrossType): string {
  return cross === 'golden_cross' ? 'Golden Cross' : 'Death Cross'
}

export function getCrossIcon(cross: CrossType): string {
  return cross === 'golden_cross' ? 'mdi-star-four-points' : 'mdi-skull'
}

// --- MACD helpers ---

export function getMACDTrendColor(trend: MACDTrend): string {
  return trend === 'bullish' ? 'success' : 'error'
}

export function getMomentumIcon(momentum: Momentum): string {
  switch (momentum) {
    case 'increasing': return 'mdi-arrow-up'
    case 'decreasing': return 'mdi-arrow-down'
    case 'flat': return 'mdi-arrow-right'
    default: return 'mdi-help'
  }
}

// --- Bollinger Bands helpers ---

export function getBBPositionColor(position: BBPricePosition | string): string {
  switch (position) {
    case 'above_upper': return 'error'
    case 'upper_zone': return 'warning'
    case 'middle': return 'grey'
    case 'lower_zone': return 'warning'
    case 'below_lower': return 'success'
    default: return 'grey'
  }
}

// --- OBV helpers ---

export function getOBVConfirmationColor(confirmation: OBVConfirmation): string {
  switch (confirmation) {
    case 'confirmed': return 'success'
    case 'divergence': return 'warning'
    case 'unknown': return 'grey'
    default: return 'grey'
  }
}

// --- ATR helpers ---

export function getATRLevelColor(level: ATRLevel): string {
  switch (level) {
    case 'low': return 'info'
    case 'normal': return 'grey'
    case 'high': return 'warning'
    case 'extreme': return 'error'
    default: return 'grey'
  }
}

// --- ADX helpers ---

export function getADXStrengthColor(strength: ADXTrendStrength): string {
  switch (strength) {
    case 'no_trend': return 'grey'
    case 'developing': return 'warning'
    case 'established': return 'success'
    case 'strong': return 'orange'
    case 'extreme': return 'error'
    default: return 'grey'
  }
}

export function getADXStrengthIcon(strength: ADXTrendStrength): string {
  switch (strength) {
    case 'no_trend': return 'mdi-cancel'
    case 'developing': return 'mdi-sprout'
    case 'established': return 'mdi-chart-line'
    case 'strong': return 'mdi-fire'
    case 'extreme': return 'mdi-flash'
    default: return 'mdi-help'
  }
}

export function getADXDirectionColor(direction: ADXTrendDirection): string {
  switch (direction) {
    case 'bullish': return 'success'
    case 'bearish': return 'error'
    case 'neutral': return 'grey'
    default: return 'grey'
  }
}

// --- Overall bias helpers ---

export function getBiasColor(bias: OverallBias): string {
  switch (bias) {
    case 'bullish': return 'success'
    case 'bearish': return 'error'
    case 'neutral': return 'grey'
    default: return 'grey'
  }
}

export function getBiasIcon(bias: OverallBias): string {
  switch (bias) {
    case 'bullish': return 'mdi-arrow-up-bold-circle'
    case 'bearish': return 'mdi-arrow-down-bold-circle'
    case 'neutral': return 'mdi-minus-circle'
    default: return 'mdi-help-circle'
  }
}

// --- Signal helpers ---

export function getStrategyColor(strategy: SignalStrategy): string {
  switch (strategy) {
    case 'BUY': return 'success'
    case 'SELL': return 'error'
    case 'WAIT': return 'warning'
    default: return 'grey'
  }
}

export function getStrategyIcon(strategy: SignalStrategy): string {
  switch (strategy) {
    case 'BUY': return 'mdi-arrow-up-bold-circle'
    case 'SELL': return 'mdi-arrow-down-bold-circle'
    case 'WAIT': return 'mdi-pause-circle'
    default: return 'mdi-help-circle'
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'success'
  if (confidence >= 60) return 'info'
  if (confidence >= 40) return 'warning'
  return 'error'
}

export function getPerformanceStatusColor(status: SignalPerformanceStatus): string {
  switch (status) {
    case 'ACTIVE': return 'info'
    case 'HIT_TP': return 'success'
    case 'HIT_SL': return 'error'
    case 'PENDING': return 'grey'
    default: return 'grey'
  }
}

// --- News helpers ---

export function getSentimentColor(sentiment: SentimentOverall): string {
  switch (sentiment) {
    case 'positive': return 'success'
    case 'negative': return 'error'
    case 'neutral': return 'grey'
    default: return 'grey'
  }
}

export function getNewsImpactColor(direction: NewsImpactDirection): string {
  switch (direction) {
    case 'supportive': return 'success'
    case 'conflicting': return 'warning'
    case 'neutral': return 'grey'
    default: return 'grey'
  }
}

// --- Validation helpers ---

export function getValidationStatusColor(status: ValidationStatus): string {
  switch (status) {
    case 'pass': return 'success'
    case 'fail': return 'error'
    case 'warning': return 'warning'
    default: return 'grey'
  }
}

export function getValidationStatusIcon(status: ValidationStatus): string {
  switch (status) {
    case 'pass': return 'mdi-check-circle'
    case 'fail': return 'mdi-close-circle'
    case 'warning': return 'mdi-alert'
    default: return 'mdi-help-circle'
  }
}

export function getPreFilterStatus(preFilter: PreFilterResult): { label: string; color: string; icon: string } {
  if (preFilter.shouldAnalyze) {
    return { label: 'Ready to Analyze', color: 'success', icon: 'mdi-check-circle' }
  }
  return { label: 'Filtered Out', color: 'error', icon: 'mdi-filter-remove' }
}

// --- Consensus helpers ---

export function getConsensusColor(consensus: Consensus): string {
  switch (consensus) {
    case 'strong': return 'success'
    case 'moderate': return 'info'
    case 'weak': return 'warning'
    case 'none': return 'error'
    default: return 'grey'
  }
}

// --- Format helpers ---

export function formatNumber(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined) return 'N/A'
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M'
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K'
  }
  return value.toFixed(decimals)
}

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2
  }).format(value)
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

export function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('th-TH')
}

export function formatThaiDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// --- Symbol type helpers ---

export function getSymbolTypeIcon(type: string): string {
  switch (type) {
    case 'CRYPTO': return 'mdi-bitcoin'
    case 'STOCK': return 'mdi-chart-line'
    case 'FOREX': return 'mdi-currency-usd'
    case 'COMMODITY': return 'mdi-gold'
    default: return 'mdi-chart-box'
  }
}

// --- Data age helpers ---

export function isDataStale(seconds: number, threshold: number = 300): boolean {
  return seconds > threshold
}
