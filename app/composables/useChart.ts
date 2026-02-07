import { ref, readonly } from 'vue'
import axios from 'axios'
import type { ChartData, ChartTimeframe, ChartApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ Chart Data API
 * เรียก GET /api/data/:symbolId/chart
 *
 * ⚠️ Shared singleton — ทุก component ที่เรียก useChart() จะใช้ cache เดียวกัน
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const chartCache = ref<Map<string, ChartData>>(new Map())
const loadingCharts = ref<Set<string>>(new Set())
const chartErrors = ref<Map<string, string>>(new Map())

/**
 * Build cache key from symbolId + timeframe
 */
function cacheKey(symbolId: number, timeframe: ChartTimeframe): string {
  return `${symbolId}-${timeframe}`
}

export function useChart() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Check if chart is loading for specific symbol + timeframe
   */
  function isLoadingChart(symbolId: number, timeframe: ChartTimeframe): boolean {
    return loadingCharts.value.has(cacheKey(symbolId, timeframe))
  }

  /**
   * Get cached chart data
   */
  function getCachedChart(symbolId: number, timeframe: ChartTimeframe): ChartData | undefined {
    return chartCache.value.get(cacheKey(symbolId, timeframe))
  }

  /**
   * Get error for specific chart
   */
  function getChartError(symbolId: number, timeframe: ChartTimeframe): string | undefined {
    return chartErrors.value.get(cacheKey(symbolId, timeframe))
  }

  /**
   * Fetch chart data from API
   * GET /api/data/:symbolId/chart?timeframe=1H&limit=200&includeOverlays=true&includeSignals=true&includeVolume=true
   */
  async function fetchChartData(
    symbolId: number,
    options?: {
      timeframe?: ChartTimeframe
      limit?: number
      includeOverlays?: boolean
      includeSignals?: boolean
      includeVolume?: boolean
      forceRefresh?: boolean
    }
  ): Promise<ChartData | null> {
    const {
      timeframe = '1H',
      limit = 200,
      includeOverlays = true,
      includeSignals = true,
      includeVolume = true,
      forceRefresh = false,
    } = options || {}

    const key = cacheKey(symbolId, timeframe)

    // Return cached if available and not forcing refresh
    if (!forceRefresh && chartCache.value.has(key)) {
      return chartCache.value.get(key) || null
    }

    // Skip if already loading
    if (loadingCharts.value.has(key)) {
      return null
    }

    // Mark as loading
    loadingCharts.value.add(key)
    chartErrors.value.delete(key)

    try {
      const params = new URLSearchParams({
        timeframe,
        limit: String(limit),
        includeOverlays: String(includeOverlays),
        includeSignals: String(includeSignals),
        includeVolume: String(includeVolume),
      })

      const url = `${baseUrl}/api/data/${symbolId}/chart?${params.toString()}`
      const { data: response } = await axios.get<ChartApiResponse>(url)

      if (response.success) {
        chartCache.value.set(key, response.data)
        return response.data
      } else {
        throw new Error('Failed to fetch chart data')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch chart data'
      chartErrors.value.set(key, errorMsg)
      console.error(`[useChart] Error fetching chart for symbol ${symbolId} (${timeframe}):`, err)
      return null
    } finally {
      loadingCharts.value.delete(key)
    }
  }

  /**
   * Clear chart cache
   */
  function clearChartCache(symbolId?: number) {
    if (symbolId !== undefined) {
      // Clear all timeframes for this symbol
      for (const key of chartCache.value.keys()) {
        if (key.startsWith(`${symbolId}-`)) {
          chartCache.value.delete(key)
          chartErrors.value.delete(key)
        }
      }
    } else {
      chartCache.value.clear()
      chartErrors.value.clear()
    }
  }

  return {
    // State
    chartCache: readonly(chartCache),

    // Actions
    fetchChartData,
    isLoadingChart,
    getCachedChart,
    getChartError,
    clearChartCache,
  }
}
