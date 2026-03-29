import axios from 'axios'
import type { FvgData, FvgParams, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับ SMC FVG Detection
 *
 * Fetch data จาก GET /api/smc/fvg
 * Shared singleton — module-level state
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const data = ref<FvgData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useFvg() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Fetch FVG zones + candles
   * GET /api/smc/fvg
   */
  async function fetchFvg(params: FvgParams): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data: response } = await axios.get<ApiResponse<FvgData>>(
        `${baseUrl}/api/smc/fvg`,
        { params }
      )

      if (response.success) {
        data.value = response.data
      } else {
        throw new Error('Failed to load FVG data')
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message
        || err.response?.data?.error
        || err.message
        || 'Failed to load FVG data'
      error.value = msg
      data.value = null
    } finally {
      loading.value = false
    }
  }

  function clearFvg() {
    data.value = null
  }

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    fetchFvg,
    clearFvg,
  }
}
