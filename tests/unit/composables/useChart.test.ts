/**
 * Unit tests for useChart composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

let useChart: typeof import('../../../app/composables/useChart').useChart

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useChart')
  useChart = mod.useChart
})

const mockChartData = {
  symbol: 'BTC-USD',
  timeframe: '1H' as const,
  candles: [
    { time: 1000, open: 100, high: 110, low: 90, close: 105 },
    { time: 2000, open: 105, high: 115, low: 95, close: 110 },
  ],
  volume: [
    { time: 1000, value: 500, color: 'rgba(0,255,0,0.5)' },
    { time: 2000, value: 600, color: 'rgba(0,255,0,0.5)' },
  ],
  overlays: {
    sma50: [{ time: 1000, value: 100 }],
    sma200: [{ time: 1000, value: 95 }],
    ema20: [{ time: 1000, value: 102 }],
    bbUpper: [{ time: 1000, value: 115 }],
    bbMiddle: [{ time: 1000, value: 105 }],
    bbLower: [{ time: 1000, value: 95 }],
    ichimokuConversion: [],
    ichimokuBase: [],
    ichimokuSpanA: [],
    ichimokuSpanB: [],
  },
  signals: [],
}

const mockChartApiResponse = {
  success: true,
  data: mockChartData,
  meta: { totalCandles: 2, timeframe: '1H', startTime: '', endTime: '', candlesPerDay: 24, hasMore: true },
}

describe('useChart', () => {
  describe('initial state', () => {
    it('should start with empty state', () => {
      const { chartCache } = useChart()
      expect(chartCache.value.size).toBe(0)
    })
  })

  describe('fetchChartData', () => {
    it('should fetch and cache chart data', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const { fetchChartData, getCachedChart } = useChart()
      const result = await fetchChartData(1)

      expect(result).toBeDefined()
      expect(result!.candles).toHaveLength(2)
      expect(getCachedChart(1, '1H')).toBeDefined()
    })

    it('should use default options', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const { fetchChartData } = useChart()
      await fetchChartData(1)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('timeframe=1H'),
      )
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=200'),
      )
    })

    it('should pass custom options', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const { fetchChartData } = useChart()
      await fetchChartData(1, { timeframe: '4H', limit: 100 })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('timeframe=4H'),
      )
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=100'),
      )
    })

    it('should return cached data without API call', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const { fetchChartData } = useChart()
      await fetchChartData(1)
      mockedAxios.get.mockClear()

      const result = await fetchChartData(1)
      expect(result).toBeDefined()
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('should bypass cache with forceRefresh', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockChartApiResponse })

      const { fetchChartData } = useChart()
      await fetchChartData(1)
      mockedAxios.get.mockClear()

      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })
      await fetchChartData(1, { forceRefresh: true })
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    it('should skip if already loading', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockImplementationOnce(() =>
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchChartData, isLoadingChart } = useChart()
      const p1 = fetchChartData(1)

      expect(isLoadingChart(1, '1H')).toBe(true)
      const result = await fetchChartData(1) // should return null because loading
      expect(result).toBeNull()

      resolvePromise!({ data: mockChartApiResponse })
      await p1
    })

    it('should handle API error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchChartData, getChartError } = useChart()
      const result = await fetchChartData(1)

      expect(result).toBeNull()
      expect(getChartError(1, '1H')).toBe('Network Error')
    })

    it('should handle success=false from API', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, data: null },
      })

      const { fetchChartData } = useChart()
      const result = await fetchChartData(1)

      expect(result).toBeNull()
    })

    it('should handle API error with response data', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: 'No data' } },
        message: 'Failed',
      })

      const { fetchChartData, getChartError } = useChart()
      const result = await fetchChartData(1)

      expect(result).toBeNull()
      expect(getChartError(1, '1H')).toBe('No data')
    })

    it('should manage loading state', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchChartData, isLoadingChart } = useChart()
      const promise = fetchChartData(1)

      expect(isLoadingChart(1, '1H')).toBe(true)

      resolvePromise!({ data: mockChartApiResponse })
      await promise

      expect(isLoadingChart(1, '1H')).toBe(false)
    })
  })

  describe('fetchOlderChartData', () => {
    it('should fetch older candles and merge', async () => {
      // Initial load
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const { fetchChartData, fetchOlderChartData, getCachedChart } = useChart()
      await fetchChartData(1, { timeframe: '1H' })

      // Older data
      const olderData = {
        success: true,
        data: {
          ...mockChartData,
          candles: [{ time: 500, open: 90, high: 100, low: 85, close: 95 }],
          volume: [{ time: 500, value: 400, color: 'rgba(0,255,0,0.5)' }],
        },
        meta: { ...mockChartApiResponse.meta, hasMore: false },
      }
      mockedAxios.get.mockResolvedValueOnce({ data: olderData })

      const result = await fetchOlderChartData(1, '1H')

      expect(result.addedCount).toBe(1)
      expect(result.data!.candles).toHaveLength(3) // 1 older + 2 existing
    })

    it('should skip if already fetching older data', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const { fetchChartData, fetchOlderChartData } = useChart()
      await fetchChartData(1, { timeframe: '1H' })

      // Simulate slow fetch
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const p1 = fetchOlderChartData(1, '1H')
      const result2 = await fetchOlderChartData(1, '1H')

      expect(result2).toEqual({ data: null, addedCount: 0 })

      resolvePromise!({ data: { ...mockChartApiResponse, meta: { ...mockChartApiResponse.meta, hasMore: false } } })
      await p1
    })

    it('should skip if no initial data', async () => {
      const { fetchOlderChartData } = useChart()
      const result = await fetchOlderChartData(1, '1H')

      expect(result).toEqual({ data: null, addedCount: 0 })
    })

    it('should set hasMore=false when no new candles added', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const { fetchChartData, fetchOlderChartData, getHasMore } = useChart()
      await fetchChartData(1, { timeframe: '1H' })

      // Return same candles (duplicates)
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const result = await fetchOlderChartData(1, '1H')

      expect(result.addedCount).toBe(0)
      expect(getHasMore(1, '1H')).toBe(false)
    })

    it('should skip when hasMore is false', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { ...mockChartApiResponse, meta: { ...mockChartApiResponse.meta, hasMore: false } },
      })

      const { fetchChartData, fetchOlderChartData } = useChart()
      await fetchChartData(1, { timeframe: '1H' })

      mockedAxios.get.mockClear()
      const result = await fetchOlderChartData(1, '1H')

      expect(result).toEqual({ data: null, addedCount: 0 })
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('should handle error gracefully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const { fetchChartData, fetchOlderChartData } = useChart()
      await fetchChartData(1, { timeframe: '1H' })

      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const result = await fetchOlderChartData(1, '1H')
      expect(result).toEqual({ data: null, addedCount: 0 })
    })

    it('should handle API success=false response', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const { fetchChartData, fetchOlderChartData } = useChart()
      await fetchChartData(1, { timeframe: '1H' })

      mockedAxios.get.mockResolvedValueOnce({ data: { success: false } })

      const result = await fetchOlderChartData(1, '1H')
      expect(result).toEqual({ data: null, addedCount: 0 })
    })

    it('should merge overlays when older data has them', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockChartApiResponse })

      const { fetchChartData, fetchOlderChartData, getCachedChart } = useChart()
      await fetchChartData(1, { timeframe: '1H' })

      const olderData = {
        success: true,
        data: {
          ...mockChartData,
          candles: [{ time: 500, open: 90, high: 100, low: 85, close: 95 }],
          volume: [{ time: 500, value: 400, color: 'rgba(0,255,0,0.5)' }],
          overlays: {
            sma50: [{ time: 500, value: 90 }],
            sma200: [{ time: 500, value: 85 }],
            ema20: [{ time: 500, value: 92 }],
            bbUpper: [{ time: 500, value: 105 }],
            bbMiddle: [{ time: 500, value: 95 }],
            bbLower: [{ time: 500, value: 85 }],
            ichimokuConversion: [],
            ichimokuBase: [],
            ichimokuSpanA: [],
            ichimokuSpanB: [],
          },
          signals: [{ time: 500, position: 'belowBar', color: 'green', shape: 'arrowUp', text: 'BUY', strategy: 'BUY', confidence: 80, entryPrice: 95, takeProfit: 100, stopLoss: 90 }],
        },
        meta: { ...mockChartApiResponse.meta, hasMore: false },
      }
      mockedAxios.get.mockResolvedValueOnce({ data: olderData })

      const result = await fetchOlderChartData(1, '1H')

      expect(result.addedCount).toBe(1)
      const cached = getCachedChart(1, '1H')
      expect(cached!.overlays.sma50.length).toBeGreaterThan(1)
    })
  })

  describe('getHasMore', () => {
    it('should default to true for unknown keys', () => {
      const { getHasMore } = useChart()
      expect(getHasMore(999, '1H')).toBe(true)
    })
  })

  describe('clearChartCache', () => {
    it('should clear specific symbol (all timeframes)', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockChartApiResponse })

      const { fetchChartData, getCachedChart, clearChartCache } = useChart()
      await fetchChartData(1, { timeframe: '1H' })

      clearChartCache(1)
      expect(getCachedChart(1, '1H')).toBeUndefined()
    })

    it('should clear all cache', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockChartApiResponse })

      const { fetchChartData, chartCache, clearChartCache } = useChart()
      await fetchChartData(1)
      await fetchChartData(2)

      clearChartCache()
      expect(chartCache.value.size).toBe(0)
    })
  })

  describe('clearTimelineForTf', () => {
    it('should clear specific timeframe only', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockChartApiResponse })

      const { fetchChartData, getCachedChart, clearTimelineForTf } = useChart()
      await fetchChartData(1, { timeframe: '1H' })

      clearTimelineForTf(1, '1H')
      expect(getCachedChart(1, '1H')).toBeUndefined()
    })
  })

  describe('isFetchingOlder', () => {
    it('should return false when not fetching', () => {
      const { isFetchingOlder } = useChart()
      expect(isFetchingOlder(1, '1H')).toBe(false)
    })
  })
})
