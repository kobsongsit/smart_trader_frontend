import axios from 'axios'
import type { BacktestData, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ Backtest data
 *
 * GET /api/strategy/backtest?symbol=X&interval=X&from=X&to=X&mode=X
 * Non-singleton — function-level state เพื่อให้ใช้แยกกันได้
 */
export function useBacktest() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  const backtestData = ref<BacktestData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBacktest(params: {
    symbol: string
    interval: string
    from?: string
    to?: string
    mode?: 'production' | 'original'
  }): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data: response } = await axios.get<ApiResponse<BacktestData>>(
        `${baseUrl}/api/strategy/backtest`,
        { params }
      )

      if (response.success) {
        backtestData.value = response.data
      } else {
        throw new Error('Failed to load backtest data')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to load backtest data'
      backtestData.value = null
    } finally {
      loading.value = false
    }
  }

  function clearBacktest() {
    backtestData.value = null
  }

  return {
    backtestData: readonly(backtestData),
    loading: readonly(loading),
    error: readonly(error),
    fetchBacktest,
    clearBacktest,
  }
}
