import axios from 'axios'
import type { ChartTrade, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับดึง trade entry/exit สำหรับแสดงบน chart
 *
 * GET /api/strategy/trades?symbol=X&interval=X&from=X&to=X
 * Shared singleton — module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const trades = ref<ChartTrade[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useChartTrades() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Fetch trades for chart display
   * GET /api/strategy/trades
   */
  async function fetchTrades(params: {
    symbol: string
    interval?: string
    from?: string
    to?: string
  }): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data: response } = await axios.get<ApiResponse<ChartTrade[]>>(
        `${baseUrl}/api/strategy/trades`,
        { params }
      )

      if (response.success) {
        trades.value = response.data
      } else {
        throw new Error('Failed to load chart trades')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to load chart trades'
      trades.value = []
    } finally {
      loading.value = false
    }
  }

  /** Clear trades (เช่น เมื่อเปลี่ยน symbol) */
  function clearTrades() {
    trades.value = []
  }

  return {
    trades: readonly(trades),
    loading: readonly(loading),
    error: readonly(error),
    fetchTrades,
    clearTrades,
  }
}
