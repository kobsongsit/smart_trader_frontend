/**
 * Unit tests for useMonthlyPerformance composable
 *
 * Requirement-First: tests written from acceptance criteria,
 * NOT from implementation details.
 *
 * Acceptance Criteria:
 *  AC #13: API /api/strategy/performance/monthly returns months array sorted newest first
 *  AC #14: Each month has: totalPips, wins, losses, totalTrades, winRate, profitFactor,
 *          cumulativePips, bestTrade, worstTrade, symbols[], intervals[]
 *  AC #15: Composable useMonthlyPerformance: fetchMonthly, refresh
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

// Re-import composable per test to reset module-level singleton state
let useMonthlyPerformance: typeof import('../../../app/composables/useMonthlyPerformance').useMonthlyPerformance

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useMonthlyPerformance')
  useMonthlyPerformance = mod.useMonthlyPerformance
})

// ── Mock data (from requirement, not from code) ──

const mockBestTrade = {
  symbol: 'USD-JPY',
  action: 'BUY' as const,
  pips: 120,
  date: '2026-03-05',
  interval: '1h',
}

const mockWorstTrade = {
  symbol: 'XAU-USD',
  action: 'SELL' as const,
  pips: -85,
  date: '2026-03-12',
  interval: '4h',
}

const mockSymbolBreakdown = [
  { symbol: 'USD-JPY', totalPips: 200, wins: 8, losses: 3, totalTrades: 11 },
  { symbol: 'XAU-USD', totalPips: -50, wins: 4, losses: 5, totalTrades: 9 },
]

const mockIntervalBreakdown = [
  { interval: '1h', wins: 7, losses: 4, totalPips: 120 },
  { interval: '4h', wins: 5, losses: 4, totalPips: 30 },
]

const mockMonth1 = {
  month: '2026-03',
  label: 'Mar 2026',
  totalPips: 350,
  wins: 20,
  losses: 10,
  totalTrades: 30,
  winRate: 66.7,
  profitFactor: 2.1,
  cumulativePips: 1600,
  bestTrade: mockBestTrade,
  worstTrade: mockWorstTrade,
  symbols: mockSymbolBreakdown,
  intervals: mockIntervalBreakdown,
}

const mockMonth2 = {
  month: '2026-02',
  label: 'Feb 2026',
  totalPips: 200,
  wins: 15,
  losses: 8,
  totalTrades: 23,
  winRate: 65.2,
  profitFactor: 1.8,
  cumulativePips: 1250,
  bestTrade: { ...mockBestTrade, pips: 90, date: '2026-02-10' },
  worstTrade: { ...mockWorstTrade, pips: -60, date: '2026-02-20' },
  symbols: mockSymbolBreakdown,
  intervals: mockIntervalBreakdown,
}

const mockPerformanceData = {
  months: [mockMonth1, mockMonth2], // newest first per AC #13
}

describe('useMonthlyPerformance', () => {
  // ============================================================
  // AC #15: Composable returns reactive state
  // ============================================================
  describe('AC #15: Return reactive state (data, loading, error)', () => {
    it('TC-M1: should return data, loading, error as reactive refs with correct initial values', () => {
      const { data, loading, error } = useMonthlyPerformance()

      expect(data).toHaveProperty('value')
      expect(loading).toHaveProperty('value')
      expect(error).toHaveProperty('value')

      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('TC-M2: should return fetchMonthly and refresh functions', () => {
      const composable = useMonthlyPerformance()

      expect(typeof composable.fetchMonthly).toBe('function')
      expect(typeof composable.refresh).toBe('function')
    })
  })

  // ============================================================
  // AC #13: API call and months sorted newest first
  // ============================================================
  describe('AC #13: API /api/strategy/performance/monthly', () => {
    it('TC-M3: should call GET /api/strategy/performance/monthly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPerformanceData },
      })

      const { fetchMonthly } = useMonthlyPerformance()
      await fetchMonthly()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:9001/api/strategy/performance/monthly',
      )
    })

    it('TC-M4: should store months array sorted newest first (as received from API)', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPerformanceData },
      })

      const { fetchMonthly, data } = useMonthlyPerformance()
      await fetchMonthly()

      expect(data.value).not.toBeNull()
      const months = data.value!.months
      expect(months).toHaveLength(2)
      // Newest first
      expect(months[0].month).toBe('2026-03')
      expect(months[1].month).toBe('2026-02')
    })
  })

  // ============================================================
  // AC #14: Each month has all required fields
  // ============================================================
  describe('AC #14: Month data has all required fields', () => {
    it('TC-M5: should store month with totalPips, wins, losses, totalTrades, winRate, profitFactor', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPerformanceData },
      })

      const { fetchMonthly, data } = useMonthlyPerformance()
      await fetchMonthly()

      const month = data.value!.months[0]
      expect(month.totalPips).toBe(350)
      expect(month.wins).toBe(20)
      expect(month.losses).toBe(10)
      expect(month.totalTrades).toBe(30)
      expect(month.winRate).toBe(66.7)
      expect(month.profitFactor).toBe(2.1)
    })

    it('TC-M6: should store cumulativePips', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPerformanceData },
      })

      const { fetchMonthly, data } = useMonthlyPerformance()
      await fetchMonthly()

      expect(data.value!.months[0].cumulativePips).toBe(1600)
      expect(data.value!.months[1].cumulativePips).toBe(1250)
    })

    it('TC-M7: should store bestTrade and worstTrade', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPerformanceData },
      })

      const { fetchMonthly, data } = useMonthlyPerformance()
      await fetchMonthly()

      const month = data.value!.months[0]
      expect(month.bestTrade.symbol).toBe('USD-JPY')
      expect(month.bestTrade.action).toBe('BUY')
      expect(month.bestTrade.pips).toBe(120)
      expect(month.bestTrade.date).toBe('2026-03-05')
      expect(month.bestTrade.interval).toBe('1h')

      expect(month.worstTrade.symbol).toBe('XAU-USD')
      expect(month.worstTrade.pips).toBe(-85)
    })

    it('TC-M8: should store symbols breakdown array', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPerformanceData },
      })

      const { fetchMonthly, data } = useMonthlyPerformance()
      await fetchMonthly()

      const symbols = data.value!.months[0].symbols
      expect(symbols).toHaveLength(2)
      expect(symbols[0].symbol).toBe('USD-JPY')
      expect(symbols[0].totalPips).toBe(200)
      expect(symbols[0].wins).toBe(8)
      expect(symbols[0].losses).toBe(3)
      expect(symbols[0].totalTrades).toBe(11)
    })

    it('TC-M9: should store intervals breakdown array', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPerformanceData },
      })

      const { fetchMonthly, data } = useMonthlyPerformance()
      await fetchMonthly()

      const intervals = data.value!.months[0].intervals
      expect(intervals).toHaveLength(2)
      expect(intervals[0].interval).toBe('1h')
      expect(intervals[0].wins).toBe(7)
      expect(intervals[0].losses).toBe(4)
      expect(intervals[0].totalPips).toBe(120)
    })
  })

  // ============================================================
  // AC #15: fetchMonthly & refresh behavior
  // ============================================================
  describe('AC #15: fetchMonthly behavior', () => {
    it('TC-M10: should return data on success', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPerformanceData },
      })

      const { fetchMonthly } = useMonthlyPerformance()
      const result = await fetchMonthly()

      expect(result).toEqual(mockPerformanceData)
    })

    it('TC-M11: should set loading=true during fetch', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve
        }) as any,
      )

      const { fetchMonthly, loading } = useMonthlyPerformance()
      const promise = fetchMonthly()

      expect(loading.value).toBe(true)

      resolvePromise!({ data: { success: true, data: mockPerformanceData } })
      await promise

      expect(loading.value).toBe(false)
    })

    it('TC-M12: should set error on API failure', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: 'Server error' } },
        message: 'Request failed',
      })

      const { fetchMonthly, error, data } = useMonthlyPerformance()
      const result = await fetchMonthly()

      expect(result).toBeNull()
      expect(error.value).toBe('Server error')
      expect(data.value).toBeNull()
    })

    it('TC-M13: should handle success=false response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'No performance data' },
      })

      const { fetchMonthly, error } = useMonthlyPerformance()
      const result = await fetchMonthly()

      expect(result).toBeNull()
      expect(error.value).toBe('No performance data')
    })

    it('TC-M14: should handle network error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchMonthly, error } = useMonthlyPerformance()
      const result = await fetchMonthly()

      expect(result).toBeNull()
      expect(error.value).toBe('Network Error')
    })

    it('TC-M15: should clear error on new fetch', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('First error'))
      const { fetchMonthly, error } = useMonthlyPerformance()
      await fetchMonthly()
      expect(error.value).toBe('First error')

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPerformanceData },
      })
      await fetchMonthly()
      expect(error.value).toBeNull()
    })
  })

  // ============================================================
  // AC #15: refresh alias
  // ============================================================
  describe('AC #15: refresh alias', () => {
    it('TC-M16: refresh() should work same as fetchMonthly()', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPerformanceData },
      })

      const { refresh, data } = useMonthlyPerformance()
      const result = await refresh()

      expect(result).toEqual(mockPerformanceData)
      expect(data.value).toEqual(mockPerformanceData)
    })
  })

  // ============================================================
  // Edge case: empty months
  // ============================================================
  describe('Edge case: empty months array', () => {
    it('TC-M17: should handle empty months array', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: { months: [] } },
      })

      const { fetchMonthly, data, error } = useMonthlyPerformance()
      await fetchMonthly()

      expect(data.value).not.toBeNull()
      expect(data.value!.months).toEqual([])
      expect(error.value).toBeNull()
    })
  })
})
