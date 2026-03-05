import axios from 'axios'
import type {
  ApiResponse,
  RawIndicatorResponse,
  RawIndicators,
  IndicatorInterval,
  IndicatorSignalCount,
} from '../../types/trading'

/**
 * Composable สำหรับ Multi-Timeframe Indicator API
 *
 * Features:
 * - Fetch raw indicators per timeframe (GET /api/indicators/:symbolId?interval=)
 * - Cache per symbol+interval combo
 * - Client-side bullish/bearish/neutral count
 *
 * ⚠️ Shared singleton — ทุก component ที่เรียก useIndicators() จะใช้ state เดียวกัน
 *
 * Note: API นี้แยกจาก /api/analysis — เร็วกว่ามากเพราะแค่ดึง data จาก DB
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

/** Cache key = "symbolId:interval" e.g. "1:15m" */
const indicatorCache = ref<Map<string, RawIndicatorResponse>>(new Map())
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
 * ใช้สำหรับแสดง Indicator Summary per-TF
 *
 * Logic:
 * - Price vs SMA50/SMA200: above = bullish, below = bearish
 * - SMA50 vs SMA200: golden cross = bullish, death cross = bearish
 * - MACD histogram: > 0 = bullish, < 0 = bearish
 * - RSI: < 30 = bullish (oversold), > 70 = bearish (overbought)
 * - Stochastic %K: < 20 = bullish, > 80 = bearish
 * - ADX direction: plusDI > minusDI = bullish
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

// ============================================================
// Composable
// ============================================================

export function useIndicators() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * GET /api/indicators/:symbolId?interval=
   * Fetch raw indicators for a specific timeframe
   */
  async function fetchIndicators(
    symbolId: number,
    interval: IndicatorInterval = '15m',
    options?: { forceRefresh?: boolean },
  ): Promise<RawIndicatorResponse | null> {
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
      const { data: response } = await axios.get<ApiResponse<RawIndicatorResponse>>(
        `${baseUrl}/api/indicators/${symbolId}?interval=${interval}`,
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

  /**
   * Get cached indicator data
   */
  function getCached(symbolId: number, interval: IndicatorInterval): RawIndicatorResponse | undefined {
    return indicatorCache.value.get(cacheKey(symbolId, interval))
  }

  /**
   * Check if a specific symbol+interval is currently loading
   */
  function isLoading(symbolId: number, interval: IndicatorInterval): boolean {
    return loadingKeys.value.has(cacheKey(symbolId, interval))
  }

  /**
   * Compute bullish/bearish/neutral signal count from raw indicators
   */
  function getSignalCount(symbolId: number, interval: IndicatorInterval, currentPrice?: number): IndicatorSignalCount {
    const cached = indicatorCache.value.get(cacheKey(symbolId, interval))
    if (!cached) return { bullish: 0, bearish: 0, neutral: 0 }
    return computeSignalCount(cached.indicators, currentPrice)
  }

  /**
   * Clear cache for a specific symbol (all TFs) or everything
   */
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
    clearCache,
  }
}
