import { ref, computed, readonly } from 'vue'
import axios from 'axios'
import type { AnalysisData, ApiResponse, SignalData } from '../../types/trading'

/**
 * Composable สำหรับ Unified Analysis API
 * เรียก GET /api/analysis/:symbolId
 * รวมทุกอย่าง: price, indicators, trends, validation, signal, news, meta
 *
 * Frontend ไม่ต้องคำนวณอะไรเพิ่ม - แสดงผลอย่างเดียว
 *
 * ⚠️ Shared singleton — ทุก component ที่เรียก useAnalysis() จะใช้ state/cache เดียวกัน
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================
const analysisCache = ref<Map<number, AnalysisData>>(new Map())
const loadingSymbols = ref<Set<number>>(new Set())
const errors = ref<Map<number, string>>(new Map())
const isAnalyzing = ref(false)
const analyzeError = ref<string | null>(null)

export function useAnalysis() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Check if loading specific symbol
   */
  function isLoadingSymbol(symbolId: number): boolean {
    return loadingSymbols.value.has(symbolId)
  }

  /**
   * Get cached analysis data
   */
  function getCachedAnalysis(symbolId: number): AnalysisData | undefined {
    return analysisCache.value.get(symbolId)
  }

  /**
   * Get error for symbol
   */
  function getError(symbolId: number): string | undefined {
    return errors.value.get(symbolId)
  }

  /**
   * Fetch full analysis for a symbol
   * GET /api/analysis/:symbolId?includeNews=true
   */
  async function fetchAnalysis(
    symbolId: number,
    options?: { includeNews?: boolean; forceRefresh?: boolean }
  ): Promise<AnalysisData | null> {
    const { includeNews = false, forceRefresh = false } = options || {}

    // Return cached if available and not forcing refresh
    if (!forceRefresh && analysisCache.value.has(symbolId)) {
      return analysisCache.value.get(symbolId) || null
    }

    // Skip if already loading this symbol
    if (loadingSymbols.value.has(symbolId)) {
      return null
    }

    // Mark as loading
    loadingSymbols.value.add(symbolId)
    errors.value.delete(symbolId)

    try {
      const params = new URLSearchParams()
      if (includeNews) params.append('includeNews', 'true')

      const queryString = params.toString()
      const url = `${baseUrl}/api/analysis/${symbolId}${queryString ? '?' + queryString : ''}`
      const { data: response } = await axios.get<ApiResponse<AnalysisData>>(url)

      if (response.success) {
        analysisCache.value.set(symbolId, response.data)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch analysis')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch analysis'
      errors.value.set(symbolId, errorMsg)
      console.error(`Error fetching analysis for symbol ${symbolId}:`, err)
      return null
    } finally {
      loadingSymbols.value.delete(symbolId)
    }
  }

  /**
   * Request AI Signal Analysis
   * POST /api/signals/analyze
   */
  async function analyzeSignal(
    symbolId: number,
    includeNews = false
  ): Promise<SignalData | null> {
    isAnalyzing.value = true
    analyzeError.value = null

    try {
      const url = `${baseUrl}/api/signals/analyze`
      const { data: response } = await axios.post<ApiResponse<SignalData>>(url, {
        symbolId,
        includeNews
      })

      if (response.success) {
        // Update signal in cached analysis data
        const cached = analysisCache.value.get(symbolId)
        if (cached) {
          cached.signal = response.data
        }
        return response.data
      } else {
        throw new Error(response.error || 'Failed to analyze signal')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to analyze signal'
      analyzeError.value = errorMsg
      console.error('Error analyzing signal:', err)
      return null
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * Fetch signal history for a symbol
   * GET /api/signals/:symbolId?limit=N
   */
  async function fetchSignalHistory(
    symbolId: number,
    limit = 10
  ): Promise<SignalData[]> {
    try {
      const url = `${baseUrl}/api/signals/${symbolId}?limit=${limit}`
      const { data: response } = await axios.get<ApiResponse<SignalData[]>>(url)

      if (response.success) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch signal history')
      }
    } catch (err: any) {
      console.error('Error fetching signal history:', err)
      return []
    }
  }

  /**
   * Update a specific section in cache (for WebSocket partial updates)
   */
  function updateCacheSection<K extends keyof AnalysisData>(
    symbolId: number,
    section: K,
    data: AnalysisData[K]
  ) {
    const cached = analysisCache.value.get(symbolId)
    if (cached) {
      cached[section] = data
    }
  }

  /**
   * Clear cache
   */
  function clearCache(symbolId?: number) {
    if (symbolId !== undefined) {
      analysisCache.value.delete(symbolId)
      errors.value.delete(symbolId)
    } else {
      analysisCache.value.clear()
      errors.value.clear()
    }
  }

  // Computed
  const hasAnyLoading = computed(() => loadingSymbols.value.size > 0)

  return {
    // State
    analysisCache: readonly(analysisCache),
    isAnalyzing: readonly(isAnalyzing),
    analyzeError: readonly(analyzeError),

    // Computed
    hasAnyLoading,

    // Actions
    fetchAnalysis,
    analyzeSignal,
    fetchSignalHistory,
    isLoadingSymbol,
    getCachedAnalysis,
    getError,
    updateCacheSection,
    clearCache
  }
}
