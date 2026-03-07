import axios from 'axios'
import type { ValidationData, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับจัดการ ProIndicator Validation (Layer 3)
 * เรียก API: GET /api/validation/:symbolId
 *
 * Shared singleton — module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const validationCache = ref<Map<number, ValidationData>>(new Map())
const loadingSymbols = ref<Set<number>>(new Set())
const errors = ref<Map<number, string>>(new Map())

export function useValidation() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /** Check if loading specific symbol */
  function isLoadingSymbol(symbolId: number): boolean {
    return loadingSymbols.value.has(symbolId)
  }

  /** Get cached validation */
  function getCachedValidation(symbolId: number): ValidationData | undefined {
    return validationCache.value.get(symbolId)
  }

  /** Get error for symbol */
  function getError(symbolId: number): string | undefined {
    return errors.value.get(symbolId)
  }

  /**
   * Fetch validation for a symbol
   * GET /api/validation/:symbolId
   */
  async function fetchValidation(
    symbolId: number,
    timeframe: string = '15m',
    forceRefresh = false,
  ): Promise<ValidationData | null> {
    // Return cached if available and not forcing refresh
    if (!forceRefresh && validationCache.value.has(symbolId)) {
      return validationCache.value.get(symbolId) || null
    }

    // Prevent duplicate concurrent requests
    if (loadingSymbols.value.has(symbolId)) {
      return validationCache.value.get(symbolId) ?? null
    }

    loadingSymbols.value.add(symbolId)
    errors.value.delete(symbolId)

    try {
      const url = `${baseUrl}/api/validation/${symbolId}?timeframe=${timeframe}`
      const { data: response } = await axios.get<ApiResponse<ValidationData>>(url)

      if (response.success) {
        validationCache.value.set(symbolId, response.data)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch validation')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch validation'
      errors.value.set(symbolId, errorMsg)
      return null
    } finally {
      loadingSymbols.value.delete(symbolId)
    }
  }

  /** Fetch validation for multiple symbols */
  async function fetchMultipleValidation(symbolIds: number[], timeframe: string = '15m'): Promise<void> {
    await Promise.all(symbolIds.map(id => fetchValidation(id, timeframe)))
  }

  /** Clear cache */
  function clearCache(symbolId?: number) {
    if (symbolId !== undefined) {
      validationCache.value.delete(symbolId)
      errors.value.delete(symbolId)
    } else {
      validationCache.value.clear()
      errors.value.clear()
    }
  }

  const hasAnyLoading = computed(() => loadingSymbols.value.size > 0)

  return {
    // State
    validationCache: readonly(validationCache),

    // Computed
    hasAnyLoading,

    // Actions
    fetchValidation,
    fetchMultipleValidation,
    isLoadingSymbol,
    getCachedValidation,
    getError,
    clearCache,
  }
}
