import axios from 'axios'
import type { PriceSummaryItem, ApiResponse } from '../../types/trading'

/**
 * Composable for Price Summary tooltip
 *
 * Fetch latest 1m candle price per symbol from GET /api/strategy/price-summary
 * Shows as tooltip on flash icon click, auto-hides after 5 seconds.
 */

const data = ref<PriceSummaryItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showTooltip = ref(false)

let hideTimer: ReturnType<typeof setTimeout> | null = null

export function usePriceSummary() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Fetch price summary and show tooltip for 5 seconds
   */
  async function fetchAndShow(): Promise<void> {
    // Clear existing timer
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    loading.value = true
    error.value = null
    showTooltip.value = true

    try {
      const url = `${baseUrl}/api/strategy/price-summary`
      const { data: response } = await axios.get<ApiResponse<PriceSummaryItem[]>>(url)

      if (response.success) {
        data.value = response.data
      } else {
        throw new Error(response.error || 'Failed to load price summary')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to load prices'
    } finally {
      loading.value = false

      // Auto-hide after 5 seconds
      hideTimer = setTimeout(() => {
        showTooltip.value = false
      }, 5000)
    }
  }

  /** Manually hide tooltip */
  function hide(): void {
    showTooltip.value = false
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    showTooltip: readonly(showTooltip),
    fetchAndShow,
    hide,
  }
}
