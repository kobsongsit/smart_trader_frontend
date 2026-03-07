import axios from 'axios'
import type { LatestPriceData, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ Latest Price API
 * GET /api/data/:symbolId/price (~3ms)
 *
 * Shared singleton — module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const priceCache = ref<Map<number, LatestPriceData>>(new Map())
const loadingSymbols = ref<Set<number>>(new Set())
const errors = ref<Map<number, string>>(new Map())

export function usePrice() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /** Check if loading specific symbol */
  function isLoadingPrice(symbolId: number): boolean {
    return loadingSymbols.value.has(symbolId)
  }

  /** Get cached price data */
  function getCachedPrice(symbolId: number): LatestPriceData | undefined {
    return priceCache.value.get(symbolId)
  }

  /** Get error for symbol */
  function getPriceError(symbolId: number): string | undefined {
    return errors.value.get(symbolId)
  }

  /**
   * Fetch latest price for a symbol
   * GET /api/data/:symbolId/price
   */
  async function fetchPrice(symbolId: number, forceRefresh = false): Promise<LatestPriceData | null> {
    // Return cached if available and not forcing refresh
    if (!forceRefresh && priceCache.value.has(symbolId)) {
      return priceCache.value.get(symbolId) || null
    }

    // Prevent duplicate concurrent requests
    if (loadingSymbols.value.has(symbolId)) {
      return priceCache.value.get(symbolId) ?? null
    }

    loadingSymbols.value.add(symbolId)
    errors.value.delete(symbolId)

    try {
      const url = `${baseUrl}/api/data/${symbolId}/price`
      const { data: response } = await axios.get<ApiResponse<LatestPriceData>>(url)

      if (response.success && response.data) {
        priceCache.value.set(symbolId, response.data)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch price')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch price'
      errors.value.set(symbolId, errorMsg)
      return null
    } finally {
      loadingSymbols.value.delete(symbolId)
    }
  }

  /** Clear cache for a specific symbol or everything */
  function clearPriceCache(symbolId?: number) {
    if (symbolId !== undefined) {
      priceCache.value.delete(symbolId)
      errors.value.delete(symbolId)
    } else {
      priceCache.value.clear()
      errors.value.clear()
    }
  }

  const hasAnyLoading = computed(() => loadingSymbols.value.size > 0)

  return {
    // State
    priceCache: readonly(priceCache),

    // Computed
    hasAnyLoading,

    // Actions
    fetchPrice,
    isLoadingPrice,
    getCachedPrice,
    getPriceError,
    clearPriceCache,
  }
}
