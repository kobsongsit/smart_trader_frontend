import axios from 'axios'
import type {
  ApiResponse,
  RawIndicatorResponse,
  RawIndicators,
  IndicatorInterval,
  IndicatorSignalCount,
  EnhancedIndicatorResponse,
  DerivedSignals,
  BBPosition,
  IndicatorSummaryCount,
  IchimokuSignals,
} from '../../types/trading'

/**
 * Composable สำหรับ Multi-Timeframe Indicator API
 *
 * Features:
 * - Fetch raw indicators per timeframe (GET /api/indicators/:symbolId?interval=)
 * - Enhanced mode: ?enhanced=true → server returns derivedSignals, bollingerPosition, summary
 * - Cache per symbol+interval combo
 * - Client-side bullish/bearish/neutral count (fallback if not enhanced)
 *
 * Shared singleton — ทุก component ที่เรียก useIndicators() จะใช้ state เดียวกัน
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

/** Cache key = "symbolId:interval" e.g. "1:15m" */
const indicatorCache = ref<Map<string, RawIndicatorResponse | EnhancedIndicatorResponse>>(new Map())
const loadingKeys = ref<Set<string>>(new Set())
const error = ref<string | null>(null)

// ============================================================
// Helpers
// ============================================================

function cacheKey(symbolId: number, interval: IndicatorInterval): string {
  return `${symbolId}:${interval}`
}

/**
 * คำนวณ bullish/bearish/neutral count จาก raw indicator values
 * ใช้เป็น fallback ถ้าไม่ได้ใช้ enhanced mode
 */
function computeSignalCount(ind: RawIndicators, currentPrice?: number): IndicatorSignalCount {
  let bullish = 0
  let bearish = 0
  let neutral = 0

  const price = currentPrice ?? ind.bollingerBands?.middle ?? null

  // ── Price vs SMA50 ──
  if (ind.movingAverages.sma50 !== null && price !== null) {
    price > ind.movingAverages.sma50 ? bullish++ : bearish++
  } else {
    neutral++
  }

  // ── Price vs SMA200 ──
  if (ind.movingAverages.sma200 !== null && price !== null) {
    price > ind.movingAverages.sma200 ? bullish++ : bearish++
  } else {
    neutral++
  }

  // ── SMA50 vs SMA200 (Golden/Death Cross) ──
  if (ind.movingAverages.sma50 !== null && ind.movingAverages.sma200 !== null) {
    ind.movingAverages.sma50 > ind.movingAverages.sma200 ? bullish++ : bearish++
  } else {
    neutral++
  }

  // ── MACD histogram ──
  if (ind.macd.histogram !== null) {
    ind.macd.histogram > 0 ? bullish++ : bearish++
  } else {
    neutral++
  }

  // ── RSI ──
  if (ind.rsi !== null) {
    if (ind.rsi < 30) bullish++
    else if (ind.rsi > 70) bearish++
    else neutral++
  } else {
    neutral++
  }

  // ── Stochastic %K ──
  if (ind.stochastic?.k !== null && ind.stochastic?.k !== undefined) {
    if (ind.stochastic.k < 20) bullish++
    else if (ind.stochastic.k > 80) bearish++
    else neutral++
  } else {
    neutral++
  }

  // ── ADX direction (plusDI vs minusDI) ──
  if (ind.adx?.plusDI != null && ind.adx?.minusDI != null) {
    ind.adx.plusDI > ind.adx.minusDI ? bullish++ : bearish++
  } else {
    neutral++
  }

  return { bullish, bearish, neutral }
}

/** Type guard to check if response is enhanced */
function isEnhanced(resp: RawIndicatorResponse | EnhancedIndicatorResponse): resp is EnhancedIndicatorResponse {
  return 'derivedSignals' in resp
}

// ============================================================
// Composable
// ============================================================

