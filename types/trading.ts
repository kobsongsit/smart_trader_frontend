/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

/**
 * Portfolio overview data from GET /api/strategy/portfolio
 */
export interface PortfolioData {
  totalPips: number
  wins: number
  losses: number
  totalTrades: number
  winRate: number
  profitFactor: number
  streak: number
  streakType: 'W' | 'L'
  openPositions: number
  since: string
  maxDrawdown: number
  todayPips: number
  weekPips: number
}

/**
 * Open position data from GET /api/strategy/positions
 */
export interface Position {
  symbol: string
  interval: string
  action: 'BUY' | 'SELL'
  entryPrice: string
  currentPrice: string | null
  slPrice: string
  slLabel: string
  entryTime: string
  floatingPips: number | null
  slDistancePercent: number | null
  duration: string | null
}

// ============================================================
// Trade History
// ============================================================

/**
 * Summary stats for closed trades (filtered)
 */
export interface TradeHistorySummary {
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalPips: number
  profitFactor: number
  avgWinPips: number
  avgLossPips: number
}

/**
 * Single closed trade
 */
export interface ClosedTrade {
  id: number
  symbol: string
  interval: string
  strategyName: string
  action: 'BUY' | 'SELL'
  entryPrice: string
  entryTime: string
  exitPrice: string
  exitTime: string
  exitReason: 'TP' | 'SL' | 'OPPOSITE_SIGNAL' | 'MANUAL'
  profitPips: number
  duration: string
}

/**
 * Pagination info for trade history
 */
export interface TradeHistoryPagination {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

/**
 * Full trade history response data
 */
export interface TradeHistoryData {
  summary: TradeHistorySummary
  trades: ClosedTrade[]
  pagination: TradeHistoryPagination
}

// ============================================================
// Monthly Performance
// ============================================================

/**
 * Best/worst trade highlight in a month
 */
export interface MonthlyTradeHighlight {
  symbol: string
  action: 'BUY' | 'SELL'
  pips: number
  date: string
  interval: string
}

/**
 * Per-symbol breakdown within a month
 */
export interface MonthlySymbolBreakdown {
  symbol: string
  totalPips: number
  wins: number
  losses: number
  totalTrades: number
}

/**
 * Per-interval breakdown within a month
 */
export interface MonthlyIntervalBreakdown {
  interval: string
  wins: number
  losses: number
  totalPips: number
}

/**
 * Single month performance data
 */
export interface MonthlyData {
  month: string         // "2026-03"
  label: string         // "Mar 2026"
  totalPips: number
  wins: number
  losses: number
  totalTrades: number
  winRate: number
  profitFactor: number
  cumulativePips: number
  bestTrade: MonthlyTradeHighlight
  worstTrade: MonthlyTradeHighlight
  symbols: MonthlySymbolBreakdown[]
  intervals: MonthlyIntervalBreakdown[]
}

/**
 * Full monthly performance response data
 */
export interface MonthlyPerformanceData {
  months: MonthlyData[]
}

// ============================================================================
// Indicator At API Types (GET /api/indicators/:symbolId/at)
// ============================================================================

export interface IndicatorAtRawValues {
  sma50: number | null
  sma200: number | null
  ema20: number | null
  rsi: number | null
  stochK: number | null
  stochD: number | null
  macdLine: number | null
  macdSignal: number | null
  macdHistogram: number | null
  bbUpper: number | null
  bbMiddle: number | null
  bbLower: number | null
  adx: number | null
  plusDI: number | null
  minusDI: number | null
  atr: number | null
  obv: number | null
  ichimokuConversion: number | null
  ichimokuBase: number | null
  ichimokuSpanA: number | null
  ichimokuSpanB: number | null
}

export interface IndicatorAtDerivedSignals {
  bollingerSqueeze: boolean | null
  rsiDivergence: 'BULLISH' | 'BEARISH' | null
  macdDivergence: 'BULLISH' | 'BEARISH' | null
  smaCrossover: 'GOLDEN' | 'DEATH' | null
  candlestickPattern: string | null
  patternDirection: 'BULLISH' | 'BEARISH' | null
}

export interface IndicatorAtBollingerPosition {
  percentB: number | null
  position: string | null
}

export type IndicatorAtTrendDirection = 'BULLISH' | 'BEARISH' | 'SIDEWAYS' | null
export type IndicatorAtTrendStrength = 'STRONG' | 'MODERATE' | 'WEAK' | null

export interface IndicatorAtData {
  timestamp: string
  interval: string
  symbol: string
  symbolId: number
  indicators: IndicatorAtRawValues
  derivedSignals: IndicatorAtDerivedSignals
  bollingerPosition: IndicatorAtBollingerPosition
  trendDirection: IndicatorAtTrendDirection
  trendStrength: IndicatorAtTrendStrength
}

export interface IndicatorAtResponse {
  success: boolean
  data: IndicatorAtData
}
