import axios from 'axios'
import type { ChartTrade, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ Trade History List ใน /history page
 *
 * เรียก GET /api/strategy/trades (เดียวกับ chart แต่ non-singleton)
 * ไม่ใช้ module-level state เพื่อไม่ conflict กับ useChartTrades ที่ใช้ใน FVG chart
 */
export function useTradesList() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  const allTrades = ref<ChartTrade[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch trades สำหรับ history list
   * GET /api/strategy/trades
   */
  async function fetchTrades(params: {
    symbol: string
    interval?: string
    from: string
    to: string
  }): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data: response } = await axios.get<ApiResponse<ChartTrade[]>>(
        `${baseUrl}/api/strategy/trades`,
        { params }
      )

      if (response.success) {
        // แสดงเฉพาะ CLOSED trades ใน history list
        allTrades.value = response.data.filter(t => t.status === 'CLOSED')
      } else {
        throw new Error('Failed to load trades')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to load trades'
      allTrades.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    allTrades: readonly(allTrades),
    loading: readonly(loading),
    error: readonly(error),
    fetchTrades,
  }
}
