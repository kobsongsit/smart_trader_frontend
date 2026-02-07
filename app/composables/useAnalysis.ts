import { ref, computed, readonly } from 'vue'
import axios from 'axios'
import type { AnalysisData, ApiResponse, SignalData, SymbolSummary, SummaryResponse, TimestampCheckResponse } from '../../types/trading'

/**
 * Composable สำหรับ Analysis API + WebSocket integration
 *
 * APIs:
 * - GET /api/analysis/summary     → ข้อมูลสรุปทุก symbol (เรียกครั้งเดียว)
 * - GET /api/analysis/:symbolId   → full analysis สำหรับ detail (lazy load)
 * - GET /api/analysis/timestamps  → lightweight timestamp check (cache freshness)
 * - POST /api/signals/analyze     → request AI signal analysis
 * - GET /api/signals/:symbolId    → signal history
 *
 * WebSocket events ที่ listen:
 * - signal:loading → set AI analyzing state for symbolId
 * - analysis:full  → update analysisCache with fresh data
 * - signal:new     → update signal in cache
 *
 * ⚠️ Shared singleton — ทุก component ที่เรียก useAnalysis() จะใช้ state/cache เดียวกัน
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

// Summary data (GET /api/analysis/summary)
const summaryList = ref<SymbolSummary[]>([])
const summaryLoading = ref(false)
const summaryError = ref<string | null>(null)
const summaryLastRefresh = ref<string | null>(null)

// Full analysis cache per symbol (GET /api/analysis/:symbolId)
const analysisCache = ref<Map<number, AnalysisData>>(new Map())
const loadingSymbols = ref<Set<number>>(new Set())
const errors = ref<Map<number, string>>(new Map())
const isAnalyzing = ref(false)
const analyzeError = ref<string | null>(null)

// AI analyzing state per symbol (set by WebSocket signal:loading)
const aiAnalyzingSymbols = ref<Set<number>>(new Set())

// Track whether WebSocket listeners have been registered
let wsListenersRegistered = false

export function useAnalysis() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // ─── Register WebSocket listeners (once) ───
  if (!wsListenersRegistered) {
    wsListenersRegistered = true

    // Use try-catch because useSocket might not be available in SSR
    try {
      const { onSignalLoading, onAnalysisFull, onSignalNew } = useSocket()

      onSignalLoading((data) => {
        aiAnalyzingSymbols.value.add(data.symbolId)
      })

      onAnalysisFull((data) => {
        if (data.success && data.data) {
          const symbolId = data.data.symbol?.id
          if (symbolId) {
            analysisCache.value.set(symbolId, data.data)
            aiAnalyzingSymbols.value.delete(symbolId)
            errors.value.delete(symbolId)
          }
        }
      })

      onSignalNew((data) => {
        if (data.symbolId && data.signal) {
          const cached = analysisCache.value.get(data.symbolId)
          if (cached) {
            cached.signal = data.signal
          }
          aiAnalyzingSymbols.value.delete(data.symbolId)
        }
      })
    } catch {
      // WebSocket not available (e.g., SSR) — that's okay
      console.warn('[useAnalysis] WebSocket listeners not registered (SSR or useSocket unavailable)')
    }
  }

  // ============================================================
  // Summary API (GET /api/analysis/summary)
  // ============================================================

  /**
   * Fetch summary for all active symbols — 1 request for the entire list
   * (Legacy: ใช้ได้ถ้าต้องการดึงทั้งหมดในครั้งเดียว)
   */
  async function fetchSummary(options?: { forceRefresh?: boolean }): Promise<SymbolSummary[]> {
    const { forceRefresh = false } = options || {}

    // Return cached if available and not forcing refresh
    if (!forceRefresh && summaryList.value.length > 0) {
      return summaryList.value
    }

    // Skip if already loading
    if (summaryLoading.value) return summaryList.value

    summaryLoading.value = true
    summaryError.value = null

    try {
      const url = `${baseUrl}/api/analysis/summary`
      const { data: response } = await axios.get<ApiResponse<SummaryResponse>>(url)

      if (response.success) {
        summaryList.value = response.data.symbols
        summaryLastRefresh.value = response.data.lastRefresh
        return response.data.symbols
      } else {
        throw new Error(response.error || 'Failed to fetch summary')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch summary'
      summaryError.value = errorMsg
      console.error('[useAnalysis] Error fetching summary:', err)
      return []
    } finally {
      summaryLoading.value = false
    }
  }

  /**
   * Fetch summary for a single symbol (Progressive Loading)
   * GET /api/analysis/summary?symbolId=X
   *
   * เรียกทีละ symbol แล้วเติมลงใน summaryList ทันที
   * UI จะ reactive update เพราะ summaryList เป็น ref
   */
  async function fetchSymbolSummary(symbolId: number): Promise<SymbolSummary | null> {
    try {
      const url = `${baseUrl}/api/analysis/summary?symbolId=${symbolId}`
      const { data: response } = await axios.get<ApiResponse<SummaryResponse>>(url)

      if (response.success && response.data.symbols.length > 0) {
        const summary = response.data.symbols[0] as SymbolSummary

        // Upsert into summaryList — replace if exists, push if new
        const idx = summaryList.value.findIndex(s => s.id === symbolId)
        if (idx >= 0) {
          summaryList.value.splice(idx, 1, summary)
        } else {
          summaryList.value.push(summary)
        }

        // Update lastRefresh
        summaryLastRefresh.value = response.data.lastRefresh

        return summary
      }
      return null
    } catch (err: any) {
      console.error(`[useAnalysis] Error fetching summary for symbol ${symbolId}:`, err)
      return null
    }
  }

  /**
   * Get cached summary for a specific symbol
   */
  function getCachedSummary(symbolId: number): SymbolSummary | undefined {
    return summaryList.value.find(s => s.id === symbolId)
  }

  // ============================================================
  // Full Analysis API (GET /api/analysis/:symbolId) — lazy load
  // ============================================================

  /**
   * Check if loading specific symbol (HTTP request)
   */
  function isLoadingSymbol(symbolId: number): boolean {
    return loadingSymbols.value.has(symbolId)
  }

  /**
   * Check if AI is analyzing specific symbol (WebSocket)
   */
  function isAIAnalyzing(symbolId: number): boolean {
    return aiAnalyzingSymbols.value.has(symbolId)
  }

  /**
   * Get cached full analysis data
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
   * Fetch full analysis for a symbol (used when expanding detail)
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

    // Mark as AI analyzing immediately (don't wait for WebSocket)
    aiAnalyzingSymbols.value.add(symbolId)

    try {
      const url = `${baseUrl}/api/signals/analyze`
      const { data: response } = await axios.post<ApiResponse<SignalData>>(url, {
        symbolId,
        includeNews
      })

      if (response.success) {
        // Update signal in cache only if backend returns actual data
        // (avoid overwriting existing signal with null)
        if (response.data) {
          const cached = analysisCache.value.get(symbolId)
          if (cached) {
            cached.signal = response.data
          }
        }
        // Always clear loading state — if WebSocket sends update later, it will update cache reactively
        aiAnalyzingSymbols.value.delete(symbolId)
        return response.data
      } else {
        throw new Error(response.error || 'Failed to analyze signal')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to analyze signal'
      analyzeError.value = errorMsg
      console.error('Error analyzing signal:', err)
      aiAnalyzingSymbols.value.delete(symbolId)
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

  // ============================================================
  // Cache Freshness Check (GET /api/analysis/timestamps)
  // ============================================================

  /**
   * ตรวจสอบ data freshness ของ 1 symbol
   * เปรียบเทียบ cached meta.timestamp กับ backend timestamp
   * ถ้า backend ใหม่กว่า → auto re-fetch analysis + summary
   *
   * @returns true ถ้ามีการ refresh, false ถ้า data ยัง fresh
   */
  async function checkFreshness(symbolId: number): Promise<boolean> {
    try {
      const url = `${baseUrl}/api/analysis/timestamps?symbolIds=${symbolId}`
      const { data: response } = await axios.get<ApiResponse<TimestampCheckResponse>>(url)

      if (!response.success || !response.data.symbols?.length) {
        return false
      }

      const serverTs = response.data.symbols[0]
      if (!serverTs) return false

      // เปรียบเทียบกับ cached timestamp
      const cached = analysisCache.value.get(symbolId)
      const cachedTimestamp = cached?.meta?.timestamp

      // ถ้าไม่มี cache → ต้อง fetch ใหม่
      // ถ้ามี cache แต่ server timestamp ใหม่กว่า → re-fetch
      const serverLatest = serverTs.timestamps.price // ใช้ price timestamp เป็นตัวอ้างอิงหลัก
      const needsRefresh = !cachedTimestamp || new Date(serverLatest) > new Date(cachedTimestamp)

      if (needsRefresh) {
        console.log(`[useAnalysis] Data stale for symbol ${symbolId}, refreshing...`)
        // Re-fetch ทั้ง analysis และ summary พร้อมกัน
        await Promise.all([
          fetchAnalysis(symbolId, { forceRefresh: true }),
          fetchSymbolSummary(symbolId),
        ])
        return true
      }

      return false
    } catch (err: any) {
      // Fail silently — ใช้ cached data ต่อไป ไม่ block UI
      console.warn(`[useAnalysis] Freshness check failed for symbol ${symbolId}:`, err.message)
      return false
    }
  }

  /**
   * ตรวจสอบ data freshness แบบ batch (หลาย symbol พร้อมกัน)
   * เหมาะสำหรับ list page — เช็คทีเดียวหลาย symbol
   *
   * @returns list ของ symbolIds ที่ถูก refresh
   */
  async function checkFreshnessBatch(symbolIds: number[]): Promise<number[]> {
    if (symbolIds.length === 0) return []

    try {
      const idsParam = symbolIds.join(',')
      const url = `${baseUrl}/api/analysis/timestamps?symbolIds=${idsParam}`
      const { data: response } = await axios.get<ApiResponse<TimestampCheckResponse>>(url)

      if (!response.success || !response.data.symbols?.length) {
        return []
      }

      const refreshedIds: number[] = []
      const refreshPromises: Promise<any>[] = []

      for (const serverTs of response.data.symbols) {
        const cached = analysisCache.value.get(serverTs.symbolId)
        const cachedTimestamp = cached?.meta?.timestamp
        const serverLatest = serverTs.timestamps.price

        const needsRefresh = !cachedTimestamp || new Date(serverLatest) > new Date(cachedTimestamp)

        if (needsRefresh) {
          refreshedIds.push(serverTs.symbolId)
          refreshPromises.push(
            fetchAnalysis(serverTs.symbolId, { forceRefresh: true }),
            fetchSymbolSummary(serverTs.symbolId),
          )
        }
      }

      if (refreshPromises.length > 0) {
        console.log(`[useAnalysis] Refreshing ${refreshedIds.length} stale symbols:`, refreshedIds)
        await Promise.allSettled(refreshPromises)
      }

      return refreshedIds
    } catch (err: any) {
      console.warn('[useAnalysis] Batch freshness check failed:', err.message)
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
   * Clear all caches
   */
  function clearCache(symbolId?: number) {
    if (symbolId !== undefined) {
      analysisCache.value.delete(symbolId)
      errors.value.delete(symbolId)
    } else {
      analysisCache.value.clear()
      errors.value.clear()
      summaryList.value = []
      summaryLastRefresh.value = null
    }
  }

  // Computed
  const hasAnyLoading = computed(() => loadingSymbols.value.size > 0)
  const hasAnyAIAnalyzing = computed(() => aiAnalyzingSymbols.value.size > 0)

  return {
    // Summary state
    summaryList: readonly(summaryList),
    summaryLoading: readonly(summaryLoading),
    summaryError: readonly(summaryError),
    summaryLastRefresh: readonly(summaryLastRefresh),

    // Analysis state
    analysisCache: readonly(analysisCache),
    isAnalyzing: readonly(isAnalyzing),
    analyzeError: readonly(analyzeError),

    // Computed
    hasAnyLoading,
    hasAnyAIAnalyzing,

    // Summary actions
    fetchSummary,
    fetchSymbolSummary,
    getCachedSummary,

    // Analysis actions
    fetchAnalysis,
    analyzeSignal,
    fetchSignalHistory,
    isLoadingSymbol,
    isAIAnalyzing,
    getCachedAnalysis,
    getError,
    updateCacheSection,
    clearCache,

    // Freshness check
    checkFreshness,
    checkFreshnessBatch
  }
}
