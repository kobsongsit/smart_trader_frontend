/**
 * Format number ด้วย locale string (ใช้ใน IndicatorDetailPanel)
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

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
  id?: number
  symbol: string
  interval: string
  action: 'BUY' | 'SELL'
  strategyName?: string | null
  entryPrice: string
  currentPrice: string | null
  slPrice: string
  slLabel: string
  tpPrice?: string | null
  tpLabel?: string | null
  entryTime: string
  floatingPips: number | null
  slDistancePercent: number | null
  maxHoldBars?: number | null
  duration: string | null
}

/**
 * Price summary item from GET /api/strategy/price-summary
 */
export interface PriceSummaryItem {
  symbol: string
  price: string | null
  candleTime: string | null
  ageMinutes: number | null
  indicatorTime: string | null
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
  exitReason: 'TP' | 'TP2' | 'SL' | 'OPPOSITE_SIGNAL' | 'MANUAL' | 'TRAIL_STOP'
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

// ============================================================================
// SMC — Symbol List
// ============================================================================

export interface SymbolItem {
  id: number
  symbol: string
  name: string
  type: string
  isActive: boolean
}

// ============================================================================
// SMC — FVG (Fair Value Gap) Types
// ============================================================================

/** Raw candle data จาก API /api/smc/fvg */
export interface FvgCandle {
  timestamp: string   // ISO string เช่น "2026-03-01T22:00:00.000Z"
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** FVG Zone ที่ detect ได้ */
export interface FvgZone {
  timestamp: string   // ISO string — เวลาของแท่ง 2 (ใช้กำหนด x position บน chart)
  type: 'BULLISH' | 'BEARISH'
  top: number         // ขอบบน zone
  bottom: number      // ขอบล่าง zone
  candle2Body: number // body size แท่ง Imbalance
  atrAtTime: number   // ATR(14) ณ ขณะนั้น
  gapSize: number     // top - bottom
  bodyRatio: number   // candle2Body / atrAtTime
  gapRatio: number    // gapSize / atrAtTime
}

/** Stats จาก detection */
export interface FvgStats {
  total: number
  bullish: number
  bearish: number
  avgGapSize: number
  avgBodyRatio: number
}

/** Full response data จาก GET /api/smc/fvg */
export interface FvgData {
  symbol: string
  symbolId: number
  interval: string
  from: string
  to: string
  config: {
    minBodyRatio: number
    minGapRatio: number
  }
  candles: FvgCandle[]
  fvgZones: FvgZone[]
  stats: FvgStats
}

// ============================================================================
// Chart Trades — GET /api/strategy/trades
// ============================================================================

export interface ChartTrade {
  id: number
  symbolId: number
  symbolName: string
  interval: string
  strategyName: string
  action: 'BUY' | 'SELL'
  status: 'OPEN' | 'CLOSED'
  entryPrice: number
  entryTime: string
  entryTimestamp: number          // UNIX seconds — ใช้กับ LW Charts ได้ตรง
  exitPrice: number | null
  exitTime: string | null
  exitTimestamp: number | null    // UNIX seconds
  exitReason: 'SL' | 'TP' | 'TP2' | 'OPPOSITE_SIGNAL' | 'MANUAL' | 'TRAIL_STOP' | null
  slPrice: number | null
  tpPrice: number | null
  profitPips: number | null
  profitPercent: number | null
  entryIndicators: Record<string, number> | null
}

/** Query params สำหรับเรียก /api/smc/fvg */
export interface FvgParams {
  symbol: string
  interval: string
  from: string
  to: string
  minBodyRatio: number
  minGapRatio: number
}

// ============================================================================
// Backtest — GET /api/strategy/backtest
// ============================================================================

/**
 * Single backtest trade
 * ต่างจาก ChartTrade: ไม่มี symbolId, status เป็น CLOSED เสมอ,
 * exitPrice/exitTimestamp ไม่เป็น null, profitPercent เป็น null เสมอ
 */
export interface BacktestTrade {
  id: number
  symbolName: string
  interval: string
  strategyName: string
  action: 'BUY' | 'SELL'
  status: 'CLOSED'
  entryPrice: number
  entryTime: string
  entryTimestamp: number          // UNIX seconds — ใช้กับ LW Charts
  exitPrice: number               // ไม่เป็น null ใน backtest
  exitTime: string
  exitTimestamp: number           // UNIX seconds
  exitReason: 'SL' | 'TP' | 'TP2' | 'OPPOSITE_SIGNAL' | 'MANUAL' | 'TRAIL_STOP'
  slPrice: number | null
  tpPrice: number | null
  profitPips: number | null
  profitPercent: null             // เป็น null เสมอใน backtest
  // Multi-TP fields (มีเมื่อ tpMode = 'multi')
  tpMode?: 'fixed' | 'atr' | 'rr' | 'multi'
  tp2Price?: number | null
  tp1Hit?: boolean | null
  tp1HitTime?: string | null
  tp1HitPrice?: number | null
  breakEvenActive?: boolean | null
  trailStopPrice?: number | null
  half1Pips?: number | null
  half2Pips?: number | null
}

/** Summary stats จาก backtest */
export interface BacktestSummary {
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalPips: number
  profitFactor: number
  avgWinPips: number
  avgLossPips: number
  // Multi-TP fields (optional — มีเมื่อ tpMode = 'multi')
  tp2Hits?: number
  trailStopHits?: number
  tp1Reached?: number
  breakEvenHits?: number
  avgRR?: number
}

/** Strategy override params สำหรับ backtest */
export interface StrategyOverrides {
  tpMode?: 'fixed' | 'atr' | 'rr' | 'multi'
  tpAtrMult?: number
  tpRrMult?: number
  tp1RrMult?: number
  tp2RrMult?: number
  trailAtrMult?: number
  breakEvenAfterTp1?: boolean
}

/** Full response จาก GET /api/strategy/backtest */
export interface BacktestData {
  symbol: string
  interval: string
  from: string
  to: string
  mode: 'production' | 'original'
  summary: BacktestSummary
  trades: BacktestTrade[]
}
