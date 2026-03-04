import axios from 'axios'
import type { MarketHoliday, CreateHolidayResponse, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับจัดการ Market Holidays
 *
 * Features:
 * - Fetch holidays (GET /api/market-holidays?year=&market=)
 * - Create holiday (POST /api/market-holidays) → returns cleanup info
 * - Delete holiday (DELETE /api/market-holidays/:id)
 * - Client-side lookup by date
 *
 * ⚠️ Shared singleton — ทุก component ที่เรียก useMarketHolidays() จะใช้ state เดียวกัน
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const holidays = ref<MarketHoliday[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useMarketHolidays() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // ── Set of holiday dates for quick lookup ──
  const holidayDatesSet = computed<Set<string>>(() => {
    return new Set(holidays.value.map((h) => h.date))
  })

  /**
   * GET /api/market-holidays
   * Fetch holidays, optionally filtered by year and market
   */
  async function fetchHolidays(options?: { year?: number; market?: string }): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const params: Record<string, string | number> = {}
      if (options?.year) params.year = options.year
      if (options?.market) params.market = options.market

      const { data: response } = await axios.get<ApiResponse<MarketHoliday[]>>(
        `${baseUrl}/api/market-holidays`,
        { params },
      )

      if (response.success) {
        holidays.value = response.data
      } else {
        throw new Error(response.error || 'Failed to fetch holidays')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || err.message || 'Failed to fetch holidays'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * POST /api/market-holidays
   * Create a new holiday — returns holiday + cleanup result
   */
  async function createHoliday(data: {
    date: string
    name: string
    market?: string | null
  }): Promise<CreateHolidayResponse | null> {
    try {
      const { data: response } = await axios.post<ApiResponse<CreateHolidayResponse>>(
        `${baseUrl}/api/market-holidays`,
        {
          date: data.date,
          name: data.name,
          market: data.market || null,
        },
      )

      if (response.success) {
        // Add to local state immediately (optimistic)
        holidays.value.push(response.data.holiday)
        return response.data
      }
      return null
    } catch (err: any) {
      error.value =
        err.response?.data?.error?.message || err.message || 'Failed to create holiday'
      return null
    }
  }

  /**
   * DELETE /api/market-holidays/:id
   * Remove a holiday
   */
  async function deleteHoliday(id: number): Promise<boolean> {
    try {
      const { data: response } = await axios.delete<ApiResponse<null>>(
        `${baseUrl}/api/market-holidays/${id}`,
      )

      if (response.success) {
        // Remove from local state immediately (optimistic)
        holidays.value = holidays.value.filter((h) => h.id !== id)
        return true
      }
      return false
    } catch (err: any) {
      error.value =
        err.response?.data?.error?.message || err.message || 'Failed to delete holiday'
      return false
    }
  }

  /**
   * Client-side lookup: find holiday by date string (YYYY-MM-DD)
   */
  function getHolidayByDate(dateStr: string): MarketHoliday | undefined {
    return holidays.value.find((h) => h.date === dateStr)
  }

  /**
   * Check if a date is a holiday (quick lookup via Set)
   */
  function isHoliday(dateStr: string): boolean {
    return holidayDatesSet.value.has(dateStr)
  }

  return {
    // State (readonly)
    holidays: readonly(holidays),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    holidayDatesSet,

    // Actions
    fetchHolidays,
    createHoliday,
    deleteHoliday,
    getHolidayByDate,
    isHoliday,
  }
}
