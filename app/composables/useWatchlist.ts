import axios from 'axios'
import type { WatchlistItem, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับจัดการ Watchlist
 *
 * Features:
 * - Fetch user's watchlist (GET /api/watchlist)
 * - Add symbol to watchlist (POST /api/watchlist)
 * - Remove symbol from watchlist (DELETE /api/watchlist/:symbolId)
 * - Quick lookup via watchlistSymbolIds computed Set
 *
 * ⚠️ Shared singleton — ทุก component ที่เรียก useWatchlist() จะใช้ state เดียวกัน
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const watchlist = ref<WatchlistItem[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useWatchlist() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // ── Quick lookup: Set of symbolIds currently in watchlist ──
  const watchlistSymbolIds = computed<Set<number>>(() => {
    return new Set(watchlist.value.map((item) => item.symbolId))
  })

  /**
   * Check if a symbol is in the watchlist
   */
  function isInWatchlist(symbolId: number): boolean {
    return watchlistSymbolIds.value.has(symbolId)
  }

  /**
   * GET /api/watchlist
   * Fetch user's active watchlist items
   */
  async function fetchWatchlist(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const { data: response } = await axios.get<ApiResponse<WatchlistItem[]>>(
        `${baseUrl}/api/watchlist`,
      )

      if (response.success) {
        watchlist.value = response.data
      } else {
        throw new Error(response.error || 'Failed to fetch watchlist')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || err.message || 'Failed to fetch watchlist'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * POST /api/watchlist
   * Add a symbol to watchlist
   */
  async function addToWatchlist(
    symbolId: number,
    options?: { priority?: number; notes?: string },
  ): Promise<boolean> {
    try {
      const { data: response } = await axios.post<ApiResponse<WatchlistItem>>(
        `${baseUrl}/api/watchlist`,
        {
          symbolId,
          priority: options?.priority,
          notes: options?.notes,
        },
      )

      if (response.success) {
        // Add to local state immediately (optimistic)
        watchlist.value.push(response.data)
        return true
      }
      return false
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || err.message || 'Failed to add to watchlist'
      error.value = msg
      return false
    }
  }

  /**
   * DELETE /api/watchlist/:symbolId
   * Remove a symbol from watchlist (soft delete — isActive: false)
   */
  async function removeFromWatchlist(symbolId: number): Promise<boolean> {
    try {
      const { data: response } = await axios.delete<ApiResponse<null>>(
        `${baseUrl}/api/watchlist/${symbolId}`,
      )

      if (response.success) {
        // Remove from local state immediately (optimistic)
        watchlist.value = watchlist.value.filter((item) => item.symbolId !== symbolId)
        return true
      }
      return false
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || err.message || 'Failed to remove from watchlist'
      error.value = msg
      return false
    }
  }

  /**
   * Toggle watchlist — add if not in, remove if already in
   * Returns the new state: true = now in watchlist, false = now removed
   */
  async function toggleWatchlist(symbolId: number): Promise<boolean> {
    if (isInWatchlist(symbolId)) {
      await removeFromWatchlist(symbolId)
      return false
    } else {
      await addToWatchlist(symbolId)
      return true
    }
  }

  return {
    // State
    watchlist: readonly(watchlist),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    watchlistSymbolIds,

    // Actions
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
  }
}
