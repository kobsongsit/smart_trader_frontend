import axios from 'axios'
import type { TrendsResponse, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับจัดการ Multi-Timeframe Trends
 * เรียก API: GET /api/trends/:symbolId
 *
 * Response shape (TrendCache): { timeframes, analysis }
 *
 * Shared singleton — module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const trendsCache = ref<Map<number, TrendsResponse>>(new Map())
const loadingSymbols = ref<Set<number>>(new Set())
const errors = ref<Map<number, string>>(new Map())

export function useTrends() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /** Check if loading specific symbol */
  function isLoadingSymbol(symbolId: number): boolean {
    return loadingSymbols.value.has(symbolId)
  }

  /** Get cached trends */
  function getCachedTrends(symbolId: number): TrendsResponse | undefined {
    return trendsCache.value.get(symbolId)
  }

  /** Get error for symbol */
  function getError(symbolId: number): string | undefined {
    return errors.value.get(symbolId)
  }

  /**
   * Fetch trends for a symbol
   * GET /api/trends/:symbolId
   */
  async function fetchTrends(symbolId: number, forceRefresh = false): Promise<TrendsResponse | null> {
    // Return cached if available and not forcing refresh
    if (!forceRefresh && trendsCache.value.has(symbolId)) {
      return trendsCache.value.get(symbolId) || null
    }

    // Prevent duplicate concurrent requests
    if (loadingSymbols.value.has(symbolId)) {
      return trendsCache.value.get(symbolId) ?? null
    }

    loadingSymbols.value.add(symbolId)
    errors.value.delete(symbolId)

    try {
      const url = `${baseUrl}/api/trends/${symbolId}`
      const { data: response } = await axios.get<ApiResponse<TrendsResponse>>(url)

      if (response.success) {
        trendsCache.value.set(symbolId, response.data)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch trends')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch trends'
      errors.value.set(symbolId, errorMsg)
      return null
    } finally {
      loadingSymbols.value.delete(symbolId)
    }
  }

  /** Fetch trends for multiple symbols */
  async function fetchMultipleTrends(symbolIds: number[]): Promise<void> {
    await Promise.all(symbolIds.map(id => fetchTrends(id)))
  }

  /** Clear cache */
  function clearCache(symbolId?: number) {
    if (symbolId !== undefined) {
      trendsCache.value.delete(symbolId)
      errors.value.delete(symbolId)
    } else {
      trendsCache.value.clear()
      errors.value.clear()
    }
  }

  const hasAnyLoading = computed(() => loadingSymbols.value.size > 0)

  return {
    // State
    trendsCache: readonly(trendsCache),

    // Computed
    hasAnyLoading,

    // Actions
    fetchTrends,
    fetchMultipleTrends,
    isLoadingSymbol,
    getCachedTrends,
    getError,
    clearCache,
  }
}
