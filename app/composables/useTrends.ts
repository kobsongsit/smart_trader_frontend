import axios from 'axios'
import type { SymbolTrends, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับจัดการ Multi-Timeframe Trends (Layer 2)
 * เรียก API: GET /api/trends/:symbolId
 */
export function useTrends() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // State - cache trends by symbolId
  const trendsCache = ref<Map<number, SymbolTrends>>(new Map())
  const loadingSymbols = ref<Set<number>>(new Set())
  const errors = ref<Map<number, string>>(new Map())

  // Check if loading specific symbol
  function isLoadingSymbol(symbolId: number): boolean {
    return loadingSymbols.value.has(symbolId)
  }

  // Get cached trends
  function getCachedTrends(symbolId: number): SymbolTrends | undefined {
    return trendsCache.value.get(symbolId)
  }

  // Get error for symbol
  function getError(symbolId: number): string | undefined {
    return errors.value.get(symbolId)
  }

  // Fetch trends for a symbol
  async function fetchTrends(symbolId: number, forceRefresh = false): Promise<SymbolTrends | null> {
    // Return cached if available and not forcing refresh
    if (!forceRefresh && trendsCache.value.has(symbolId)) {
      return trendsCache.value.get(symbolId) || null
    }

    // Mark as loading
    loadingSymbols.value.add(symbolId)
    errors.value.delete(symbolId)

    try {
      const url = `${baseUrl}/api/trends/${symbolId}`
      const { data: response } = await axios.get<ApiResponse<SymbolTrends>>(url)

      if (response.success) {
        trendsCache.value.set(symbolId, response.data)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch trends')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch trends'
      errors.value.set(symbolId, errorMsg)
      console.error(`Error fetching trends for symbol ${symbolId}:`, err)
      return null
    } finally {
      loadingSymbols.value.delete(symbolId)
    }
  }

  // Fetch trends for multiple symbols
  async function fetchMultipleTrends(symbolIds: number[]): Promise<void> {
    await Promise.all(symbolIds.map(id => fetchTrends(id)))
  }

  // Clear cache
  function clearCache(symbolId?: number) {
    if (symbolId !== undefined) {
      trendsCache.value.delete(symbolId)
      errors.value.delete(symbolId)
    } else {
      trendsCache.value.clear()
      errors.value.clear()
    }
  }

  // Computed
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
    clearCache
  }
}