export function useIndicators() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * GET /api/indicators/:symbolId?interval=&enhanced=true
   * Fetch indicators for a specific timeframe
   */
  async function fetchIndicators(
    symbolId: number,
    interval: IndicatorInterval = '15m',
    options?: { forceRefresh?: boolean; enhanced?: boolean },
  ): Promise<RawIndicatorResponse | EnhancedIndicatorResponse | null> {
    const key = cacheKey(symbolId, interval)

    // Return from cache if available (unless force refresh)
    if (!options?.forceRefresh && indicatorCache.value.has(key)) {
      return indicatorCache.value.get(key)!
    }

    // Prevent duplicate concurrent requests
    if (loadingKeys.value.has(key)) return indicatorCache.value.get(key) ?? null

    loadingKeys.value.add(key)
    error.value = null

    try {
      const params = new URLSearchParams({ interval })
      if (options?.enhanced) params.append('enhanced', 'true')

      const { data: response } = await axios.get<ApiResponse<RawIndicatorResponse | EnhancedIndicatorResponse>>(
        `${baseUrl}/api/indicators/${symbolId}?${params.toString()}`,
      )

      if (response.success && response.data) {
        indicatorCache.value.set(key, response.data)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch indicators')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || err.message || 'Failed to fetch indicators'
      return null
    } finally {
      loadingKeys.value.delete(key)
    }
  }

  /** Get cached indicator data */
  function getCached(symbolId: number, interval: IndicatorInterval): RawIndicatorResponse | EnhancedIndicatorResponse | undefined {
    return indicatorCache.value.get(cacheKey(symbolId, interval))
  }

  /** Check if a specific symbol+interval is currently loading */
  function isLoading(symbolId: number, interval: IndicatorInterval): boolean {
    return loadingKeys.value.has(cacheKey(symbolId, interval))
  }

  /** Compute bullish/bearish/neutral signal count (client-side fallback) */
  function getSignalCount(symbolId: number, interval: IndicatorInterval, currentPrice?: number): IndicatorSignalCount {
    const cached = indicatorCache.value.get(cacheKey(symbolId, interval))
    if (!cached) return { bullish: 0, bearish: 0, neutral: 0 }
    return computeSignalCount(cached.indicators, currentPrice)
  }

  // ── Enhanced helpers ──

  /** Get derived signals from enhanced response (BB squeeze, divergence, crossover, pattern) */
  function getDerivedSignals(symbolId: number, interval: IndicatorInterval): DerivedSignals | null {
    const cached = indicatorCache.value.get(cacheKey(symbolId, interval))
    if (!cached || !isEnhanced(cached)) return null
    return cached.derivedSignals
  }

  /** Get Bollinger Band position from enhanced response */
  function getBBPosition(symbolId: number, interval: IndicatorInterval): BBPosition | null {
    const cached = indicatorCache.value.get(cacheKey(symbolId, interval))
    if (!cached || !isEnhanced(cached)) return null
    return cached.bollingerPosition
  }

  /** Get server-computed indicator summary from enhanced response */
  function getServerSummary(symbolId: number, interval: IndicatorInterval): IndicatorSummaryCount | null {
    const cached = indicatorCache.value.get(cacheKey(symbolId, interval))
    if (!cached || !isEnhanced(cached)) return null
    return cached.summary
  }

  /** Get Ichimoku derived signals from enhanced response (TK Cross, Price vs Cloud, Cloud Color) */
  function getIchimokuSignals(symbolId: number, interval: IndicatorInterval): IchimokuSignals | null {
    const cached = indicatorCache.value.get(cacheKey(symbolId, interval))
    if (!cached || !isEnhanced(cached)) return null
    return cached.ichimokuSignals ?? null
  }

  /** Clear cache for a specific symbol (all TFs) or everything */
  function clearCache(symbolId?: number) {
    if (symbolId) {
      for (const key of indicatorCache.value.keys()) {
        if (key.startsWith(`${symbolId}:`)) {
          indicatorCache.value.delete(key)
        }
      }
    } else {
      indicatorCache.value.clear()
    }
  }

  return {
    error: readonly(error),
    fetchIndicators,
    getCached,
    isLoading,
    getSignalCount,
    getDerivedSignals,
    getBBPosition,
    getServerSummary,
    getIchimokuSignals,
    clearCache,
  }
}
