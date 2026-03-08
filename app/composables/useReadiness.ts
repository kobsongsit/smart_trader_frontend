import axios from 'axios'
import type {
  ApiResponse,
  ReadinessData,
  ReadinessResponse,
  ReadinessHistoryItem,
  ReadinessHistoryResponse,
} from '../../types/trading'

/**
 * Composable for Signal Readiness Engine API
 *
 * APIs:
 * - GET  /api/readiness/:symbolId           -> Latest readiness result
 * - GET  /api/readiness/:symbolId/history   -> Score history
 * - POST /api/readiness/:symbolId/evaluate  -> Manual trigger (debug)
 *
 * Real-time updates via WebSocket `readiness:update` event
 * (replaces previous HTTP polling every 60s)
 *
 * Shared singleton -- module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const readinessCache = ref<Map<number, ReadinessData>>(new Map())
const historyCache = ref<Map<number, ReadinessHistoryItem[]>>(new Map())
const loadingSymbols = ref<Set<number>>(new Set())
const historyLoading = ref<Set<number>>(new Set())
const errors = ref<Map<number, string>>(new Map())

// Track whether WebSocket listener has been registered
let wsListenerRegistered = false

export function useReadiness() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // ─── Register WebSocket listener (once, client-only) ───
  if (import.meta.client && !wsListenerRegistered) {
    wsListenerRegistered = true

    try {
      const { onReadinessUpdate } = useSocket()

      onReadinessUpdate((data) => {
        if (data.symbolId && data.readiness) {
          // Update cache directly with inline data (no re-fetch needed)
          readinessCache.value.set(data.symbolId, data.readiness as ReadinessData)
          errors.value.delete(data.symbolId)
        }
      })
    } catch {
      // Registration failed — allow retry on next call
      wsListenerRegistered = false
    }
  }

  // ─── Loading helpers ───

  function isLoadingReadiness(symbolId: number): boolean {
    return loadingSymbols.value.has(symbolId)
  }

  function isLoadingHistory(symbolId: number): boolean {
    return historyLoading.value.has(symbolId)
  }

  // ─── Cache helpers ───

  function getCachedReadiness(symbolId: number): ReadinessData | undefined {
    return readinessCache.value.get(symbolId)
  }

  function getCachedHistory(symbolId: number): ReadinessHistoryItem[] {
    return historyCache.value.get(symbolId) ?? []
  }

  function getReadinessError(symbolId: number): string | undefined {
    return errors.value.get(symbolId)
  }

  // ─── Fetch latest readiness ───

  async function fetchReadiness(
    symbolId: number,
    forceRefresh = false,
  ): Promise<ReadinessData | null> {
    if (!forceRefresh && readinessCache.value.has(symbolId)) {
      return readinessCache.value.get(symbolId) || null
    }

    if (loadingSymbols.value.has(symbolId)) {
      return readinessCache.value.get(symbolId) ?? null
    }

    loadingSymbols.value.add(symbolId)
    errors.value.delete(symbolId)

    try {
      const url = `${baseUrl}/api/readiness/${symbolId}`
      const { data: response } = await axios.get<ApiResponse<ReadinessResponse>>(url)

      if (response.success && response.data?.readiness) {
        readinessCache.value.set(symbolId, response.data.readiness)
        return response.data.readiness
      } else {
        throw new Error(response.error || 'Failed to fetch readiness')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch readiness'
      errors.value.set(symbolId, errorMsg)
      return null
    } finally {
      loadingSymbols.value.delete(symbolId)
    }
  }

  // ─── Fetch readiness history ───

  async function fetchReadinessHistory(
    symbolId: number,
    limit = 60,
  ): Promise<ReadinessHistoryItem[]> {
    if (historyLoading.value.has(symbolId)) {
      return historyCache.value.get(symbolId) ?? []
    }

    historyLoading.value.add(symbolId)

    try {
      const url = `${baseUrl}/api/readiness/${symbolId}/history?limit=${limit}`
      const { data: response } = await axios.get<ApiResponse<ReadinessHistoryResponse>>(url)

      if (response.success && response.data?.history) {
        historyCache.value.set(symbolId, response.data.history)
        return response.data.history
      } else {
        throw new Error(response.error || 'Failed to fetch readiness history')
      }
    } catch (err: any) {
      // Fail silently -- history is non-critical
      return []
    } finally {
      historyLoading.value.delete(symbolId)
    }
  }

  // ─── Manual trigger (debug) ───

  async function triggerEvaluate(symbolId: number): Promise<ReadinessData | null> {
    loadingSymbols.value.add(symbolId)
    errors.value.delete(symbolId)

    try {
      const url = `${baseUrl}/api/readiness/${symbolId}/evaluate`
      const { data: response } = await axios.post<ApiResponse<ReadinessResponse>>(url)

      if (response.success && response.data?.readiness) {
        readinessCache.value.set(symbolId, response.data.readiness)
        return response.data.readiness
      } else {
        throw new Error(response.error || 'Failed to trigger readiness evaluation')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to evaluate readiness'
      errors.value.set(symbolId, errorMsg)
      return null
    } finally {
      loadingSymbols.value.delete(symbolId)
    }
  }

  // ─── Cache cleanup ───

  function clearReadinessCache(symbolId?: number) {
    if (symbolId !== undefined) {
      readinessCache.value.delete(symbolId)
      historyCache.value.delete(symbolId)
      errors.value.delete(symbolId)
    } else {
      readinessCache.value.clear()
      historyCache.value.clear()
      errors.value.clear()
    }
  }

  return {
    // State (readonly)
    readinessCache: readonly(readinessCache),
    historyCache: readonly(historyCache),

    // Actions
    fetchReadiness,
    fetchReadinessHistory,
    triggerEvaluate,

    // Loading
    isLoadingReadiness,
    isLoadingHistory,

    // Cache
    getCachedReadiness,
    getCachedHistory,
    getReadinessError,
    clearReadinessCache,
  }
}
