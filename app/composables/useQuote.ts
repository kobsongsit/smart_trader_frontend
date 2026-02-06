import axios from 'axios'
import type { ApiResponse } from '../../types/trading'

/**
 * Quote data interface
 */
export interface Quote {
  symbolId: number
  symbol: string
  price: number
  change: number
  changePercent: number
  high24h: number
  low24h: number
  volume24h: number
  timestamp: string
}

/**
 * Composable สำหรับจัดการ Quote (ราคาล่าสุด)
 */
export function useQuote() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // State - cache quotes by symbolId
  const quotesCache = ref<Map<number, Quote>>(new Map())
  const loadingSymbols = ref<Set<number>>(new Set())
  const errors = ref<Map<number, string>>(new Map())

  /**
   * Check if loading specific symbol
   */
  function isLoadingSymbol(symbolId: number): boolean {
    return loadingSymbols.value.has(symbolId)
  }

  /**
   * Get cached quote
   */
  function getCachedQuote(symbolId: number): Quote | undefined {
    return quotesCache.value.get(symbolId)
  }

  /**
   * Get error for symbol
   */
  function getError(symbolId: number): string | undefined {
    return errors.value.get(symbolId)
  }

  /**
   * Fetch quote for a symbol
   * GET /api/data/:symbolId/quote
   */
  async function fetchQuote(symbolId: number, forceRefresh = false): Promise<Quote | null> {
    // Return cached if available and not forcing refresh
    if (!forceRefresh && quotesCache.value.has(symbolId)) {
      return quotesCache.value.get(symbolId) || null
    }

    // Mark as loading
    loadingSymbols.value.add(symbolId)
    errors.value.delete(symbolId)

    try {
      const url = `${baseUrl}/api/data/${symbolId}/quote`
      const { data: response } = await axios.get<ApiResponse<Quote>>(url)

      if (response.success) {
        quotesCache.value.set(symbolId, response.data)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch quote')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch quote'
      errors.value.set(symbolId, errorMsg)
      console.error(`Error fetching quote for symbol ${symbolId}:`, err)
      return null
    } finally {
      loadingSymbols.value.delete(symbolId)
    }
  }

  /**
   * Fetch quotes for multiple symbols
   */
  async function fetchMultipleQuotes(symbolIds: number[]): Promise<void> {
    await Promise.all(symbolIds.map(id => fetchQuote(id)))
  }

  /**
   * Clear cache
   */
  function clearCache(symbolId?: number) {
    if (symbolId !== undefined) {
      quotesCache.value.delete(symbolId)
      errors.value.delete(symbolId)
    } else {
      quotesCache.value.clear()
      errors.value.clear()
    }
  }

  // Computed
  const hasAnyLoading = computed(() => loadingSymbols.value.size > 0)

  return {
    // State
    quotesCache: readonly(quotesCache),

    // Computed
    hasAnyLoading,

    // Actions
    fetchQuote,
    fetchMultipleQuotes,
    isLoadingSymbol,
    getCachedQuote,
    getError,
    clearCache
  }
}
