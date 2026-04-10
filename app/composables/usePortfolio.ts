import axios from 'axios'
import type { PortfolioData, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ Portfolio Overview
 *
 * Fetch data จาก GET /api/strategy/portfolio
 * รองรับ optional date range: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Shared singleton — module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const data = ref<PortfolioData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

/** จำ range ล่าสุดที่ fetch ไป — ให้ refresh() ใช้ซ้ำได้โดยไม่ต้องส่ง params */
const lastParams = ref<{ from?: string; to?: string } | undefined>(undefined)

export function usePortfolio() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Fetch portfolio overview data
   * GET /api/strategy/portfolio
   * @param params.from  'YYYY-MM-DD' — วันเริ่มต้น (optional, default = STRATEGY_START_DATE ใน backend)
   * @param params.to    'YYYY-MM-DD' — วันสิ้นสุด (optional, default = ปัจจุบัน)
   */
  async function fetchPortfolio(params?: {
    from?: string
    to?: string
  }): Promise<PortfolioData | null> {
    loading.value = true
    error.value = null
    lastParams.value = params  // จำ range ล่าสุดไว้

    try {
      const url = `${baseUrl}/api/strategy/portfolio`
      const { data: response } = await axios.get<ApiResponse<PortfolioData>>(url, {
        params: {
          ...(params?.from ? { from: params.from } : {}),
          ...(params?.to   ? { to:   params.to   } : {}),
        },
      })

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
   * Refresh — reuse lastParams โดยอัตโนมัติ
   * เรียกจาก refresh button ใน index.vue ได้เลย โดยไม่ต้องรู้ว่า range ปัจจุบันคืออะไร
   */
  async function refresh(): Promise<PortfolioData | null> {
    return fetchPortfolio(lastParams.value)
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
