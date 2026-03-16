import axios from 'axios'
import type { PortfolioData, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ Portfolio Overview
 *
 * Fetch data จาก GET /api/strategy/portfolio
 * Shared singleton — module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const data = ref<PortfolioData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function usePortfolio() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Fetch portfolio overview data
   * GET /api/strategy/portfolio
   */
  async function fetchPortfolio(): Promise<PortfolioData | null> {
    loading.value = true
    error.value = null

    try {
      const url = `${baseUrl}/api/strategy/portfolio`
      const { data: response } = await axios.get<ApiResponse<PortfolioData>>(url)

      if (response.success) {
        data.value = response.data
        return response.data
      } else {
        throw new Error(response.error || 'Failed to load portfolio data')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load portfolio data'
      error.value = errorMsg
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh — alias for fetchPortfolio
   */
  async function refresh(): Promise<PortfolioData | null> {
    return fetchPortfolio()
  }

  return {
    // State
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchPortfolio,
    refresh,
  }
}
