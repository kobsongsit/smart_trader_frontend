import axios from 'axios'
import type { IndicatorAtData, IndicatorAtResponse } from '../../types/trading'

/**
 * Composable for fetching indicator data at a specific candle timestamp.
 *
 * Calls: GET /api/indicators/:symbolId/at?timestamp=<unix_seconds>&interval=<timeframe>
 *
 * Used by CandlestickChart click handler -> IndicatorDetailPanel
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const indicatorAtData = ref<IndicatorAtData | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const isOpen = ref(false)

// ============================================================
// Composable
// ============================================================

export function useIndicatorDetail() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Fetch indicator data at a specific candle timestamp
   *
   * @param symbolId - Symbol ID
   * @param timestamp - UNIX timestamp in seconds
   * @param interval - Timeframe interval (e.g. '1H', '4H', '1D')
   */
  async function fetchIndicatorAt(
    symbolId: number,
    timestamp: number,
    interval: string,
  ): Promise<IndicatorAtData | null> {
    // Prevent duplicate requests
    if (isLoading.value) return null

    isLoading.value = true
    error.value = null

    try {
      // Map chart timeframes to API interval format (lowercase)
      const intervalMap: Record<string, string> = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '1H': '1h',
        '4H': '4h',
        '1D': '1d',
        '1W': '1w',
        '1M': '1mn',
      }
      const apiInterval = intervalMap[interval] || interval.toLowerCase()

      const params = new URLSearchParams({
        timestamp: String(timestamp),
        interval: apiInterval,
      })

      const url = `${baseUrl}/api/indicators/${symbolId}/at?${params.toString()}`
      const { data: response } = await axios.get<IndicatorAtResponse>(url)

      if (response.success && response.data) {
        indicatorAtData.value = response.data
        isOpen.value = true
        return response.data
      } else {
        throw new Error('Failed to fetch indicator data')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Failed to fetch indicator data'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /** Close the indicator detail panel */
  function closePanel() {
    isOpen.value = false
  }

  /** Open the indicator detail panel */
  function openPanel() {
    isOpen.value = true
  }

  /** Clear data and close */
  function reset() {
    indicatorAtData.value = null
    error.value = null
    isOpen.value = false
  }

  return {
    // State
    indicatorAtData: readonly(indicatorAtData),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isOpen,

    // Actions
    fetchIndicatorAt,
    closePanel,
    openPanel,
    reset,
  }
}
