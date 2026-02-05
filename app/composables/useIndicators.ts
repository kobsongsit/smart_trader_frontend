import axios from 'axios'
import type { SymbolIndicators, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับจัดการ Indicators
 */
export function useIndicators() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // State - cache indicators by symbolId
  const indicatorsCache = ref<Map<number, SymbolIndicators>>(new Map())
  const loadingSymbols = ref<Set<number>>(new Set())
  const errors = ref<Map<number, string>>(new Map())

  // Check if loading specific symbol
  function isLoadingSymbol(symbolId: number): boolean {
    return loadingSymbols.value.has(symbolId)
  }

  // Get cached indicators
  function getCachedIndicators(symbolId: number): SymbolIndicators | undefined {
    return indicatorsCache.value.get(symbolId)
  }

  // Get error for symbol
  function getError(symbolId: number): string | undefined {
    return errors.value.get(symbolId)
  }

  // Fetch indicators for a symbol
  async function fetchIndicators(symbolId: number, forceRefresh = false): Promise<SymbolIndicators | null> {
    // Return cached if available and not forcing refresh
    if (!forceRefresh && indicatorsCache.value.has(symbolId)) {
      return indicatorsCache.value.get(symbolId) || null
    }

    // Mark as loading
    loadingSymbols.value.add(symbolId)
    errors.value.delete(symbolId)

    try {
      const url = `${baseUrl}/api/indicators/${symbolId}`
      const { data: response } = await axios.get<ApiResponse<SymbolIndicators>>(url)

      if (response.success) {
        indicatorsCache.value.set(symbolId, response.data)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch indicators')
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch indicators'
      errors.value.set(symbolId, errorMsg)
      console.error(`Error fetching indicators for symbol ${symbolId}:`, err)
      return null
    } finally {
      loadingSymbols.value.delete(symbolId)
    }
  }

  // Fetch indicators for multiple symbols
  async function fetchMultipleIndicators(symbolIds: number[]): Promise<void> {
    await Promise.all(symbolIds.map(id => fetchIndicators(id)))
  }

  // Clear cache
  function clearCache(symbolId?: number) {
    if (symbolId !== undefined) {
      indicatorsCache.value.delete(symbolId)
      errors.value.delete(symbolId)
    } else {
      indicatorsCache.value.clear()
      errors.value.clear()
    }
  }

  // Computed
  const hasAnyLoading = computed(() => loadingSymbols.value.size > 0)

  return {
    // State
    indicatorsCache: readonly(indicatorsCache),

    // Computed
    hasAnyLoading,

    // Actions
    fetchIndicators,
    fetchMultipleIndicators,
    isLoadingSymbol,
    getCachedIndicators,
    getError,
    clearCache
  }
}
