import axios from 'axios'
import type { ClosedTrade, TradeHistoryPagination, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ Position History บน Dashboard
 *
 * Non-singleton (factory function) — ไม่ share state กับ useTradeHistory ใน history page
 * Fetch จาก GET /api/strategy/history?limit=10&page=N
 */

interface PositionHistoryResponse {
  trades: ClosedTrade[]
  pagination: TradeHistoryPagination
}

export function usePositionHistory() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // ── State ──────────────────────────────────────────────────
  const trades = ref<ClosedTrade[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(0)
  const hasMore = ref(false)

  // ── Fetch first page ────────────────────────────────────────
  async function fetchHistory(): Promise<void> {
    loading.value = true
    error.value = null
    trades.value = []
    currentPage.value = 0
    hasMore.value = false

    try {
      const url = `${baseUrl}/api/strategy/history?limit=5&page=1`
      const { data: response } = await axios.get<ApiResponse<PositionHistoryResponse>>(url)

      if (response.success) {
        trades.value = response.data.trades
        currentPage.value = 1
        hasMore.value = response.data.pagination.hasMore
      } else {
        throw new Error(response.error || 'Failed to load position history')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to load position history'
    } finally {
      loading.value = false
    }
  }

  // ── Load more (append) ──────────────────────────────────────
  async function loadMore(): Promise<void> {
    if (!hasMore.value || loadingMore.value) return

    loadingMore.value = true

    try {
      const nextPage = currentPage.value + 1
      const url = `${baseUrl}/api/strategy/history?limit=10&page=${nextPage}`
      const { data: response } = await axios.get<ApiResponse<PositionHistoryResponse>>(url)

      if (response.success) {
        trades.value = [...trades.value, ...response.data.trades]
        currentPage.value = nextPage
        hasMore.value = response.data.pagination.hasMore
      } else {
        throw new Error(response.error || 'Failed to load more')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to load more'
    } finally {
      loadingMore.value = false
    }
  }

  return {
    trades: readonly(trades),
    loading: readonly(loading),
    loadingMore: readonly(loadingMore),
    error: readonly(error),
    hasMore: readonly(hasMore),
    fetchHistory,
    loadMore,
  }
}
