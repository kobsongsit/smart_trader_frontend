import axios from 'axios'
import type { TradeHistoryData, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ Trade History
 *
 * Fetch data จาก GET /api/strategy/history
 * Shared singleton — module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const data = ref<TradeHistoryData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Filter state
const filters = ref({
  symbol: '' as string,
  interval: '' as string,
  month: '' as string,
  year: '' as string,
  result: '' as string,
  exitReason: '' as string,
  sort: 'newest' as string,
  page: 1,
  limit: 20,
})

export function useTradeHistory() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Build query string from current filters
   */
  function buildQueryParams(overrides?: Partial<typeof filters.value>): string {
    const f = { ...filters.value, ...overrides }
    const params = new URLSearchParams()

    if (f.symbol) params.set('symbol', f.symbol)
    if (f.interval) params.set('interval', f.interval)
    if (f.month) params.set('month', f.month)
    if (f.year) params.set('year', f.year)
    if (f.result) params.set('result', f.result)
    if (f.exitReason) params.set('exitReason', f.exitReason)
    if (f.sort) params.set('sort', f.sort)
    params.set('page', String(f.page))
    params.set('limit', String(f.limit))

    return params.toString()
  }

  /**
   * Fetch trade history with current filters
   * GET /api/strategy/history?...query params
   */
  async function fetchHistory(filterOverrides?: Partial<typeof filters.value>): Promise<TradeHistoryData | null> {
    // Apply overrides to filters if provided
    if (filterOverrides) {
      Object.assign(filters.value, filterOverrides)
    }

    loading.value = true
    error.value = null

    try {
      const qs = buildQueryParams()
      const url = `${baseUrl}/api/strategy/history?${qs}`
      const { data: response } = await axios.get<ApiResponse<TradeHistoryData>>(url)

      if (response.success) {
        data.value = response.data
        return response.data
      } else {
        throw new Error(response.error || 'Failed to load trade history')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load trade history'
      error.value = errorMsg
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Load more trades — increment page and append to existing trades
   */
  async function loadMore(): Promise<void> {
    if (!data.value?.pagination.hasMore) return

    const nextPage = filters.value.page + 1
    filters.value.page = nextPage

    try {
      const qs = buildQueryParams()
      const url = `${baseUrl}/api/strategy/history?${qs}`
      const { data: response } = await axios.get<ApiResponse<TradeHistoryData>>(url)

      if (response.success && data.value) {
        // Append new trades to existing list
        data.value = {
          ...response.data,
          trades: [...data.value.trades, ...response.data.trades],
        }
      }
    } catch (err: any) {
      // Revert page on error
      filters.value.page = nextPage - 1
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load more trades'
      error.value = errorMsg
    }
  }

  /**
   * Reset filters and fetch fresh data
   */
  async function reset(): Promise<void> {
    filters.value = {
      symbol: '',
      interval: '',
      month: '',
      year: '',
      result: '',
      exitReason: '',
      sort: 'newest',
      page: 1,
      limit: 20,
    }
    await fetchHistory()
  }

  return {
    // State
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    filters,

    // Actions
    fetchHistory,
    loadMore,
    reset,
  }
}
