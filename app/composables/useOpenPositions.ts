import axios from 'axios'
import type { Position, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ Open Positions
 *
 * Fetch data จาก GET /api/strategy/positions
 * Shared singleton — module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const positions = ref<Position[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useOpenPositions() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Fetch open positions data
   * GET /api/strategy/positions
   */
  async function fetchPositions(): Promise<Position[]> {
    loading.value = true
    error.value = null

    try {
      const url = `${baseUrl}/api/strategy/positions`
      const { data: response } = await axios.get<ApiResponse<Position[]>>(url)

      if (response.success) {
        positions.value = response.data
        return response.data
      } else {
        throw new Error(response.error || 'Failed to load open positions')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load open positions'
      error.value = errorMsg
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh — alias for fetchPositions
   */
  async function refresh(): Promise<Position[]> {
    return fetchPositions()
  }

  return {
    // State
    positions: readonly(positions),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchPositions,
    refresh,
  }
}
