import axios from 'axios'
import type { MonthlyPerformanceData, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ Monthly Performance
 *
 * Fetch data จาก GET /api/strategy/performance/monthly
 * Shared singleton — module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const data = ref<MonthlyPerformanceData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useMonthlyPerformance() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Fetch monthly performance data
   * GET /api/strategy/performance/monthly
   */
  async function fetchMonthly(): Promise<MonthlyPerformanceData | null> {
    loading.value = true
    error.value = null

    try {
      const url = `${baseUrl}/api/strategy/performance/monthly`
      const { data: response } = await axios.get<ApiResponse<MonthlyPerformanceData>>(url)

      if (response.success) {
        data.value = response.data
        return response.data
      } else {
        throw new Error(response.error || 'Failed to load monthly performance')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load monthly performance'
      error.value = errorMsg
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh — alias for fetchMonthly
   */
  async function refresh(): Promise<MonthlyPerformanceData | null> {
    return fetchMonthly()
  }

  return {
    // State
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchMonthly,
    refresh,
  }
}
